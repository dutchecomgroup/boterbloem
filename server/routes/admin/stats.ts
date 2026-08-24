import { Router } from "express";
import { db } from "../../db.js";
import { orders, contactRequests } from "@shared/schema";
import { sql, and, eq, gte, lte, isNotNull } from "drizzle-orm";

export const statsRouter = Router();

// GET /api/admin/stats/dashboard
statsRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
    const next30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [{ openRequests }] = await db
      .select({ openRequests: sql<number>`count(*)::int` })
      .from(contactRequests)
      .where(eq(contactRequests.status, "nieuw"));

    const [{ upcomingOrders }] = await db
      .select({ upcomingOrders: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.status, "bevestigd"),
          gte(orders.eventDate, today.toISOString().slice(0, 10)),
          lte(orders.eventDate, next30.toISOString().slice(0, 10)),
        ),
      );

    const [{ revenueThisMonth }] = await db
      .select({ revenueThisMonth: sql<string>`coalesce(sum(${orders.totalPrice}), 0)::text` })
      .from(orders)
      .where(and(eq(orders.status, "afgeleverd"), gte(orders.paidAt, startOfMonth), isNotNull(orders.paidAt)));

    const [{ revenueLastMonth }] = await db
      .select({ revenueLastMonth: sql<string>`coalesce(sum(${orders.totalPrice}), 0)::text` })
      .from(orders)
      .where(
        and(
          eq(orders.status, "afgeleverd"),
          gte(orders.paidAt, startOfLastMonth),
          lte(orders.paidAt, endOfLastMonth),
          isNotNull(orders.paidAt),
        ),
      );

    // Last 12 months revenue
    const revenueByMonth = await db.execute<{ month: string; revenue: string }>(sql`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', now()) - interval '11 months',
          date_trunc('month', now()),
          interval '1 month'
        ) AS month
      )
      SELECT
        to_char(m.month, 'YYYY-MM') AS month,
        coalesce(sum(o.total_price), 0)::text AS revenue
      FROM months m
      LEFT JOIN orders o
        ON date_trunc('month', o.paid_at) = m.month
        AND o.status = 'afgeleverd'
      GROUP BY m.month
      ORDER BY m.month ASC
    `);

    res.json({
      openRequests,
      upcomingOrders,
      revenueThisMonth: Number(revenueThisMonth ?? 0),
      revenueLastMonth: Number(revenueLastMonth ?? 0),
      revenueByMonth: revenueByMonth.map((r) => ({ month: r.month, revenue: Number(r.revenue) })),
    });
  } catch (err) {
    next(err);
  }
});
