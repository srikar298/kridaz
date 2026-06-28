import { prisma } from "../../config/prisma.js";
import crypto from "crypto";
import { addDays } from "date-fns";
import logger from "../../utils/logger.js";
import { wrapped } from "../../utils/envelope.js";
import generateEmail from "../../utils/generateEmail.js";
import { sendWhatsAppMessage } from "../../utils/notification.service.js";
export const createVenueInvite = async (req, res) => {
  const adminId = req.user.id; // From verifyAdminToken middleware
  const { email, phone, turfData } = req.body;

  if (!email && !phone) {
    return res.status(400).json({
      message: "Either email or phone is required to send an invite.",
    });
  }

  if (!turfData || !turfData.name) {
    return res.status(400).json({ message: "Turf data is required." });
  }

  try {
    // 1. Create a stub User & OwnerProfile to hold the Turf
    const stubEmail = email || `invited_${crypto.randomUUID()}@placeholder.com`;
    const stubPhone = phone || null;

    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: stubEmail }, { phone: stubPhone }].filter(Boolean),
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: stubEmail,
          phone: stubPhone,
          username: `user_${crypto.randomBytes(6).toString("hex")}`,
          password: crypto.randomBytes(16).toString("hex"), // Random unguessable password
          name: "Invited Venue Owner",
          role: "USER", // Upgraded to VENUE_OWNER upon signup
          isVerified: false,
        },
      });
    }

    let ownerProfile = await prisma.ownerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!ownerProfile) {
      ownerProfile = await prisma.ownerProfile.create({
        data: {
          userId: user.id,
          businessName: turfData.name || "Pending Business",
        },
      });
    }

    // 2. Create the Turf (hidden initially)
    const newTurf = await prisma.turf.create({
      data: {
        name: turfData.name,
        description: turfData.description,
        location: turfData.location || "Pending Location",
        city: turfData.city || "Pending",
        state: turfData.state || "Pending",
        image: turfData.image || "",
        images: turfData.images || [],
        sportTypes: turfData.sportTypes || [],
        groundTypes: turfData.groundTypes || [],
        facilities: turfData.facilities || [],
        pricePerHour: turfData.pricePerHour || 0,
        openTime: turfData.openTime || "00:00",
        closeTime: turfData.closeTime || "23:59",
        slotDuration: turfData.slotDuration || 60,
        ownerId: ownerProfile.id,
        status: "invited",
        isActive: false, // Hidden from public
      },
    });

    // 3. Create the VenueInvite
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = addDays(new Date(), 7); // 7 days expiration

    const venueInvite = await prisma.venueInvite.create({
      data: {
        adminId,
        email,
        phone,
        token: inviteToken,
        turfId: newTurf.id,
        expiresAt,
      },
    });

    // Construct a magic link for the venue owner to claim the invite
    const magicLink = `${process.env.OWNER_URL ? process.env.OWNER_URL.split(",")[0] : "http://localhost:5174"}/claim-venue?inviteToken=${inviteToken}`;

    // Integrate actual email/whatsapp sending functions
    if (email) {
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; background: #000; color: #fff; border-radius: 20px;">
          <h1 style="color: #fbbf24;">You're Invited to Kridaz!</h1>
          <p>Hey there! You've been invited to onboard your venue: <strong>${turfData.name}</strong>.</p>
          <a href="${magicLink}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #fbbf24; color: #000; text-decoration: none; font-weight: bold; border-radius: 10px;">Claim Venue</a>
        </div>
      `;
      await generateEmail(
        email,
        "Invitation to Onboard Your Venue on Kridaz",
        emailHtml
      ).catch((e) => logger.error("generateEmail error", e));
    }

    if (phone) {
      const waMessage = `🎉 Hello! You've been invited to onboard your venue *${turfData.name}* on Kridaz.\n\nClick here to claim and setup your venue: ${magicLink}`;
      const templateName =
        process.env.MSG91_WHATSAPP_NOTIF_TEMPLATE || "general_messages";
      const params = {
        customer_name: "Venue Owner",
        update_line_1: `You've been invited to onboard your venue: ${turfData.name}.`,
        update_line_2: `Use this secure link to claim your venue:`,
        update_line_3: `${magicLink}`,
        status_text: "Venue Invite",
        footer_note: "Welcome to Kridaz!",
      };
      await sendWhatsAppMessage(phone, waMessage, templateName, params).catch(
        (e) => logger.error("sendWhatsAppMessage error", e)
      );
    }

    return wrapped(
      res,
      {
        message: "Venue and Invite created successfully",
        magicLink, // returning for admin to copy
        venueInvite,
      },
      201
    );
  } catch (err) {
    logger.error("Error in createVenueInvite", err);
    return res.status(500).json({ message: err.message });
  }
};

export const listVenueInvites = async (req, res) => {
  try {
    const invites = await prisma.venueInvite.findMany({
      include: {
        Turf: {
          select: {
            id: true,
            name: true,
            city: true,
            status: true,
            isActive: true,
          },
        },
        User: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Update status locally if expired & normalize Prisma relation keys for frontend
    const now = new Date();
    const formattedInvites = invites.map(({ Turf, User, ...inv }) => {
      if (inv.status === "PENDING" && inv.expiresAt < now) {
        inv.status = "EXPIRED";
      }
      return { ...inv, turf: Turf, admin: User };
    });

    return wrapped(res, { invites: formattedInvites });
  } catch (err) {
    logger.error("Error in listVenueInvites", err);
    return res.status(500).json({ message: err.message });
  }
};

export const resendVenueInvite = async (req, res) => {
  const { id } = req.params;
  try {
    const invite = await prisma.venueInvite.findUnique({ where: { id } });
    if (!invite) return res.status(404).json({ message: "Invite not found." });

    if (invite.status === "ACCEPTED") {
      return res.status(400).json({ message: "Invite already accepted." });
    }

    // Refresh token & expiration
    const newToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = addDays(new Date(), 7);

    const updatedInvite = await prisma.venueInvite.update({
      where: { id },
      data: { token: newToken, expiresAt, status: "PENDING" },
    });

    const magicLink = `${process.env.OWNER_URL ? process.env.OWNER_URL.split(",")[0] : "http://localhost:5174"}/claim-venue?inviteToken=${newToken}`;

    // Dispatch Email/WhatsApp again
    if (invite.email) {
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; background: #000; color: #fff; border-radius: 20px;">
          <h1 style="color: #fbbf24;">Your Kridaz Invite (Resent)</h1>
          <p>Hey there! Your previous invite expired. Here's a fresh link to onboard your venue.</p>
          <a href="${magicLink}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #fbbf24; color: #000; text-decoration: none; font-weight: bold; border-radius: 10px;">Claim Venue</a>
        </div>
      `;
      await generateEmail(
        invite.email,
        "Reminder: Invitation to Onboard Your Venue on Kridaz",
        emailHtml
      ).catch((e) => logger.error("generateEmail error", e));
    }

    if (invite.phone) {
      const waMessage = `🎉 Hello! Your Kridaz invite was resent.\n\nClick here to claim and setup your venue: ${magicLink}`;
      const templateName =
        process.env.MSG91_WHATSAPP_NOTIF_TEMPLATE || "general_messages";
      const params = {
        customer_name: "Venue Owner",
        update_line_1: `Your previous invite expired.`,
        update_line_2: `Here is a fresh, secure link to claim your venue:`,
        update_line_3: `${magicLink}`,
        status_text: "Invite Resent",
        footer_note: "Welcome to Kridaz!",
      };
      await sendWhatsAppMessage(
        invite.phone,
        waMessage,
        templateName,
        params
      ).catch((e) => logger.error("sendWhatsAppMessage error", e));
    }
    return wrapped(res, {
      message: "Invite resent successfully",
      magicLink,
      invite: updatedInvite,
    });
  } catch (err) {
    logger.error("Error in resendVenueInvite", err);
    return res.status(500).json({ message: err.message });
  }
};

export const revokeVenueInvite = async (req, res) => {
  const { id } = req.params;
  try {
    const invite = await prisma.venueInvite.findUnique({ where: { id } });
    if (!invite) return res.status(404).json({ message: "Invite not found." });

    if (invite.status === "ACCEPTED") {
      return res
        .status(400)
        .json({ message: "Cannot revoke accepted invite." });
    }

    await prisma.venueInvite.update({
      where: { id },
      data: { status: "EXPIRED" },
    });

    return wrapped(res, { message: "Invite revoked successfully" });
  } catch (err) {
    logger.error("Error in revokeVenueInvite", err);
    return res.status(500).json({ message: err.message });
  }
};

export const verifyPublicInvite = async (req, res) => {
  const { token } = req.params;
  try {
    const invite = await prisma.venueInvite.findUnique({
      where: { token },
      include: {
        turf: true,
      },
    });

    if (!invite)
      return res.status(404).json({ message: "Invalid invite token." });
    if (invite.status === "ACCEPTED")
      return res
        .status(400)
        .json({ message: "This invite has already been accepted." });
    if (invite.status === "EXPIRED" || new Date() > invite.expiresAt)
      return res.status(400).json({ message: "This invite has expired." });

    return wrapped(res, { invite });
  } catch (err) {
    logger.error("Error in verifyPublicInvite", err);
    return res.status(500).json({ message: err.message });
  }
};
