import express from "express";
import {
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
} from "../../admin/admin.controller.js";

import { validate } from "../../../middleware/validate.middleware.js";
import {
  approveWithdrawalSchema,
  rejectWithdrawalSchema,
} from "../../admin/admin.validator.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Withdrawal
 *   description: Admin management for user and owner payout requests
 */

/**
 * @swagger
 * /wallet/admin/list:
 *   get:
 *     summary: List all withdrawal requests
 *     tags: [Admin Withdrawal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending and processed withdrawals
 */
router.get("/list", getAllWithdrawalRequests);

/**
 * @swagger
 * /wallet/admin/{id}/approve:
 *   put:
 *     summary: Approve a withdrawal request
 *     tags: [Admin Withdrawal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Withdrawal approved
 */
router.put(
  "/:id/approve",
  validate(approveWithdrawalSchema),
  approveWithdrawalRequest
);

/**
 * @swagger
 * /wallet/admin/{id}/reject:
 *   put:
 *     summary: Reject a withdrawal request
 *     tags: [Admin Withdrawal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Withdrawal rejected
 */
router.put(
  "/:id/reject",
  validate(rejectWithdrawalSchema),
  rejectWithdrawalRequest
);

export default router;
