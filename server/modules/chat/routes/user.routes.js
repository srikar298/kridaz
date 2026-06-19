import express from "express";
import verifyAuth from "../../../middleware/jwt/auth.middleware.js";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  updateGroup,
  respondToInvite,
  addToGroup,
  removeFromGroup,
  deleteChat,
  addGroupsToCommunity,
  makeGroupAdmin,
  dismissGroupAdmin,
  togglePinChat,
} from "../chat.controller.js";
import {
  allMessages,
  sendMessage,
  markMessagesRead,
  deleteMessages,
  clearChat,
  getChatMedia,
  forwardMessage,
  broadcastMessage,
} from "../message.controller.js";
import upload from "../../../middleware/uploads/upload.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Messaging, Group Chats, and Community Conversations
 */

router.use(verifyAuth);

// ── Chat Management ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Access or create a 1-on-1 chat
 *     tags: [Chat]
 *   get:
 *     summary: Fetch all chats for the current user
 *     tags: [Chat]
 */
router.route("/").post(accessChat).get(fetchChats);

/**
 * @swagger
 * /chat/group:
 *   post:
 *     summary: Create a new group chat or community
 *     tags: [Chat]
 */
router.post("/group", createGroupChat);

/**
 * @swagger
 * /chat/group/update:
 *   put:
 *     summary: Update group info
 *     tags: [Chat]
 */
router.put("/group/update", upload.single("groupImage"), updateGroup);

/**
 * @swagger
 * /chat/respond-invite:
 *   post:
 *     summary: Respond to group invite
 *     tags: [Chat]
 */
router.post("/respond-invite", respondToInvite);

/**
 * @swagger
 * /chat/groupadd:
 *   put:
 *     summary: Add user to group
 *     tags: [Chat]
 */
router.put("/groupadd", addToGroup);

/**
 * @swagger
 * /chat/groupremove:
 *   put:
 *     summary: Remove user from group
 *     tags: [Chat]
 */
router.put("/groupremove", removeFromGroup);

/**
 * @swagger
 * /chat/community/add-groups:
 *   put:
 *     summary: Add groups to community
 *     tags: [Chat]
 */
router.put("/community/add-groups", addGroupsToCommunity);

/**
 * @swagger
 * /chat/groupadmin:
 *   put:
 *     summary: Make user group admin
 *     tags: [Chat]
 */
router.put("/groupadmin", makeGroupAdmin);

/**
 * @swagger
 * /chat/dismissadmin:
 *   put:
 *     summary: Dismiss group admin
 *     tags: [Chat]
 */
router.put("/dismissadmin", dismissGroupAdmin);

/**
 * @swagger
 * /chat/pin:
 *   put:
 *     summary: Toggle pin chat
 *     tags: [Chat]
 */
router.put("/pin", togglePinChat);

/**
 * @swagger
 * /chat/{chatId}:
 *   delete:
 *     summary: Delete Chat / Community
 *     tags: [Chat]
 */
router.delete("/:chatId", deleteChat);

// ── Message Operations ──────────────────────────────────────────────────────

/**
 * @swagger
 * /chat/message/{chatId}:
 *   get:
 *     summary: Get all messages for a chat
 *     tags: [Chat]
 */
router.get("/message/:chatId", allMessages);

/**
 * @swagger
 * /chat/message:
 *   post:
 *     summary: Send a message
 *     tags: [Chat]
 */
router.post("/message", sendMessage);

/**
 * @swagger
 * /chat/message/forward:
 *   post:
 *     summary: Forward a message
 *     tags: [Chat]
 */
router.post("/message/forward", forwardMessage);

/**
 * @swagger
 * /chat/message/broadcast:
 *   post:
 *     summary: Broadcast a message
 *     tags: [Chat]
 */
router.post("/message/broadcast", broadcastMessage);

/**
 * @swagger
 * /chat/message/{chatId}/read:
 *   put:
 *     summary: Mark messages as read
 *     tags: [Chat]
 */
router.put("/message/:chatId/read", markMessagesRead);

/**
 * @swagger
 * /chat/message/delete:
 *   post:
 *     summary: Delete messages
 *     tags: [Chat]
 */
router.post("/message/delete", deleteMessages);

/**
 * @swagger
 * /chat/message/clear:
 *   post:
 *     summary: Clear chat
 *     tags: [Chat]
 */
router.post("/message/clear", clearChat);

/**
 * @swagger
 * /chat/message/{chatId}/media:
 *   get:
 *     summary: Get chat media
 *     tags: [Chat]
 */
router.get("/message/:chatId/media", getChatMedia);

export default router;
