import express from "express";
import {
  getDashboardData,
  getCoachDashboardData,
  getUmpireDashboardData,
  getStreamerDashboardData,
  getScorerDashboardData,
  getOwnerCalendarData,
  getDetailedOccupancyStats,
  getOwnerCustomers,
} from "../dashboard.controller.js";
import verifyOwnerToken from "../../../middleware/jwt/owner.middleware.js";
import { authorizeRoles } from "../../../middleware/jwt/auth.middleware.js";

const dashboardRouter = express.Router();

dashboardRouter.get(
  "/",
  verifyOwnerToken,
  authorizeRoles("venue_owner"),
  getDashboardData
);
dashboardRouter.get(
  "/coach",
  verifyOwnerToken,
  authorizeRoles("coach"),
  getCoachDashboardData
);
dashboardRouter.get(
  "/umpire",
  verifyOwnerToken,
  authorizeRoles("umpire"),
  getUmpireDashboardData
);
dashboardRouter.get(
  "/streamer",
  verifyOwnerToken,
  authorizeRoles("streamer"),
  getStreamerDashboardData
);
dashboardRouter.get(
  "/scorer",
  verifyOwnerToken,
  authorizeRoles("scorer"),
  getScorerDashboardData
);
dashboardRouter.get(
  "/calendar",
  verifyOwnerToken,
  authorizeRoles("venue_owner"),
  getOwnerCalendarData
);
dashboardRouter.get(
  "/occupancy",
  verifyOwnerToken,
  authorizeRoles("venue_owner"),
  getDetailedOccupancyStats
);
dashboardRouter.get(
  "/customers",
  verifyOwnerToken,
  authorizeRoles("venue_owner"),
  getOwnerCustomers
);

export default dashboardRouter;
