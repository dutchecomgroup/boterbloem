import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  time,
  integer,
  boolean,
  pgEnum,
  jsonb,
  date,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ---------- Enums ----------

export const orderStatusEnum = pgEnum("order_status", [
  "aanvraag",
  "bevestigd",
  "in_productie",
  "klaar",
  "afgeleverd",
  "geannuleerd",
]);

export const contactStatusEnum = pgEnum("contact_status", [
  "nieuw",
  "gelezen",
  "opgevolgd",
  "omgezet_naar_order",
]);

export const productCategoryEnum = pgEnum("product_category", [
  "bruidstaart",
  "verjaardag",
  "mini_desserts",
  "cupcakes",
  "taart_los",
  "overig",
]);

export const deliveryTypeEnum = pgEnum("delivery_type", [
  "afhalen",
  "bezorgen",
  "ter_plaatse",
]);

// ---------- Sessions (connect-pg-simple) ----------

export const sessions = pgTable("sessions", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6, withTimezone: false }).notNull(),
}, (table) => ({
  expireIdx: index("IDX_session_expire").on(table.expire),
}));

// ---------- Users (admin) ----------

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 120 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }),
  role: varchar("role", { length: 32 }).notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  usernameIdx: uniqueIndex("users_username_unique").on(table.username),
}));

// ---------- Customers ----------

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Products / Services ----------

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  category: productCategoryEnum("category").notNull().default("overig"),
  description: text("description"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull().default("0"),
  /**
   * Toont de site `vanaf € 395,00` of gewoon `€ 65,00`?
   *
   * Een bruidstaart op maat begint ergens; een basistaart voor twaalf personen kost wat hij
   * kost. Tot deze kolom bestond stond er op `/aanbod` hardgecodeerd "Vanaf-prijzen per taart"
   * boven de hele lijst -- een bewering die voor elke regel tegelijk gold en dus voor sommige
   * niet klopte.
   *
   * Bestaande regels kregen bij de migratie `true`, omdat dat precies is wat de site toen al
   * over ze zei. Nieuwe producten staan op `false`: een vanaf-prijs is iets wat je bewust kiest.
   */
  priceIsFrom: boolean("price_is_from").notNull().default(false),
  unit: varchar("unit", { length: 32 }).notNull().default("stuk"),
  active: boolean("active").notNull().default(true),
  /** Zichtbaar op de publieke taart-prijslijst. Default false: bewust aanzetten. */
  publicVisible: boolean("public_visible").notNull().default(false),
  /**
   * Btw-tarief van dit product: `geen`, `laag` of `hoog`. `null` = nog niet ingesteld, en dat
   * wordt in het beheerscherm zichtbaar gemarkeerd.
   *
   * Geen verdeling zoals bij een pakket: een taart of een schaal mini desserts is één ding,
   * en dat ding is eten. Blijkt een product tóch samengesteld, dan hoort het een pakket te zijn.
   */
  vatRate: varchar("vat_rate", { length: 8 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex("products_slug_unique").on(table.slug),
}));

// ---------- Packages (sweet & grazing tables) ----------

export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  tagline: varchar("tagline", { length: 255 }),
  description: text("description"),
  /** Vanaf-prijs — een richtlijn, het pakket kan aangevuld worden. */
  priceFrom: numeric("price_from", { precision: 10, scale: 2 }).notNull().default("0"),
  /** "totaal" of "per_persoon" */
  priceUnit: varchar("price_unit", { length: 32 }).notNull().default("totaal"),
  personsMin: integer("persons_min"),
  personsMax: integer("persons_max"),
  /** Array van strings: wat zit er in het pakket. */
  includes: jsonb("includes").$type<string[]>().notNull().default([]),
  coverItemId: integer("cover_item_id"),
  /**
   * Het btw-tarief dat een regel uit dit pakket meekrijgt, als het pakket **één** prestatie is.
   * `null` = volg de instelling. Bij een gesplitst pakket (zie hieronder) doet dit veld niets.
   */
  vatRate: varchar("vat_rate", { length: 8 }),
  /**
   * De btw-verdeling van de pakketprijs: welk deel is eten en drinken (9%) en welk deel is
   * verhuur, materiaal en opbouw (21%).
   *
   * **Waarom een verdeling en niet één tarief.** Een sweet table bevat allebei, en de
   * Belastingdienst staat niet toe dat het 21%-deel meelift op het lage tarief van het eten.
   * Bij één prijs naar de klant moet het bedrag aan de achterkant gesplitst worden volgens de
   * marktwaarde. Eén tarief over het geheel is dus geen vereenvoudiging maar een fout.
   *
   * **Per eenheid, net als `priceFrom`.** Staat `priceUnit` op `per_persoon`, dan zijn dit
   * bedragen per persoon: € 22,00 eten en € 3,00 servies bij een pakketprijs van € 25,00 p.p.
   * Het aantal op de regel doet de vermenigvuldiging, zodat twintig gasten vanzelf op € 440,00
   * en € 60,00 uitkomen.
   *
   * Allebei leeg = geen verdeling; dan is het pakket één regel met `vatRate`.
   */
  vatSplitLow: numeric("vat_split_low", { precision: 10, scale: 2 }),
  vatSplitHigh: numeric("vat_split_high", { precision: 10, scale: 2 }),
  featured: boolean("featured").notNull().default(false),
  /** Default false: pas zichtbaar als de prijzen bekend zijn. */
  active: boolean("active").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex("packages_slug_unique").on(table.slug),
}));

/**
 * Welk deel van een gesplitst pakket een regel vertegenwoordigt: het lage tarief (eten en
 * drinken) of het hoge (verhuur, materiaal en opbouw).
 *
 * Staat in `order_items.details` zodat hetzelfde pakket nog eens toevoegen het aantal van
 * **beide** regels verhoogt, in plaats van er twee nieuwe naast te zetten.
 */
export type PakketDeel = "laag" | "hoog";

// ---------- Orders / Bookings ----------

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  eventDate: date("event_date"),
  deliveryType: deliveryTypeEnum("delivery_type").notNull().default("afhalen"),
  status: orderStatusEnum("status").notNull().default("aanvraag"),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull().default("0"),
  depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  paidAt: timestamp("paid_at"),
  /** Tijd los van de datum, zodat "datum bekend, tijd nog niet" geldig blijft. */
  eventTime: time("event_time"),
  /** Hoe laat zij er moet zijn om op te bouwen — los van `eventTime`. */
  setupTime: time("setup_time"),
  location: text("location"),
  /** `ABB-2026-001` — voor de offerte en om naar te verwijzen aan de telefoon. */
  reference: varchar("reference", { length: 32 }),
  packageId: integer("package_id").references(() => packages.id, { onDelete: "set null" }),
  persons: integer("persons"),
  /**
   * Bewust een eigen veld en niet in `notes`: bij eten mag een allergie niet ondersneeuwen
   * tussen "belt vrijdag over de kleuren".
   */
  allergies: text("allergies"),
  theme: text("theme"),
  /**
   * `geen` | `laag` | `hoog` — zie `BTW_TARIEVEN`. Leeg betekent: volg de standaard uit
   * `site_settings.btw`. Bewust geen kopie van het percentage: verandert het tarief ooit, dan
   * hoeft een oude boeking niet mee te veranderen, maar een lopende wel.
   */
  vatRate: varchar("vat_rate", { length: 8 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("orders_status_idx").on(table.status),
  eventDateIdx: index("orders_event_date_idx").on(table.eventDate),
  referenceIdx: uniqueIndex("orders_reference_unique").on(table.reference),
}));

/**
 * Logboek van één boeking. Beantwoordt vragen die anders alleen in iemands hoofd zitten:
 * "wanneer is dit bevestigd?", "is de aanbetaling al binnen?", "wanneer kwam die regel erbij?".
 *
 * Alleen wat ná de invoering gelogd is verschijnt hier. Bestaande boekingen kregen bij de
 * migratie één `aangemaakt`-regel; de lege staat in het scherm zegt dat erbij, zodat niemand
 * denkt dat er iets mist.
 */
export const orderEvents = pgTable("order_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  at: timestamp("at").notNull().defaultNow(),
  kind: varchar("kind", { length: 32 }).notNull(),
  summary: text("summary").notNull(),
  details: jsonb("details"),
  actor: varchar("actor", { length: 120 }),
}, (table) => ({
  orderIdx: index("order_events_order_idx").on(table.orderId, table.at),
}));

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0"),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull().default("0"),
  /**
   * Wat er in deze regel zit, als subregels eronder — bijvoorbeeld waar een pakket uit
   * bestaat. Bewust hier opgeslagen en niet opgezocht bij het pakket: dat pakket kan later
   * veranderen of verdwijnen, maar wat er met déze klant is afgesproken hoort te blijven staan.
   *
   * `packageId` zegt uit welk pakket de regel voortkwam. Daarmee wordt hetzelfde pakket nog
   * eens toevoegen een hoger aantal in plaats van een tweede identieke regel. Het is
   * uitdrukkelijk een herkomst-notitie en geen verwijzing: het pakket mag verdwijnen zonder
   * dat deze regel iets verliest.
   */
  details: jsonb("details").$type<{ inbegrepen?: string[]; packageId?: number; deel?: PakketDeel }>(),
  /**
   * Het btw-tarief van déze regel: `geen`, `laag` of `hoog`. `null` betekent "volg de boeking",
   * en die volgt op zijn beurt de instelling.
   *
   * **Waarom per regel en niet per boeking.** Eén offerte kan twee tarieven bevatten: een
   * grazing table valt onder 9% (eten en drinken), de styling en het glaswerk ernaast onder
   * 21%. Met één tarief voor de hele boeking is het bedrag op zo'n offerte simpelweg fout, en
   * bij btw is "ongeveer goed" niet goed genoeg.
   *
   * `null` als standaard houdt bestaande boekingen ongemoeid en zorgt dat je het tarief alleen
   * aanraakt bij de regel die afwijkt.
   */
  vatRate: varchar("vat_rate", { length: 8 }),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------- Betalingen ----------

/**
 * Wat er daadwerkelijk binnengekomen is op een boeking, als losse regels.
 *
 * **Waarom een tabel en geen vinkje.** Het model kende alleen `depositAmount` (afgesproken) en
 * `depositPaid` (binnen). Daarmee was "de aanbetaling is voldaan" vast te leggen en "de rest
 * ook" niet: een afgeleverde boeking van EUR 295 bleef voor altijd op openstaand staan, tenzij je
 * deed alsof de aanbetaling het hele bedrag was. Een klant die in twee of drie keer betaalt is
 * bovendien gewoon normaal.
 *
 * Ontvangen is vanaf nu de som van deze regels, niet een afgeleide van de aanbetaling.
 * `depositAmount` blijft bestaan en betekent nog steeds wat het altijd betekende: het bedrag
 * dat is **afgesproken** en dat op de offerte staat als "nu te voldoen".
 *
 * `paidOn` is een datum en geen tijdstip -- niemand weet of het geld om 11:04 of om 14:20
 * binnenkwam, en die precisie voorstellen is doen alsof.
 */
export const orderPayments = pgTable("order_payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  /** Wanneer het geld binnenkwam. Bepaalt in welke periode de betaling meetelt. */
  paidOn: date("paid_on").notNull(),
  /** Contant, overboeking, tikkie of anders. Mag leeg -- het bedrag is wat telt. */
  method: varchar("method", { length: 32 }),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  orderIdx: index("order_payments_order_idx").on(table.orderId, table.paidOn),
  /** De omzetpagina telt betalingen per periode op; dan is de datum de ingang. */
  paidOnIdx: index("order_payments_paid_on_idx").on(table.paidOn),
}));

// ---------- Contact requests ----------

export const contactRequests = pgTable("contact_requests", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  eventDate: date("event_date"),
  eventType: varchar("event_type", { length: 80 }),
  persons: integer("persons"),
  message: text("message").notNull(),
  status: contactStatusEnum("status").notNull().default("nieuw"),
  /** Gewenst pakket uit het formulier — mag leeg zijn ("weet ik nog niet"). */
  packageId: integer("package_id").references(() => packages.id, { onDelete: "set null" }),
  /** De gelegenheid, als keuze uit gallery_categories. `eventType` blijft als vrij veld. */
  categoryId: integer("category_id"),
  convertedOrderId: integer("converted_order_id").references(() => orders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("contact_status_idx").on(table.status),
  createdIdx: index("contact_created_idx").on(table.createdAt),
}));

// ---------- Gallery ----------

/** Een categorie is een **gelegenheid** (babyshower, bruiloft), niet een taart-type. */
export const galleryCategories = pgTable("gallery_categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  /**
   * Welke foto de tegel van deze gelegenheid vult.
   *
   * Zonder deze kolom kwam de omslag altijd van een event, en viel `nest()` daarna terug op de
   * eerste losse foto op volgorde. Dat werkte zolang losse foto's restanten waren; sinds de
   * foto's van de klant rechtstreeks onder een gelegenheid hangen is de omslag anders een
   * toevalstreffer van de uploadvolgorde.
   *
   * Geen foreign key, net als bij `galleryAlbums.coverItemId`: een foto verwijderen mag de
   * gelegenheid niet meeslepen en ook niet blokkeren. Wijst hij nergens meer heen, dan valt de
   * omslag terug op de volgorde.
   */
  coverItemId: integer("cover_item_id"),
  published: boolean("published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => ({
  slugIdx: uniqueIndex("gallery_cat_slug_unique").on(table.slug),
}));

/**
 * Eén blok in het verhaal van een event: een tussenkop, een stuk tekst, of een groep foto's.
 * De volgorde in de lijst is de volgorde op de pagina.
 */
export type AlbumBlok =
  | { soort: "kop"; inhoud: string }
  | { soort: "tekst"; inhoud: string }
  | { soort: "fotos"; itemIds: number[] };

export const albumBlokSchema = z.discriminatedUnion("soort", [
  z.object({ soort: z.literal("kop"), inhoud: z.string().min(1) }),
  z.object({ soort: z.literal("tekst"), inhoud: z.string().min(1) }),
  z.object({ soort: z.literal("fotos"), itemIds: z.array(z.number().int().positive()) }),
]);

/** Eén uitgevoerd event binnen een gelegenheid. Meerdere albums per categorie. */
export const galleryAlbums = pgTable("gallery_albums", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => galleryCategories.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 120 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  eventDate: date("event_date"),
  description: text("description"),
  /**
   * Het verhaal bij dit event: tekst en foto's door elkaar. `null` betekent "nog niet
   * ingedeeld" en dan wordt het album getoond zoals voorheen — omschrijving, dan alle foto's.
   * Zo blijven bestaande albums werken zonder dat er iets aan hoeft te veranderen.
   */
  blocks: jsonb("blocks").$type<AlbumBlok[]>(),
  coverItemId: integer("cover_item_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  catSlugIdx: uniqueIndex("gallery_albums_cat_slug_unique").on(table.categoryId, table.slug),
  categoryIdx: index("gallery_albums_category_idx").on(table.categoryId),
}));

export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => galleryCategories.id, { onDelete: "set null" }),
  /** Mag leeg zijn: een losse foto kan direct onder een gelegenheid blijven staan. */
  albumId: integer("album_id").references(() => galleryAlbums.id, { onDelete: "set null" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  altText: varchar("alt_text", { length: 255 }),
  caption: text("caption"),
  width: integer("width"),
  height: integer("height"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  source: varchar("source", { length: 32 }).notNull().default("upload"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  featuredIdx: index("gallery_featured_idx").on(table.featured),
  categoryIdx: index("gallery_category_idx").on(table.categoryId),
  albumIdx: index("gallery_album_idx").on(table.albumId),
}));

// ---------- Reviews ----------

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  authorName: varchar("author_name", { length: 120 }).notNull(),
  eventType: varchar("event_type", { length: 120 }),
  rating: integer("rating"),
  body: text("body").notNull(),
  occurredOn: date("occurred_on"),
  /** Default false: publiceren is een bewuste handeling, ook vanwege toestemming. */
  published: boolean("published").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  source: varchar("source", { length: 32 }).notNull().default("handmatig"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  publishedIdx: index("reviews_published_idx").on(table.published),
}));

// ---------- Site settings ----------

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Relations ----------

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  payments: many(orderPayments),
}));

export const orderPaymentsRelations = relations(orderPayments, ({ one }) => ({
  order: one(orders, {
    fields: [orderPayments.orderId],
    references: [orders.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const galleryCategoriesRelations = relations(galleryCategories, ({ many }) => ({
  albums: many(galleryAlbums),
  items: many(galleryItems),
}));

export const galleryAlbumsRelations = relations(galleryAlbums, ({ one, many }) => ({
  category: one(galleryCategories, {
    fields: [galleryAlbums.categoryId],
    references: [galleryCategories.id],
  }),
  items: many(galleryItems),
}));

export const galleryItemsRelations = relations(galleryItems, ({ one }) => ({
  category: one(galleryCategories, {
    fields: [galleryItems.categoryId],
    references: [galleryCategories.id],
  }),
  album: one(galleryAlbums, {
    fields: [galleryItems.albumId],
    references: [galleryAlbums.id],
  }),
}));

// ---------- Zod schemas ----------

export const insertCustomerSchema = createInsertSchema(customers, {
  email: z.string().email().optional().or(z.literal("")),
}).omit({ id: true, createdAt: true, updatedAt: true });

/**
 * `reference` en `totalPrice` staan er bewust niet in.
 *
 * Het boekingsnummer wordt server-side gezet bij het aanmaken en hoort daarna vast te staan —
 * er wordt naar verwezen op offertes en aan de telefoon. Het totaal is **afgeleid**: de server
 * herberekent het bij elke regelwijziging uit de som van `order_items`. Wie het van buitenaf
 * mag zetten, kan het uit de pas laten lopen met wat eronder staat.
 */
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reference: true,
  totalPrice: true,
});

/**
 * `lineTotal` volgt uit aantal × stuksprijs en wordt server-side berekend, zodat een regel
 * nooit een bedrag kan tonen dat niet bij zijn eigen getallen hoort.
 */
export const insertOrderItemSchema = createInsertSchema(orderItems, {
  description: z.string().min(1, "Omschrijving is verplicht"),
  // drizzle-zod maakt van een jsonb-kolom een losse `Json`, waar dus ook een string of getal
  // in past. Hier de echte vorm opschrijven, anders is de kolom in de praktijk ongetypeerd.
  details: z
    .object({
      inbegrepen: z.array(z.string()).optional(),
      packageId: z.number().int().positive().optional(),
      deel: z.enum(["laag", "hoog"]).optional(),
    })
    .nullable()
    .optional(),
  // Anders loopt 'onzin' pas stuk op de CHECK in de database, en dat komt binnen als een 500
  // met een ruwe databasefout in beeld.
  vatRate: z.enum(["geen", "laag", "hoog"]).nullable().optional(),
}).omit({ id: true, lineTotal: true });

/** `orderId` komt uit het webadres, niet uit de body: anders kun je op een andere boeking boeken. */
export const insertOrderPaymentSchema = createInsertSchema(orderPayments, {
  amount: z.string().min(1, "Bedrag is verplicht"),
  paidOn: z.string().min(1, "Datum is verplicht"),
  method: z.enum(["contant", "overboeking", "tikkie", "anders"]).nullable().optional(),
}).omit({ id: true, orderId: true, createdAt: true });

export const insertOrderEventSchema = createInsertSchema(orderEvents).omit({
  id: true,
  at: true,
});

export const insertProductSchema = createInsertSchema(products, {
  vatRate: z.enum(["geen", "laag", "hoog"]).nullable().optional(),
  // Optioneel: de server leidt hem af uit de naam (server/lib/slug.ts).
  slug: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertContactRequestSchema = createInsertSchema(contactRequests, {
  email: z.string().email("Geldig e-mailadres vereist"),
  name: z.string().min(2, "Naam is verplicht"),
  message: z.string().min(5, "Bericht is te kort"),
}).omit({
  id: true,
  createdAt: true,
  status: true,
  convertedOrderId: true,
});

export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({
  id: true,
  createdAt: true,
});

export const insertGalleryCategorySchema = createInsertSchema(galleryCategories, {
  // Optioneel: de server leidt hem af uit de naam. Een expliciete slug mag nog wel mee, want de
  // seed maakt zo de verborgen gelegenheid `sitefotos` waar de fotokiezer naar uploadt.
  slug: z.string().optional(),
}).omit({
  id: true,
});

export const insertGalleryAlbumSchema = createInsertSchema(galleryAlbums, {
  title: z.string().min(1, "Titel is verplicht"),
  // Optioneel: de server leidt hem af uit de naam (server/lib/slug.ts).
  slug: z.string().optional(),
  // drizzle-zod maakt van een jsonb-kolom een losse `Json` waar ook een string in past. De
  // echte vorm hier vastleggen, anders is de kolom in de praktijk ongetypeerd — en dit is
  // inhoud die op een publieke pagina gerenderd wordt.
  blocks: z.array(albumBlokSchema).nullable().optional(),
}).omit({ id: true, createdAt: true });

export const insertPackageSchema = createInsertSchema(packages, {
  name: z.string().min(1, "Naam is verplicht"),
  // Optioneel: de server leidt hem af uit de naam (server/lib/slug.ts).
  slug: z.string().optional(),
  priceUnit: z.enum(["totaal", "per_persoon"]),
  includes: z.array(z.string()),
  // Zonder deze zou 'onzin' pas op de CHECK in de database stuklopen, en dat komt binnen als
  // een 500 met een ruwe databasefout in beeld. Hier is het een 400 met een leesbare melding.
  vatRate: z.enum(["geen", "laag", "hoog"]).nullable().optional(),
}).omit({ id: true, createdAt: true });

export const insertReviewSchema = createInsertSchema(reviews, {
  authorName: z.string().min(1, "Naam is verplicht"),
  body: z.string().min(10, "Review is te kort"),
  rating: z.number().int().min(1).max(5).nullish(),
}).omit({ id: true, createdAt: true });

// ---------- Site settings shape (JSONB validation) ----------

/**
 * `facebook` en `openingHours` stonden hier maar hadden geen veld in het beheerscherm en
 * werden nergens uitgelezen. Een atelier dat op afspraak werkt heeft geen openingstijden, en
 * er is geen Facebook-pagina. Weg dus: een instelling die niemand kan invullen en niemand
 * leest, is alleen maar iets om je later over af te vragen wat het ook alweer deed.
 *
 * De sleutels mogen in bestaande jsonb-rijen blijven staan; niets leest ze meer.
 */
export const contactSettingsSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  /** Alleen cijfers, spaties en een eventuele +. Wordt een `wa.me`-link op de site. */
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  instagram: z.string().optional(),
});

/**
 * `title` en `imageFilename` stonden hier maar werden nergens gebruikt: de kop op de homepage
 * staat hardgecodeerd als "Atelier" plus "Boterbloem" in het sierlijke lettertype, en de hero
 * toont een carousel van uitgelichte galerijfoto's in plaats van één vaste foto. Twee velden in
 * het beheerscherm die niets deden, wat erger is dan geen veld: je vult het in en er gebeurt
 * niets.
 */
export const heroSettingsSchema = z.object({
  /** De zin onder de naam. Het eerste wat een bezoeker leest. */
  tagline: z.string().default("Sweet tables en grazing tables voor jouw mooiste momenten"),
  /** Opschrift van de knop. */
  ctaLabel: z.string().default("Vraag offerte aan"),
  /** Waar die knop heen gaat. Een pad op de eigen site, of een volledig adres. */
  ctaHref: z.string().default("/contact"),
  /**
   * De drie foto's van de collage bovenaan de homepage, als `gallery_items.id`.
   *
   * **Id's en geen bestandsnamen**, anders dan `about.imageFilename`: de collage moet ook de
   * alt-tekst en de verhouding van een foto kennen, en die staan bij de rij. Een bestandsnaam
   * zou dwingen de hele galerij op te halen om ze terug te zoeken.
   *
   * Leeg = de eerste drie uitgelichte foto's, zoals het was voordat dit veld bestond. Zo staat
   * er altijd iets, ook direct na een verse import.
   *
   * Geen foreign key mogelijk (het is jsonb), dus de homepage negeert stil een id dat nergens
   * meer heen wijst en vult aan met uitgelicht werk.
   */
  fotoIds: z.array(z.number().int().positive()).max(3).default([]),
  /** Het kleine regeltje in hoofdletters boven de grote zin. */
  bovenschrift: z.string().default("Sweet tables · Grazing tables · Taarten"),
  /** De tweede, lichtere knop naast de hoofdknop. Gaat altijd naar de galerij. */
  tweedeKnop: z.string().default("Bekijk de galerij"),
});

export const aboutSettingsSchema = z.object({
  heading: z.string().default("Over Atelier Boterbloem"),
  body: z.string().default(""),
  imageFilename: z.string().optional(),
  /** Het citaat op het groene vlak onder haar verhaal. */
  citaat: z.string().default("Smaak, ambacht, en een glimlach in elke beet."),
  /** Wie het zegt. Staat klein onder het citaat. */
  citaatBron: z.string().default("Atelier Boterbloem"),
});

/**
 * Levertijden — uit de meeting: 10 dagen vooraf, taarten flexibeler.
 *
 * `agendaFeedToken` hoort hier omdat het naast de levertijden de enige instelling is die
 * niet in een eigen tabel thuishoort. Wie het token heeft, ziet alle boekingen met
 * klantnaam; het is los te vervangen zonder wachtwoordwijziging.
 *
 * `taartenDagen` stond hier ook, maar werd nergens uitgelezen: het label in het beheerscherm
 * zei "(informatief)" en dat was letterlijk waar. De tekst hieronder noemt de taarten al.
 */
export const levertijdenSettingsSchema = z.object({
  standaardDagen: z.number().int().min(0).max(365).default(10),
  tekst: z.string().default(
    "Vraag je aan minimaal 10 dagen van tevoren aan. Voor taarten kunnen we vaak flexibeler zijn, vraag gerust.",
  ),
  agendaFeedToken: z.string().default(""),
});

export type LevertijdenSettings = z.infer<typeof levertijdenSettingsSchema>;

/**
 * Btw-tarieven. Drie mogelijkheden, want de derde is een echte:
 *
 * - **geen** — kleineondernemersregeling. Er komt dan géén btw-regel op de offerte; een regel
 *   met `€ 0,00 btw` zou suggereren dat er btw berekend is en die nul is.
 * - **laag** — 9%, het tarief voor eten en drinken.
 * - **hoog** — 21%.
 *
 * **Bedragen zijn inclusief btw.** Dat is de enige juiste keuze voor een particuliere klant:
 * wat op de offerte staat is wat ze betaalt. De btw wordt er op de offerte uit *gehaald*
 * ("waarvan € 30,60 btw"), niet bij opgeteld.
 */
export const BTW_TARIEVEN = {
  geen: 0,
  laag: 9,
  hoog: 21,
} as const;

export type BtwTarief = keyof typeof BTW_TARIEVEN;

/**
 * In gewone taal. Er stond "9% — laag tarief", en dan moet je eerst weten wát het lage tarief
 * is. Deze labels voeden zowel de instellingen als de keuzelijst in de boekingsheet, dus ze
 * moeten los van hun schermpje te begrijpen zijn.
 */
export const BTW_LABEL: Record<BtwTarief, string> = {
  geen: "Geen btw (kleineondernemersregeling)",
  laag: "9% (eten en drinken)",
  hoog: "21%",
};

/**
 * De productcategorieën in gewone taal, om dezelfde reden als `BTW_LABEL` hierboven.
 *
 * In het beheerscherm stond de kale databasewaarde: `mini_desserts`, `taart_los`. Dat is
 * dezelfde soort lek als het slug-veld -- de vorm van de database komt naar buiten op een
 * scherm dat door iemand anders bediend wordt. De waarden in de kolom blijven wat ze zijn.
 */
export const PRODUCT_CATEGORIE_LABEL: Record<Product["category"], string> = {
  bruidstaart: "Bruidstaart",
  verjaardag: "Verjaardagstaart",
  mini_desserts: "Mini desserts",
  cupcakes: "Cupcakes",
  taart_los: "Losse taart",
  overig: "Overig",
};

export function isBtwTarief(v: unknown): v is BtwTarief {
  return typeof v === "string" && v in BTW_TARIEVEN;
}

/**
 * Het tarief is een eigenschap van het bedrijf, niet van één boeking — daarom staat de
 * standaard in de instellingen. Per boeking kan hij afwijken, voor het geval dat ooit nodig is.
 */
export const btwSettingsSchema = z.object({
  standaardTarief: z.enum(["geen", "laag", "hoog"]).default("geen"),
  /** Onder de bedragen op de offerte. Leeg = de standaardzin bij het gekozen tarief. */
  toelichting: z.string().default(""),
});

export type BtwSettings = z.infer<typeof btwSettingsSchema>;

/* ---------- Teksten per pagina ----------
 *
 * **Waarom deze sleutels bestaan.** De site had acht beheerbare tekstvelden en ruim honderd
 * regels die hardgecodeerd in de pagina's stonden. De vraag van de klant was letterlijk: *"Kan
 * ik ook ergens gewoon tekst van de website aanpassen?"* -- en het antwoord was nee, op de zin
 * onder haar naam en haar over-tekst na.
 *
 * **Elke standaardwaarde is de tekst die er vandaag staat.** Daardoor verandert er bij het in
 * gebruik nemen niets aan wat een bezoeker leest; wat zij daarna anders zet, is haar keuze. De
 * publieke route parst elke sleutel door zijn schema, dus een lege database levert deze teksten
 * op en de pagina's hoeven geen eigen terugval meer mee te dragen.
 *
 * **Gegroepeerd per pagina, niet per sectie of in één grote sleutel.** Eén sleutel voor alles
 * zou betekenen dat één tikfout de hele pagina blokkeert en elke opslag alles herschrijft; een
 * sleutel per sectie geeft twintig verzoeken bij het bewaren. Per pagina is bovendien de vorm
 * die het beheerscherm al heeft: één blok met een *Bekijk*-link naar precies die pagina.
 *
 * Bewust níét beheerbaar: navigatielabels, formulierlabels, foutmeldingen en
 * toegankelijkheidsteksten. Dat is gereedschap, geen inhoud -- een kapotte foutmelding is erger
 * dan een foutmelding in niet precies haar woorden.
 */

/** Kop plus tekst, de vorm die in bijna elk blok terugkomt. */
const kopEnTekst = (titel: string, tekst: string) =>
  z.object({ titel: z.string().default(titel), tekst: z.string().default(tekst) });

export const paginaHomeSchema = z.object({
  aanbodTag: z.string().default("Wat we maken"),
  aanbodTitel: z.string().default("Sweet & grazing tables"),
  werkTag: z.string().default("Onze creaties"),
  werkTitel: z.string().default("Uitgelicht werk"),
  werkLink: z.string().default("Alle creaties"),
  procesTag: z.string().default("Het proces"),
  procesTitel: z.string().default("Zo gaat het"),
  procesLink: z.string().default("Lees hoe het werkt"),
  reviewsTag: z.string().default("Klanten over ons"),
  reviewsTitel: z.string().default("Wat klanten vertellen"),
  slotAccent: z.string().default("Een idee?"),
  slotTitel: z.string().default("Laten we het bespreken"),
  slotTekst: z.string().default(
    "Of het nu een bruiloft, verjaardag of een doopfeest is: vertel ons over jouw moment en we ontwerpen iets unieks.",
  ),
  slotKnop: z.string().default("Stuur een bericht"),
});

export const paginaAanbodSchema = z.object({
  tag: z.string().default("Aanbod"),
  titel: z.string().default("Sweet & grazing tables"),
  intro: z.string().default(
    "Een tafel vol zoets die het middelpunt van je feest wordt. We werken met pakketten als startpunt: een richtlijn met een vanaf-prijs, die we samen aanvullen tot het precies past bij jouw dag.",
  ),
  galerijLink: z.string().default("Bekijk de hele galerij"),
  pakkettenSlotzin: z.string().default(
    "Elk pakket is een startpunt. Meer gasten, een extra lekkernij of een eigen kleurenschema? Dat is allemaal mogelijk. We kijken samen wat bij je feest past.",
  ),
  weetjesTitel: z.string().default("Goed om te weten"),
  /**
   * De vier punten onder de prijzen. Een lijst en geen vaste velden: zij mag er een schrappen
   * of toevoegen zonder dat er een leeg blok achterblijft.
   */
  weetjes: z
    .array(z.object({ icoon: z.string().default("•"), titel: z.string(), tekst: z.string() }))
    .max(8)
    .default([
      { icoon: "📅", titel: "Op tijd aanvragen", tekst: "" },
      { icoon: "🍰", titel: "Taarten zijn flexibeler", tekst: "Een losse taart heeft minder voorbereiding nodig dan een hele tafel, dus vraag gerust wat er nog kan." },
      { icoon: "🚚", titel: "Bezorgen of afhalen", tekst: "We bezorgen en bouwen ter plaatse op. Afhalen kan ook, dan leggen we uit hoe je het veilig vervoert." },
      { icoon: "💬", titel: "Altijd op maat", tekst: "Allergieën, een kleurenschema of een eigen idee? Vertel het bij de aanvraag, dan kijken we samen wat past." },
    ]),
  taartenTag: z.string().default("Ook mogelijk"),
  taartenTitel: z.string().default("Taarten"),
  taartenIntro: z.string().default(
    "Een taart zonder tafel eromheen kan natuurlijk ook: voor een verjaardag, een bruiloft of gewoon omdat het kan.",
  ),
  taartenBijschrift: z.string().default("De uiteindelijke prijs hangt af van het ontwerp."),
  smakenTitel: z.string().default("Smaken"),
  /**
   * De vaste smaken. Stonden hardgecodeerd in `AanbodPage`, terwijl haar PDF en haar eigen
   * artikel elkaar tegenspreken over welke vier het zijn (vraag 11 in het content-invulplan).
   * Juist dat moet zij kunnen rechtzetten zonder ons.
   */
  smaken: z
    .array(z.object({ naam: z.string(), omschrijving: z.string().default("") }))
    .max(12)
    .default([
      { naam: "Lemon Bliss", omschrijving: "Citroen & vanille" },
      { naam: "Strawberry Blush", omschrijving: "Witte chocolade & aardbei" },
      { naam: "Caramel Cocoa", omschrijving: "Chocolade & karamel" },
      { naam: "Coco Blanc", omschrijving: "Kokos, witte chocolade & hazelnoot" },
    ]),
  smakenSlot: z.string().default("Iets anders in gedachten? Vraag het gerust, er kan vaak meer."),
  reviewsTag: z.string().default("Ervaringen"),
  reviewsTitel: z.string().default("Wat klanten zeggen"),
  slotAccent: z.string().default("Klaar om te plannen?"),
  slotTekst: z.string().default(
    "Vertel ons over je feest: de datum, het aantal gasten en wat je voor je ziet. We denken graag mee.",
  ),
  slotKnop: z.string().default("Vraag een offerte aan"),
  leegTitel: z.string().default("Binnenkort"),
  leegTekst: z.string().default(
    "We zetten de pakketten en prijzen op dit moment op een rij. Wil je nu al weten wat er mogelijk is voor jouw feest? Stuur gerust een bericht.",
  ),
});

export const paginaGalerijSchema = z.object({
  tag: z.string().default("Galerij"),
  titel: z.string().default("Ons werk"),
  intro: z.string().default(
    "Kies een gelegenheid en bekijk wat we eerder maakten. Zo krijg je een idee van wat er mogelijk is, en van de sfeer die erbij past.",
  ),
  slotVraag: z.string().default("Iets gezien dat past bij jouw feest?"),
  slotKnop: z.string().default("Vraag een offerte aan"),
});

export const paginaWerkwijzeSchema = z.object({
  tag: z.string().default("Werkwijze"),
  titel: z.string().default("Zo werkt het"),
  intro: z.string().default(
    "Achter iedere tafel en iedere taart zit een heel proces: van het eerste berichtje tot het moment waarop alles klaarstaat. Dit is hoe dat gaat.",
  ),
  levertijdTag: z.string().default("Op tijd aanvragen"),
  levertijdTitel: z.string().default("Wanneer moet je het vastleggen?"),
  slotVraag: z.string().default("Weet je al wat je zoekt, of juist nog niet?"),
  slotKnop: z.string().default("Offerte aanvragen"),
});

export const paginaContactSchema = z.object({
  tag: z.string().default("Contact"),
  titel: z.string().default("Vertel ons jouw idee"),
  intro: z.string().default(
    "Vul het formulier in met zoveel mogelijk details: datum, gelegenheid en aantal personen. Dan komen we zo snel mogelijk bij je terug met een voorstel.",
  ),
  bedanktTitel: z.string().default("Bedankt!"),
  bedanktTekst: z.string().default(
    "Je bericht is verstuurd. We nemen zo snel mogelijk contact met je op.",
  ),
  stappenTag: z.string().default("Hoe het werkt"),
  stappenTitel: z.string().default("Van idee tot tafel"),
});

export const voettekstSchema = z.object({
  payoff: z.string().default(
    "Handgemaakte sweet tables, grazing tables en taarten voor jouw mooiste momenten.",
  ),
  contactKop: z.string().default("Contact"),
  volgKop: z.string().default("Volg ons"),
});

/**
 * Eén stap uit haar werkwijze.
 *
 * **Geen nummer in de opslag.** Dat stond er wel (`"01"` t/m `"07"`), maar zodra je stappen kunt
 * herschikken staat "03" boven de eerste. Het nummer volgt nu uit de plek in de lijst.
 *
 * **Een foto-id en geen zoekterm.** De vorige vorm zocht een foto op een fragment van de
 * alt-tekst, omdat id's per database verschillen bij een seed. Zodra zíj de foto kiest is het id
 * juist de betere sleutel -- net als bij `packages.coverItemId` en `hero.fotoIds`. Geen foreign
 * key mogelijk in jsonb, dus een verdwenen foto wordt stil overgeslagen en aangevuld.
 */
export const werkwijzeStapSchema = z.object({
  titel: z.string().min(1),
  tekst: z.string().default(""),
  fotoItemId: z.number().int().positive().nullable().default(null),
});

export type WerkwijzeStapData = z.infer<typeof werkwijzeStapSchema>;

/**
 * Haar werkwijze-tekst, vrijwel woordelijk uit haar artikel "Van eerste idee tot taart op tafel".
 * Waar ze "de taart" schreef terwijl de zin net zo goed over een sweet table gaat, staat er iets
 * breders; elke aanpassing staat in docs/klant/content-invulplan.md.
 *
 * Dit is de enige plek waar deze tekst in de code staat. De seed leest hem hier uit en koppelt
 * er alleen haar foto's aan.
 */
const WERKWIJZE_KORT_STANDAARD: WerkwijzeStapData[] = [
  { titel: "Aanvraag", tekst: "Je stuurt een berichtje met de datum, het aantal gasten en waar je aan denkt. Een foto of een bord vol inspiratie mag ook.", fotoItemId: null },
  { titel: "Kennismaking", tekst: "We bespreken de wensen: hoe groot het moet worden, voor hoeveel personen, welke stijl erbij past en welke smaak het wordt.", fotoItemId: null },
  { titel: "Offerte", tekst: "Je krijgt een voorstel met wat erin zit en wat het kost. Pas als dat klopt, leggen we de datum vast.", fotoItemId: null },
  { titel: "Ontwerp", tekst: "Kleuren, vormen, decoratie en details worden één geheel. Een schets laat vooraf zien waar we naartoe werken.", fotoItemId: null },
  { titel: "Levering & opbouw", tekst: "Alles wordt vers gemaakt, zorgvuldig verpakt en op locatie opgebouwd. Jij hoeft er niets meer aan te doen.", fotoItemId: null },
];

const WERKWIJZE_LANG_STANDAARD: WerkwijzeStapData[] = [
  { titel: "Alles begint met een idee", tekst: "Vaak kom je met een foto, een bord vol inspiratie of alleen een paar losse ideeën. Misschien een bepaalde kleur, bloemen, een thema of juist een bepaalde sfeer. Samen bespreken we wat de wensen zijn. Hoe groot moet het worden? Voor hoeveel personen? Welke stijl past erbij? En natuurlijk: welke smaak gaat het worden?", fotoItemId: null },
  { titel: "Van inspiratie naar een concreet ontwerp", tekst: "Als alle wensen duidelijk zijn, begint voor mij het leukste gedeelte: het ontwerp. Ik kijk naar de kleuren, vormen, decoratie en details en maak daar een concreet ontwerp van. Zo ontstaat er van een verzameling ideeën uiteindelijk één geheel. Een schets helpt om vooraf precies voor ogen te hebben waar we naartoe werken. Soms verandert er nog iets, maar juist dat overleg maakt het persoonlijk.", fotoItemId: null },
  { titel: "Tijd om in te kopen", tekst: "Wanneer het ontwerp en de smaken vaststaan, begint de voorbereiding. De ingrediënten worden ingekocht en alle decoratie wordt verzameld. Denk aan chocolade, boter, eieren en verse ingrediënten, maar ook aan kartons, dozen, linten en natuurlijk alle details die het uiteindelijk compleet maken.", fotoItemId: null },
  { titel: "Bakken, vullen en opbouwen", tekst: "Dan is het eindelijk tijd om de keuken in te duiken. De lagen worden gebakken en zodra alles goed is afgekoeld, begint het opbouwen. De lagen worden gevuld, gestapeld en afgesmeerd, en vervolgens krijgt het zijn definitieve vorm. Dit is het moment waarop de schets langzaam werkelijkheid begint te worden.", fotoItemId: null },
  { titel: "De details maken het af", tekst: "Daarna komt het decoreren. Bloemen, strikjes, chocolade, parels, tekst of andere persoonlijke details worden één voor één aangebracht. Juist de kleine details zorgen ervoor dat het echt van jou wordt. En natuurlijk wordt alles nog even gecontroleerd: klopt de kleur, staat alles recht, en ziet het eruit zoals we vooraf hadden bedacht?", fotoItemId: null },
  { titel: "Klaarmaken voor afhalen", tekst: "Als alles helemaal klaar is, wordt het zorgvuldig verpakt. De taart gaat veilig in een passende doos en wordt gekoeld bewaard tot het moment van afhalen. Want na al die uren werk wil je natuurlijk maar één ding: dat alles heelhuids op de feestlocatie aankomt.", fotoItemId: null },
  { titel: "En dan is het zover", tekst: "Wat begon als een berichtje, een paar inspiratiebeelden en een aantal wensen, staat klaar om onderdeel te worden van jouw bijzondere moment.", fotoItemId: null },
];

/**
 * Haar werkwijze in twee dieptes: vijf korte stappen voor de strip op de homepage en de
 * contactpagina, zeven uitgeschreven stappen voor `/werkwijze`.
 *
 * Twee lijsten en geen vlag per stap: de korte versie is geen selectie uit de lange, de titels
 * verschillen ("Aanvraag" tegenover "Alles begint met een idee"). Het zijn twee teksten over
 * dezelfde werkwijze.
 *
 * **De standaardwaarde is haar eigen tekst, geen lege lijst.** Een lege lijst liet bij een nog
 * niet gevulde database de hele strip op de homepage verdwijnen -- en daarmee kwamen twee
 * groene banden direct op elkaar te staan. Het uitgangspunt van deze sleutels is dat er niets
 * zichtbaars verandert tot zij zelf iets wijzigt. De foto's staan op `null`; `stapFotos()` vult
 * die aan met haar eigen werk.
 *
 * Een kopie per aanroep (de functie-vorm van `.default`), zodat een gewijzigde stap in het ene
 * antwoord niet stilletjes in het volgende opduikt.
 */
export const werkwijzeSettingsSchema = z.object({
  kort: z.array(werkwijzeStapSchema).max(8).default(() => WERKWIJZE_KORT_STANDAARD.map((s) => ({ ...s }))),
  lang: z.array(werkwijzeStapSchema).max(12).default(() => WERKWIJZE_LANG_STANDAARD.map((s) => ({ ...s }))),
});

export type PaginaHomeSettings = z.infer<typeof paginaHomeSchema>;
export type PaginaAanbodSettings = z.infer<typeof paginaAanbodSchema>;
export type PaginaGalerijSettings = z.infer<typeof paginaGalerijSchema>;
export type PaginaWerkwijzeSettings = z.infer<typeof paginaWerkwijzeSchema>;
export type PaginaContactSettings = z.infer<typeof paginaContactSchema>;
export type VoettekstSettings = z.infer<typeof voettekstSchema>;
export type WerkwijzeSettings = z.infer<typeof werkwijzeSettingsSchema>;

/**
 * Sleutel → schema. `site_settings` is jsonb, dus de database bewaakt de vorm niet; dit is
 * de enige plek waar dat gebeurt. Een sleutel die hier niet in staat wordt geweigerd — zo
 * maakt een typefout in een sleutelnaam geen stille extra rij aan.
 *
 * Nieuwe instelling? Schema hierboven toevoegen en hier registreren.
 */
export const siteSettingSchemas = {
  contact: contactSettingsSchema,
  hero: heroSettingsSchema,
  about: aboutSettingsSchema,
  levertijden: levertijdenSettingsSchema,
  btw: btwSettingsSchema,
  paginaHome: paginaHomeSchema,
  paginaAanbod: paginaAanbodSchema,
  paginaGalerij: paginaGalerijSchema,
  paginaWerkwijze: paginaWerkwijzeSchema,
  paginaContact: paginaContactSchema,
  voettekst: voettekstSchema,
  werkwijze: werkwijzeSettingsSchema,
} as const;

export type SiteSettingKey = keyof typeof siteSettingSchemas;

export function isSiteSettingKey(key: string): key is SiteSettingKey {
  return Object.prototype.hasOwnProperty.call(siteSettingSchemas, key);
}

/**
 * Wat er van `site_settings` naar een **niet-ingelogde bezoeker** mag.
 *
 * 🔴 **Waarom dit register bestaat.** `GET /api/public/settings` stuurde alle rijen ongefilterd
 * door, inclusief `levertijden.agendaFeedToken`. Wie de homepage opvroeg kon dat token uit het
 * antwoord plukken en er `/api/agenda.ics?token=…` mee ophalen: álle boekingen met klantnaam,
 * locatie, bedrag en notitie. Het instellingenscherm waarschuwt zelf dat die link met niemand
 * gedeeld mag worden; de site deelde hem met iedereen.
 *
 * **`.pick()` en niet `.omit()`.** Met `.omit({ agendaFeedToken: true })` zou elk veld dat hier
 * later bij komt automatisch naar buiten lekken — je moet dan onthouden om het uit te sluiten.
 * Met `.pick()` is "gaat niet naar buiten" de standaard en kost publiceren één bewuste regel.
 * Dat verschil is precies waar dit lek uit ontstond.
 *
 * `btw` staat er helemaal niet in: `standaardTarief` en `toelichting` worden alleen op de
 * offerte gebruikt, en die maakt zij in het beheerpaneel.
 */
export const publiekeSiteSettingSchemas = {
  contact: contactSettingsSchema,
  hero: heroSettingsSchema,
  about: aboutSettingsSchema,
  levertijden: levertijdenSettingsSchema.pick({ standaardDagen: true, tekst: true }),
  // De teksten zijn per definitie publiek: ze staan op de pagina's.
  paginaHome: paginaHomeSchema,
  paginaAanbod: paginaAanbodSchema,
  paginaGalerij: paginaGalerijSchema,
  paginaWerkwijze: paginaWerkwijzeSchema,
  paginaContact: paginaContactSchema,
  voettekst: voettekstSchema,
  werkwijze: werkwijzeSettingsSchema,
} as const;

export type PubliekeSiteSettingKey = keyof typeof publiekeSiteSettingSchemas;

/**
 * De vorm die de publieke site binnenkrijgt. Volledig ingevuld: de route parst elke sleutel
 * door zijn schema, dus een ontbrekende rij levert de standaardwaarden op in plaats van
 * `undefined`. Daarom hoeven de pagina's geen eigen terugvalteksten meer te hebben.
 */
export type PubliekeSiteSettings = {
  [K in PubliekeSiteSettingKey]: z.infer<(typeof publiekeSiteSettingSchemas)[K]>;
};

export type ContactSettings = z.infer<typeof contactSettingsSchema>;
export type HeroSettings = z.infer<typeof heroSettingsSchema>;
export type AboutSettings = z.infer<typeof aboutSettingsSchema>;

// ---------- Types ----------

export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderPayment = typeof orderPayments.$inferSelect;
export type InsertOrderPayment = z.infer<typeof insertOrderPaymentSchema>;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type InsertOrderEvent = z.infer<typeof insertOrderEventSchema>;
/** De soorten gebeurtenissen op de tijdlijn. */
export type OrderEventKind =
  | "aangemaakt" | "status" | "regel" | "betaling" | "offerte" | "wijziging";
export type ContactRequest = typeof contactRequests.$inferSelect;
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;
export type GalleryCategory = typeof galleryCategories.$inferSelect;
export type InsertGalleryCategory = z.infer<typeof insertGalleryCategorySchema>;
export type GalleryAlbum = typeof galleryAlbums.$inferSelect;
export type InsertGalleryAlbum = z.infer<typeof insertGalleryAlbumSchema>;
export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
