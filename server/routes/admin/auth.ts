import { Router } from "express";
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

authRouter.post("/login", async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
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
