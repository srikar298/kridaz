import express from "express";
import {
  getAllRequestedOwners,
  approveOwnerRequest,
  deleteOwnerRequest,
  reconsiderOwnerRequest,
  getAllVerificationRequests,
} from "../../admin/admin.controller.js";

import { validate } from "../../../middleware/validate.middleware.js";
import { approveOwnerRequestSchema } from "../../admin/admin.validator.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Partner Request
 *   description: Admin management for new turf owner registration requests
 */

router.get("/list", getAllRequestedOwners);
router.get("/all", getAllVerificationRequests);
router.put(
  "/:id/accept",
  validate(approveOwnerRequestSchema),
  approveOwnerRequest
);
router.delete("/:id", deleteOwnerRequest);
router.put("/reconsider/:id", reconsiderOwnerRequest);

export default router;
