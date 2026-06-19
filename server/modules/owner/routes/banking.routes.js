import { Router } from "express";
import {
  getBankingDetails,
  updateBankingDetails,
  getPayoutConfig,
  requestPayout,
} from "../banking.controller.js";
import verifyOwnerToken from "../../../middleware/jwt/owner.middleware.js";
import { paymentLimiter } from "../../../middleware/rateLimiter.middleware.js";

const bankingRouter = Router();

bankingRouter.get("/", verifyOwnerToken, getBankingDetails);
bankingRouter.put("/", verifyOwnerToken, updateBankingDetails);
bankingRouter.get("/config", verifyOwnerToken, getPayoutConfig);
bankingRouter.post("/payout", paymentLimiter, verifyOwnerToken, requestPayout);
bankingRouter.post(
  "/verify-password",
  verifyOwnerToken,
  (req, res, next) => {
    req.body.amount = 0; // Dummy amount for verification
    next();
  },
  requestPayout
);

export default bankingRouter;
