import express from "express";
import userReviewRouter from "./routes/user.routes.js";
import ownerReviewRouter from "./routes/owner.routes.js";

/**
 * Review Domain Router
 * Mounts actor-specific sub-routers for Reviews.
 *
 * Routes:
 * /api/review/...
 */

const reviewRouter = express.Router();

// Mount Actor Sub-Routers
reviewRouter.use("/user", userReviewRouter);
reviewRouter.use("/owner", ownerReviewRouter);

// Fallback / Root - Map to user routes
reviewRouter.use("/", userReviewRouter);

export default reviewRouter;
