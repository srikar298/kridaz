import express from "express";
import upload from "../../../middleware/uploads/upload.middleware.js";
import { handleSingleUpload } from "../upload.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Generic file and media upload utilities
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a file to R2
 *     description: Generic endpoint for uploading images, documents, or videos.
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               folder: { type: string, default: "kridaz/verification" }
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 url: { type: string }
 *                 name: { type: string }
 */
router.post("/", upload.single("file"), handleSingleUpload);

export default router;
