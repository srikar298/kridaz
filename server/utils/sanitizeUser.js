/**
 * Strip secrets from a Prisma user row before serialising over the wire.
 *
 * What gets removed:
 *   - password       — argon2 hash, MUST never leave the server
 *   - fcmToken       — push token; not secret per se but pollutes responses
 *   - googleId       — auth provider id; we don't surface it to clients
 *   - refreshTokens  — relation array (sometimes included accidentally)
 *   - tokenVersion   — internal counter for /logout-all session invalidation;
 *                      clients have no reason to see it
 *
 * If a route also includes `ownerProfile`, its fields are passed through
 * untouched — owner profiles don't carry secrets in this schema.
 *
 * Safe with null/undefined input.
 */
export const sanitizeUser = (u) => {
  if (!u) return null;
  const { password, fcmToken, googleId, refreshTokens, tokenVersion, ...safe } = u;
  return safe;
};

/**
 * Sanitize an array of user rows.
 */
export const sanitizeUsers = (rows) =>
  Array.isArray(rows) ? rows.map(sanitizeUser) : [];
