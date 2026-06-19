import { Router } from "express";
import {
  turfRegister,
  getTurfByOwner,
  editTurfById,
  getTurfDetailsWithSlots,
  toggleTurfVisibility,
  deleteTurf,
} from "../turf.controller.js";
import upload from "../../../middleware/uploads/upload.middleware.js";
import verifyOwnerToken from "../../../middleware/jwt/owner.middleware.js";
import { turfRegisterSchema } from "../turf.validator.js";
import { validate } from "../../../middleware/validate.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Owner Turf
 *   description: Turf management for owners
 */

/**
 * @swagger
 * /turf/owner/register:
 *   post:
 *     summary: Register a new turf
 *     tags: [Owner Turf]
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/register",
  verifyOwnerToken,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "saleDeed", maxCount: 1 },
    { name: "electricityBill", maxCount: 1 },
    { name: "gstRegistration", maxCount: 1 },
    { name: "rentalAgreement", maxCount: 1 },
    { name: "ownershipAgreement", maxCount: 1 },
    { name: "googleProfileScreenshot", maxCount: 1 },
  ]),
  validate(turfRegisterSchema),
  turfRegister
);

/**
 * @swagger
 * /turf/owner/all:
 *   get:
 *     summary: Get all turfs by owner
 *     tags: [Owner Turf]
 *     security:
 *       - BearerAuth: []
 */
router.get("/all", verifyOwnerToken, getTurfByOwner);

/**
 * @swagger
 * /turf/owner/{id}/details:
 *   get:
 *     summary: Get turf details with slots
 *     tags: [Owner Turf]
 *     security:
 *       - BearerAuth: []
 */
router.get("/:id/details", verifyOwnerToken, getTurfDetailsWithSlots);

/**
 * @swagger
 * /turf/owner/{id}:
 *   put:
 *     summary: Edit turf by ID
 *     tags: [Owner Turf]
 *     security:
 *       - BearerAuth: []
 */
router.put("/:id", verifyOwnerToken, editTurfById);

/**
 * @swagger
 * /turf/owner/{id}/visibility:
 *   put:
 *     summary: Toggle turf visibility
 *     tags: [Owner Turf]
 *     security:
 *       - BearerAuth: []
 */
router.put("/:id/visibility", verifyOwnerToken, toggleTurfVisibility);

/**
 * @swagger
 * /turf/owner/{id}:
 *   delete:
 *     summary: Delete turf
 *     tags: [Owner Turf]
 *     security:
 *       - BearerAuth: []
 */
router.delete("/:id", verifyOwnerToken, deleteTurf);

export default router;
