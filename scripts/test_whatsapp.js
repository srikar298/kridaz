import { sendWhatsAppMessage } from "../server/utils/notification.service.js";
import dotenv from "dotenv";
dotenv.config({ path: "./server/.env" });

async function runTests() {
  const phone = "919000000000"; // Replace with a test number if needed, but we just want to see the API response payload
  console.log("--- Testing Booking Confirmation (Array Format) ---");
  const res1 = await sendWhatsAppMessage(
    phone,
    "Test",
    process.env.MSG91_WHATSAPP_BOOKING_TEMPLATE,
    [
      "Rahul",
      "Urban Sports Arena",
      "15 June 2026",
      "08:00 PM",
      "https://kridaz.com/pass",
      "https://api.kridaz.com/invoice",
    ]
  );
  console.log("Booking confirmation sent:", res1);

  console.log("\\n--- Testing Generic Template (Object Format) ---");
  const res2 = await sendWhatsAppMessage(
    phone,
    "Test",
    process.env.MSG91_WHATSAPP_CANCEL_TEMPLATE || "general_messages",
    {
      customer_name: "Rahul",
      update_line_1: "Your wallet has been successfully recharged.",
      update_line_2: "Amount Added: ₹500",
      update_line_3: "Current Balance: ₹1500",
      status_text: "Success",
      footer_note: "Thank you for using Kridaz!",
    }
  );
  console.log("Generic template sent:", res2);
}

runTests()
  .then(() => {
    console.log("Tests completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
