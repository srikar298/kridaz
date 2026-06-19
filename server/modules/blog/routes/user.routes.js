import { Router } from "express";
import { getBlogs, getBlogById, likeBlog } from "../blog.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Sports news, articles, and community updates
 */

/**
 * @swagger
 * /blog:
 *   get:
 *     summary: Get all blogs
 *     tags: [Blog]
 */
router.get("/", getBlogs);

/**
 * @swagger
 * /blog/{id}:
 *   get:
 *     summary: Get blog by ID
 *     tags: [Blog]
 */
router.get("/:id", getBlogById);

/**
 * @swagger
 * /blog/{id}/like:
 *   post:
 *     summary: Like a blog post
 *     tags: [Blog]
 *     security:
 *       - BearerAuth: []
 */
router.post("/:id/like", likeBlog);

export default router;
