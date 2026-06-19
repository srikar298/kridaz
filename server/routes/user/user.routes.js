import { Router } from "express";
import authRouter from "../../modules/auth/auth.routes.js";
import turfRouter from "../../modules/turf/turf.routes.js";
import reviewRouter from "../../modules/review/review.routes.js";
import blogRouter from "../../modules/blog/blog.routes.js";
import playerRouter from "../../modules/player/player.routes.js";
import storyRouter from "../../modules/story/story.routes.js";
import communityRouter from "../../modules/community/community.routes.js";
import walletRouter from "../../modules/wallet/wallet.routes.js";
import notificationRouter from "../../modules/notification/notification.routes.js";
import disputeRouter from "../../modules/dispute/dispute.routes.js";
import playerPublicRouter from "../../modules/player/routes/public.routes.js";
import userBookingRouter from "../../modules/booking/routes/user.routes.js";

/**
 * @description User actor router. Mounts all user-facing sub-domains.
 * NOTE: Booking is NOT mounted here — it is a self-contained vertical slice
 * mounted directly at /api/booking from routes/index.js.
 */
const userRouter = Router();

userRouter.use("/auth", authRouter);
userRouter.use("/turf", turfRouter);
userRouter.use("/review", reviewRouter);
userRouter.use("/blogs", blogRouter);

// Public — no auth required, safe public fields only
userRouter.use("/", playerPublicRouter);

userRouter.use("/players", playerRouter);
userRouter.use("/stories", storyRouter);
userRouter.use("/community", communityRouter);
userRouter.use("/wallet", walletRouter);
userRouter.use("/dispute", disputeRouter);
userRouter.use("/notifications", notificationRouter);
userRouter.use("/notification", notificationRouter);
userRouter.use("/booking", userBookingRouter);

export default userRouter;
