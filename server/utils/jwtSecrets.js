/**
 * Centralized JWT secret resolution.
 *
 * Production keeps three logical secrets:
 *
 *   - ACCESS     — short-lived (15m) access tokens, issued at login/refresh
 *   - REGISTRATION — short-lived (30m) registration tokens, issued after OTP
 *   - LEGACY (JWT_SECRET) — what every code path used before this split
 *
 * During the split the new vars (JWT_ACCESS_SECRET, JWT_REGISTRATION_SECRET)
 * fall back to JWT_SECRET if unset, so deploying this file without setting
 * the new envs is a no-op. Rotating to independent secrets is a separate
 * coordinated change: provision the new env, then redeploy with old tokens
 * accepted via JWT_SECRET until they expire (~15m for access, ~30d for
 * refresh which doesn't use JWT anyway).
 *
 * Rotation runbook (for the operator running the actual swap later):
 *   1. Set JWT_ACCESS_SECRET=<new> alongside JWT_SECRET=<old> in the env.
 *   2. Restart server — new tokens are signed with <new>, old tokens still
 *      verify because verifyAccess() iterates both keys (TODO: enable that
 *      multi-key verify path in a later PR).
 *   3. Wait for the access-token TTL window (15m) so all in-flight tokens
 *      have rotated.
 *   4. Drop JWT_SECRET from the env. Now only the new secret is accepted.
 *   5. Repeat for JWT_REGISTRATION_SECRET on a separate cycle.
 */

const required = (label, value) => {
  if (!value) {
    throw new Error(
      `[jwtSecrets] ${label} is unset — refusing to start. Set JWT_SECRET (legacy) or the specific JWT_*_SECRET env.`
    );
  }
  if (process.env.NODE_ENV === "production" && value.length < 64) {
    throw new Error(
      `[jwtSecrets] ${label} is too weak. Must be at least 64 characters long in production.`
    );
  }
  return value;
};

export const getAccessSecret = () =>
  required(
    "JWT_ACCESS_SECRET",
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET
  );

export const getRegistrationSecret = () =>
  required(
    "JWT_REGISTRATION_SECRET",
    process.env.JWT_REGISTRATION_SECRET || process.env.JWT_SECRET
  );
