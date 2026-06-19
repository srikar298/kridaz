import { Router } from "express";
import adminFeatureRouter from "./routes/admin.routes.js";

/**
 * Feature Domain Router
 * Mounts actor-specific sub-routers for the Feature module.
 *
 * Routes:
 * /api/feature/...
 */

const featureRouter = Router();

// Mount Actor Sub-Routers
featureRouter.use("/admin", adminFeatureRouter);

export default featureRouter;
