/**
 * Draait vóór elk testbestand.
 *
 * Sommige modules eisen bij het importeren al een omgeving: `server/env.ts` stopt het
 * proces zonder geldige `DATABASE_URL` en `SESSION_SECRET`. Wie een pure functie uit een
 * bestand wil testen dat daar (indirect) van afhangt, liep daarop stuk.
 *
 * De waarden hieronder zijn bewust **onbruikbaar**: een poort waar niets luistert en een
 * databasenaam die niet bestaat. Dit project heeft één database en die is live — een test
 * die per ongeluk verbindt, schrijft in productie. Deze regel is de rem daarop, ook als er
 * een echte DATABASE_URL in de shell of in `.env` staat.
 *
 * Een test die écht een database nodig heeft, hoort die zelf expliciet op te zetten.
 */
process.env.DATABASE_URL = "postgres://test:test@127.0.0.1:1/boterbloem_test_bestaat_niet";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || "test-secret-alleen-voor-unittests-minimaal-32-tekens";
process.env.NODE_ENV = "test";
