import jwt from "jsonwebtoken";
import verifyAuth from "./jwt/auth.middleware.js";
import { getAccessSecret } from "../utils/jwtSecrets.js";

/**
 * Authentication middleware (Alias for verifyAuth)
 * Used in many routes to protect endpoints
 */
export const authenticate = verifyAuth;
export const protect = verifyAuth;

/**
 * Optional Protect middleware
 * Decodes user if token is present, but doesn't block if missing
 */
export const optionalProtect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    let token = null;

    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (token) {
      const decoded = jwt.verify(token, getAccessSecret());
      if (decoded) {
        req.user = {
          id: decoded.id,
          userId: decoded.id,
          role: decoded.role?.toLowerCase() || "",
          ...decoded,
        };
      }
    }
  } catch (err) {
    // Silently fail decoding
  }
  next();
};

export default verifyAuth;
