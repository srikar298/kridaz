import { Router } from "express"

import turfRouter from "../../modules/turf/turf.routes.js"
import dashboardRouter from "../../modules/admin/routes/dashboard.routes.js";
import communityRouter from "../../modules/community/community.routes.js"
import transactionRouter from "../../modules/wallet/routes/transaction.routes.js"
import userManagementRouter from "../../modules/player/routes/admin.routes.js"
import ownerRequestRouter from "../../modules/owner/routes/partnerRequest.routes.js"
import ownerManagementRouter from "../../modules/owner/routes/admin.routes.js"
import featureFlagRouter from "../../modules/feature/feature.routes.js"
import adminMarketingRouter from "../../modules/marketing/routes/admin.routes.js"
import blogRouter from "../../modules/blog/blog.routes.js"
import professionalRouter from "../../modules/professional/professional.routes.js"
import withdrawalRouter from "../../modules/wallet/routes/admin.routes.js"
import supportRouter from "../../modules/support/routes/admin.routes.js"
import auditRouter from "../../modules/audit/routes/admin.routes.js"
import settingsRouter from "../../modules/settings/routes/admin.routes.js"
import adminNotificationRouter from "../../modules/notification/routes/admin.routes.js"
import adminDisputeRouter from "../../modules/dispute/routes/admin.routes.js"
import gameRouter from "../../modules/hostedGame/hostedGame.routes.js"
import verifyAdminToken from "../../middleware/jwt/admin.middleware.js"

const adminRouter = Router()

adminRouter.use("/blogs", verifyAdminToken, blogRouter);
adminRouter.use("/marketing", verifyAdminToken, adminMarketingRouter);
adminRouter.use("/features", verifyAdminToken, featureFlagRouter);
adminRouter.use("/venue-owner-requests", verifyAdminToken, ownerRequestRouter);
adminRouter.use("/professionals", verifyAdminToken, professionalRouter);
adminRouter.use("/withdrawals", verifyAdminToken, withdrawalRouter);
adminRouter.use("/support", verifyAdminToken, supportRouter);
adminRouter.use("/audit", verifyAdminToken, auditRouter);
adminRouter.use("/settings", verifyAdminToken, settingsRouter);
adminRouter.use("/users", verifyAdminToken, userManagementRouter);
adminRouter.use("/owners", verifyAdminToken, ownerManagementRouter);
adminRouter.use("/turfs", verifyAdminToken, turfRouter);
adminRouter.use("/dashboard", verifyAdminToken, dashboardRouter);
adminRouter.use("/transactions", verifyAdminToken, transactionRouter);
adminRouter.use("/community", verifyAdminToken, communityRouter);
adminRouter.use("/dispute", verifyAdminToken, adminDisputeRouter);
adminRouter.use("/notifications", verifyAdminToken, adminNotificationRouter);
adminRouter.use("/games", verifyAdminToken, gameRouter);
import adminCouponRouter from "../../modules/admin/routes/coupon.routes.js";
import errorLogsRouter from "../../modules/admin/routes/errorLogs.routes.js";
import venueInvitesRouter from "../../modules/admin/routes/venueInvites.routes.js";
adminRouter.use("/coupons", verifyAdminToken, adminCouponRouter);
adminRouter.use("/error-logs", verifyAdminToken, errorLogsRouter);
adminRouter.use("/venue-invites", verifyAdminToken, venueInvitesRouter);

export default adminRouter;


