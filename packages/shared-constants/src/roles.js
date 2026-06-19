/**
 * @fileoverview User and owner role constants shared between server and client.
 *
 * Usage:
 *   import { USER_ROLE, OWNER_ROLE } from '@kridaz/shared-constants/roles';
 */

/**
 * Platform user roles.
 * @type {Readonly<Record<string, string>>}
 */
export const USER_ROLE = Object.freeze({
  USER: "USER",
  ADMIN: "ADMIN",
});

/**
 * Owner / partner roles used in owner registration and permission checks.
 * @type {Readonly<Record<string, string>>}
 */
export const OWNER_ROLE = Object.freeze({
  VENUE_OWNER: "VENUE_OWNER",
  OWNER: "OWNER",
  COACH: "COACH",
  UMPIRE: "UMPIRE",
  SCORER: "SCORER",
  STREAMER: "STREAMER",
  PROFESSIONAL: "PROFESSIONAL",
});

/**
 * All valid roles combined — useful for runtime validation.
 * @type {string[]}
 */
export const ALL_ROLES = Object.freeze([
  ...Object.values(USER_ROLE),
  ...Object.values(OWNER_ROLE),
]);
