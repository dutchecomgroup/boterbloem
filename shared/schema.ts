import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
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
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }),
  role: varchar("role", { length: 32 }).notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_unique").on(table.email),
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
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex("products_slug_unique").on(table.slug),
}));

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
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("orders_status_idx").on(table.status),
  eventDateIdx: index("orders_event_date_idx").on(table.eventDate),
}));

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0"),
  lineTotal: numeric("line_total", { precision: 10, scale: 2 }).notNull().default("0"),
  sortOrder: integer("sort_order").notNull().default(0),
});

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
  convertedOrderId: integer("converted_order_id").references(() => orders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("contact_status_idx").on(table.status),
  createdIdx: index("contact_created_idx").on(table.createdAt),
}));

// ---------- Gallery ----------

export const galleryCategories = pgTable("gallery_categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => ({
  slugIdx: uniqueIndex("gallery_cat_slug_unique").on(table.slug),
}));

export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => galleryCategories.id, { onDelete: "set null" }),
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

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
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

export const galleryItemsRelations = relations(galleryItems, ({ one }) => ({
  category: one(galleryCategories, {
    fields: [galleryItems.categoryId],
    references: [galleryCategories.id],
  }),
}));

// ---------- Zod schemas ----------

export const insertCustomerSchema = createInsertSchema(customers, {
  email: z.string().email().optional().or(z.literal("")),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });

export const insertProductSchema = createInsertSchema(products).omit({
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

// ---------- Site settings shape (JSONB validation) ----------

export const contactSettingsSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  openingHours: z.array(z.object({
    day: z.string(),
    hours: z.string(),
  })).default([]),
});

export const heroSettingsSchema = z.object({
  title: z.string().default("Atelier Boterbloem"),
  tagline: z.string().default("Handgemaakte taarten voor jouw mooiste momenten"),
  ctaLabel: z.string().default("Vraag offerte aan"),
  ctaHref: z.string().default("/contact"),
  imageFilename: z.string().optional(),
});

export const aboutSettingsSchema = z.object({
  heading: z.string().default("Over Atelier Boterbloem"),
  body: z.string().default(""),
  imageFilename: z.string().optional(),
});

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
export type ContactRequest = typeof contactRequests.$inferSelect;
export type InsertContactRequest = z.infer<typeof insertContactRequestSchema>;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;
export type GalleryCategory = typeof galleryCategories.$inferSelect;
export type InsertGalleryCategory = z.infer<typeof insertGalleryCategorySchema>;
export type SiteSetting = typeof siteSettings.$inferSelect;
