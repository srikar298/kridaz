/**
 * Notification Templates Registry
 * Generates Email, WhatsApp, and In-App templates based on application events.
 */

export const getTemplatesForEvent = (eventName, payload) => {
  switch (eventName) {
    case "GAME_JOIN_APPROVED":
      return {
        inApp: {
          title: "Match Join Approved",
          message: `Your request to join match ${payload.matchName || ""} has been approved.`,
          type: "SUCCESS",
          link: `/my-joined-games`,
        },
        email: {
          subject: "Match Join Approved",
          html: `<p>Your request to join match ${payload.matchName || ""} has been approved. See you on the field!</p>`,
        },
        wa: {
          message: `Your request to join match ${payload.matchName || ""} has been approved. See you on the field!`,
        },
      };

    case "GAME_JOIN_REJECTED":
      return {
        inApp: {
          title: "Match Join Rejected",
          message: `Your request to join match ${payload.matchName || ""} was rejected. Your coins have been refunded.`,
          type: "INFO",
          link: `/my-joined-games`,
        },
        email: {
          subject: "Match Join Rejected",
          html: `<p>Your request to join match ${payload.matchName || ""} was rejected. Your coins have been refunded to your wallet.</p>`,
        },
        wa: {
          message: `Your request to join match ${payload.matchName || ""} was rejected. Your coins have been refunded to your wallet.`,
        },
      };

    case "GAME_PLAYER_LEFT":
      return {
        inApp: {
          title: "Player Left Match",
          message: `${payload.playerName || "A player"} has left your hosted match ${payload.matchName || ""}.`,
          type: "WARNING",
          link: `/hosted-games`,
        },
        email: {
          subject: "Player Left Match",
          html: `<p>${payload.playerName || "A player"} has left your hosted match ${payload.matchName || ""}.</p>`,
        },
        wa: {
          message: `${payload.playerName || "A player"} has left your hosted match ${payload.matchName || ""}.`,
        },
      };

    case "WITHDRAWAL_REQUESTED":
      return {
        email: {
          subject: "Withdrawal Request Received",
          html: `<p>We have received your withdrawal request for ₹${payload.amount}. It is currently under review and will be processed soon.</p>`,
        },
        inApp: {
          title: "Withdrawal Requested",
          message: `Your withdrawal request for ₹${payload.amount} has been received.`,
          type: "INFO",
          link: `/wallet`,
        },
      };

    case "MANUAL_BOOKING_CREATED":
      return {
        email: {
          subject: "Booking Ticket - " + (payload.venueName || "Kridaz Venue"),
          html: `<p>Hi ${payload.customerName},</p>
                 <p>Your booking at ${payload.venueName} for ${payload.date} at ${payload.time} is confirmed.</p>
                 <p>Have a great game!</p>`,
        },
        wa: {
          message: `Hi ${payload.customerName},\nYour booking at ${payload.venueName} for ${payload.date} at ${payload.time} is confirmed.\nHave a great game!`,
        },
      };

    case "GAME_CANCELLED_BY_HOST":
      return {
        email: {
          subject: "Match Cancelled",
          html: `<p>The match ${payload.matchName || ""} has been cancelled by the host. Your coins have been refunded.</p>`,
        },
        wa: {
          message: `The match ${payload.matchName || ""} has been cancelled by the host. Your coins have been refunded.`,
        },
        inApp: {
          title: "Match Cancelled",
          message: `The match ${payload.matchName || ""} has been cancelled by the host.`,
          type: "WARNING",
          link: `/my-joined-games`,
        },
      };

    case "OFFICIAL_INVITE_UPDATED":
      return {
        inApp: {
          title: `Official Invitation ${payload.status === "accepted" ? "Accepted" : "Rejected"}`,
          message: `${payload.responderName || "Someone"} has ${payload.status} your invitation to be the ${payload.type ? payload.type.toLowerCase() : "official"} for the match.`,
          type: "SYSTEM",
          link: `/hosted-game/${payload.gameId}`,
        },
        email: {
          subject: `Official Invitation ${payload.status === "accepted" ? "Accepted" : "Rejected"}`,
          html: `<p>${payload.responderName || "Someone"} has ${payload.status} your invitation to be the ${payload.type ? payload.type.toLowerCase() : "official"} for the match ${payload.matchName || ""}.</p>`,
        },
        wa: {
          message: `${payload.responderName || "Someone"} has ${payload.status} your invitation to be the ${payload.type ? payload.type.toLowerCase() : "official"} for the match ${payload.matchName || ""}.`,
        },
      };

    case "PRO_INVITE_RECEIVED":
      return {
        inApp: {
          title: "Match Official Invitation",
          message: `You have been invited to be a ${payload.type} for a match.`,
          type: "SYSTEM",
          link: `/my-hosted-games`,
        },
        email: {
          subject: "Match Official Invitation",
          html: `<p>You have been invited to be the ${payload.type ? payload.type.toLowerCase() : "official"} for the match ${payload.matchName || ""}. Please log in to accept or decline the invitation.</p>`,
        },
        wa: {
          message: `You have been invited to be the ${payload.type ? payload.type.toLowerCase() : "official"} for the match ${payload.matchName || ""}. Please log in to accept or decline the invitation.`,
        },
      };

    case "PRO_BOOKING_CREATED":
      return {
        email: {
          subject: "New Professional Booking",
          html: `<p>You have a new booking for ${payload.date} at ${payload.time}. Please check your dashboard for details.</p>`,
        },
        wa: {
          message: `You have a new booking for ${payload.date} at ${payload.time}. Please check your dashboard for details.`,
        },
        inApp: {
          title: "New Booking Received",
          message: `You have a new booking for ${payload.date} at ${payload.time}.`,
          type: "SUCCESS",
          link: `/professional-dashboard`,
        },
      };

    case "PRO_BOOKING_COMPLETED":
      return {
        email: {
          subject: "Booking Completed",
          html: `<p>Your booking on ${payload.date} is now complete. Coins have been settled.</p>`,
        },
        inApp: {
          title: "Booking Completed",
          message: `Your booking on ${payload.date} is now complete.`,
          type: "SUCCESS",
          link: `/professional-dashboard`,
        },
      };

    case "PRO_BOOKING_REJECTED":
      return {
        email: {
          subject: "Professional Booking Update",
          html: `<p>The professional you requested for ${payload.date} could not accept your booking. Your coins have been refunded.</p>`,
        },
        wa: {
          message: `The professional you requested for ${payload.date} could not accept your booking. Your coins have been refunded.`,
        },
        inApp: {
          title: "Booking Rejected",
          message: `The professional could not accept your booking. Coins refunded.`,
          type: "INFO",
          link: `/my-bookings`,
        },
      };

    case "PRO_ONDEMAND_MATCHED":
      return {
        email: {
          subject: "On-Demand Request Matched",
          html: `<p>Your on-demand request for a professional has been matched!</p>`,
        },
        wa: {
          message: `Your on-demand request for a professional has been matched!`,
        },
        inApp: {
          title: "Request Matched",
          message: `Your on-demand request has been matched.`,
          type: "SUCCESS",
          link: `/hosted-games`,
        },
      };

    case "PRO_ONDEMAND_EXPIRED":
      return {
        email: {
          subject: "On-Demand Request Expired",
          html: `<p>We couldn't find a match for your on-demand request. Your coins have been refunded.</p>`,
        },
        inApp: {
          title: "Request Expired",
          message: `We couldn't find a match for your on-demand request. Coins refunded.`,
          type: "WARNING",
          link: `/hosted-games`,
        },
      };

    case "AUTO_SETTLEMENT_PROCESSED":
      return {
        email: {
          subject: "Auto-Settlement Processed",
          html: `<p>An auto-settlement of ₹${payload.amount} has been processed to your bank account.</p>`,
        },
        inApp: {
          title: "Settlement Processed",
          message: `An auto-settlement of ₹${payload.amount} has been processed.`,
          type: "SUCCESS",
          link: `/venue-owner/payouts`,
        },
      };

    case "WALLET_BOOKING_CONFIRMED":
      return {
        email: {
          subject: "Booking Confirmed - " + (payload.venueName || "Venue"),
          html: `<p>Your booking at ${payload.venueName} is confirmed.</p>`,
        },
        wa: {
          message: `Your booking at ${payload.venueName} is confirmed.`,
        },
      };

    case "BOOKING_CANCELLED":
      return {
        email: {
          subject: "Booking Cancelled",
          html: `<p>Your booking at ${payload.venueName} has been cancelled.</p>`,
        },
        wa: {
          message: `Your booking at ${payload.venueName} has been cancelled.`,
        },
        inAppOwner: {
          title: "Booking Cancelled",
          message: `A booking at ${payload.venueName} has been cancelled.`,
          type: "WARNING",
          link: `/venue-owner/bookings`,
        },
      };

    case "WALLET_TOPUP_SUCCESS":
      return {
        email: {
          subject: "Wallet Top-up Successful",
          html: `<p>Your wallet top-up of ₹${payload.amount} was successful.</p>`,
        },
        inApp: {
          title: "Top-up Successful",
          message: `Your wallet top-up of ₹${payload.amount} was successful.`,
          type: "SUCCESS",
          link: `/wallet`,
        },
      };

    case "WALLET_TOPUP_DISCOUNT":
      return {
        email: {
          subject: "Special Top-up Discount",
          html: `<p>You received a discount/bonus on your wallet top-up!</p>`,
        },
      };

    case "PAYMENT_RECOVERED":
      return {
        email: {
          subject: "Payment Recovered",
          html: `<p>Your recent payment was successfully recovered and applied to your wallet.</p>`,
        },
        inApp: {
          title: "Payment Recovered",
          message: `Your recent payment was successfully recovered and applied to your wallet.`,
          type: "SUCCESS",
          link: `/wallet`,
        },
      };

    case "GAME_JOIN_REQUESTED":
      return {
        email: {
          subject: "Match Join Request Received",
          html: `<p>Your request to join match ${payload.matchName || ""} has been received and is pending host approval.</p>`,
        },
        wa: {
          message: `Your request to join match ${payload.matchName || ""} has been received and is pending host approval.`,
        },
      };

    case "BOOKING_COMPLETED":
      return {
        email: {
          subject: "How was your game?",
          html: `<p>We hope you enjoyed your game at ${payload.venueName}. Feel free to leave a review!</p>`,
        },
      };

    case "PARTNER_REQUEST_APPROVED":
      return {
        email: {
          subject: "Partner Request Approved",
          html: `<p>Congratulations! Your partner request has been approved. Welcome to Kridaz.</p>`,
        },
        wa: {
          message: `Congratulations! Your partner request has been approved. Welcome to Kridaz.`,
        },
        inApp: {
          title: "Request Approved",
          message: `Your partner request has been approved.`,
          type: "SUCCESS",
          link: `/`,
        },
      };

    case "PARTNER_REQUEST_REJECTED":
      return {
        email: {
          subject: "Partner Request Update",
          html: `<p>Unfortunately, your partner request could not be approved at this time.</p>`,
        },
        wa: {
          message: `Unfortunately, your partner request could not be approved at this time.`,
        },
        inApp: {
          title: "Request Update",
          message: `Your partner request could not be approved at this time.`,
          type: "WARNING",
          link: `/`,
        },
      };

    case "WITHDRAWAL_APPROVED":
      return {
        email: {
          subject: "Withdrawal Approved",
          html: `<p>Your withdrawal request for ₹${payload.amount} has been approved and processed.</p>`,
        },
        inApp: {
          title: "Withdrawal Approved",
          message: `Your withdrawal request for ₹${payload.amount} has been approved.`,
          type: "SUCCESS",
          link: `/wallet`,
        },
      };

    case "WITHDRAWAL_REJECTED":
      return {
        email: {
          subject: "Withdrawal Rejected",
          html: `<p>Your withdrawal request for ₹${payload.amount} was rejected. Reason: ${payload.reason || "N/A"}</p>`,
        },
        inApp: {
          title: "Withdrawal Rejected",
          message: `Your withdrawal request for ₹${payload.amount} was rejected.`,
          type: "ERROR",
          link: `/wallet`,
        },
      };

    case "DISPUTE_RAISED":
      return {
        email: {
          subject: "Dispute Raised",
          html: `<p>A dispute has been raised regarding your recent booking/match. Our team is investigating.</p>`,
        },
        wa: {
          message: `A dispute has been raised regarding your recent booking/match. Our team is investigating.`,
        },
      };

    case "DISPUTE_RESOLVED":
      return {
        email: {
          subject: "Dispute Resolved",
          html: `<p>Your recent dispute has been resolved. Please check the app for details.</p>`,
        },
        wa: {
          message: `Your recent dispute has been resolved. Please check the app for details.`,
        },
      };

    default:
      return null;
  }
};
