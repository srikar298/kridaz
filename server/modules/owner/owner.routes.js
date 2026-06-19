import { Router } from "express";
import dashboardRouter from "./routes/dashboard.routes.js";
import promotionRouter from "./routes/promotion.routes.js";
import supportRouter from "./routes/support.routes.js";
import bankingRouter from "./routes/banking.routes.js";
import revenueRouter from "./routes/revenue.routes.js";
import adminOwnerRouter from "./routes/admin.routes.js";

/**
 * Owner Operations Domain Router
 * Mounts sub-routers for Owner-specific domain features.
 *
 * Routes:
 * /api/owner/operations/...
 */

const ownerOperationsRouter = Router();

// Mount Feature Sub-Routers
ownerOperationsRouter.use("/dashboard", dashboardRouter);
ownerOperationsRouter.use("/promotions", promotionRouter);
ownerOperationsRouter.use("/support", supportRouter);
ownerOperationsRouter.use("/banking", bankingRouter);
ownerOperationsRouter.use("/revenue", revenueRouter);
ownerOperationsRouter.use("/admin", adminOwnerRouter);

export default ownerOperationsRouter;
