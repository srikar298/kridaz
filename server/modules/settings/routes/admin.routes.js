import { Router } from "express";
import {
  getPayoutSettings,
  updatePayoutSettings,
  getPlatformConfigs,
  updatePlatformConfigs,
} from "../settings.controller.js";
import verifyAdminToken from "../../../middleware/jwt/admin.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Platform-wide configuration management
 */

router.get("/payout", verifyAdminToken, getPayoutSettings);
router.put("/payout", verifyAdminToken, updatePayoutSettings);

router.get("/platform", verifyAdminToken, getPlatformConfigs);
router.put("/platform", verifyAdminToken, updatePlatformConfigs);

export default router;
