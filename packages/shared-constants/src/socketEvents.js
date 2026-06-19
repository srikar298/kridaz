/**
 * @fileoverview Socket.IO event name constants shared between server and client.
 *
 * Usage (server):
 *   import { SOCKET } from '@kridaz/shared-constants/socketEvents';
 *   io.emit(SOCKET.ONLINE_USERS_COUNT, { count });
 *
 * Usage (client):
 *   import { SOCKET } from '@kridaz/shared-constants/socketEvents';
 *   socket.on(SOCKET.MESSAGE_RECEIVED, handler);
 */

/** @type {Readonly<Record<string, string>>} */
export const SOCKET = Object.freeze({
  // ── Presence & Connection ──────────────────────────────────────────────────
  SETUP: "setup",
  CONNECTED: "connected",
  ONLINE_USERS_COUNT: "online_users_count",
  USER_LAST_SEEN: "user last seen",
  USER_PROFILE_UPDATED: "user profile updated",

  // ── Chat & Messaging ───────────────────────────────────────────────────────
  JOIN_CHAT: "join chat",
  NEW_MESSAGE: "new message",
  MESSAGE_RECEIVED: "message recieved", // NOTE: intentional typo preserved for backward-compat
  MESSAGES_READ: "messages read",
  DELETE_MESSAGE: "delete message",
  MESSAGE_DELETED: "message deleted",
  TYPING: "typing",
  STOP_TYPING: "stop typing",
  CHAT_UPDATED: "chat updated",
  CHAT_DELETED: "chat deleted",

  // ── Location ───────────────────────────────────────────────────────────────
  LOCATION_UPDATE: "location:update",
  LOCATION_START: "location:start",
  NEARBY_LOCATION_UPDATE: "nearby:location:update",
  UPDATE_LOCATION: "update_location",

  // ── Live Scoring ───────────────────────────────────────────────────────────
  JOIN_MATCH: "joinMatch",
  LEAVE_MATCH: "leaveMatch",
  OVERLAY_JOIN: "overlayJoin",
  SCORE_UPDATED: "scoreUpdated",
  BALL_EVENT: "ballEvent",
  MATCH_ENDED: "matchEnded",

  // ── Reels ──────────────────────────────────────────────────────────────────
  REEL_LIKED: "reel_liked",
  REEL_COMMENTED: "reel_commented",
  REEL_DELETED: "reel_deleted",

  // ── Community ──────────────────────────────────────────────────────────────
  NEW_COMMUNITY_POST: "new_community_post",
  COMMUNITY_POST_LIKED: "community_post_liked",
  COMMUNITY_POST_COMMENTED: "community_post_commented",
  COMMUNITY_POST_DELETED: "community_post_deleted",

  // ── Notifications ───────────────────────────────────────────────────────────
  NEW_NOTIFICATION: "new_notification",
  NOTIFICATION_COUNT: "notification_count",

  // ── Media Processing ───────────────────────────────────────────────────────
  MEDIA_PROCESSING_PROGRESS: "MEDIA_PROCESSING_PROGRESS",
  MEDIA_PROCESSING_COMPLETE: "MEDIA_PROCESSING_COMPLETE",
});
