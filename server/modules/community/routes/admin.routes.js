import express from "express";
import { getPostReports, deletePost } from "../community.controller.js";

const router = express.Router();

// GET /community/admin/reports
router.get("/reports", getPostReports);

// DELETE /community/admin/:id
router.delete("/:id", deletePost);

export default router;
