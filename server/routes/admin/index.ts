import { Router } from "express";
import { authRouter } from "./auth.js";
import { ordersRouter } from "./orders.js";
import { customersRouter } from "./customers.js";
import { productsRouter } from "./products.js";
import { galleryRouter } from "./gallery.js";
import { settingsRouter } from "./settings.js";
import { contactRequestsRouter } from "./contact-requests.js";
import { statsRouter } from "./stats.js";
import { requireAuth } from "../../auth.js";

export const adminRouter = Router();

// Public-ish (login/logout/me)
adminRouter.use("/auth", authRouter);

// All other admin routes require auth
adminRouter.use(requireAuth);
adminRouter.use("/orders", ordersRouter);
adminRouter.use("/customers", customersRouter);
adminRouter.use("/products", productsRouter);
adminRouter.use("/gallery", galleryRouter);
adminRouter.use("/settings", settingsRouter);
adminRouter.use("/contact-requests", contactRequestsRouter);
adminRouter.use("/stats", statsRouter);
