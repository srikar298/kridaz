import { Router } from "express";
import userHostedGameRouter from "./routes/user.routes.js";
import adminHostedGameRouter from "./routes/admin.routes.js";

/**
 * Hosted Game Domain Router
 * Mounts actor-specific sub-routers for the HostedGame module.
 *
 * Routes:
 * /api/hosted-game/...
 */

const hostedGameRouter = Router();

// Mount Actor Sub-Routers
hostedGameRouter.use("/user", userHostedGameRouter);
hostedGameRouter.use("/admin", adminHostedGameRouter);

// Fallback / Root - Map to user routes
hostedGameRouter.use("/", userHostedGameRouter);

export default hostedGameRouter;
