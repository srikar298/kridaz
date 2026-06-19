import { Router } from "express";
import userTeamRouter from "./routes/user.routes.js";
import ownerTeamRouter from "./routes/owner.routes.js";
import adminTeamRouter from "./routes/admin.routes.js";

/**
 * Team Domain Router
 * Mounts actor-specific sub-routers for the Team module.
 *
 * Routes:
 * /api/team/user/...
 * /api/team/owner/...
 * /api/team/admin/...
 *
 * NOTE: For backward compatibility, the base /api/team/... routes
 * are handled by mounting the user router at the root of this module.
 */

const teamRouter = Router();

// Mount Actor Sub-Routers
teamRouter.use("/user", userTeamRouter);
teamRouter.use("/owner", ownerTeamRouter);
teamRouter.use("/admin", adminTeamRouter);

// Fallback / Root - Map to user routes for backward compatibility
teamRouter.use("/", userTeamRouter);

export default teamRouter;
