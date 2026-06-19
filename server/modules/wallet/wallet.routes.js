import { Router } from "express";
import userWalletRouter from "./routes/user.routes.js";
import ownerWalletRouter from "./routes/owner.routes.js";
import adminWalletRouter from "./routes/admin.routes.js";

/**
 * Wallet Domain Router
 * Mounts actor-specific sub-routers for the Wallet module.
 *
 * Routes:
 * /api/wallet/...
 */

const walletRouter = Router();

// Mount Actor Sub-Routers
walletRouter.use("/user", userWalletRouter);
walletRouter.use("/owner", ownerWalletRouter);
walletRouter.use("/admin", adminWalletRouter);

// Fallback / Root - Map to user routes
walletRouter.use("/", userWalletRouter);

export default walletRouter;
