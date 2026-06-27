import { prisma } from "../../../config/prisma.js";

export const resolveQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const qrCode = await prisma.dynamicQRCode.findUnique({
      where: { id },
    });

    if (!qrCode) {
      return res.status(404).json({ success: false, error: "QR code not found" });
    }

    if (qrCode.isActive && qrCode.targetUrl) {
      return res.redirect(qrCode.targetUrl);
    }

    if (qrCode.fallbackUrl) {
      return res.redirect(qrCode.fallbackUrl);
    }

    return res.status(404).json({ success: false, error: "No target URL available for this QR code" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
