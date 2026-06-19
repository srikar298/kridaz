import { Router } from "express";
import adminSupportRouter from "./routes/admin.routes.js";

/**
 * Support Domain Router
 * Mounts sub-routers for the Support/Tickets module.
 *
 * Routes:
 * /api/support/...
 */

const supportRouter = Router();

// Mount Actor Sub-Routers
supportRouter.use("/admin", adminSupportRouter);

// Fallback - Map root to admin router for direct mount compat
supportRouter.use("/", adminSupportRouter);

export default supportRouter;
