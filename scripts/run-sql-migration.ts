/**
 * Voert één .sql-migratiebestand uit tegen de database uit `DATABASE_URL`.
 *
 *   npx tsx scripts/run-sql-migration.ts docs/deployment/sql-pending/<bestand>.sql
 *   npx tsx scripts/run-sql-migration.ts <bestand>.sql --dry-run
 *
 * Waarom dit bestaat en niet `drizzle-kit push`:
 * `push` vergelijkt het schema met de database en voert zelf DDL uit — je ziet pas achteraf
 * wat er is gebeurd, er is geen versiegeschiedenis en er is geen weg terug. Dit project
 * heeft één database en die is live. Een migratie hoort leesbaar, herhaalbaar en
 * terugvindbaar te zijn.
 *
 * Het bestand draait in één transactie, dus een fout halverwege laat niets half af.
 *
 * ⚠️ Uitzondering: `ALTER TYPE ... ADD VALUE` (een waarde aan een enum toevoegen) kan in
 * Postgres NIET in een transactieblok. Zet zo'n statement in een eigen bestand en draai het
 * met --no-transaction, vóór de migratie die de nieuwe waarde gebruikt.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import postgres from "postgres";

/** Interne "fout" om een dry run terug te draaien: Postgres rolt terug bij een throw. */
class DryRunRollback extends Error {}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dryRun = args.includes("--dry-run");
const noTransaction = args.includes("--no-transaction");
const assumeYes = args.includes("--yes");

if (!file) {
  console.error("Gebruik: npx tsx scripts/run-sql-migration.ts <bestand.sql> [--dry-run] [--no-transaction] [--yes]");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL ontbreekt.");
  process.exit(1);
}

const target = new URL(url);
const dbName = target.pathname.replace(/^\//, "");
const host = target.hostname;
const isLive = !dbName.endsWith("_dev");

const abs = path.resolve(file);
const sqlText = await fs.readFile(abs, "utf8");

console.log("");
console.log("  bestand : " + path.relative(process.cwd(), abs));
console.log("  database: " + dbName + " op " + host);
console.log("  modus   : " + (dryRun ? "DRY RUN (rollback aan het eind)" : noTransaction ? "UITVOEREN zonder transactie" : "UITVOEREN in transactie"));
console.log("");

if (isLive) {
  console.log("  \x1b[41m\x1b[97m  LET OP: dit is de LIVE database.  \x1b[0m");
  console.log("  Heb je een pg_dump gemaakt? Zie docs/deployment/db-migraties.md");
  console.log("");
}

if (!dryRun && !assumeYes) {
  const rl = readline.createInterface({ input, output });
  const antwoord = await rl.question(`Typ de databasenaam om door te gaan (${dbName}): `);
  rl.close();
  if (antwoord.trim() !== dbName) {
    console.log("Afgebroken — naam kwam niet overeen.");
    process.exit(1);
  }
}

const sql = postgres(url, {
  ssl: host === "localhost" || host === "127.0.0.1" ? false : "require",
  max: 1,
  connect_timeout: 15,
  // Migraties mogen lang duren; geen statement-timeout opleggen.
  idle_timeout: 0,
});

const started = Date.now();

try {
  if (noTransaction) {
    await sql.unsafe(sqlText);
    console.log("\n✓ Uitgevoerd (zonder transactie).");
  } else {
    await sql.begin(async (tx) => {
      await tx.unsafe(sqlText);
      if (dryRun) {
        console.log("✓ SQL draaide zonder fouten — nu terugdraaien (dry run).");
        throw new DryRunRollback();
      }
    });
    console.log("\n✓ Uitgevoerd en vastgelegd.");
  }
  console.log(`  duur: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log("\n→ Werk nu docs/deployment/db-migraties.md bij (DEV of LIVE op ✅).\n");
} catch (err) {
  if (err instanceof DryRunRollback) {
    console.log("\n✓ Dry run geslaagd, niets gewijzigd.\n");
  } else {
    const e = err as { message?: string; position?: string; detail?: string; hint?: string };
    console.error("\n✗ Migratie mislukt — er is niets gewijzigd.\n");
    console.error("  " + (e.message ?? String(err)));
    if (e.detail) console.error("  detail: " + e.detail);
    if (e.hint) console.error("  hint: " + e.hint);
    if (e.position) {
      const upto = sqlText.slice(0, Number(e.position));
      console.error("  regel: " + (upto.split("\n").length));
    }
    console.error("");
    await sql.end({ timeout: 5 }).catch(() => {});
    process.exit(1);
  }
}

await sql.end({ timeout: 5 }).catch(() => {});
