import { Router } from "express";
import adminSettingsRouter from "./routes/admin.routes.js";

/**
 * Settings Domain Router
 * Mounts sub-routers for the Settings module.
 *
 * Routes:
 * /api/settings/...
 */

const settingsRouter = Router();

// Mount Actor Sub-Routers
settingsRouter.use("/admin", adminSettingsRouter);

// Fallback - Map root to admin router for direct mount compat
settingsRouter.use("/", adminSettingsRouter);

export default settingsRouter;
