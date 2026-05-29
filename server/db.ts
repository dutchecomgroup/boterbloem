import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema";
import { env, isProd } from "./env.js";

const client = postgres(env.DATABASE_URL, {
  ssl: isProd ? false : "prefer",
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export { client as pg };
