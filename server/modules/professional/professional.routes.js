import { Router } from "express";
import userProfessionalRouter from "./routes/user.routes.js";
import adminProfessionalRouter from "./routes/admin.routes.js";

/**
 * Professional Domain Router
 * Mounts actor-specific sub-routers for the Professional module (umpires, scorers, streamers, coaches).
 *
 * Routes:
 * /api/professional/...
 */

const professionalRouter = Router();

// Mount Actor Sub-Routers
professionalRouter.use("/user", userProfessionalRouter);
professionalRouter.use("/admin", adminProfessionalRouter);

// Fallback / Root - Map to user routes
professionalRouter.use("/", userProfessionalRouter);

export default professionalRouter;
