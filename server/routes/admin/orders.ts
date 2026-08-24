import { Router } from "express";
import { db } from "../../db.js";
import {
  orders,
  orderItems,
  orderEvents,
  customers,
  packages,
  contactRequests,
  insertOrderSchema,
  insertOrderItemSchema,
} from "@shared/schema";
import { desc, eq, sql } from "drizzle-orm";
import { requireFields } from "../../lib/patch.js";
import { boekingTotaal, regelTotaal, pakketNaarRegels, naarCenten } from "../../lib/orderTotals.js";
import { logOrderEvent, gebeurtenis, GELOGDE_VELDEN, type Tx } from "../../lib/orderEvents.js";
import type { AuthedRequest } from "../../auth.js";
import { z } from "zod";

export const ordersRouter = Router();

/* ===========================================================================
 * Gedeeld gereedschap
 * ========================================================================= */

/** Wie de wijziging doet, voor in de tijdlijn. */
function wie(req: AuthedRequest): string | null {
  return req.session?.username ?? null;
}

/**
 * Het totaal opnieuw optellen uit álle regels van de boeking.
 *
 * Altijd binnen dezelfde transactie als de regelwijziging zelf. Zou je dit erbuiten doen, dan
 * bestaat er een moment waarop de regels al veranderd zijn en het totaal nog niet — en dat is
 * precies het bedrag dat de lijst, het dashboard en de offerte laten zien.
 */
async function hertelTotaal(tx: Tx, orderId: number): Promise<string> {
  const regels = await tx
    .select({ lineTotal: orderItems.lineTotal })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const totaal = boekingTotaal(regels);
  await tx
    .update(orders)
    .set({ totalPrice: totaal, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
  return totaal;
}

/**
 * Het volgende boekingsnummer: `ABB-2026-014`, per jaar tellend.
 *
 * Leidt af uit het hoogste bestaande nummer van dit jaar in plaats van uit `count(*)`, zodat
 * een verwijderde boeking geen nummer laat hergebruiken — het staat al op een offerte bij een
 * klant. Twee gelijktijdige aanmaken kunnen hetzelfde nummer trekken; daarvoor ligt de unieke
 * index op `reference` als vangnet en probeert de aanroeper het opnieuw.
 */
async function volgendeReferentie(tx: Tx): Promise<string> {
  const jaar = new Date().getFullYear();
  const [hoogste] = await tx
    .select({ reference: orders.reference })
    .from(orders)
    .where(sql`${orders.reference} LIKE ${`ABB-${jaar}-%`}`)
    .orderBy(desc(orders.reference))
    .limit(1);

  const vorig = hoogste?.reference ? Number(hoogste.reference.slice(-3)) : 0;
  return `ABB-${jaar}-${String(vorig + 1).padStart(3, "0")}`;
}

/** Postgres-foutcode voor een schending van een unieke index. */
const UNIEK_GESCHONDEN = "23505";

function isDubbeleReferentie(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === UNIEK_GESCHONDEN;
}

/**
 * Namen bij verwijzingen, voor leesbare tijdlijnregels. Geven `null` terug als de rij niet
 * (meer) bestaat — een verwijderd pakket mag de tijdlijn niet laten omvallen.
 */
async function pakketNaam(tx: Tx, id: unknown): Promise<string | null> {
  if (typeof id !== "number") return null;
  const [r] = await tx.select({ name: packages.name }).from(packages).where(eq(packages.id, id)).limit(1);
  return r?.name ?? null;
}

async function klantNaam(tx: Tx, id: unknown): Promise<string | null> {
  if (typeof id !== "number") return null;
  const [r] = await tx.select({ name: customers.name }).from(customers).where(eq(customers.id, id)).limit(1);
  return r?.name ?? null;
}

/** De boeking ophalen of een 404 gooien — scheelt dezelfde vier regels in elke route. */
async function haalBoeking(tx: Tx, id: number) {
  const [order] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) {
    const err = new Error("Boeking niet gevonden") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  return order;
}

/* ===========================================================================
 * Boekingen
 * ========================================================================= */

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
        reference: orders.reference,
        eventDate: orders.eventDate,
        eventTime: orders.eventTime,
        status: orders.status,
        totalPrice: orders.totalPrice,
        depositAmount: orders.depositAmount,
        depositPaid: orders.depositPaid,
        deliveryType: orders.deliveryType,
        persons: orders.persons,
        location: orders.location,
        // Alleen of er iets is, niet wat — de lijst hoeft geen allergieën te tonen, maar wel
        // te kunnen markeren dat er op gelet moet worden.
        heeftAllergie: sql<boolean>`${orders.allergies} IS NOT NULL AND ${orders.allergies} <> ''`,
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
    const order = await haalBoeking(db, id);
    const customer = order.customerId
      ? (await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1))[0]
      : null;
    const pakket = order.packageId
      ? (await db.select().from(packages).where(eq(packages.id, order.packageId)).limit(1))[0]
      : null;
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id))
      .orderBy(orderItems.sortOrder);
    res.json({ ...order, customer, pakket: pakket ?? null, items });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const { order, items } = createOrderSchema.parse(req.body);
    const actor = wie(req);

    // Twee pogingen: als twee mensen tegelijk aanmaken kan het nummer botsen op de unieke
    // index. De tweede poging leest het dan opnieuw en komt een hoger nummer tegen.
    let created;
    for (let poging = 0; ; poging++) {
      try {
        created = await db.transaction(async (tx) => {
          const reference = await volgendeReferentie(tx);
          const [row] = await tx.insert(orders).values({ ...order, reference }).returning();

          if (items.length) {
            await tx.insert(orderItems).values(
              items.map((it, idx) => ({
                ...it,
                orderId: row.id,
                sortOrder: idx,
                lineTotal: regelTotaal(it.quantity ?? 1, it.unitPrice ?? 0),
              })),
            );
            row.totalPrice = await hertelTotaal(tx, row.id);
          }

          await logOrderEvent(tx, row.id, gebeurtenis.aangemaakt(), actor);
          return row;
        });
        break;
      } catch (err) {
        if (poging === 0 && isDubbeleReferentie(err)) continue;
        throw err;
      }
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

ordersRouter.patch("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = requireFields(insertOrderSchema.partial().parse(req.body));
    const actor = wie(req);

    const row = await db.transaction(async (tx) => {
      const voor = await haalBoeking(tx, id);

      const [na] = await tx
        .update(orders)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();

      // Statuswissel is een eigen soort gebeurtenis — daar wordt het vaakst naar teruggekeken.
      if (data.status && data.status !== voor.status) {
        await logOrderEvent(tx, id, gebeurtenis.status(voor.status, data.status), actor);
      }

      // Aanbetaling: het bedrag én "is het binnen" zijn allebei het loggen waard.
      if (
        (data.depositAmount !== undefined && data.depositAmount !== voor.depositAmount) ||
        (data.depositPaid !== undefined && data.depositPaid !== voor.depositPaid)
      ) {
        const bedrag = String(data.depositAmount ?? voor.depositAmount);
        const betaald = data.depositPaid ?? voor.depositPaid;
        await logOrderEvent(tx, id, gebeurtenis.aanbetaling(bedrag, betaald), actor);
      }

      // De overige velden waarvan het later uitmaakt dát ze veranderd zijn. `notes` staat er
      // bewust niet bij: een notitie bijstellen hoort niet elke keer in de tijdlijn.
      for (const veld of GELOGDE_VELDEN) {
        const nieuw = (data as Record<string, unknown>)[veld];
        const oud = (voor as Record<string, unknown>)[veld];
        if (nieuw === undefined || String(nieuw ?? "") === String(oud ?? "")) continue;

        // Verwijzingen als naam loggen, niet als nummer. "Pakket: leeg → 2" zegt niets tegen
        // wie het over een half jaar teruggeleest; het id blijft in `details` staan.
        const [was, wordt] =
          veld === "packageId"
            ? [await pakketNaam(tx, oud), await pakketNaam(tx, nieuw)]
            : veld === "customerId"
              ? [await klantNaam(tx, oud), await klantNaam(tx, nieuw)]
              : [oud, nieuw];

        await logOrderEvent(tx, id, gebeurtenis.gewijzigd(veld, was, wordt), actor);
      }

      return na;
    });

    res.json(row);
  } catch (err) {
    next(err);
  }
});

ordersRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // `order_items` en `order_events` hangen met ON DELETE CASCADE — die gaan vanzelf mee.
    await db.delete(orders).where(eq(orders.id, id));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ===========================================================================
 * Regels
 *
 * Elke route hieronder doet drie dingen in één transactie: de regel wegschrijven, het totaal
 * hertellen, en de tijdlijn bijwerken. Ze slagen of falen samen — anders kan het totaal uit de
 * pas lopen met de regels eronder, ook met twee schermen open.
 * ========================================================================= */

/** `lineTotal` komt nooit van de client: die wordt hier berekend uit aantal × stuksprijs. */
const regelInvoer = insertOrderItemSchema.omit({ orderId: true });

ordersRouter.get("/:id/events", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const rows = await db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, id))
      .orderBy(desc(orderEvents.at), desc(orderEvents.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/:id/items", async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const invoer = regelInvoer.parse(req.body);
    const actor = wie(req);

    const resultaat = await db.transaction(async (tx) => {
      await haalBoeking(tx, id);

      // Achteraan, ook als er gaten in de nummering zitten.
      const [laatste] = await tx
        .select({ sortOrder: orderItems.sortOrder })
        .from(orderItems)
        .where(eq(orderItems.orderId, id))
        .orderBy(desc(orderItems.sortOrder))
        .limit(1);

      const lineTotal = regelTotaal(invoer.quantity ?? 1, invoer.unitPrice ?? 0);
      const [regel] = await tx
        .insert(orderItems)
        .values({
          ...invoer,
          orderId: id,
          lineTotal,
          sortOrder: (laatste?.sortOrder ?? -1) + 1,
        })
        .returning();

      const totalPrice = await hertelTotaal(tx, id);
      await logOrderEvent(tx, id, gebeurtenis.regelToegevoegd(regel.description, lineTotal), actor);
      return { regel, totalPrice };
    });

    res.status(201).json(resultaat);
  } catch (err) {
    next(err);
  }
});

ordersRouter.patch("/:id/items/:itemId", async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    const data = requireFields(regelInvoer.partial().parse(req.body));
    const actor = wie(req);

    const resultaat = await db.transaction(async (tx) => {
      const [voor] = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, itemId))
        .limit(1);

      // Ook controleren dat de regel bij déze boeking hoort. Anders zou
      // `/orders/1/items/99` een regel van een andere boeking bewerken.
      if (!voor || voor.orderId !== id) {
        return { fout: "Regel niet gevonden" as const };
      }

      const lineTotal = regelTotaal(
        data.quantity ?? voor.quantity,
        data.unitPrice ?? voor.unitPrice,
      );

      const [regel] = await tx
        .update(orderItems)
        .set({ ...data, lineTotal })
        .where(eq(orderItems.id, itemId))
        .returning();

      const totalPrice = await hertelTotaal(tx, id);

      // Alleen loggen als er echt iets aan het bedrag of de omschrijving veranderde. Wie
      // alleen de volgorde aanpast hoeft de tijdlijn niet vol te zetten.
      const bedragGewijzigd = lineTotal !== voor.lineTotal;
      const tekstGewijzigd = data.description !== undefined && data.description !== voor.description;
      if (bedragGewijzigd || tekstGewijzigd) {
        await logOrderEvent(tx, id, gebeurtenis.regelGewijzigd(regel.description, lineTotal), actor);
      }

      return { regel, totalPrice };
    });

    if ("fout" in resultaat) return res.status(404).json({ error: resultaat.fout });
    res.json(resultaat);
  } catch (err) {
    next(err);
  }
});

ordersRouter.delete("/:id/items/:itemId", async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const itemId = Number(req.params.itemId);
    const actor = wie(req);

    const resultaat = await db.transaction(async (tx) => {
      const [regel] = await tx.select().from(orderItems).where(eq(orderItems.id, itemId)).limit(1);
      if (!regel || regel.orderId !== id) return { fout: "Regel niet gevonden" as const };

      await tx.delete(orderItems).where(eq(orderItems.id, itemId));
      const totalPrice = await hertelTotaal(tx, id);
      await logOrderEvent(tx, id, gebeurtenis.regelVerwijderd(regel.description), actor);
      return { totalPrice };
    });

    if ("fout" in resultaat) return res.status(404).json({ error: resultaat.fout });
    res.json({ ok: true, ...resultaat });
  } catch (err) {
    next(err);
  }
});

const reorderSchema = z.object({ ids: z.array(z.number().int().positive()).min(1) });

ordersRouter.post("/:id/items/reorder", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { ids } = reorderSchema.parse(req.body);

    const resultaat = await db.transaction(async (tx) => {
      const bestaand = await tx
        .select({ id: orderItems.id })
        .from(orderItems)
        .where(eq(orderItems.orderId, id));

      // De lijst moet exact de regels van deze boeking bevatten. Zonder deze controle zou een
      // verouderd scherm — waar net een regel bij is gekomen — die regel op volgorde 0 laten
      // staan en dus stilzwijgend bovenaan zetten.
      const eigen = new Set(bestaand.map((r) => r.id));
      if (ids.length !== eigen.size || ids.some((i) => !eigen.has(i))) {
        return { fout: "De volgorde komt niet overeen met de regels van deze boeking" as const };
      }

      await Promise.all(
        ids.map((itemId, idx) =>
          tx.update(orderItems).set({ sortOrder: idx }).where(eq(orderItems.id, itemId)),
        ),
      );
      return { ok: true as const };
    });

    if ("fout" in resultaat) return res.status(409).json({ error: resultaat.fout });
    res.json(resultaat);
  } catch (err) {
    next(err);
  }
});

/**
 * Regels overnemen uit een pakket. Voegt toe, vervangt niet: wie een pakket kiest ná het
 * handmatig typen van een paar regels raakt die niet kwijt.
 *
 * **Hetzelfde pakket nog eens toevoegen verhoogt het aantal** van de bestaande regel. Twee
 * identieke regels van € 25,00 onder elkaar lezen op een offerte als een fout, ook al klopt
 * het totaal. Voorwaarde is wel dat de stuksprijs gelijk is: is die met de hand aangepast, dan
 * gaat het om iets anders en komt er een eigen regel bij.
 */
ordersRouter.post("/:id/apply-package", async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const { packageId, aantal } = z
      .object({
        packageId: z.number().int().positive(),
        // Optioneel: laat de aanroeper het aantal zelf bepalen (twee pakketten naast elkaar).
        aantal: z.number().positive().max(9999).optional(),
      })
      .parse(req.body);
    const actor = wie(req);

    const resultaat = await db.transaction(async (tx) => {
      const order = await haalBoeking(tx, id);
      const [pakket] = await tx.select().from(packages).where(eq(packages.id, packageId)).limit(1);
      if (!pakket) return { fout: "Pakket niet gevonden" as const };

      const nieuw = pakketNaarRegels(pakket, order.persons, aantal);
      const hoofd = nieuw[0];

      // Staat dit pakket er al, tegen dezelfde stuksprijs?
      const bestaandeRegels = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, id))
        .orderBy(orderItems.sortOrder);

      const zelfde = bestaandeRegels.find(
        (r) => r.details?.packageId === packageId && naarCenten(r.unitPrice) === naarCenten(hoofd.unitPrice),
      );

      let regels: Array<typeof orderItems.$inferSelect>;
      let verhoogd = false;

      if (zelfde) {
        const nieuwAantal = Number(zelfde.quantity) + Number(hoofd.quantity);
        regels = await tx
          .update(orderItems)
          .set({
            quantity: String(nieuwAantal),
            lineTotal: regelTotaal(nieuwAantal, zelfde.unitPrice),
            // De inhoud opnieuw vastleggen: het pakket kan sinds de vorige keer veranderd zijn.
            details: hoofd.details,
          })
          .where(eq(orderItems.id, zelfde.id))
          .returning();
        verhoogd = true;
      } else {
        const laatsteSort = bestaandeRegels.at(-1)?.sortOrder ?? -1;
        regels = await tx
          .insert(orderItems)
          .values(nieuw.map((r, idx) => ({ ...r, orderId: id, sortOrder: laatsteSort + 1 + idx })))
          .returning();
      }

      // Het pakket ook op de boeking zelf vastleggen, zodat de sheet en de offerte weten
      // wat er geboekt is en niet alleen welke regels eruit voortkwamen.
      await tx.update(orders).set({ packageId, updatedAt: new Date() }).where(eq(orders.id, id));

      const totalPrice = await hertelTotaal(tx, id);
      await logOrderEvent(
        tx,
        id,
        verhoogd
          ? gebeurtenis.regelGewijzigd(regels[0].description, regels[0].lineTotal)
          : gebeurtenis.pakketToegepast(pakket.name, regels.length),
        actor,
      );
      return { regels, totalPrice, verhoogd };
    });

    if ("fout" in resultaat) return res.status(404).json({ error: resultaat.fout });
    res.status(201).json(resultaat);
  } catch (err) {
    next(err);
  }
});

/* ===========================================================================
 * Aanvraag → boeking
 * ========================================================================= */

const convertSchema = z.object({ contactRequestId: z.number().int().positive() });

/**
 * GET /orders/from-contact/:id/voorbeeld — wat er zou gebeuren als je omzet.
 *
 * Bestaat zodat het scherm vóóraf kan tonen of de klant gekoppeld of nieuw aangemaakt wordt,
 * en hoeveel regels het pakket oplevert. Dat antwoord hoort van de server te komen: de regel
 * voor het ontdubbelen (hoofdletterongevoelig op e-mail) staat hier, en die twee keer
 * opschrijven is precies hoe ze uit elkaar gaan lopen.
 */
ordersRouter.get("/from-contact/:id/voorbeeld", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [cr] = await db.select().from(contactRequests).where(eq(contactRequests.id, id)).limit(1);
    if (!cr) return res.status(404).json({ error: "Aanvraag niet gevonden" });

    const [bestaandeKlant] = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(sql`lower(${customers.email}) = lower(${cr.email})`)
      .limit(1);

    const [pakket] = cr.packageId
      ? await db.select().from(packages).where(eq(packages.id, cr.packageId)).limit(1)
      : [];

    const regels = pakket ? pakketNaarRegels(pakket, cr.persons) : [];

    res.json({
      alOmgezet: cr.convertedOrderId,
      bestaandeKlant: bestaandeKlant ?? null,
      pakket: pakket ? { id: pakket.id, name: pakket.name } : null,
      aantalRegels: regels.length,
      totaal: boekingTotaal(regels),
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/from-contact", async (req: AuthedRequest, res, next) => {
  try {
    const { contactRequestId } = convertSchema.parse(req.body);
    const actor = wie(req);

    const [cr] = await db
      .select()
      .from(contactRequests)
      .where(eq(contactRequests.id, contactRequestId))
      .limit(1);
    if (!cr) return res.status(404).json({ error: "Aanvraag niet gevonden" });

    // Scenario 83: twee keer omzetten. De tweede keer wijst naar de boeking die er al is in
    // plaats van er een tweede te maken — dat is een fout die je pas ontdekt als de klant belt.
    if (cr.convertedOrderId) {
      return res.status(409).json({
        error: "Deze aanvraag is al omgezet naar een boeking",
        orderId: cr.convertedOrderId,
      });
    }

    const resultaat = await db.transaction(async (tx) => {
      // Eerst kijken of deze klant al bestaat. Zonder dit kreeg een terugkerende klant — juist
      // het soort klant dat je wil herkennen — bij elke aanvraag een nieuwe rij, en klopte de
      // omzet per klant niet meer. Vergelijking hoofdletterongevoelig: mensen typen hun eigen
      // adres niet twee keer hetzelfde.
      const [bestaand] = await tx
        .select()
        .from(customers)
        .where(sql`lower(${customers.email}) = lower(${cr.email})`)
        .limit(1);

      let customer;
      if (bestaand) {
        // Notities aanvullen, niet overschrijven: wat er al stond is met de hand ingevoerd.
        const nieuweNotitie = [bestaand.notes, `[${new Date().toISOString().slice(0, 10)}] ${cr.message}`]
          .filter(Boolean)
          .join("\n\n");
        [customer] = await tx
          .update(customers)
          .set({
            notes: nieuweNotitie,
            phone: bestaand.phone ?? cr.phone ?? null,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, bestaand.id))
          .returning();
      } else {
        [customer] = await tx
          .insert(customers)
          .values({
            name: cr.name,
            email: cr.email,
            phone: cr.phone ?? undefined,
            notes: cr.message,
          })
          .returning();
      }

      const reference = await volgendeReferentie(tx);

      // Gelegenheid, personen en pakket gaan als vélden mee. Ze stonden hiervoor als tekstbrij
      // in `notes` ("Type: … · Personen: …"), waardoor je er niet op kon filteren, de agenda ze
      // niet kon tonen en de offerte ze niet wist te vinden.
      const [order] = await tx
        .insert(orders)
        .values({
          customerId: customer.id,
          reference,
          eventDate: cr.eventDate ?? undefined,
          packageId: cr.packageId ?? undefined,
          persons: cr.persons ?? undefined,
          theme: cr.eventType ?? undefined,
          status: "aanvraag",
          notes: cr.message,
        })
        .returning();

      await logOrderEvent(
        tx,
        order.id,
        gebeurtenis.aangemaakt(`aanvraag #${cr.id}`),
        actor,
      );

      // Het gevraagde pakket meteen als regels, zodat de boeking niet op € 0,00 opent terwijl
      // de klant een pakket van € 395 heeft aangevraagd.
      let regels: typeof orderItems.$inferSelect[] = [];
      if (cr.packageId) {
        const [pakket] = await tx
          .select()
          .from(packages)
          .where(eq(packages.id, cr.packageId))
          .limit(1);
        if (pakket) {
          regels = await tx
            .insert(orderItems)
            .values(
              pakketNaarRegels(pakket, cr.persons).map((r, idx) => ({
                ...r,
                orderId: order.id,
                sortOrder: idx,
              })),
            )
            .returning();
          order.totalPrice = await hertelTotaal(tx, order.id);
          await logOrderEvent(
            tx,
            order.id,
            gebeurtenis.pakketToegepast(pakket.name, regels.length),
            actor,
          );
        }
      }

      await tx
        .update(contactRequests)
        .set({ status: "omgezet_naar_order", convertedOrderId: order.id })
        .where(eq(contactRequests.id, contactRequestId));

      return { customer, order, items: regels, bestaandeKlant: Boolean(bestaand) };
    });

    res.status(201).json(resultaat);
  } catch (err) {
    next(err);
  }
});
