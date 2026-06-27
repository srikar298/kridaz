import { prisma } from "../../../config/prisma.js";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetUrl: z.string().url("Valid Target URL is required").or(z.literal("")),
  fallbackUrl: z.string().url("Valid Fallback URL is required").or(z.literal("")),
  isActive: z.boolean().optional().default(true),
});

const updateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  targetUrl: z.string().url("Valid Target URL is required").or(z.literal("")).optional(),
  fallbackUrl: z.string().url("Valid Fallback URL is required").or(z.literal("")).optional(),
  isActive: z.boolean().optional(),
});

export const createQRCode = async (req, res) => {
  try {
    const validatedData = createSchema.parse(req.body);

    const qrCode = await prisma.dynamicQRCode.create({
      data: validatedData,
    });

    res.status(201).json({ success: true, data: qrCode });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllQRCodes = async (req, res) => {
  try {
    const qrCodes = await prisma.dynamicQRCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data: qrCodes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getQRCodeById = async (req, res) => {
  try {
    const { id } = req.params;
    const qrCode = await prisma.dynamicQRCode.findUnique({
      where: { id },
    });

    if (!qrCode) {
      return res.status(404).json({ success: false, error: "QR code not found" });
    }

    res.status(200).json({ success: true, data: qrCode });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateSchema.parse(req.body);

    const qrCode = await prisma.dynamicQRCode.update({
      where: { id },
      data: validatedData,
    });

    res.status(200).json({ success: true, data: qrCode });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, error: "QR code not found" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.dynamicQRCode.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: "QR code deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ success: false, error: "QR code not found" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};
