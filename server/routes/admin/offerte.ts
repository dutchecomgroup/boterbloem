import { Router } from "express";
import { db } from "../../db.js";
import {
  orders, orderItems, orderPayments, customers, packages, siteSettings,
  contactSettingsSchema, btwSettingsSchema,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { formatBedrag, btwPerTarief, openstaand, ontvangen, naarCenten } from "../../lib/orderTotals.js";
import { logOrderEvent, gebeurtenis } from "../../lib/orderEvents.js";
import type { AuthedRequest } from "../../auth.js";

export const offerteRouter = Router();

/**
 * GET /api/admin/orders/:id/offerte — een printbare offerte in een eigen tabblad.
 *
 * **Waarom HTML en geen gegenereerde PDF.** Een echte PDF vraagt `@react-pdf/renderer` (~2 MB,
 * met een eigen componentenboom die niets van Tailwind weet, dus de huisstijl twee keer
 * onderhouden) of `puppeteer` (~300 MB Chromium op een VPS waar al drie projecten draaien).
 * *Opslaan als PDF* zit in elke browser achter de printknop, dus ze houdt er evengoed een
 * bestand aan over — en de huisstijl staat hier één keer.
 *
 * Server-gerenderd en niet in de SPA, omdat een printpagina niets van het beheerpaneel nodig
 * heeft: geen navigatie, geen zijbalk, een eigen `@media print`.
 */
offerteRouter.get("/:id/offerte", async (req: AuthedRequest, res, next) => {
  try {
    const id = Number(req.params.id);

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return res.status(404).type("html").send(pagina404());

    const [klant, pakket, regels, instellingen, betalingen] = await Promise.all([
      order.customerId
        ? db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1)
        : Promise.resolve([]),
      order.packageId
        ? db.select().from(packages).where(eq(packages.id, order.packageId)).limit(1)
        : Promise.resolve([]),
      db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(orderItems.sortOrder),
      db.select().from(siteSettings),
      db.select().from(orderPayments).where(eq(orderPayments.orderId, id)),
    ]);

    const contact = leesInstelling(instellingen, "contact", contactSettingsSchema);
    const btwInstelling = leesInstelling(instellingen, "btw", btwSettingsSchema);

    // Per tarief uitgesplitst: één offerte kan een grazing table (9%) en styling (21%) naast
    // elkaar bevatten, en dan is één percentage over het hele totaal simpelweg fout. Het tarief
    // komt van de regel zelf, die het meekreeg van het pakket of product waaruit hij ontstond.
    const btwRegels = btwPerTarief(regels);

    // Dat er een offerte uit is gegaan hoort in de tijdlijn: het is het moment waarop een
    // bedrag naar buiten ging (scenario 85 — "de klant zegt dat de offerte niet klopt").
    await logOrderEvent(db, id, gebeurtenis.offerteBekeken(), req.session?.username ?? null);

    res.type("html").send(
      offerteHtml({
        order, klant: klant[0] ?? null, pakket: pakket[0] ?? null, regels, contact, btwRegels,
        btwInstelling, ontvangenBedrag: ontvangen(betalingen),
      }),
    );
  } catch (err) {
    next(err);
  }
});

/* -------------------------------------------------------------------------- */

function leesInstelling<T>(
  rijen: Array<{ key: string; value: unknown }>,
  sleutel: string,
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T } },
): T | null {
  const rij = rijen.find((r) => r.key === sleutel);
  if (!rij) return null;
  const r = schema.safeParse(rij.value);
  return r.success ? (r.data ?? null) : null;
}

const NL_DATUM = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" });

function datumNl(iso: string | null): string {
  if (!iso) return "nog te bepalen";
  return NL_DATUM.format(new Date(`${iso}T12:00:00`));
}

/** Voorkomt dat een klantnaam met `<` of `&` de pagina breekt. */
function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Regeleindes in een adres of allergietekst blijven regeleindes. */
function escMeerRegels(v: unknown): string {
  return esc(v).replace(/\n/g, "<br>");
}

/**
 * Eén regel in de feestgegevens: een naam en een waarde.
 *
 * De gegevens stonden eerst als drie zinnen met punten ertussen — *"Jaren 60 · 26 augustus
 * 2026 · 15 personen"* en *"bezorgen · feest om 20:00 · opbouw om 19:00"*. Dat leest voor
 * degene die het invulde, want die weet wat elk stukje is. Voor de klant die de offerte
 * openslaat is het raden welk getal waar bij hoort.
 *
 * Een lege waarde levert geen regel op, geen regel met een streepje: op een offerte hoort niet
 * te staan wat er nog níét bekend is.
 */
function rij(naam: string, waarde: string | null | undefined, meerRegels = false): string {
  const v = waarde?.toString().trim();
  if (!v || v === "nog te bepalen") return "";
  return `<dt>${esc(naam)}</dt><dd>${meerRegels ? escMeerRegels(v) : esc(v)}</dd>`;
}

function pagina404(): string {
  return `<!doctype html><html lang="nl"><meta charset="utf-8">
<title>Boeking niet gevonden</title>
<body style="font-family:system-ui;padding:3rem;text-align:center;color:#2B2926">
<h1 style="font-weight:400">Deze boeking bestaat niet (meer)</h1>
<p>Mogelijk is hij verwijderd, of klopt het nummer in het webadres niet.</p>
</body></html>`;
}

type OfferteData = {
  order: typeof orders.$inferSelect;
  klant: typeof customers.$inferSelect | null;
  pakket: typeof packages.$inferSelect | null;
  regels: Array<typeof orderItems.$inferSelect>;
  contact: { email?: string; phone?: string; address?: string; postcode?: string; city?: string } | null;
  btwRegels: Array<{ percentage: number; over: string; excl: string; btw: string }>;
  btwInstelling: { toelichting: string } | null;
  /** Wat er binnen is, uit `order_payments`. Niet af te leiden uit de aanbetaling. */
  ontvangenBedrag: string;
};

function offerteHtml({ order, klant, pakket, regels, contact, btwRegels, btwInstelling, ontvangenBedrag }: OfferteData): string {
  const nummer = order.reference ?? `Boeking ${order.id}`;
  const open = openstaand(order.totalPrice, ontvangenBedrag);
  const heeftAanbetaling = Number(order.depositAmount) !== 0;
  /** Of er al iets binnen is. Bepaalt of de offerte terugkijkt of vooruit. */
  const erIsBetaald = naarCenten(ontvangenBedrag) > 0;
  /** Wat er ná de aanbetaling nog komt. Altijd totaal min de *afgesproken* aanbetaling. */
  const restNaAanbetaling = openstaand(order.totalPrice, order.depositAmount);

  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offerte ${esc(nummer)} — Atelier Boterbloem</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --cream:#FBF6EE; --gold:#C8A560; --gold-dark:#A0813E;
    --charcoal:#2B2926; --burgundy:#7A1F2B;
  }
  * { box-sizing:border-box; }
  body {
    margin:0; background:var(--cream); color:var(--charcoal);
    font-family:Inter, system-ui, sans-serif; font-size:14px; line-height:1.6;
  }
  .blad { max-width:760px; margin:0 auto; padding:2.5rem 2rem 4rem; }
  h1, h2, .bedrag { font-family:"Cormorant Garamond", Georgia, serif; font-weight:400; }

  .printbalk {
    position:sticky; top:0; z-index:10; display:flex; justify-content:flex-end;
    gap:.75rem; padding:.75rem 2rem; background:rgba(251,246,238,.94);
    border-bottom:1px solid rgba(43,41,38,.1); backdrop-filter:blur(6px);
  }
  .knop {
    border:1px solid var(--gold); background:transparent; color:var(--gold-dark);
    border-radius:999px; padding:.5rem 1.25rem; font-size:12px; letter-spacing:.12em;
    text-transform:uppercase; cursor:pointer;
  }
  .knop:hover { background:rgba(200,165,96,.12); }

  .kop { display:flex; justify-content:space-between; gap:2rem; flex-wrap:wrap;
         border-bottom:2px solid var(--gold); padding-bottom:1.25rem; margin-bottom:1.75rem; }
  .kop h1 { margin:0; font-size:1.9rem; letter-spacing:.02em; }
  .kop .rechts { text-align:right; }
  .tag { font-size:10px; text-transform:uppercase; letter-spacing:.25em; color:var(--gold-dark); }
  .zacht { color:rgba(43,41,38,.6); }

  .blok { margin-bottom:1.75rem; }

  .gegevens { display:flex; gap:2.5rem; flex-wrap:wrap; }
  .gegevens > div { flex:1 1 220px; }
  .gegevens dl { display:grid; grid-template-columns:auto 1fr; gap:.15rem 1rem; margin:.35rem 0 0; }
  .gegevens dt { font-size:12px; color:rgba(43,41,38,.55); }
  .gegevens dd { margin:0; }

  table { width:100%; border-collapse:collapse; margin-top:.5rem; }
  th { font-size:10px; text-transform:uppercase; letter-spacing:.16em; color:rgba(43,41,38,.55);
       text-align:left; padding:.4rem .5rem; border-bottom:1px solid rgba(43,41,38,.18); font-weight:500; }
  td { padding:.5rem; border-bottom:1px solid rgba(43,41,38,.07); vertical-align:top; }
  .num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .vermelding td { color:rgba(43,41,38,.55); }
  .korting .num { color:var(--burgundy); }
  .onderdelen { margin:.3rem 0 0; padding:0; list-style:none; font-size:12px;
                color:rgba(43,41,38,.65); }
  .onderdelen li { padding-left:.9rem; position:relative; }
  .onderdelen li::before { content:"·"; position:absolute; left:.2rem; color:var(--gold-dark); }

  .totalen { margin-left:auto; margin-top:1rem; width:min(320px,100%); }
  .totalen div { display:flex; justify-content:space-between; gap:2rem; padding:.3rem 0; }
  .totalen .hoofd { border-top:2px solid rgba(43,41,38,.2); margin-top:.4rem; padding-top:.6rem; }
  .bedrag { font-size:1.35rem; }
  .open { color:var(--gold-dark); }

  .allergie { border-left:4px solid var(--burgundy); background:rgba(122,31,43,.06);
              padding:.75rem 1rem; border-radius:0 4px 4px 0; }
  .allergie .tag { color:var(--burgundy); }

  .voet { margin-top:2.5rem; border-top:1px solid rgba(43,41,38,.12); padding-top:1rem;
          font-size:12px; color:rgba(43,41,38,.6); }

  @media print {
    /* De printbalk hoort niet op papier — en de achtergrondkleur kost een halve cartridge. */
    .printbalk { display:none; }
    body { background:#fff; }
    .blad { padding:0; max-width:none; }
    table { page-break-inside:auto; }
    tr { page-break-inside:avoid; }
  }
</style>
</head>
<body>
  <div class="printbalk">
    <button class="knop" onclick="window.print()">Printen / opslaan als PDF</button>
  </div>

  <div class="blad">
    <header class="kop">
      <div>
        <h1>Atelier Boterbloem</h1>
        <p class="zacht" style="margin:.35rem 0 0">
          ${[contact?.address, [contact?.postcode, contact?.city].filter(Boolean).join(" ")].filter(Boolean).map(esc).join("<br>")}
          ${contact?.email ? `<br>${esc(contact.email)}` : ""}
          ${contact?.phone ? ` · ${esc(contact.phone)}` : ""}
        </p>
      </div>
      <div class="rechts">
        <span class="tag">Offerte</span>
        <p class="bedrag" style="margin:.2rem 0 0">${esc(nummer)}</p>
        <p class="zacht" style="margin:0">${datumNl(new Date().toISOString().slice(0, 10))}</p>
      </div>
    </header>

    <section class="blok gegevens">
      <div>
        <span class="tag">Voor</span>
        <p style="margin:.35rem 0 0">
          <strong>${esc(klant?.name ?? "—")}</strong>
          ${klant?.email ? `<br><span class="zacht">${esc(klant.email)}</span>` : ""}
          ${klant?.phone ? `<br><span class="zacht">${esc(klant.phone)}</span>` : ""}
        </p>
      </div>
      <div>
        <span class="tag">Het feest</span>
        <dl>
          ${rij("Gelegenheid", order.theme)}
          ${rij("Datum", datumNl(order.eventDate))}
          ${rij("Aanvang", order.eventTime ? `${order.eventTime.slice(0, 5)} uur` : null)}
          ${rij("Opbouw", order.setupTime ? `${order.setupTime.slice(0, 5)} uur` : null)}
          ${rij("Aantal personen", order.persons ? String(order.persons) : null)}
          ${rij(order.deliveryType === "bezorgen" ? "Bezorgen op" : "Afhalen", order.location, true)}
          ${rij("Pakket", pakket?.name ?? null)}
        </dl>
      </div>
    </section>

    <section class="blok">
      <table>
        <thead>
          <tr>
            <th>Omschrijving</th>
            <th class="num">Aantal</th>
            <th class="num">Stuksprijs</th>
            <th class="num">Totaal</th>
          </tr>
        </thead>
        <tbody>
          ${regels.length === 0
            ? `<tr><td colspan="4" class="zacht" style="padding:1.5rem;text-align:center">Nog geen regels.</td></tr>`
            : regels.map((r) => {
                const cent = Math.round(Number(r.lineTotal) * 100);
                const klasse = cent === 0 ? "vermelding" : cent < 0 ? "korting" : "";
                const inbegrepen = r.details?.inbegrepen ?? [];
                // Wat er in een pakket zit staat als onderdelen ónder de regel, niet als
                // losse posten van € 0,00 ertussen. De klant ziet zo één bedrag met daaronder
                // wat ze ervoor krijgt, in plaats van zes regels waarvan vijf niets kosten.
                return `<tr class="${klasse}">
            <td>
              ${esc(r.description)}
              ${inbegrepen.length
                ? `<ul class="onderdelen">${inbegrepen.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
                : ""}
            </td>
            <td class="num">${esc(String(Number(r.quantity)).replace(".", ","))}</td>
            <td class="num">${esc(formatBedrag(r.unitPrice))}</td>
            <td class="num">${esc(formatBedrag(r.lineTotal))}</td>
          </tr>`;
              }).join("\n")}
        </tbody>
      </table>

      <div class="totalen">
        <div class="hoofd">
          <span class="tag" style="align-self:center">Totaal</span>
          <span class="bedrag">${esc(formatBedrag(order.totalPrice))}</span>
        </div>
        ${/*
           * Eén regel per tarief. Bij één tarief leest dat als voorheen; bij twee zie je waar
           * elk bedrag vandaan komt, en dat is precies wat een boekhouder wil kunnen navlooien.
           */ ""}
        ${btwRegels.map((b) => `<div class="zacht" style="font-size:12px">
               <span>${esc(formatBedrag(b.over))} incl. ${b.percentage}% btw &rarr; ${esc(formatBedrag(b.excl))} excl.</span>
               <span>btw ${esc(formatBedrag(b.btw))}</span>
             </div>`).join("")}
        ${/*
           * De betaling in twee stappen, want dat is de vraag van de klant: hoeveel maak ik nu
           * over, en hoeveel later? Er stond alleen "Aanbetaling" en "Openstaand", en dat
           * openstaande bedrag was het totaal min de aanbetaling — ook als die nog niet betaald
           * was. Dan lees je "nog € 95,00" terwijl er € 295,00 moet komen.
           */ ""}
        ${!heeftAanbetaling && !erIsBetaald
          ? ""
          : erIsBetaald
            ? `<div class="zacht"><span>Reeds ontvangen</span>
                 <span>− ${esc(formatBedrag(ontvangenBedrag))}</span></div>
               <div class="open hoofd"><span class="tag" style="align-self:center">Nog te voldoen</span>
                 <span class="bedrag">${esc(formatBedrag(open))}</span></div>`
            : `<div class="open hoofd"><span class="tag" style="align-self:center">Nu te voldoen · aanbetaling</span>
                 <span class="bedrag">${esc(formatBedrag(order.depositAmount))}</span></div>
               <div class="zacht"><span>Daarna, bij oplevering</span>
                 <span>${esc(formatBedrag(restNaAanbetaling))}</span></div>`}
      </div>
    </section>

    ${order.allergies?.trim()
      ? `<section class="blok allergie">
           <span class="tag">Allergieën &amp; dieet</span>
           <p style="margin:.25rem 0 0">${escMeerRegels(order.allergies)}</p>
         </section>`
      : ""}

    ${order.notes?.trim()
      ? `<section class="blok"><span class="tag">Notities</span>
           <p style="margin:.25rem 0 0">${escMeerRegels(order.notes)}</p></section>`
      : ""}

    <footer class="voet">
      ${btwRegels.length
        ? `<p style="margin:0">Alle bedragen zijn inclusief btw (${btwRegels.map((b) => `${b.percentage}%`).join(" en ")}).</p>`
        // Bij de kleineondernemersregeling hoort er géén btw-bedrag op de offerte te staan.
        : `<p style="margin:0">Er wordt geen btw in rekening gebracht.</p>`}
      ${btwInstelling?.toelichting ? `<p style="margin:.35rem 0 0">${escMeerRegels(btwInstelling.toelichting)}</p>` : ""}
      <p style="margin:.35rem 0 0">
        Deze offerte is een richtprijs; wijzigingen in aantallen of wensen kunnen het bedrag
        veranderen. Vragen? Bel of mail gerust.
      </p>
    </footer>
  </div>
</body>
</html>`;
}
