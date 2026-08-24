/**
 * Vangnet vóór de livegang: zit er nog demo-content in de gebouwde bundel?
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
import fs from "node:fs/promises";
import path from "node:path";

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

if (treffers.length === 0) {
  console.log("✓ Geen demo-content in de gebouwde bundel.");
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
