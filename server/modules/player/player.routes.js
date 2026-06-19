import express from "express";
import userPlayerRouter from "./routes/user.routes.js";
import adminPlayerRouter from "./routes/admin.routes.js";

/**
 * Player Domain Router
 * Mounts actor-specific sub-routers for the Player module.
 *
 * Routes:
 * /api/player/...
 */

const playerRouter = express.Router();

// Mount Actor Sub-Routers
playerRouter.use("/user", userPlayerRouter);
playerRouter.use("/admin", adminPlayerRouter);

// Fallback / Root - Map to user routes
playerRouter.use("/", userPlayerRouter);

export default playerRouter;
