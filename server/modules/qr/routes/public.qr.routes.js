import { Router } from "express";
import { resolveQRCode } from "../controllers/public.qr.controller.js";

const qrPublicRouter = Router();

qrPublicRouter.get("/:id", resolveQRCode);

export default qrPublicRouter;
