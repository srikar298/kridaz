/**
 * @fileoverview Barrel re-export for @kridaz/shared-constants.
 *
 * Import the full package:
 *   import { SOCKET, BOOKING_STATUS, PHONE_REGEX } from '@kridaz/shared-constants';
 *
 * Or import a specific sub-module for smaller bundles:
 *   import { SOCKET } from '@kridaz/shared-constants/socketEvents';
 */

export * from "./socketEvents.js";
export * from "./roles.js";
export * from "./bookingStatus.js";
export * from "./mediaStatus.js";
export * from "./validation.js";
