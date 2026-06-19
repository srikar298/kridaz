import { Router } from "express";
import userAuthRouter from "./routes/user.routes.js";
import ownerAuthRouter from "./routes/owner.routes.js";

/**
 * Auth Domain Router
 * Mounts actor-specific sub-routers for Authentication and Profile management.
 *
 * Routes:
 * /api/auth/...
 */

const authRouter = Router();

// Mount Actor Sub-Routers
authRouter.use("/user", userAuthRouter);
authRouter.use("/owner", ownerAuthRouter);

// Fallback / Root - Map to user routes
authRouter.use("/", userAuthRouter);

export default authRouter;
