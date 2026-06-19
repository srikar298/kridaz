import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";

export const createInquiry = async (req, res) => {
  try {
    const userId = req.user.id;
    const { proId, interestFor, phone, message } = req.body;

    if (!proId || !interestFor || !phone || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const inquiry = await prisma.professionalInquiry.create({
      data: {
        userId,
        proId,
        interestFor,
        phone,
        message,
        status: "PENDING",
      },
    });

    return res
      .status(201)
      .json({ success: true, message: "Inquiry sent successfully", inquiry });
  } catch (error) {
    logger.error("Error creating inquiry:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProInquiries = async (req, res) => {
  try {
    const proId = req.user.id; // Professional is also a user

    const inquiries = await prisma.professionalInquiry.findMany({
      where: { proId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, inquiries });
  } catch (error) {
    logger.error("Error fetching pro inquiries:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateInquiryStatus = async (req, res) => {
  try {
    const proId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const inquiry = await prisma.professionalInquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return res
        .status(404)
        .json({ success: false, message: "Inquiry not found" });
    }

    if (inquiry.proId !== proId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const updatedInquiry = await prisma.professionalInquiry.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: "Inquiry updated",
      inquiry: updatedInquiry,
    });
  } catch (error) {
    logger.error("Error updating inquiry status:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
