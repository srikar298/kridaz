import express from "express";
import userChatRouter from "./routes/user.routes.js";

/**
 * Chat Domain Router
 * Mounts actor-specific sub-routers for the Chat module.
 *
 * Routes:
 * /api/chat/...
 */

const chatRouter = express.Router();

// Mount Actor Sub-Routers
chatRouter.use("/user", userChatRouter);

// Fallback / Root - Map to user routes
chatRouter.use("/", userChatRouter);

export default chatRouter;
