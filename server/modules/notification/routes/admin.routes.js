import { Router } from "express";
import {
  getFailedJobs,
  retryJob,
  removeFailedJob,
  sendAdminPushNotification,
} from "../admin.notification.controller.js";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} from "../notification.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Notification
 *   description: Monitoring and management of push notification delivery jobs
 */

/**
 * @swagger
 * /notification/admin/send:
 *   post:
 *     summary: Send direct push notification to specific user or all users
 *     tags: [Admin Notification]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientId:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               type:
 *                 type: string
 *               link:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Notification queued successfully
 */
router.post("/send", sendAdminPushNotification);

router.get("/", getMyNotifications);

router.put("/mark-all-read", markAllAsRead);

router.put("/:id/mark-read", markAsRead);

router.delete("/clear", clearNotifications);

/**
 * @swagger
 * /notification/admin/failed:
 *   get:
 *     summary: List failed notification jobs
 *     tags: [Admin Notification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of failed attempts
 */
router.get("/failed", getFailedJobs);

/**
 * @swagger
 * /notification/admin/failed/{jobId}/retry:
 *   post:
 *     summary: Retry a failed notification job
 *     tags: [Admin Notification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Job re-queued
 */
router.post("/failed/:jobId/retry", retryJob);

/**
 * @swagger
 * /notification/admin/failed/{jobId}:
 *   delete:
 *     summary: Remove a failed notification job from record
 *     tags: [Admin Notification]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Job entry deleted
 */
router.delete("/failed/:jobId", removeFailedJob);

export default router;
