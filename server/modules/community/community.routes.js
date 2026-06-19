import express from "express";
import userCommunityRouter from "./routes/user.routes.js";
import adminCommunityRouter from "./routes/admin.routes.js";

/**
 * Community Domain Router
 * Mounts actor-specific sub-routers for the Community module.
 *
 * Routes:
 * /api/community/...
 */

const communityRouter = express.Router();

// Mount Actor Sub-Routers
communityRouter.use("/user", userCommunityRouter);
communityRouter.use("/admin", adminCommunityRouter);

// Fallback / Root - Map to user routes
communityRouter.use("/", userCommunityRouter);

export default communityRouter;
