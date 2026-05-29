import "dotenv/config";
import { pg } from "../server/db.js";

const tables = [
  "users",
  "gallery_categories",
  "gallery_items",
  "products",
  "site_settings",
  "contact_requests",
  "orders",
  "customers",
];

for (const t of tables) {
  const r = await pg`SELECT count(*)::int AS c FROM ${pg(t)}`;
  console.log(`${t}: ${r[0].c}`);
}

console.log("\nDB:", await pg`SELECT current_user, current_database()`);
await pg.end();
process.exit(0);
