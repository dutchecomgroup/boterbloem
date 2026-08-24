import { Router } from "express";
import { authRouter } from "./auth.js";
import { ordersRouter } from "./orders.js";
import { offerteRouter } from "./offerte.js";
import { customersRouter } from "./customers.js";
import { productsRouter } from "./products.js";
import { galleryRouter } from "./gallery.js";
import { settingsRouter } from "./settings.js";
import { contactRequestsRouter } from "./contact-requests.js";
import { statsRouter } from "./stats.js";
import { packagesRouter } from "./packages.js";
import { reviewsRouter } from "./reviews.js";
import { agendaRouter } from "./agenda.js";
import { requireAuth } from "../../auth.js";

export const adminRouter = Router();

// Public-ish (login/logout/me)
adminRouter.use("/auth", authRouter);

// All other admin routes require auth
adminRouter.use(requireAuth);
// De offerte hangt onder /orders/:id/offerte maar staat in een eigen bestand: het is
// server-gerenderde HTML, geen JSON-route.
adminRouter.use("/orders", offerteRouter);
adminRouter.use("/orders", ordersRouter);
adminRouter.use("/customers", customersRouter);
adminRouter.use("/products", productsRouter);
adminRouter.use("/gallery", galleryRouter);
adminRouter.use("/settings", settingsRouter);
adminRouter.use("/contact-requests", contactRequestsRouter);
adminRouter.use("/stats", statsRouter);
adminRouter.use("/packages", packagesRouter);
adminRouter.use("/reviews", reviewsRouter);
adminRouter.use("/agenda", agendaRouter);
