import express from "express";
import { getAllErrorLogs, resolveErrorLog } from "../admin.controller.js";

const router = express.Router();

router.get("/", getAllErrorLogs);
router.patch("/:id/resolve", resolveErrorLog);

export default router;
