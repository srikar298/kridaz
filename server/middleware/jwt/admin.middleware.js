import jwt from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "@kridaz/common";
import { getAccessSecret } from "../../utils/jwtSecrets.js";
import { isTokenVersionStale } from "../../utils/tokenVersion.js";

const verifyAdminToken = async (req, res, next) => {
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

  // Support both {id, role} and {user: {role}} or similar structures
  const role = decoded.role || (decoded.user && decoded.user.role);

  if (role?.toUpperCase() !== "ADMIN") {
    return next(
      new ForbiddenError("Admin privileges required", {
        code: "FORBIDDEN_ROLE",
        required: ["ADMIN"],
        actual: role || null,
      })
    );
  }

  // Normalize for controllers expecting req.user or specific id/role placement
  const normalizedUser = {
    ...decoded,
    id: decoded.id || (decoded.user && decoded.user.id),
    role: role,
  };

  req.admin = normalizedUser;
  req.user = normalizedUser;
  next();
};

export default verifyAdminToken;
