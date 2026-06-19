import { prisma } from "../../config/prisma.js";
import { logAdminAction } from "../../utils/auditLogger.js";
import NotificationService from "../../services/notification.service.js";
import { sanitizeUser } from "../../utils/sanitizeUser.js";

// --- Support Ticket Controllers ---

export const getAllTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  const { ticketId } = req.params;
  const { status } = req.body;
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
      },
    });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.user = sanitizeUser(ticket.user);

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });

    // ── Notifications (Queued) ──────────────────────────────────────────────────────────
    const recipient = ticket.user;
    if (recipient && recipient.email) {
      NotificationService.sendEmail({
        to: recipient.email,
        subject: `Support Ticket Status Updated: ${ticket.subject}`,
        html: `<p>Hello ${recipient.name},</p><p>Your support ticket status has been updated to: <strong>${status}</strong>.</p><p>View details in your dashboard.</p>`,
      });

      NotificationService.sendInApp({
        userId: recipient.id,
        recipientModel: "User",
        title: "Ticket Status Updated",
        message: `Your ticket "${ticket.subject}" is now ${status}.`,
        type: "SUPPORT",
        link: "/venue-owner/docs-support",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated",
      ticket: updatedTicket,
    });

    await logAdminAction(req, "UPDATE_TICKET_STATUS", "RESOLUTION", ticket.id, {
      status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const replyToTicket = async (req, res) => {
  const { ticketId } = req.params;
  const { message } = req.body;
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.user = sanitizeUser(ticket.user);

    const [reply] = await prisma.$transaction([
      prisma.ticketReply.create({
        data: {
          ticketId,
          senderType: "ADMIN",
          senderId: req.user.id,
          message,
        },
      }),
      prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
          updatedAt: new Date(),
        },
      }),
    ]);

    // ── Notifications (Queued) ──────────────────────────────────────────────────────────
    const recipient = ticket.user;

    if (recipient && recipient.email) {
      NotificationService.sendEmail({
        to: recipient.email,
        subject: `New Reply on Support Ticket: ${ticket.subject}`,
        html: `<p>Hello ${recipient.name},</p><p>An administrator has replied to your support ticket.</p><p><strong>Message:</strong> ${message}</p><p>Please check your dashboard to reply.</p>`,
      });

      NotificationService.sendInApp({
        userId: recipient.id,
        recipientModel: "User",
        title: "New Support Reply",
        message: `Admin replied to your ticket: "${message.substring(0, 50)}..."`,
        type: "SUPPORT",
        link: "/venue-owner/docs-support",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reply sent",
      ticket,
    });

    await logAdminAction(req, "REPLY_TO_TICKET", "RESOLUTION", ticket.id);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleAgentStatus = async (req, res) => {
  const { ticketId } = req.params;
  const { isOnline } = req.body;
  try {
    // Support agent online status is currently handled via transient state or metadata.
    // If persistent agent status is required, it should be added to the schema.
    res.status(200).json({
      success: true,
      message: `Agent is now ${isOnline ? "online" : "offline"}`,
      isAgentOnline: isOnline,
    });

    await logAdminAction(
      req,
      "TOGGLE_SUPPORT_AGENT_STATUS",
      "RESOLUTION",
      ticketId,
      {
        isOnline,
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Dispute Controllers ---

export const getAllDisputes = async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            turf: { select: { id: true, name: true } },
          },
        },
        raisedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      disputes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resolveDispute = async (req, res) => {
  const { disputeId } = req.params;
  const { action, message } = req.body;
  try {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: "RESOLVED",
        resolution: {
          action,
          message,
          resolvedAt: new Date(),
          resolvedBy: req.user.id,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Dispute resolved with action: ${action}`,
      dispute: updatedDispute,
    });

    await logAdminAction(req, "RESOLVE_DISPUTE", "RESOLUTION", dispute.id, {
      action,
      message,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
