import { Router } from "express";
import {
  createQRCode,
  getAllQRCodes,
  getQRCodeById,
  updateQRCode,
  deleteQRCode,
} from "../controllers/admin.qr.controller.js";

const qrAdminRouter = Router();

qrAdminRouter.post("/", createQRCode);
qrAdminRouter.get("/", getAllQRCodes);
qrAdminRouter.get("/:id", getQRCodeById);
qrAdminRouter.put("/:id", updateQRCode);
qrAdminRouter.delete("/:id", deleteQRCode);

export default qrAdminRouter;
