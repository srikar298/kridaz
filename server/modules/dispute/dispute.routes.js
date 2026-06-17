import { Router } from "express";
import userDisputeRouter from "./routes/user.routes.js";
import adminDisputeRouter from "./routes/admin.routes.js";
import ownerDisputeRouter from "./routes/owner.routes.js";

/**
 * Dispute Domain Router
 * Mounts actor-specific sub-routers for Disputes.
 * 
 * Routes:
 * /api/dispute/...
 */

const disputeRouter = Router();

// Mount Actor Sub-Routers
disputeRouter.use("/user", userDisputeRouter);
disputeRouter.use("/admin", adminDisputeRouter);
disputeRouter.use("/owner", ownerDisputeRouter);

// Fallback / Root - Map to user routes
disputeRouter.use("/", userDisputeRouter);

export default disputeRouter;
