import { prisma } from "../../config/prisma.js";

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.status(200).json({
      success: true,
      logs: logs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
