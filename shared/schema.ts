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

export const insertGalleryCategorySchema = createInsertSchema(galleryCategories).omit({
  id: true,
});

export const insertGalleryAlbumSchema = createInsertSchema(galleryAlbums, {
  title: z.string().min(1, "Titel is verplicht"),
  slug: z.string().min(1, "Slug is verplicht"),
  // drizzle-zod maakt van een jsonb-kolom een losse `Json` waar ook een string in past. De
  // echte vorm hier vastleggen, anders is de kolom in de praktijk ongetypeerd — en dit is
  // inhoud die op een publieke pagina gerenderd wordt.
  blocks: z.array(albumBlokSchema).nullable().optional(),
}).omit({ id: true, createdAt: true });

export const insertPackageSchema = createInsertSchema(packages, {
  name: z.string().min(1, "Naam is verplicht"),
  slug: z.string().min(1, "Slug is verplicht"),
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
  /** Opschrift van de gouden knop. */
  ctaLabel: z.string().default("Vraag offerte aan"),
  /** Waar die knop heen gaat. Een pad op de eigen site, of een volledig adres. */
  ctaHref: z.string().default("/contact"),
});

export const aboutSettingsSchema = z.object({
  heading: z.string().default("Over Atelier Boterbloem"),
  body: z.string().default(""),
  imageFilename: z.string().optional(),
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
} as const;

export type SiteSettingKey = keyof typeof siteSettingSchemas;

export function isSiteSettingKey(key: string): key is SiteSettingKey {
  return Object.prototype.hasOwnProperty.call(siteSettingSchemas, key);
}

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
