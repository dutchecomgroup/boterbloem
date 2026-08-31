import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(6778),
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),
  UPLOADS_DIR: z.string().default("./uploads"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),
  PUBLIC_BASE_URL: z.string().default("http://localhost:6778"),
  /**
   * Overschrijft de `secure`-vlag op de sessiecookie. Laat leeg, tenzij je weet waarom niet.
   *
   * Normaal volgt die vlag `NODE_ENV`, en dat klopt: een sessiecookie hoort alleen over een
   * versleutelde verbinding te reizen. Maar `NODE_ENV=production` doet meer dan dat — het is
   * ook de schakelaar die de gebouwde site überhaupt serveert (server/index.ts). Draait de
   * app in productie op een adres zonder HTTPS, dan bewaart de browser een `secure`-cookie
   * niet en is inloggen onmogelijk, terwijl het wachtwoord wel klopt.
   *
   * Deze sleutel maakt dat losse geval expliciet in plaats van er `NODE_ENV` voor te
   * verbuigen. Hij hoort weg zodra er een certificaat is.
   */
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";

/** Zie `COOKIE_SECURE` hierboven. Zonder die sleutel volgt de cookie gewoon `NODE_ENV`. */
export const cookieSecure = env.COOKIE_SECURE ? env.COOKIE_SECURE === "true" : isProd;

if (isProd && !cookieSecure) {
  console.warn(
    "[env] COOKIE_SECURE=false in productie — de sessiecookie reist onversleuteld. " +
      "Alleen bedoeld voor een besloten preview zonder HTTPS.",
  );
}
