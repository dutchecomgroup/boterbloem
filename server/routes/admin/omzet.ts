import { Router } from "express";
import { db } from "../../db.js";
import { orders, orderItems, orderPayments, customers, packages } from "@shared/schema";
import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { btwPerTarief, naarCenten, naarBedrag, ontvangen, openstaand } from "../../lib/orderTotals.js";
import { perBucket, som, vorigePeriode, type Groep } from "../../lib/omzet.js";

export const omzetRouter = Router();

/**
 * De cijfers achter `/admin/omzet`.
 *
 * **Omzet telt op de datum van het feest en op status `afgeleverd`.** Dat is de afspraak van
 * 25-08. Het werk is dan geleverd, dus de omzet is verdiend -- ook als de klant pas later
 * betaalt. Wat er binnenkwam staat er los naast als kaspositie.
 *
 * Dit verving de oude regel op het dashboard, die naast `afgeleverd` ook `paid_at IS NOT NULL`
 * eiste. Dat veld werd nergens geschreven, dus die teller stond structureel op nul.
 *
 * **Het rekenwerk gebeurt hier in TypeScript en niet in SQL.** De afrondingsregels staan in
 * `orderTotals.ts` en zijn daar getest met echte bedragen; ze in een tweede taal nog eens
 * opschrijven is precies hoe twee antwoorden op dezelfde vraag ontstaan. De aantallen zijn
 * klein genoeg dat het niets kost.
 */

const ISO = /^\d{4}-\d{2}-\d{2}$/;

const vraagSchema = z.object({
  van: z.string().regex(ISO, "Datum moet YYYY-MM-DD zijn"),
  tot: z.string().regex(ISO, "Datum moet YYYY-MM-DD zijn"),
  groep: z.enum(["maand", "week"]).default("maand"),
});

/** Boekingen die in een periode omzet opleveren: afgeleverd, met een feestdatum in de periode. */
async function afgeleverdIn(van: string, tot: string) {
  return db
    .select({
      id: orders.id,
      reference: orders.reference,
      eventDate: orders.eventDate,
      totalPrice: orders.totalPrice,
      packageId: orders.packageId,
      customerId: orders.customerId,
    })
    .from(orders)
    .where(and(eq(orders.status, "afgeleverd"), gte(orders.eventDate, van), lte(orders.eventDate, tot)))
    .orderBy(asc(orders.eventDate));
}

omzetRouter.get("/", async (req, res, next) => {
  try {
    const { van, tot, groep } = vraagSchema.parse(req.query);
    if (van > tot) return res.status(400).json({ error: "De einddatum ligt vóór de begindatum" });

    const boekingen = await afgeleverdIn(van, tot);
    const ids = boekingen.map((b) => b.id);

    // Regels van precies déze boekingen, voor de btw-uitsplitsing en het pakketoverzicht.
    const regels = ids.length
      ? await db
          .select({
            orderId: orderItems.orderId,
            description: orderItems.description,
            lineTotal: orderItems.lineTotal,
            vatRate: orderItems.vatRate,
            details: orderItems.details,
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, ids))
      : [];

    const omzet = som(boekingen.map((b) => b.totalPrice));
    const reeks = perBucket(
      boekingen.map((b) => ({ datum: b.eventDate, bedrag: b.totalPrice })),
      van, tot, groep as Groep,
    );

    // Vergelijking met de even lange periode ervoor. Niet met vorig jaar: dat bestaat bij een
    // jong bedrijf meestal niet, en dan vergelijk je met nul.
    const vorige = vorigePeriode(van, tot);
    const vorigeBoekingen = await afgeleverdIn(vorige.van, vorige.tot);
    const vorigeOmzet = som(vorigeBoekingen.map((b) => b.totalPrice));
    const verschilCenten = naarCenten(omzet) - naarCenten(vorigeOmzet);

    // De kaspositie: wat er in déze periode binnenkwam, op betaaldatum. Losse vraag, los antwoord.
    const betalingenInPeriode = await db
      .select({ amount: orderPayments.amount, paidOn: orderPayments.paidOn })
      .from(orderPayments)
      .where(and(gte(orderPayments.paidOn, van), lte(orderPayments.paidOn, tot)));

    // Openstaand kijkt bewust niet naar de periode: een rekening van vier maanden geleden is
    // juist het geval dat je wilt zien.
    const alleAfgeleverd = await db
      .select({
        id: orders.id,
        reference: orders.reference,
        eventDate: orders.eventDate,
        totalPrice: orders.totalPrice,
        klant: customers.name,
        ontvangen: sql<string>`coalesce((
          SELECT sum(p.amount) FROM order_payments p WHERE p.order_id = ${orders.id}
        ), 0)::text`,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.status, "afgeleverd"))
      .orderBy(asc(orders.eventDate));

    const openstaandeposten = alleAfgeleverd
      .map((o) => ({ ...o, open: openstaand(o.totalPrice, o.ontvangen) }))
      .filter((o) => naarCenten(o.open) > 0);

    // Per pakket: waar komt de omzet vandaan. De herkomst staat op de regel (`details.packageId`)
    // en niet op de boeking, want één boeking kan regels uit twee pakketten bevatten.
    const pakketten = await db.select({ id: packages.id, name: packages.name }).from(packages);
    const naamVan = new Map(pakketten.map((p) => [p.id, p.name]));
    const perPakket = new Map<string, number>();
    for (const r of regels) {
      const pid = (r.details as { packageId?: number } | null)?.packageId;
      const naam = pid ? (naamVan.get(pid) ?? "Onbekend pakket") : "Los werk";
      perPakket.set(naam, (perPakket.get(naam) ?? 0) + naarCenten(r.lineTotal));
    }

    res.json({
      periode: { van, tot, groep },
      omzet,
      aantalBoekingen: boekingen.length,
      gemiddeld: boekingen.length ? naarBedrag(Math.round(naarCenten(omzet) / boekingen.length)) : "0.00",
      vorige: {
        van: vorige.van,
        tot: vorige.tot,
        omzet: vorigeOmzet,
        verschil: naarBedrag(verschilCenten),
        // Geen percentage als er niets was om mee te vergelijken: "+100%" ten opzichte van nul
        // is geen groei maar een deling door nul met een nette jas aan.
        procent: naarCenten(vorigeOmzet) > 0
          ? Math.round((verschilCenten / naarCenten(vorigeOmzet)) * 100)
          : null,
      },
      reeks,
      btw: btwPerTarief(regels),
      perPakket: [...perPakket]
        .map(([naam, centen]) => ({ naam, omzet: naarBedrag(centen) }))
        .sort((a, b) => naarCenten(b.omzet) - naarCenten(a.omzet)),
      kas: {
        ontvangen: ontvangen(betalingenInPeriode),
        reeks: perBucket(
          betalingenInPeriode.map((b) => ({ datum: b.paidOn, bedrag: b.amount })),
          van, tot, groep as Groep,
        ),
      },
      openstaand: {
        totaal: som(openstaandeposten.map((o) => o.open)),
        posten: openstaandeposten,
      },
    });
  } catch (err) {
    next(err);
  }
});
