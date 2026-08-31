import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema";
import { env } from "./env.js";

/**
 * SSL wordt bepaald door de host, niet door NODE_ENV.
 *
 * Op de VPS gaat de verbinding over loopback naar dezelfde machine — daar voegt TLS niets
 * toe en biedt de lokale Postgres het vaak niet eens aan. Elke andere host betekent dat de
 * verbinding het netwerk op gaat, en dan is "require" het minimum: "prefer" valt namelijk
 * stil terug op onversleuteld als de server geen TLS aanbiedt, zonder enige melding. Dan
 * gaan het wachtwoord en alle klantgegevens in leesbare vorm over de lijn.
 */
function isLoopback(connectionString: string): boolean {
  try {
    const host = new URL(connectionString).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

const local = isLoopback(env.DATABASE_URL);

const client = postgres(env.DATABASE_URL, {
  ssl: local ? false : "require",
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

if (!local) {
  console.log("[db] externe verbinding — TLS vereist");
}

export const db = drizzle(client, { schema });
export { client as pg };
