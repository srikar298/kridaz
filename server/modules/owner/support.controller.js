import { prisma } from "../../config/prisma.js";
import NotificationService from "../../services/notification.service.js";

export const createTicket = async (req, res) => {
  const { id: userId } = req.owner;
  const { subject, message, category, images } = req.body;

  try {
    if (message.length > 10000) {
      return res
        .status(400)
        .json({ message: "Message exceeds 10,000 characters limit" });
    }

    if (images && images.length > 5) {
      return res.status(400).json({ message: "Maximum 5 images allowed" });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        description: message,
        category,
        status: "OPEN",
      },
    });

    // Notify Admin (Queued)
    NotificationService.notifyAdmins({
      title: "New Support Ticket",
      message: `New ${category} ticket from partner: "${subject}"`,
      type: "SUPPORT",
      link: "/admin/support",
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTickets = async (req, res) => {
  const { id: userId } = req.owner;
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        replies: true,
      },
    });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addReply = async (req, res) => {
  const { id: userId } = req.owner;
  const { ticketId } = req.params;
  const { message } = req.body;

  try {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
    });

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId,
        senderType: "USER",
        senderId: userId,
        message,
      },
    });

    // Notify Admin (Queued)
    NotificationService.notifyAdmins({
      title: "Partner Replied to Ticket",
      message: `Partner replied to ticket: "${ticket.subject}"`,
      type: "SUPPORT",
      link: "/admin/support",
    });

    res.status(200).json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
