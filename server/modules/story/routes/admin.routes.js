import express from "express";
import { deleteStory, getAllStoriesAdmin } from "../story.controller.js";
import adminAuth from "../../../middleware/jwt/admin.middleware.js";

const router = express.Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Story (Admin)
 *   description: Global User Story Administration
 */

/**
 * @swagger
 * /story/admin/all:
 *   get:
 *     summary: Get all stories (Admin)
 *     tags: [Story (Admin)]
 *     security:
 *       - BearerAuth: []
 */
router.get("/all", getAllStoriesAdmin);

/**
 * @swagger
 * /story/admin/{id}:
 *   delete:
 *     summary: Force delete story (Admin)
 *     tags: [Story (Admin)]
 *     security:
 *       - BearerAuth: []
 */
router.delete("/:id", deleteStory);

export default router;
