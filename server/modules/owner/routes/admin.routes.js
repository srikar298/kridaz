import express from "express";
import {
  getAllOwners,
  getTurfByOwnerId,
  verifyKYC,
  deleteOwner,
  batchDeleteOwners,
  batchUpdateOwnerStatus,
} from "../../admin/admin.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Owner Management
 *   description: Admin operations for managing turf owners and KYC verification
 */

router.get("/all", getAllOwners);
router.get("/turf/:id", getTurfByOwnerId);
router.put("/:id/kyc", verifyKYC);
router.delete("/:id", deleteOwner);
router.post("/batch-delete", batchDeleteOwners);
router.put("/batch-status", batchUpdateOwnerStatus);

export default router;
