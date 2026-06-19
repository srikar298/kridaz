import { Router } from "express";
import adminMarketingRouter from "./routes/admin.routes.js";

/**
 * Marketing Domain Router
 * Mounts actor-specific sub-routers for the Marketing module.
 *
 * Routes:
 * /api/marketing/...
 */

const marketingRouter = Router();

// Mount Actor Sub-Routers
marketingRouter.use("/admin", adminMarketingRouter);

export default marketingRouter;
