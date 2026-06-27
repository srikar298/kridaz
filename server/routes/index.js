/**
 * @module RootRouter
 * @description The central API routing hub for the Kridaz server.
 *
 * ARCHITECTURE — Two-tier routing:
 *
 * TIER 1 — Actor Hub Routers (this file):
 *   These are complex, auth-layered routers that serve a specific user persona
 *   (User, Owner, Admin). They contain nested sub-routes and persona-specific
 *   middleware. They are explicitly imported and maintained here.
 *
 * TIER 2 — Domain Module Routers (autoloaded from modules/loader.js):
 *   Self-contained domain modules (Booking, Team, Reels, etc.) that own their
 *   own routing, middleware, and documentation. Adding a new domain module
 *   ONLY requires an entry in modules/loader.js — nothing else changes here.
 *
 * UTILITY ROUTES (this file):
 *   Small, shared, public routes (features, location, uploads) that don't
 *   warrant their own module but are referenced by multiple actors.
 */

import { Router } from "express";
import { createDomainRouter } from "../modules/loader.js";

// ── Tier 1: Actor Hub Routers ─────────────────────────────────────────────────
// These handle persona-specific flows (auth, profile, actor-specific resources).
// They deliberately have nested sub-routes to enforce actor isolation.
import userRouter from "./user/user.routes.js";
import ownerRouter from "./owner/owner.routes.js";
import adminRouter from "./admin/admin.routes.js";
import professionalRouter from "../modules/professional/professional.routes.js";

// ── Utility Routes ────────────────────────────────────────────────────────────
// Public or cross-actor utilities. Not large enough for their own module.
import featurePublicRouter from "../modules/feature/routes/public.routes.js";
import marketingPublicRouter from "../modules/marketing/routes/public.routes.js";
import blogPublicRouter from "../modules/blog/routes/public.routes.js";

const featureRouter = Router();
featureRouter.use("/", featurePublicRouter);
featureRouter.use("/marketing", marketingPublicRouter);
featureRouter.use("/blogs", blogPublicRouter);
import uploadRouter from "../modules/upload/routes/public.routes.js";
import locationRouter from "../modules/turf/routes/public.routes.js";
import settingsPublicRouter from "../modules/settings/routes/public.routes.js";
import publicVenueInvitesRouter from "../modules/admin/routes/publicVenueInvites.routes.js";
import qrPublicRouter from "../modules/qr/routes/public.qr.routes.js";

const rootRouter = Router();

// ── Tier 1: Actor Hubs (Specific overrides first) ─────────────────────────────
rootRouter.use("/professional", professionalRouter);

// ── Tier 2: Domain Modules (auto-discovered) ──────────────────────────────────
// Scans modules/loader.js MODULE_MANIFEST and mounts each domain router.
// To add a new domain: add an entry to MODULE_MANIFEST. Done.
const domainRouter = await createDomainRouter();
rootRouter.use("/", domainRouter);

// ── Tier 1: Actor Hubs ────────────────────────────────────────────────────────
rootRouter.use("/user", userRouter);
rootRouter.use("/owner", ownerRouter);
rootRouter.use("/admin", adminRouter);

// ── Utilities ─────────────────────────────────────────────────────────────────
rootRouter.use("/features", featureRouter);
rootRouter.use("/upload", uploadRouter);
rootRouter.use("/location", locationRouter);
rootRouter.use("/settings", settingsPublicRouter);
rootRouter.use("/venue-invites", publicVenueInvitesRouter);
rootRouter.use("/qr", qrPublicRouter);

export default rootRouter;
