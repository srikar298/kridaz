import { Emitter } from "@socket.io/redis-emitter";
import { pubClient } from "./redis.js";
import { getIO } from "./socket.js";
import logger from "../utils/logger.js";

let emitter;

/**
 * Initializes and returns a Socket.io Redis Emitter or live Socket.io server.
 * This allows broadcasting events from separate processes or directly in-process
 * through the main Socket.io instance.
 */
export const getEmitter = () => {
  // 1. Try to get local in-memory socket.io server instance first (since inline worker runs in-process)
  try {
    const io = getIO();
    if (io) {
      return io;
    }
  } catch (e) {
    logger.debug(
      "[EMITTER] Failed to retrieve live Socket.io server instance: " +
        e.message
    );
  }

  // 2. Fall back to Redis emitter if no direct IO server instance (e.g. if running in separate processes)
  if (!emitter) {
    if (!pubClient) {
      logger.warn(
        "[EMITTER] Redis pubClient not initialized. Emitter unavailable."
      );
      return null;
    }
    emitter = new Emitter(pubClient);
    logger.info("[EMITTER] Redis-backed Socket.io Emitter initialized.");
  }
  return emitter;
};

export default getEmitter;
