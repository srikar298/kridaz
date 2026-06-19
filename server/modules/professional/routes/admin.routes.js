import express from "express";
import {
  getAllProfessionals,
  getAllRequestedProfessionals,
  getProfessionalDetails,
  approveOwnerRequest,
  deleteOwnerRequest,
  reconsiderOwnerRequest,
  deleteOwner,
  batchDeleteOwners,
  batchUpdateOwnerStatus,
} from "../../admin/admin.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin ProfessionalManagement
 *   description: Admin management for sports professionals (Coaches, Referees, Streamers)
 */

/**
 * @swagger
 * /professional/admin/list:
 *   get:
 *     summary: List all active professionals
 *     tags: [Admin ProfessionalManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of professionals
 */
router.get("/list", getAllProfessionals);

/**
 * @swagger
 * /professional/admin/requests:
 *   get:
 *     summary: List all pending professional registration requests
 *     tags: [Admin ProfessionalManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of requests
 */
router.get("/requests", getAllRequestedProfessionals);

/**
 * @swagger
 * /professional/admin/{id}:
 *   get:
 *     summary: Get professional details
 *     tags: [Admin ProfessionalManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Professional profile data
 */
router.get("/:id", getProfessionalDetails);

/**
 * @swagger
 * /professional/admin/{id}:
 *   delete:
 *     summary: Delete professional account
 *     tags: [Admin ProfessionalManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete("/:id", deleteOwner);

// Batch actions

/**
 * @swagger
 * /professional/admin/batch-delete:
 *   post:
 *     summary: Batch delete professionals
 *     tags: [Admin ProfessionalManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post("/batch-delete", batchDeleteOwners);

/**
 * @swagger
 * /professional/admin/batch-status:
 *   put:
 *     summary: Batch update professional status
 *     tags: [Admin ProfessionalManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.put("/batch-status", batchUpdateOwnerStatus);

// Reuse existing logic for requests

/**
 * @swagger
 * /professional/admin/requests/{id}/accept:
 *   put:
 *     summary: Approve professional registration
 *     tags: [Admin ProfessionalManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Approved
 */
router.put("/requests/:id/accept", approveOwnerRequest);

/**
 * @swagger
 * /professional/admin/requests/{id}:
 *   delete:
 *     summary: Reject professional registration
 *     tags: [Admin ProfessionalManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Rejected
 */
router.delete("/requests/:id", deleteOwnerRequest);

/**
 * @swagger
 * /professional/admin/requests/reconsider/{id}:
 *   put:
 *     summary: Reconsider rejected professional request
 *     tags: [Admin ProfessionalManagement]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Reconsidered
 */
router.put("/requests/reconsider/:id", reconsiderOwnerRequest);

export default router;
