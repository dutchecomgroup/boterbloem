import { Router } from "express";
import { db } from "../../db.js";
import { customers, orders, insertCustomerSchema } from "@shared/schema";
import { desc, eq } from "drizzle-orm";
import { requireFields } from "../../lib/patch.js";

export const customersRouter = Router();

customersRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await db.select().from(customers).orderBy(desc(customers.createdAt));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

customersRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (!customer) return res.status(404).json({ error: "Klant niet gevonden" });
    const history = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.eventDate));
    res.json({ ...customer, orders: history });
  } catch (err) {
    next(err);
  }
});

customersRouter.post("/", async (req, res, next) => {
  try {
    const data = insertCustomerSchema.parse(req.body);
    const [row] = await db.insert(customers).values(data).returning();
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

customersRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = requireFields(insertCustomerSchema.partial().parse(req.body));
    const [row] = await db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Klant niet gevonden" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

customersRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.delete(customers).where(eq(customers.id, id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
