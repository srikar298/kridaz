import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";
import { UnauthorizedError, ForbiddenError } from "@kridaz/common";
import { getAccessSecret } from "../../utils/jwtSecrets.js";
import { isTokenVersionStale } from "../../utils/tokenVersion.js";

const ALLOWED_ROLES = [
  "VENUE_OWNER",
  "OWNER",
  "COACH",
  "UMPIRE",
  "ADMIN",
  "STREAMER",
  "SCORER",
];

const verifyOwnerToken = async (req, res, next) => {
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
  if (await isTokenVersionStale(decoded)) {
    return next(
      new UnauthorizedError("Session revoked. Please log in again.", {
        code: "TOKEN_REVOKED",
      })
    );
  }

  let role = decoded.role?.toUpperCase() || "";
  let isAllowed = ALLOWED_ROLES.includes(role);

  // Fallback: token role may be stale (user upgraded since token issued).
  // Re-check the database before rejecting.
  if (!isAllowed && decoded.id) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { role: true },
      });
      if (dbUser && dbUser.role) {
        const dbRole = dbUser.role.toUpperCase();
        if (ALLOWED_ROLES.includes(dbRole)) {
          role = dbRole;
          isAllowed = true;
        }
      }
    } catch (dbErr) {
      logger.warn("[owner.middleware] DB role check failed", {
        error: dbErr.message,
      });
    }
  }

  if (!isAllowed) {
    return next(
      new ForbiddenError(`Access restricted to partner roles`, {
        code: "FORBIDDEN_ROLE",
        required: ALLOWED_ROLES,
        actual: role || null,
      })
    );
  }

  const normalizedUser = {
    ...decoded,
    id: decoded.id,
    userId: decoded.id, // Alias for clarity
    ownerId: decoded.ownerId,
    role: role.toLowerCase(), // Keep it lowercase for downstream compatibility if expected
  };

  req.owner = normalizedUser;
  req.user = normalizedUser;

  next();
};

export default verifyOwnerToken;
