import { Router } from "express";
import { db } from "../../db.js";
import {
  orders,
  orderItems,
  customers,
  contactRequests,
  insertOrderSchema,
  insertOrderItemSchema,
} from "@shared/schema";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

export const ordersRouter = Router();

const createOrderSchema = z.object({
  order: insertOrderSchema,
  items: z.array(insertOrderItemSchema.omit({ orderId: true })).default([]),
});

ordersRouter.get("/", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const base = db
      .select({
        id: orders.id,
        eventDate: orders.eventDate,
        status: orders.status,
        totalPrice: orders.totalPrice,
        deliveryType: orders.deliveryType,
        customer: customers,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .orderBy(desc(orders.eventDate), desc(orders.createdAt));
    const rows = status
      ? await base.where(eq(orders.status, status as never))
      : await base;
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Boeking niet gevonden" });
    const customer = order.customerId
      ? (await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1))[0]
      : null;
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id))
      .orderBy(orderItems.sortOrder);
    res.json({ ...order, customer, items });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/", async (req, res, next) => {
  try {
    const { order, items } = createOrderSchema.parse(req.body);
    const [created] = await db.insert(orders).values(order).returning();
    if (items.length) {
      await db.insert(orderItems).values(
        items.map((it, idx) => ({ ...it, orderId: created.id, sortOrder: idx })),
      );
    }
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

ordersRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = insertOrderSchema.partial().parse(req.body);
    const [row] = await db
      .update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Boeking niet gevonden" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

ordersRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.delete(orders).where(eq(orders.id, id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Convert a contact request to an order (creates customer + empty order, marks request)
const convertSchema = z.object({ contactRequestId: z.number().int().positive() });

ordersRouter.post("/from-contact", async (req, res, next) => {
  try {
    const { contactRequestId } = convertSchema.parse(req.body);
    const [cr] = await db
      .select()
      .from(contactRequests)
      .where(eq(contactRequests.id, contactRequestId))
      .limit(1);
    if (!cr) return res.status(404).json({ error: "Aanvraag niet gevonden" });

    const [customer] = await db
      .insert(customers)
      .values({
        name: cr.name,
        email: cr.email,
        phone: cr.phone ?? undefined,
        notes: cr.message,
      })
      .returning();

    const [order] = await db
      .insert(orders)
      .values({
        customerId: customer.id,
        eventDate: cr.eventDate ?? undefined,
        status: "aanvraag",
        notes: `Type: ${cr.eventType ?? "—"} · Personen: ${cr.persons ?? "—"}\n\n${cr.message}`,
      })
      .returning();

    await db
      .update(contactRequests)
      .set({ status: "omgezet_naar_order", convertedOrderId: order.id })
      .where(eq(contactRequests.id, contactRequestId));

    res.status(201).json({ customer, order });
  } catch (err) {
    next(err);
  }
});
