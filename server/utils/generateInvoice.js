import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a professional PDF invoice for a booking.
 * @param {Object} booking - The booking details
 * @param {Object} turf - The turf details
 * @param {Object} user - The user details
 * @returns {Promise<Buffer>} - The generated PDF as a Buffer
 */
export const generateInvoice = async (booking, turf, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
      });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- Colors ---
      const primaryColor = "#84CC16"; // Lime green from Kridaz theme
      const darkColor = "#1F2937";
      const grayColor = "#6B7280";

      // --- Header with Logo ---
      const logoPath = path.join(
        __dirname,
        "../../client/user/public/logo.png"
      );
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 40 });
        doc
          .fillColor(primaryColor)
          .fontSize(22)
          .text("Kridaz", 100, 50, { bold: true });
      } else {
        doc
          .fillColor(primaryColor)
          .fontSize(25)
          .text("Kridaz", 50, 50, { bold: true });
      }

      doc
        .fillColor(darkColor)
        .fontSize(10)
        .text("Premium Sports Venue Booking", 100, 75);

      // Company Details (Right aligned)
      doc
        .fontSize(10)
        .fillColor(grayColor)
        .text("Kridaz Pvt Ltd.", 400, 50, { align: "right" })
        .text("123, Sports Complex, HSR Layout", 400, 65, { align: "right" })
        .text("Bangalore, KA - 560102", 400, 80, { align: "right" })
        .text("GSTIN: 29AAACB1234A1Z5", 400, 95, { align: "right" });

      // Horizontal Line
      doc.moveTo(50, 115).lineTo(550, 115).strokeColor("#E5E7EB").stroke();

      // --- Invoice Meta Data ---
      doc.moveDown(2);
      doc
        .fillColor(darkColor)
        .fontSize(18)
        .text("INVOICE", 50, 140, { bold: true });

      doc
        .fontSize(10)
        .fillColor(grayColor)
        .text(
          `Invoice Number: TS-${booking.id.toString().slice(-6).toUpperCase()}`,
          50,
          165
        )
        .text(
          `Booking Date: ${new Date(booking.createdAt).toLocaleDateString()}`,
          50,
          180
        )
        .text(`Payment Method: Online Payment`, 50, 195);

      // --- Billing Details ---
      doc
        .fillColor(darkColor)
        .fontSize(12)
        .text("BILL TO", 50, 230, { bold: true })
        .fontSize(10)
        .fillColor(grayColor)
        .text(user.name, 50, 250)
        .text(user.email, 50, 265)
        .text(user.phone || "N/A", 50, 280);

      doc
        .fillColor(darkColor)
        .fontSize(12)
        .text("VENUE DETAILS", 300, 230, { bold: true })
        .fontSize(10)
        .fillColor(grayColor)
        .text(turf.name, 300, 250)
        .text(turf.location, 300, 265)
        .text(turf.city || "", 300, 280);

      // --- Items Table ---
      const tableTop = 320;
      doc.rect(50, tableTop, 500, 25).fill(primaryColor);

      doc
        .fillColor("#FFFFFF")
        .fontSize(10)
        .text("Description", 60, tableTop + 8, { bold: true })
        .text("Booking Date", 200, tableTop + 8, { bold: true })
        .text("Time Slot", 320, tableTop + 8, { bold: true })
        .text("Duration", 420, tableTop + 8, { bold: true })
        .text("Price (Rs)", 480, tableTop + 8, { align: "right", bold: true });

      // Item Row
      const rowTop = tableTop + 35;
      doc
        .fillColor(darkColor)
        .text(`Booking at ${turf.name}`, 60, rowTop)
        .text(booking.selectedTurfDate, 200, rowTop)
        .text(`${booking.startTime} - ${booking.endTime}`, 320, rowTop)
        .text(`${booking.duration} Hour(s)`, 420, rowTop)
        .text(`${booking.totalPrice}`, 480, rowTop, { align: "right" });

      doc
        .moveTo(50, rowTop + 20)
        .lineTo(550, rowTop + 20)
        .strokeColor("#F3F4F6")
        .stroke();

      // --- QR Code & Summary ---
      const summaryTop = rowTop + 50;

      // QR Code Generation
      const clientUrl =
        process.env.USER_URL ||
        (process.env.CLIENT_URLS
          ? process.env.CLIENT_URLS.split(",")[0]
          : "https://kridaz.com"); // Default to domain if no env found
      const bookingPassUrl = `${clientUrl}/booking-pass/${booking.id}`;

      try {
        const qrCodeDataUrl = await QRCode.toDataURL(bookingPassUrl, {
          margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        doc.image(qrCodeDataUrl, 50, summaryTop, { width: 100 });
        doc
          .fontSize(8)
          .fillColor(grayColor)
          .text("Scan for Entry Pass", 55, summaryTop + 105);
      } catch (qrError) {
        logger.error("QR Code generation failed:", qrError);
      }

      // Summary Section
      doc
        .fillColor(darkColor)
        .fontSize(12)
        .text("Summary", 350, summaryTop, { bold: true });

      doc
        .fontSize(10)
        .text("Total Amount:", 350, summaryTop + 20)
        .text(`Rs ${booking.totalPrice}`, 480, summaryTop + 20, {
          align: "right",
        });

      doc
        .fontSize(12)
        .fillColor(primaryColor)
        .text("Advance Paid:", 350, summaryTop + 40, { bold: true })
        .text(
          `Rs ${booking.advanceAmount || booking.totalPrice}`,
          480,
          summaryTop + 40,
          { align: "right", bold: true }
        );

      doc
        .fontSize(12)
        .fillColor("#F97316") // Orange
        .text("Venue Balance:", 350, summaryTop + 60, { bold: true })
        .text(`Rs ${booking.balanceAmount || 0}`, 480, summaryTop + 60, {
          align: "right",
          bold: true,
        });

      // Payment Status Badge
      const statusX = 350;
      const statusY = summaryTop + 85;
      doc
        .rect(statusX, statusY, 200, 20)
        .fill(booking.paymentType === "PARTIAL" ? "#FEF3C7" : "#DCFCE7");
      doc
        .fillColor(booking.paymentType === "PARTIAL" ? "#92400E" : "#166534")
        .fontSize(9)
        .text(
          booking.paymentType === "PARTIAL"
            ? "PARTIAL PAYMENT RECEIVED"
            : "FULL PAYMENT RECEIVED",
          statusX + 10,
          statusY + 6,
          { bold: true }
        );

      // Support & Contacts Section (Right Side)
      doc
        .fillColor(darkColor)
        .fontSize(10)
        .text("SUPPORT CONTACTS", 350, summaryTop + 115, { bold: true });

      doc
        .fontSize(9)
        .fillColor(grayColor)
        .text(`Platform: support@kridaz.com`, 350, summaryTop + 130)
        .text(`Venue: ${turf.owner?.email || "N/A"}`, 350, summaryTop + 142);

      // Manager Contacts (Left Side)
      if (turf.managerContacts && turf.managerContacts.length > 0) {
        doc
          .fillColor(darkColor)
          .fontSize(10)
          .text("VENUE MANAGERS", 50, summaryTop + 165, { bold: true });

        let contactY = summaryTop + 180;
        turf.managerContacts.forEach((contact, index) => {
          if (index < 3) {
            // Limit to 3 on invoice to avoid overflow
            doc
              .fontSize(9)
              .fillColor(grayColor)
              .text(`${contact.name}: ${contact.phone}`, 50, contactY);
            contactY += 12;
          }
        });
      }

      // Map Link
      if (turf.mapUrl) {
        doc
          .fillColor(primaryColor)
          .fontSize(9)
          .text("Click here for Google Maps Navigation", 50, summaryTop + 118, {
            link: turf.mapUrl,
            underline: true,
          });
      }

      // --- Footer / Signature ---
      doc
        .fillColor(darkColor)
        .fontSize(10)
        .text("Authorized Signature", 50, 710)
        .moveDown(0.5);

      // Fake digital signature look
      doc
        .fontSize(14)
        .fillColor(grayColor)
        .text("Kridaz Accounts Team", 50, 725, { oblique: true });

      doc.rect(50, 745, 150, 1).fill("#E5E7EB");

      // Notes
      doc
        .fillColor(grayColor)
        .fontSize(8)
        .text(
          "Notes: This is a system-generated invoice. Please show the QR code or the Digital Pass at the venue for entry.",
          50,
          780,
          { align: "center" }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
