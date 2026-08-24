import { Router } from "express";
import { timingSafeEqual } from "node:crypto";
import { db } from "../db.js";
import { orders, customers, siteSettings } from "@shared/schema";
import { and, asc, eq, isNotNull, ne } from "drizzle-orm";
import { env } from "../env.js";

export const icsRouter = Router();

/**
 * Read-only agenda-feed, buiten /api/admin gemount.
 *
 * Agenda-apps (Google Calendar, iOS) sturen geen sessie-cookie mee, dus `requireAuth` kan
 * hier niet. In plaats daarvan een eigen token uit `site_settings.levertijden`, los te
 * vervangen zonder wachtwoordwijziging.
 *
 * ⚠️ Wie deze URL heeft, ziet alle boekingen inclusief klantnamen. Behandel hem als een
 * wachtwoord; het instellingen-scherm toont hem achter een kopieerknop.
 */
function tokenKlopt(gegeven: string, verwacht: string): boolean {
  const a = Buffer.from(gegeven);
  const b = Buffer.from(verwacht);
  // Lengteverschil lekt via een vroege return; vergelijk daarom pas na een lengtecheck die
  // zelf geen informatie over de inhoud geeft.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** ICS escapet komma, puntkomma, backslash en newline. Zonder dit breekt één klantnaam de feed. */
function esc(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** ICS-regels mogen maximaal 75 octetten zijn; langere worden gevouwen met een spatie. */
function vouw(regel: string): string {
  const bytes = Buffer.from(regel, "utf8");
  if (bytes.length <= 75) return regel;
  const stukken: string[] = [];
  let rest = regel;
  let max = 75;
  while (Buffer.from(rest, "utf8").length > max) {
    let snij = max;
    while (Buffer.from(rest.slice(0, snij), "utf8").length > max) snij--;
    stukken.push(rest.slice(0, snij));
    rest = rest.slice(snij);
    max = 74; // vervolgregels beginnen met een spatie
  }
  stukken.push(rest);
  return stukken.join("\r\n ");
}

function datumCompact(d: string): string {
  return d.replace(/-/g, "");
}

/** "14:30:00" → "143000" */
function tijdCompact(t: string): string {
  return t.replace(/:/g, "").padEnd(6, "0").slice(0, 6);
}

function volgendeDag(datum: string): string {
  const d = new Date(datum + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

icsRouter.get("/agenda.ics", async (req, res, next) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) return res.status(401).type("text/plain").send("Token ontbreekt");

    const [rij] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, "levertijden"))
      .limit(1);

    const verwacht = (rij?.value as { agendaFeedToken?: string } | undefined)?.agendaFeedToken;
    if (!verwacht || !tokenKlopt(token, verwacht)) {
      return res.status(401).type("text/plain").send("Ongeldig token");
    }

    const rows = await db
      .select({
        id: orders.id,
        eventDate: orders.eventDate,
        eventTime: orders.eventTime,
        location: orders.location,
        status: orders.status,
        totalPrice: orders.totalPrice,
        deliveryType: orders.deliveryType,
        notes: orders.notes,
        updatedAt: orders.updatedAt,
        customerName: customers.name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .where(and(isNotNull(orders.eventDate), ne(orders.status, "geannuleerd")))
      .orderBy(asc(orders.eventDate));

    const nu = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const regels: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Atelier Boterbloem//Agenda//NL",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Atelier Boterbloem",
      "X-WR-TIMEZONE:Europe/Amsterdam",
    ];

    for (const o of rows) {
      const datum = o.eventDate!;
      const titel = [o.customerName ?? "Boeking", o.deliveryType].filter(Boolean).join(" · ");

      regels.push("BEGIN:VEVENT");
      // Stabiele UID: bij een wijziging werkt de agenda-app het bestaande event bij in
      // plaats van een tweede aan te maken.
      regels.push(`UID:order-${o.id}@atelierboterbloem`);
      regels.push(`DTSTAMP:${nu}`);
      regels.push(vouw(`SUMMARY:${esc(titel)}`));

      if (o.eventTime) {
        // Tijdgebonden event. Zonder eindtijd in het datamodel: standaard twee uur.
        const start = `${datumCompact(datum)}T${tijdCompact(o.eventTime)}`;
        const eindUur = String(Math.min(23, Number(o.eventTime.slice(0, 2)) + 2)).padStart(2, "0");
        regels.push(`DTSTART;TZID=Europe/Amsterdam:${start}`);
        regels.push(`DTEND;TZID=Europe/Amsterdam:${datumCompact(datum)}T${eindUur}${tijdCompact(o.eventTime).slice(2)}`);
      } else {
        // Hele-dag-event. DTEND is exclusief, dus de dag erna.
        regels.push(`DTSTART;VALUE=DATE:${datumCompact(datum)}`);
        regels.push(`DTEND;VALUE=DATE:${datumCompact(volgendeDag(datum))}`);
      }

      if (o.location) regels.push(vouw(`LOCATION:${esc(o.location)}`));

      const omschrijving = [
        `Status: ${o.status}`,
        `Totaal: € ${o.totalPrice}`,
        o.notes ? `\n${o.notes}` : "",
        `\n${env.PUBLIC_BASE_URL}/admin/boekingen`,
      ].filter(Boolean).join(" · ");
      regels.push(vouw(`DESCRIPTION:${esc(omschrijving)}`));

      regels.push(`STATUS:${o.status === "aanvraag" ? "TENTATIVE" : "CONFIRMED"}`);
      regels.push("END:VEVENT");
    }

    regels.push("END:VCALENDAR");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", 'inline; filename="atelierboterbloem.ics"');
    res.setHeader("Cache-Control", "no-store");
    // CRLF is verplicht in het formaat; met LF weigeren sommige agenda-apps de feed.
    res.send(regels.join("\r\n") + "\r\n");
  } catch (err) {
    next(err);
  }
});
