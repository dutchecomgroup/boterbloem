import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cookieSecure, env, isProd } from "./env.js";
import { pg } from "./db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { publicRouter } from "./routes/public.js";
import { adminRouter } from "./routes/admin/index.js";
import { icsRouter } from "./routes/agenda-ics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// --- Session ---
const PgStore = connectPgSimple(session);
app.use(
  session({
    store: new PgStore({
      conObject: { connectionString: env.DATABASE_URL },
      tableName: "sessions",
      createTableIfMissing: false,
    }),
    name: "abb.sid",
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
    },
  }),
);

// --- Static uploads ---
const uploadsAbs = path.resolve(env.UPLOADS_DIR);
app.use("/uploads", express.static(uploadsAbs, { maxAge: isProd ? "30d" : 0 }));

// --- Health ---
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: env.NODE_ENV, time: new Date().toISOString() });
});

// --- API routes ---
// Buiten /api/admin: agenda-apps sturen geen sessie-cookie mee, deze route heeft een
// eigen token. Zie server/routes/agenda-ics.ts.
app.use("/api", icsRouter);
app.use("/api/public", publicRouter);
app.use("/api/admin", adminRouter);

// --- Static client (production build) ---
if (isProd) {
  const clientDist = path.resolve(__dirname, "..", "dist", "client");
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`[atelierboterbloem] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string) {
  console.log(`[atelierboterbloem] ${signal} received, shutting down`);
  server.close(() => {
    pg.end().finally(() => process.exit(0));
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
