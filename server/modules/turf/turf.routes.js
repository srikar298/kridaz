import express from "express";
import userTurfRouter from "./routes/user.routes.js";
import ownerTurfRouter from "./routes/owner.routes.js";
import adminTurfRouter from "./routes/admin.routes.js";

/**
 * Turf Domain Router
 * Mounts actor-specific sub-routers for the Turf module.
 *
 * Routes:
 * /api/turf/user/...
 * /api/turf/owner/...
 * /api/turf/admin/...
 */

const turfRouter = express.Router();

// Mount Actor Sub-Routers
turfRouter.use("/user", userTurfRouter);
turfRouter.use("/owner", ownerTurfRouter);
turfRouter.use("/admin", adminTurfRouter);

// Fallback / Root - Map to user routes
turfRouter.use("/", userTurfRouter);

export default turfRouter;
