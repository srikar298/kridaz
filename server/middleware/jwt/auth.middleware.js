import jwt from "jsonwebtoken";
import * as Sentry from "@sentry/node";
import { UnauthorizedError, ForbiddenError } from "@kridaz/common";
import { getAccessSecret } from "../../utils/jwtSecrets.js";
import { isTokenVersionStale } from "../../utils/tokenVersion.js";

const verifyAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  let token = null;

  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  } else if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return next(
      new UnauthorizedError("No token provided", { code: "NO_TOKEN" })
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getAccessSecret());
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(
        new UnauthorizedError("Session expired", { code: "TOKEN_EXPIRED" })
      );
    }
    return next(
      new UnauthorizedError("Invalid token", { code: "INVALID_TOKEN" })
    );
  }

  if (!decoded) {
    return next(
      new UnauthorizedError("Invalid token", { code: "INVALID_TOKEN" })
    );
  }

  // tokenVersion enforcement — rejects sessions revoked via /logout-all.
  // Tokens issued before this rollout don't carry `tv` and pass through.
  if (await isTokenVersionStale(decoded)) {
    return next(
      new UnauthorizedError("Session revoked. Please log in again.", {
        code: "TOKEN_REVOKED",
      })
    );
  }

  const role = decoded.role?.toLowerCase() || "";

  // Check if it's a partner/business role
  const isBusinessRole = [
    "admin",
    "venue_owner",
    "coach",
    "umpire",
    "streamer",
    "scorer",
  ].some((r) => role.includes(r));

  // Unified Identity: Always use 'id' as User ID, and 'ownerId' for business document reference
  const normalizedUser = {
    id: decoded.id,
    userId: decoded.id, // Alias for clarity
    ownerId: decoded.ownerId,
    role: role,
    ...decoded,
  };

  // Attach to request
  req.user = normalizedUser;

  if (isBusinessRole) {
    req.owner = normalizedUser;
  }

  // Set Sentry user context with the request-id for cross-system correlation
  Sentry.setUser({
    id: normalizedUser.id,
    role: normalizedUser.role,
  });
  if (res.locals?.requestId) {
    Sentry.setTag("request_id", res.locals.requestId);
  }

  next();
};

/**
 * Middleware to optionally parse user from token if present, without rejecting if missing.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    let token = null;

    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, getAccessSecret());
    if (!decoded) {
      return next();
    }

    // optionalAuth silently drops revoked sessions rather than erroring —
    // public endpoints (e.g. /turf list) keep working for the now-anonymous
    // viewer instead of returning 401 on a stale token.
    if (await isTokenVersionStale(decoded)) {
      return next();
    }

    const role = decoded.role?.toLowerCase() || "";
    const isBusinessRole = [
      "admin",
      "venue_owner",
      "coach",
      "umpire",
      "streamer",
      "scorer",
    ].some((r) => role.includes(r));

    const normalizedUser = {
      id: decoded.id,
      userId: decoded.id,
      ownerId: decoded.ownerId,
      role: role,
      ...decoded,
    };

    req.user = normalizedUser;

    if (isBusinessRole) {
      req.owner = normalizedUser;
    }

    next();
  } catch (err) {
    // Just proceed without setting req.user if token parsing fails
    next();
  }
};

/**
 * Middleware to restrict access based on user roles.
 * @param {...string} roles - Allowed roles
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(
        new ForbiddenError("No user role on request", {
          code: "FORBIDDEN_NO_ROLE",
        })
      );
    }

    const userRole = req.user.role.toLowerCase();
    const hasRole = roles.some((r) => userRole === r.toLowerCase());

    if (!hasRole) {
      return next(
        new ForbiddenError(`Access restricted to ${roles.join(", ")} roles`, {
          code: "FORBIDDEN_ROLE",
          required: roles,
          actual: userRole,
        })
      );
    }

    next();
  };
};

export default verifyAuth;
