import express from "express";
import {
  getAllUsers,
  deleteUser,
  updateUserStatus,
  batchDeleteUsers,
  batchUpdateUserStatus,
} from "../../admin/admin.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin User Management
 *   description: Admin operations for managing platform users/players
 */

router.get("/all", getAllUsers);
router.put("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);
router.post("/batch-delete", batchDeleteUsers);
router.put("/batch-status", batchUpdateUserStatus);

export default router;
