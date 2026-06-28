import { prisma } from "../config/prisma.js";
import generateEmail from "./generateEmail.js";
import axios from "axios";
import logger from "./logger.js";
import { createCircuitBreaker } from "./circuitBreaker.js";

// --- Circuit Breakers for external MSG91 API calls ---
const msg91WhatsAppBreaker = createCircuitBreaker(
  (url, payload, headers) => axios.post(url, payload, { headers }),
  { name: "MSG91_WhatsApp", timeout: 15_000 }
);
const msg91SmsBreaker = createCircuitBreaker((url) => axios.post(url), {
  name: "MSG91_SMS",
  timeout: 15_000,
});

// MSG91 WhatsApp Service
export const sendWhatsAppMessage = async (
  phone,
  message,
  templateName = null,
  params = []
) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    const sender = process.env.MSG91_WHATSAPP_SENDER; // The integrated number in MSG91

    if (!authKey) {
      logger.warn("[WhatsApp Service] MSG91_AUTH_KEY not set, using mock.");
      logger.info(`[WhatsApp Service] Mock Sending to ${phone}: ${message}`);
      return true;
    }

    // Format phone: remove + and ensure country code (defaulting to 91 if missing)
    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.length === 10) formattedPhone = "91" + formattedPhone;

    if (!templateName) {
      logger.error("[WhatsApp Service] MSG91 requires a pre-approved template for outbound messages. Missing templateName. Aborting.");
      return false;
    }

    // Build the components object e.g., body_1, body_2
    let componentsObj = {};
    if (Array.isArray(params)) {
      params.forEach((param, index) => {
        componentsObj[`body_${index + 1}`] = {
          type: "text",
          value: String(param),
        };
      });
      
      // Inject button parameter for OTP template to fix URL button error
      const otpTemplate = process.env.MSG91_WHATSAPP_OTP_TEMPLATE || "otp_verification";
      if (templateName === otpTemplate && params.length > 0) {
        componentsObj["button_1"] = {
          type: "button",
          sub_type: "url",
          index: 0,
          parameters: [
            {
              type: "text",
              text: String(params[0]),
            },
          ],
        };
      }
    } else if (typeof params === "object" && params !== null) {
      Object.entries(params).forEach(([key, value]) => {
        if (key.startsWith("button_")) {
          componentsObj[key] = value;
        } else {
          componentsObj[`body_${key}`] = {
            type: "text",
            value: String(value),
            parameter_name: key,
          };
        }
      });
    }

    const payload = {
      integrated_number: sender,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: templateName,
          language: {
            code: process.env.MSG91_WHATSAPP_LANG || "en",
            policy: "deterministic",
          },
          namespace:
            process.env.MSG91_WHATSAPP_NAMESPACE ||
            "24b8b902_4d4e_4da1_86f9_5160683abccb",
          to_and_components: [
            {
              to: [formattedPhone],
              components: componentsObj,
            },
          ],
        },
      },
    };

    const apiUrl = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

    logger.info(
      `[WhatsApp Service] Sending request to MSG91 at ${new Date().toISOString()} for ${formattedPhone}`
    );
    const startTime = Date.now();
    const response = await msg91WhatsAppBreaker.fire(apiUrl, payload, {
      authkey: authKey,
      "Content-Type": "application/json",
    });

    logger.info(
      `[WhatsApp Service] Received response from MSG91 in ${Date.now() - startTime}ms. Status: ${response.data.status}`
    );
    return response.data.status === "success";
  } catch (error) {
    logger.error(
      `[WhatsApp Service] Error: ${error.response?.data?.message || error.message}`
    );
    return false;
  }
};

export const sendSMSMessage = async (phone, otp) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
      logger.warn("[SMS Service] MSG91_AUTH_KEY not set, using mock.");
      return true;
    }

    let formattedPhone = phone.replace(/\D/g, "");
    if (formattedPhone.length === 10) formattedPhone = "91" + formattedPhone;

    const templateId = process.env.MSG91_SMS_OTP_TEMPLATE_ID || "";
    const url = `https://control.msg91.com/api/v5/otp?authkey=${authKey}&mobile=${formattedPhone}&otp=${otp}${templateId ? `&template_id=${templateId}` : ''}`;

    logger.info(
      `[SMS Service] Sending request to MSG91 at ${new Date().toISOString()} for ${formattedPhone}`
    );
    const startTime = Date.now();
    const response = await msg91SmsBreaker.fire(url);

    logger.info(
      `[SMS Service] Received response from MSG91 in ${Date.now() - startTime}ms. Type: ${response.data.type}`
    );
    return response.data.type === "success";
  } catch (error) {
    logger.error(
      `[SMS Service] Error: ${error.response?.data?.message || error.message}`
    );
    return false;
  }
};

export const notifyNewGame = async (game, host) => {
  try {
    const { city, state, gameType, date, time } = game;

    // Find users in the same city and state
    const targetUsers = await prisma.user.findMany({
      where: {
        city: { contains: city, mode: "insensitive" },
        state: { contains: state, mode: "insensitive" },
        NOT: { id: host.id },
      },
      select: { name: true, email: true, phone: true },
    });

    if (targetUsers.length === 0) return;

    const message = `
🔥 New ${gameType} Match Hosted!
📍 Location: ${city}, ${state}
📅 Date: ${new Date(date).toDateString()}
⏰ Time: ${time}
👤 Hosted by: ${host.name}

Join the action now on Kridaz! 🏏⚽🏐
    `;

    const emailSubject = `New ${gameType} Match in ${city}!`;
    const baseUrl = process.env.CLIENT_URL || "https://kridaz.vercel.app";
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; background: #000; color: #fff; border-radius: 20px;">
        <h1 style="color: #fbbf24;">New ${gameType} Match!</h1>
        <p>Hey there! A new match has been hosted in your area.</p>
        <div style="background: #171717; padding: 20px; border-radius: 15px; border: 1px solid #262626;">
          <p><strong>Sport:</strong> ${gameType}</p>
          <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Location:</strong> ${city}, ${state}</p>
        </div>
        <a href="${baseUrl}/join-games" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #fbbf24; color: #000; text-decoration: none; font-weight: bold; border-radius: 10px;">Join Match Now</a>
      </div>
    `;

    const templateName = process.env.MSG91_WHATSAPP_NOTIF_TEMPLATE;

    // Send notifications in parallel
    await Promise.all(
      targetUsers.map(async (user) => {
        // Email
        if (user.email) {
          generateEmail(user.email, emailSubject, emailHtml).catch((e) =>
            logger.error("generateEmail error", e)
          );
        }

        // WhatsApp
        if (user.phone) {
          if (templateName) {
            // Template params: Sport, City, Host, Link
            sendWhatsAppMessage(user.phone, "", templateName, [
              gameType,
              city,
              host.name,
              `${baseUrl}/join-games`,
            ]).catch((e) => logger.error("sendWhatsAppMessage error", e));
          } else {
            sendWhatsAppMessage(user.phone, message).catch((e) =>
              logger.error("sendWhatsAppMessage error", e)
            );
          }
        }
      })
    );

    logger.info(
      `[Notifications] Sent to ${targetUsers.length} users in ${city}, ${state}`
    );
  } catch (error) {
    logger.error(`[Notifications] Error: ${error.message}`);
  }
};

/**
 * Sends a branded invite email to a custom (off-platform) player.
 */
export const sendCustomPlayerInvite = async (customPlayer, game, host) => {
  try {
    const { name, email, mustPay, inviteToken } = customPlayer;
    const { gameType, date, time, city, state, perPlayerCharge } = game;

    const baseUrl = process.env.CLIENT_URL || "https://kridaz.vercel.app";
    const magicLink = `${baseUrl}/auth/signup?invite=${inviteToken}&email=${encodeURIComponent(email)}`;

    const formattedDate = new Date(date).toDateString();
    const paymentLine = mustPay
      ? `<p style="color:#fbbf24;font-weight:bold;">💳 Your slot requires a payment of ₹${perPlayerCharge} to confirm after sign-up.</p>`
      : `<p style="color:#4ade80;font-weight:bold;">🎉 Your slot is <strong>FREE</strong> — just sign up to confirm it!</p>`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#111827;border-radius:20px;overflow:hidden;border:1px solid #1f2937;">
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:36px 32px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">⚡</div>
      <h1 style="margin:0;color:#fbbf24;font-size:26px;font-weight:900;letter-spacing:-1px;">You're Invited to Play!</h1>
      <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">${host?.name || "A friend"} wants you on their team</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#d1d5db;margin:0 0 20px;">Hey <strong style="color:#fff;">${name}</strong>! You've been personally invited to join a <strong style="color:#fbbf24;">${gameType}</strong> match on Kridaz.</p>
      <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #374151;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:6px 0;">Sport</td><td style="color:#fff;font-weight:700;padding:6px 0;">${gameType}</td></tr>
          <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:6px 0;">Date</td><td style="color:#fff;font-weight:700;padding:6px 0;">${formattedDate}</td></tr>
          <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:6px 0;">Time</td><td style="color:#fff;font-weight:700;padding:6px 0;">${time}</td></tr>
          <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:6px 0;">Location</td><td style="color:#fff;font-weight:700;padding:6px 0;">${city}, ${state}</td></tr>
          <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:6px 0;">Hosted by</td><td style="color:#fff;font-weight:700;padding:6px 0;">${host?.name || "The Host"}</td></tr>
        </table>
      </div>
      ${paymentLine}
      <div style="text-align:center;margin:28px 0 8px;"><a href="${magicLink}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;text-decoration:none;font-weight:900;font-size:16px;border-radius:12px;letter-spacing:-0.5px;">Accept Invitation →</a></div>
      <p style="text-align:center;color:#4b5563;font-size:12px;margin:12px 0 0;">Button not working? Copy this link:<br><span style="color:#fbbf24;word-break:break-all;">${magicLink}</span></p>
    </div>
    <div style="background:#0a0a0a;padding:20px 32px;text-align:center;border-top:1px solid #1f2937;"><p style="color:#4b5563;font-size:11px;margin:0;">© Kridaz · This invite was sent by ${host?.name || "a Kridaz user"}. Not expecting this? You can ignore it.</p></div>
  </div>
</body>
</html>`;

    await generateEmail(
      email,
      `⚡ ${host?.name || "A friend"} invited you to play ${gameType} on Kridaz!`,
      html
    );
    logger.info(`[CustomInvite] Invite sent to ${email} for game ${game.id}`);
  } catch (error) {
    logger.error(
      `[CustomInvite] Error sending to ${customPlayer?.email}: ${error.message}`
    );
    throw error;
  }
};

/**
 * Sends a branded invite email to a custom (off-platform) umpire.
 */
export const sendCustomUmpireInvite = async (customUmpire, game, host) => {
  try {
    const { name, email, inviteToken } = customUmpire;
    const { gameType, date, time, city, state } = game;

    const baseUrl = process.env.CLIENT_URL || "https://kridaz.vercel.app";
    const magicLink = `${baseUrl}/auth/signup?umpireInvite=${inviteToken}&email=${encodeURIComponent(email)}`;
    const formattedDate = new Date(date).toDateString();

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#111827;border-radius:20px;overflow:hidden;border:1px solid #1f2937;">
    <div style="background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#1d4ed8 100%);padding:36px 32px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">⚖️</div>
      <h1 style="margin:0;color:#fbbf24;font-size:26px;font-weight:900;letter-spacing:-1px;">Umpire Invitation</h1>
      <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">${host?.name || "A host"} wants you to officiate their match</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#d1d5db;margin:0 0 20px;">Hey <strong style="color:#fff;">${name}</strong>! You've been invited to officiate a <strong style="color:#fbbf24;">${gameType}</strong> match on Kridaz.</p>
      <div style="background:#1f2937;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #374151;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:6px 0;">Match</td><td style="color:#fff;font-weight:700;padding:6px 0;">${gameType}</td></tr>
          <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:6px 0;">Date</td><td style="color:#fff;font-weight:700;padding:6px 0;">${formattedDate}</td></tr>
          <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:6px 0;">Time</td><td style="color:#fff;font-weight:700;padding:6px 0;">${time}</td></tr>
          <tr><td style="color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding:6px 0;">Location</td><td style="color:#fff;font-weight:700;padding:6px 0;">${city}, ${state}</td></tr>
        </table>
      </div>
      <p style="color:#9ca3af;font-size:14px;margin-bottom:20px;">As an invited umpire, you'll get access to a specialized scoring portal to manage the game live.</p>
      <div style="text-align:center;margin:28px 0 8px;"><a href="${magicLink}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;text-decoration:none;font-weight:900;font-size:16px;border-radius:12px;letter-spacing:-0.5px;">Setup Umpire Profile →</a></div>
    </div>
    <div style="background:#0a0a0a;padding:20px 32px;text-align:center;border-top:1px solid #1f2937;"><p style="color:#4b5563;font-size:11px;margin:0;">© Kridaz · Official Umpire Onboarding</p></div>
  </div>
</body>
</html>`;

    await generateEmail(
      email,
      `⚖️ Invitation to officiate ${gameType} match on Kridaz`,
      html
    );
    if (customUmpire.phone) {
      const waMessage = `⚖️ Hello ${name}! You've been invited by ${host?.name} to officiate a ${gameType} match on Kridaz.\n\n📅 Date: ${formattedDate}\n⏰ Time: ${time}\n\nAccept & Setup Scoring Portal: ${magicLink}`;
      await sendWhatsAppMessage(customUmpire.phone, waMessage);
    }
    logger.info(`[UmpireInvite] Invite sent to ${email}`);
  } catch (error) {
    logger.error(`[UmpireInvite] Error: ${error.message}`);
  }
};
