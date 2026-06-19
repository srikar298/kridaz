import { Router } from "express";
import {
  adminGetAllTurfs,
  adminApproveTurf,
  adminRejectTurf,
  adminDecommissionTurf,
  adminSoftDeleteTurf,
  adminHardDeleteTurf,
} from "../turf.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Turf
 *   description: Global Sports Ground Administration
 */

/**
 * @swagger
 * /turf/admin/all:
 *   get:
 *     summary: List all turfs for Admin
 *     tags: [Admin Turf]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of turfs retrieved
 */
router.get("/all", adminGetAllTurfs);

/**
 * @swagger
 * /turf/admin/{id}/approve:
 *   put:
 *     summary: Approve a turf
 *     description: Marks a turf as active and verified.
 *     tags: [Admin Turf]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Turf approved
 */
router.put("/:id/approve", adminApproveTurf);

/**
 * @swagger
 * /turf/admin/{id}/reject:
 *   put:
 *     summary: Reject a turf
 *     description: Rejects a turf application.
 *     tags: [Admin Turf]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Turf rejected
 */
router.put("/:id/reject", adminRejectTurf);

/**
 * @swagger
 * /turf/admin/{id}/decommission:
 *   put:
 *     summary: Decommission a turf
 *     description: Disables a turf from being booked.
 *     tags: [Admin Turf]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Turf decommissioned
 */
router.put("/:id/decommission", adminDecommissionTurf);

/**
 * @swagger
 * /turf/admin/{id}/soft-delete:
 *   put:
 *     summary: Soft delete a turf
 *     description: Moves a turf to deleted state without purging from DB.
 *     tags: [Admin Turf]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Turf soft deleted
 */
router.put("/:id/soft-delete", adminSoftDeleteTurf);

/**
 * @swagger
 * /turf/admin/{id}/hard-delete:
 *   delete:
 *     summary: Hard delete a turf
 *     description: Permanently removes a turf from the database.
 *     tags: [Admin Turf]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Turf permanently deleted
 */
router.delete("/:id/hard-delete", adminHardDeleteTurf);

export default router;
