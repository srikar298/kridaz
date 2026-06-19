/**
 * @fileoverview Media and reel processing status constants shared between server and client.
 *
 * These values are used by the BullMQ media processor (server) and the
 * real-time feed components (client) to track upload/processing state.
 *
 * Usage:
 *   import { MEDIA_STATUS, REEL_STATUS } from '@kridaz/shared-constants/mediaStatus';
 */

/**
 * BullMQ media processing pipeline states.
 * @type {Readonly<Record<string, string>>}
 */
export const MEDIA_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
});

/**
 * Reel content lifecycle states.
 * @type {Readonly<Record<string, string>>}
 */
export const REEL_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
  DELETED: "deleted",
});

/**
 * Supported media types for the processing queue.
 * @type {Readonly<Record<string, string>>}
 */
export const MEDIA_TYPE = Object.freeze({
  REEL: "reel",
  STORY: "story",
  COMMUNITY_POST: "community_post",
  PROFILE_PICTURE: "profile_picture",
});
