import "dotenv/config";
import { pg } from "../server/db.js";

await pg`DROP TABLE IF EXISTS users CASCADE`;
console.log("✓ users table dropped");
await pg.end();
process.exit(0);
