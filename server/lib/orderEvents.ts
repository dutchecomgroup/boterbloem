import { orderEvents, type OrderEventKind } from "@shared/schema";
import { db } from "../db.js";
import { formatBedrag } from "./orderTotals.js";

/**
 * Eén plek waar de tijdlijn geschreven wordt.
 *
 * Bewust één functie in plaats van overal een `db.insert(orderEvents)`: zo bestaat er geen
 * route die per ongeluk vergeet te loggen, en staat de formulering van de regels bij elkaar.
 * De tijdlijn is alleen iets waard als hij volledig is.
 *
 * `tx` is de transactie van de aanroeper. Dat is geen detail: een regel toevoegen en het
 * loggen daarvan horen samen te slagen of samen te falen, anders komt er een gebeurtenis in
 * de tijdlijn te staan die nooit gebeurd is.
 */
export type Tx = Pick<typeof db, "insert" | "select" | "update" | "delete">;

/** Wat `gebeurtenis.*` teruggeeft: de vorm van één tijdlijnregel, zonder wie of wanneer. */
export type Gebeurtenis = {
  kind: OrderEventKind;
  summary: string;
  details?: Record<string, unknown>;
};

export async function logOrderEvent(
  tx: Tx,
  orderId: number,
  ev: Gebeurtenis,
  actor?: string | null,
): Promise<void> {
  await tx.insert(orderEvents).values({
    orderId,
    kind: ev.kind,
    summary: ev.summary,
    details: ev.details ?? null,
    actor: actor ?? null,
  });
}

/** "2026-09-06" -> "6 september 2026". De tijdlijn wordt door een mens gelezen. */
function datumNL(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

/* ---------------------------------------------------------------------------
 * Vaste formuleringen. Hier staan ze bij elkaar zodat de tijdlijn één stem heeft
 * en niet een verzameling losse zinnetjes wordt.
 * ------------------------------------------------------------------------- */

export const gebeurtenis = {
  aangemaakt: (bron?: string) => ({
    kind: "aangemaakt" as const,
    summary: bron ? `Boeking aangemaakt uit ${bron}` : "Boeking aangemaakt",
  }),

  status: (van: string, naar: string) => ({
    kind: "status" as const,
    summary: `Status ${leesbaar(van)} → ${leesbaar(naar)}`,
    details: { van, naar },
  }),

  regelToegevoegd: (omschrijving: string, bedrag: string) => ({
    kind: "regel" as const,
    summary: `Regel erbij: ${omschrijving} — ${formatBedrag(bedrag)}`,
    details: { omschrijving, bedrag },
  }),

  regelGewijzigd: (omschrijving: string, bedrag: string) => ({
    kind: "regel" as const,
    summary: `Regel gewijzigd: ${omschrijving} — ${formatBedrag(bedrag)}`,
    details: { omschrijving, bedrag },
  }),

  regelVerwijderd: (omschrijving: string) => ({
    kind: "regel" as const,
    summary: `Regel verwijderd: ${omschrijving}`,
    details: { omschrijving },
  }),

  pakketToegepast: (pakket: string, aantalRegels: number) => ({
    kind: "regel" as const,
    summary: `Regels overgenomen uit ${pakket} (${aantalRegels})`,
    details: { pakket, aantalRegels },
  }),

  aanbetaling: (bedrag: string, betaald: boolean) => ({
    kind: "betaling" as const,
    summary: betaald
      ? `Aanbetaling ontvangen — ${formatBedrag(bedrag)}`
      : `Aanbetaling ingesteld op ${formatBedrag(bedrag)}`,
    details: { bedrag, betaald },
  }),

  betalingOntvangen: (bedrag: string, datum: string) => ({
    kind: "betaling" as const,
    summary: `Betaling ontvangen — ${formatBedrag(bedrag)} op ${datumNL(datum)}`,
    details: { bedrag, datum },
  }),

  betalingVerwijderd: (bedrag: string, datum: string) => ({
    kind: "betaling" as const,
    summary: `Betaling teruggedraaid — ${formatBedrag(bedrag)} van ${datumNL(datum)}`,
    details: { bedrag, datum },
  }),

  offerteBekeken: () => ({
    kind: "offerte" as const,
    summary: "Offerte geopend",
  }),

  /**
   * Losse veldwijzigingen. Alleen velden waarvan het later uitmaakt dát ze veranderd zijn —
   * een notitie bijstellen hoeft niet in de tijdlijn, een verplaatste datum wel.
   */
  gewijzigd: (veld: string, van: unknown, naar: unknown) => ({
    kind: "wijziging" as const,
    summary: `${veldNaam(veld)}: ${toonWaarde(van)} → ${toonWaarde(naar)}`,
    details: { veld, van, naar },
  }),
};

/** Velden die de moeite van een tijdlijnregel waard zijn. */
export const GELOGDE_VELDEN = [
  "eventDate", "eventTime", "setupTime", "location",
  "allergies", "persons", "packageId", "customerId", "deliveryType",
] as const;

const VELD_NAMEN: Record<string, string> = {
  eventDate: "Datum",
  eventTime: "Tijd van het feest",
  setupTime: "Opbouwtijd",
  location: "Locatie",
  allergies: "Allergieën",
  persons: "Aantal personen",
  packageId: "Pakket",
  customerId: "Klant",
  deliveryType: "Bezorgwijze",
};

function veldNaam(veld: string): string {
  return VELD_NAMEN[veld] ?? veld;
}

/**
 * Waarden in de samenvatting worden afgekapt. Een allergietekst van drie zinnen maakt van één
 * tijdlijnregel een alinea, en de tijdlijn is bedoeld om overheen te lezen. De volledige oude
 * en nieuwe waarde staan in `details`, dus er gaat niets verloren — het scherm kan ze tonen.
 */
const MAX_TOON = 60;

function toonWaarde(v: unknown): string {
  if (v === null || v === undefined || v === "") return "leeg";
  const s = String(v).replace(/\s+/g, " ").trim();
  return s.length > MAX_TOON ? `${s.slice(0, MAX_TOON - 1)}…` : s;
}

const STATUS_LABELS: Record<string, string> = {
  aanvraag: "aanvraag",
  bevestigd: "bevestigd",
  in_productie: "in productie",
  klaar: "klaar",
  afgeleverd: "afgeleverd",
  geannuleerd: "geannuleerd",
};

function leesbaar(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}
