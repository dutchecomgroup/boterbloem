/**
 * Vangnet vóór de livegang: zit er nog demo-content in de bundel of in de database?
 *
 *   npx tsx scripts/check-geen-demo-content.ts
 *
 * De site draait bewust op stockfoto's zolang de klant haar eigen foto's nog niet heeft
 * aangeleverd (besloten 25-08). Maar die foto's zijn taarten van ánderen, en ze tonen als
 * haar werk misleidt bezoekers die daarop een offerte aanvragen. Zie testscript §8.8 — dat
 * is een blokkerende stap, en dit script is de machinale helft daarvan.
 *
 * Standaard **waarschuwt** dit script alleen, zodat het bouwen tijdens de ontwikkeling niet
 * breekt. Met `--strict` faalt het: zo hoort het in de deploy-stap te staan zodra de echte
 * foto's binnen zijn.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../server/db.js";
import { galleryItems, reviews } from "../shared/schema.js";

const DIST = path.resolve("dist/client");
const STRICT = process.argv.includes("--strict");

/** Waar demo-content aan te herkennen is in een gebouwd bestand. */
const SPOREN = [
  { patroon: /images\.unsplash\.com/g, wat: "Unsplash-foto's uit demoGallery.ts" },
  { patroon: /source["']?\s*:\s*["']demo["']/g, wat: 'items met source: "demo"' },
];

async function bestanden(dir: string): Promise<string[]> {
  const uit: string[] = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) uit.push(...(await bestanden(p)));
    else if (/\.(js|css|html)$/.test(e.name)) uit.push(p);
  }
  return uit;
}

try {
  await fs.access(DIST);
} catch {
  console.error(`✗ ${DIST} bestaat niet — draai eerst \`npm run build\`.`);
  process.exit(1);
}

const treffers: { bestand: string; wat: string; aantal: number }[] = [];

for (const bestand of await bestanden(DIST)) {
  const inhoud = await fs.readFile(bestand, "utf8");
  for (const { patroon, wat } of SPOREN) {
    const aantal = (inhoud.match(patroon) ?? []).length;
    if (aantal > 0) {
      treffers.push({ bestand: path.relative(process.cwd(), bestand), wat, aantal });
    }
  }
}

/**
 * De bundel is maar de helft van het verhaal.
 *
 * `seed-demo-content.ts` zet stockfoto's en verzonnen reviews in de **database**, en daar ziet
 * een scan over `dist/` niets van: die rijen komen via de API binnen, niet uit de gebouwde
 * JavaScript. Tot 27-08 controleerde dit script alleen de bundel, en dan kan hij groen zijn
 * terwijl de site vol stockfoto's staat.
 */
async function controleerDatabase(): Promise<{ wat: string; aantal: number }[]> {
  const uit: { wat: string; aantal: number }[] = [];
  const [foto] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(galleryItems)
    .where(sql`${galleryItems.source} = 'demo'`);
  if (foto.n > 0) uit.push({ wat: `gallery_items met source 'demo'`, aantal: foto.n });

  const [rev] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reviews)
    .where(sql`${reviews.source} = 'demo'`);
  if (rev.n > 0) uit.push({ wat: `reviews met source 'demo'`, aantal: rev.n });

  return uit;
}

let dbTreffers: { wat: string; aantal: number }[] = [];
try {
  dbTreffers = await controleerDatabase();
} catch (err) {
  // Geen database bereikbaar is geen "groen": dan is de helft van de controle niet gedaan.
  const reden = err instanceof Error ? err.message : "onbekende fout";
  console.log("");
  console.log(`⚠ Database niet gecontroleerd: ${reden}`);
  console.log("  Deze controle is pas compleet als hij ook tegen de database kan draaien.");
  console.log("");
  if (STRICT) process.exit(1);
}

if (treffers.length === 0 && dbTreffers.length === 0) {
  console.log("✓ Geen demo-content in de gebouwde bundel en niet in de database.");
  process.exit(0);
}

const kop = STRICT ? "✗ DEMO-CONTENT IN DE BUNDEL" : "⚠ Demo-content in de bundel";
console.log(`\n${kop}\n`);
for (const t of treffers) {
  console.log(`  ${t.bestand}`);
  console.log(`    ${t.aantal}× ${t.wat}`);
}

console.log(
  "\n  Dit is stockmateriaal, geen werk van het atelier. Het mag niet mee naar de\n" +
    "  publieke live site — zie docs/deployment/testscript-master.md §8.8.\n" +
    "  Weghalen: client/src/lib/demoGallery.ts en de aanroepen ervan.\n",
);

process.exit(STRICT ? 1 : 0);
