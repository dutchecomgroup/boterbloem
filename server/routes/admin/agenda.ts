import { Router } from "express";
import { db } from "../../db.js";
import { orders, customers, contactRequests } from "@shared/schema";
import { and, asc, eq, gte, lte, isNotNull, ne, sql } from "drizzle-orm";
import { z } from "zod";

export const agendaRouter = Router();

const bereikSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from moet YYYY-MM-DD zijn"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to moet YYYY-MM-DD zijn"),
});

/**
 * GET /api/admin/agenda?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Twee soorten items op één kalender:
 *  - **boekingen** uit `orders` — echte afspraken
 *  - **aanvragen** uit `contact_requests` met een datum die nog niet omgezet is; die zijn
 *    nog geen boeking, maar bezetten mogelijk wel die dag. Ze verdwijnen zodra ze omgezet
 *    worden, anders zou dezelfde dag dubbel tellen.
 */
agendaRouter.get("/", async (req, res, next) => {
  try {
    const { from, to } = bereikSchema.parse(req.query);

    const [boekingen, aanvragen] = await Promise.all([
      db
        .select({
          id: orders.id,
          reference: orders.reference,
          eventDate: orders.eventDate,
          eventTime: orders.eventTime,
          location: orders.location,
          status: orders.status,
          deliveryType: orders.deliveryType,
          totalPrice: orders.totalPrice,
          notes: orders.notes,
          // Alleen óf er iets is, niet wát. De kalender toont een waarschuwingsteken; de
          // allergie zelf hoort in de boeking, niet in een vakje van 100 pixels breed.
          heeftAllergie: sql<boolean>`${orders.allergies} IS NOT NULL AND ${orders.allergies} <> ''`,
          customerName: customers.name,
          customerPhone: customers.phone,
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(and(isNotNull(orders.eventDate), gte(orders.eventDate, from), lte(orders.eventDate, to)))
        .orderBy(asc(orders.eventDate), asc(orders.eventTime)),

      db
        .select({
          id: contactRequests.id,
          eventDate: contactRequests.eventDate,
          name: contactRequests.name,
          eventType: contactRequests.eventType,
          persons: contactRequests.persons,
          status: contactRequests.status,
        })
        .from(contactRequests)
        .where(
          and(
            isNotNull(contactRequests.eventDate),
            gte(contactRequests.eventDate, from),
            lte(contactRequests.eventDate, to),
            ne(contactRequests.status, "omgezet_naar_order"),
          ),
        )
        .orderBy(asc(contactRequests.eventDate)),
    ]);

    res.json({
      boekingen: boekingen.map((b) => ({ ...b, soort: "boeking" as const })),
      aanvragen: aanvragen.map((a) => ({ ...a, soort: "aanvraag" as const })),
    });
  } catch (err) {
    next(err);
  }
});
