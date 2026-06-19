import jwt from "jsonwebtoken";
import { UnauthorizedError } from "@kridaz/common";
import { getAccessSecret } from "../../utils/jwtSecrets.js";
import { isTokenVersionStale } from "../../utils/tokenVersion.js";

const verifyUserToken = async (req, res, next) => {
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

  // Attach the decoded user information to the request with normalization
  req.user = {
    ...decoded,
    id: decoded.id || (decoded.user && decoded.user.id),
  };
  next();
};

export const optionalUserAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    let token = null;

    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return next(); // Proceed without req.user
    }

    const decoded = jwt.verify(token, getAccessSecret());
    // optionalAuth silently drops revoked sessions rather than erroring —
    // public endpoints stay reachable for the now-anonymous viewer.
    if (decoded && !(await isTokenVersionStale(decoded))) {
      req.user = {
        ...decoded,
        id: decoded.id || (decoded.user && decoded.user.id),
      };
    }
    next();
  } catch (err) {
    // If token is invalid/expired, still proceed as unauthenticated
    next();
  }
};

export default verifyUserToken;
