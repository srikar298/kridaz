import { prisma } from "../config/prisma.js";
import logger from "./logger.js";

/**
 * Log an administrative action to the database using Prisma.
 * @param {Object} req - Express request object
 * @param {String} action - Name of the action (e.g. "APPROVE_PROFESSIONAL")
 * @param {String} module - Module name (e.g. "USER_MANAGEMENT")
 * @param {String} targetId - ID of the affected resource
 * @param {Object} details - Additional metadata
 */
export const logAdminAction = async (
  req,
  action,
  module,
  targetId = null,
  details = {}
) => {
  try {
    const adminId = req.user?.id;

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action,
        module,
        targetId,
        details,
        ipAddress:
          req.ip ||
          req.headers["x-forwarded-for"] ||
          req.socket?.remoteAddress ||
          "unknown_ip",
        userAgent: req.headers["user-agent"],
      },
    });
  } catch (error) {
    logger.error("FAILED_TO_LOG_AUDIT_ACTION", error);
  }
};

/**
 * Enhanced audit logger that accepts explicit userId.
 */
export const logAudit = async ({
  userId,
  action,
  module,
  targetId,
  details,
  req,
}) => {
  try {
    const ipAddress = req
      ? req.ip ||
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        "unknown_ip"
      : null;
    const userAgent = req ? req.headers["user-agent"] : null;

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        module,
        targetId,
        details,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    logger.error("Audit Logging Error", error);
  }
};
