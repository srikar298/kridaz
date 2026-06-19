/**
 * Dynamic Profile Route Utility
 *
 * Determines the correct profile route based on the user's role.
 * Professionals (coach, umpire, scorer, streamer, commentator) are routed
 * to their public showcase profile (/professionals/:ownerProfileId).
 * All other roles (user, admin, venue_owner) go to the standard /profile page.
 *
 * @param {Object} user - The authenticated user object from Redux auth state
 * @param {string} role - The role string from Redux auth state
 * @returns {string} The profile route path
 */

const PROFESSIONAL_ROLES = [
  "coach",
  "umpire",
  "scorer",
  "streamer",
  "commentator",
];

/**
 * Checks if the given role string maps to a professional role.
 * @param {string|null|undefined} role
 * @returns {boolean}
 */
export const isProfessionalRole = (role) => {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return PROFESSIONAL_ROLES.some((pr) => normalized.includes(pr));
};

/**
 * Returns the correct profile route for the current user.
 * - Professionals → /professionals/:ownerProfileId (public showcase)
 * - Everyone else → /profile (standard user profile)
 *
 * @param {Object|null} user - The user object from auth state
 * @param {string|null} role - The role string from auth state
 * @returns {string}
 */
export const getDynamicProfileRoute = (user, role) => {
  if (!user) return "/profile";

  if (isProfessionalRole(role) && (user._id || user.id)) {
    return `/profile/${user._id || user.id}`;
  }

  return "/profile";
};
