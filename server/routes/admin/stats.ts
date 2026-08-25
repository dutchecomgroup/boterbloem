import { Router } from "express";
import { db } from "../../db.js";
import { orders, contactRequests } from "@shared/schema";
import { sql, and, eq, gte, lte } from "drizzle-orm";

export const statsRouter = Router();

/** `Date` → "YYYY-MM-DD". `event_date` is een `date`, dus vergelijken gaat op tekst. */
function isoDatum(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

    /*
     * Omzet telt op de **datum van het feest** en op status `afgeleverd`. Zie
     * `server/routes/admin/omzet.ts` voor de redenering; de omzetpagina gebruikt dezelfde
     * regel, en dat is het punt -- ze stonden eerder los van elkaar en gaven andere getallen.
     *
     * Hier stond `paid_at IS NOT NULL` bij. Dat veld werd door niets ooit geschreven, dus
     * deze twee tegels en de grafiek hieronder stonden structureel op € 0,00.
     */
    const [{ revenueThisMonth }] = await db
      .select({ revenueThisMonth: sql<string>`coalesce(sum(${orders.totalPrice}), 0)::text` })
      .from(orders)
      .where(and(eq(orders.status, "afgeleverd"), gte(orders.eventDate, isoDatum(startOfMonth))));

    const [{ revenueLastMonth }] = await db
      .select({ revenueLastMonth: sql<string>`coalesce(sum(${orders.totalPrice}), 0)::text` })
      .from(orders)
      .where(
        and(
          eq(orders.status, "afgeleverd"),
          gte(orders.eventDate, isoDatum(startOfLastMonth)),
          lte(orders.eventDate, isoDatum(endOfLastMonth)),
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
        ON date_trunc('month', o.event_date) = m.month
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
