import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { db } from "../../db.js";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../../auth.js";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Vul je gebruikersnaam in"),
  password: z.string().min(1, "Vul je wachtwoord in"),
});

/**
 * Er is één beheerdersaccount, dus dat is één wachtwoord om te raden. Zonder rem kan dat
 * onbeperkt en zonder spoor. Tien pogingen per kwartier per IP is ruim voor een mens die
 * zich vergist en te weinig voor iemand die een lijst afwerkt.
 *
 * `skipSuccessfulRequests` zorgt dat normaal inloggen nooit tegen de limiet aanloopt —
 * alleen mislukte pogingen tellen mee.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Te veel inlogpogingen. Probeer het over een kwartier opnieuw." },
});

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      // Loggen zodat een reeks pogingen terug te vinden is. Nooit het wachtwoord loggen.
      console.warn(
        `[auth] mislukte inlogpoging voor '${username.toLowerCase()}' vanaf ${req.ip}`,
      );
      return res.status(401).json({ error: "Onjuiste inloggegevens" });
    }
    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ id: user.id, username: user.username, name: user.name, role: user.role });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("abb.sid");
    res.json({ ok: true });
  });
});

authRouter.get("/me", async (req, res, next) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: "Niet ingelogd" });
    const rows = await db
      .select({ id: users.id, username: users.username, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.id, req.session.userId))
      .limit(1);
    if (!rows.length) return res.status(401).json({ error: "Niet ingelogd" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});
