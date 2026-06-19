import { Router } from "express";
import authRouter from "../../modules/auth/auth.routes.js";
import turfRouter from "../../modules/turf/turf.routes.js";
import reviewsRouter from "../../modules/review/review.routes.js";
import ownerOperationsRouter from "../../modules/owner/owner.routes.js";
import walletRouter from "../../modules/wallet/wallet.routes.js";
import notificationRouter from "../../modules/notification/notification.routes.js";

const ownerRouter = Router();

ownerRouter.use("/auth", authRouter);
ownerRouter.use("/turf", turfRouter);
ownerRouter.use("/reviews", reviewsRouter);
ownerRouter.use("/wallet", walletRouter);
ownerRouter.use("/notifications", notificationRouter);

// Mount Owner Operations Domain & override banking mount for direct path
import bankingRouter from "../../modules/owner/routes/banking.routes.js";
ownerRouter.use("/banking", bankingRouter);
ownerRouter.use("/", ownerOperationsRouter);

export default ownerRouter;
