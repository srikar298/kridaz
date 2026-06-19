import { Router } from "express";
import userReelsRouter from "./routes/user.routes.js";

/**
 * Reels Domain Router
 * Mounts actor-specific sub-routers for the Reels module.
 *
 * Routes:
 * /api/reels/... -> /api/reels/user/...
 *
 * NOTE: For backward compatibility and simplicity in the feed,
 * the user router is also mounted at the root.
 */

const reelsRouter = Router();

// Mount Actor Sub-Routers
reelsRouter.use("/user", userReelsRouter);

// Fallback / Root - Map to user routes
reelsRouter.use("/", userReelsRouter);

export default reelsRouter;
