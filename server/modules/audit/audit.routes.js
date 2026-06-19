import { Router } from "express";
import adminAuditRouter from "./routes/admin.routes.js";

/**
 * Audit Domain Router
 * Mounts sub-routers for the Audit/Logs module.
 *
 * Routes:
 * /api/audit/...
 */

const auditRouter = Router();

// Mount Actor Sub-Routers
auditRouter.use("/admin", adminAuditRouter);

// Fallback - Map root to admin router for direct mount compat
auditRouter.use("/", adminAuditRouter);

export default auditRouter;
