import { prisma } from "../../config/prisma.js";
import * as argon2 from "argon2";

export const getBankingDetails = async (req, res) => {
  const { id: userId, ownerId } = req.owner;
  try {
    const owner = await prisma.ownerProfile.findFirst({
      where: {
        OR: [{ userId: userId }, { id: ownerId || "" }],
      },
      select: {
        bankingDetails: true,
        walletBalance: true,
        reservedBalance: true,
        disputeBalance: true,
        withdrawnBalance: true,
      },
    });

    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner record not found" });
    }
    res.status(200).json({
      success: true,
      bankingDetails: owner.bankingDetails || {},
      walletBalance: owner.walletBalance || 0,
      reservedBalance: owner.reservedBalance || 0,
      disputeBalance: owner.disputeBalance || 0,
      withdrawnBalance: owner.withdrawnBalance || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBankingDetails = async (req, res) => {
  const { id: userId, ownerId } = req.owner;
  const {
    accountName,
    accountNumber,
    ifscCode,
    bankName,
    upiId,
    payoutMode,
    cancelledCheckUrl,
  } = req.body;
  try {
    const owner = await prisma.ownerProfile.findFirst({
      where: {
        OR: [{ userId: userId }, { id: ownerId || "" }],
      },
    });
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    const currentDetails = owner.bankingDetails || {};

    const updatedBankingDetails = {
      accountName,
      accountNumber,
      ifscCode,
      bankName,
      upiId,
      payoutMode,
      cancelledCheckUrl: cancelledCheckUrl || currentDetails.cancelledCheckUrl,
      kycStatus:
        currentDetails.kycStatus === "VERIFIED" ? "VERIFIED" : "PENDING",
    };

    const updatedOwner = await prisma.ownerProfile.update({
      where: { id: owner.id },
      data: { bankingDetails: updatedBankingDetails },
    });

    res.status(200).json({
      success: true,
      message: "Banking details updated and sent for verification",
      bankingDetails: updatedOwner.bankingDetails,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPayoutConfig = async (req, res) => {
  try {
    // Friday is the fixed payout day (5)
    res.status(200).json({ success: true, settings: { payoutDay: 5 } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestPayout = async (req, res) => {
  const { id: userId, ownerId } = req.owner;
  const { amount, password } = req.body;

  try {
    const owner = await prisma.ownerProfile.findFirst({
      where: {
        OR: [{ userId: userId }, { id: ownerId || "" }],
      },
    });
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    // Verify password if master password is set and password parameter is provided
    if (owner.password && password) {
      const isMatch = await argon2.verify(owner.password, password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid master password" });
      }
    }

    // If amount is 0, we just return success for password verification
    if (amount === 0) {
      return res
        .status(200)
        .json({ success: true, message: "Password verified successfully" });
    }

    // Verify balance
    if (Number(owner.walletBalance) < amount) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient wallet balance" });
    }

    if (amount < 5000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Minimum withdrawal amount is Rs 5000",
        });
    }

    if (amount > 300000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Maximum withdrawal limit is Rs 300,000",
        });
    }

    // Check if banking info exists
    const bankingDetails = owner.bankingDetails || {};
    if (!bankingDetails || !bankingDetails.accountName) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please configure your banking details first",
        });
    }

    if (
      bankingDetails.payoutMode === "BANK" &&
      (!bankingDetails.accountNumber || !bankingDetails.ifscCode)
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Bank account number and IFSC code are required",
        });
    }

    if (bankingDetails.payoutMode === "UPI" && !bankingDetails.upiId) {
      return res
        .status(400)
        .json({ success: false, message: "UPI ID is required for UPI payout" });
    }

    // Atomic transaction: Deduct balance and create request
    await prisma.$transaction(async (tx) => {
      // Re-verify balance within transaction
      const currentOwner = await tx.ownerProfile.findUnique({
        where: { id: owner.id },
        select: { walletBalance: true },
      });

      if (Number(currentOwner.walletBalance) < amount) {
        throw new Error("Insufficient wallet balance");
      }

      await tx.ownerProfile.update({
        where: { id: owner.id },
        data: { walletBalance: { decrement: amount } },
      });

      await tx.withdrawalRequest.create({
        data: {
          ownerId: owner.id,
          amount,
          bankDetails: {
            accountName: bankingDetails.accountName,
            accountNumber: bankingDetails.accountNumber,
            ifscCode: bankingDetails.ifscCode,
            bankName:
              bankingDetails.bankName ||
              (bankingDetails.payoutMode === "UPI"
                ? "UPI Transfer"
                : "Unknown Bank"),
            upiId: bankingDetails.upiId,
            payoutMode: bankingDetails.payoutMode,
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: `Withdrawal of Rs ${amount} initiated. Funds will reflect in 48-72 hours.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
