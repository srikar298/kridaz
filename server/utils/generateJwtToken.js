import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { getAccessSecret } from "./jwtSecrets.js";

/**
 * Look up the current tokenVersion so newly issued tokens can embed it.
 * Returns 0 (the default) for users without the field — safe fallback.
 */
const fetchTokenVersion = async (userId) => {
  if (!userId) return 0;
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });
    return row?.tokenVersion ?? 0;
  } catch {
    return 0;
  }
};

/**
 * Generates a short-lived (15m) JWT access token for Users.
 *
 * Embeds `tv` = the user's current tokenVersion so that a bump (via
 * /logout-all or password reset) invalidates every token issued before.
 */
export async function generateUserToken(userId, role = "user", ownerId = null) {
  const tv = await fetchTokenVersion(userId);
  return jwt.sign(
    {
      id: userId,
      role: role,
      ownerId: ownerId,
      tv,
    },
    getAccessSecret(),
    {
      expiresIn: "15m",
    }
  );
}

/**
 * Generates a short-lived (15m) JWT access token for Owners.
 */
export const generateOwnerToken = async (userId, role, ownerId) => {
  const tv = await fetchTokenVersion(userId);
  return jwt.sign(
    {
      id: userId,
      ownerId: ownerId,
      role: role || "owner",
      tv,
    },
    getAccessSecret(),
    {
      expiresIn: "15m",
    }
  );
};

/**
 * Generates a non-JWT secure random refresh token, hashes it, and saves to DB.
 * Returns the plaintext token for the client (to be stored in HttpOnly cookie).
 *
 * SHA-256 storage allows fast indexed lookups while keeping the plaintext
 * token out of the database.
 */
export const generateRefreshToken = async (userId, ipAddress = null) => {
  const token = crypto.randomBytes(40).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      createdByIp: ipAddress,
    },
  });

  return token;
};
