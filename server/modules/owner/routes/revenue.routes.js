import { Router } from "express";
import {
  getRevenueSummary,
  getRevenueTransactions,
} from "../revenue.controller.js";
import verifyOwnerToken from "../../../middleware/jwt/owner.middleware.js";

const revenueRouter = Router();

revenueRouter.get("/summary", verifyOwnerToken, getRevenueSummary);
revenueRouter.get("/transactions", verifyOwnerToken, getRevenueTransactions);

export default revenueRouter;
