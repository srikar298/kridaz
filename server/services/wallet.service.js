import { prisma } from "../config/prisma.js";

/**
 * Wallet Service
 * Handles wallet operations for both Users (normalized) and Owners (relational)
 */
class WalletService {
  /**
   * Get target account profile (User or OwnerProfile) based on role
   */
  async getAccountProfile(userId, role, ownerId, tx) {
    const client = tx || prisma;
    const userIdStr = userId ? userId.toString() : "";

    if (role?.toLowerCase() === "user") {
      return await client.user.findUnique({
        where: { id: userIdStr },
        select: { id: true, role: true },
      });
    } else {
      const ownerIdStr = ownerId ? ownerId.toString() : "";
      return await client.ownerProfile.findFirst({
        where: {
          OR: [{ id: ownerIdStr }, { userId: userIdStr }],
        },
      });
    }
  }

  /**
   * Get wallet balance for a user or owner
   */
  async getWallet(userId, role, tx) {
    const userIdStr = userId.toString();
    const client = tx || prisma;

    if (role?.toLowerCase() === "user") {
      const wallet = await client.wallet.findUnique({
        where: { userId: userIdStr },
      });

      if (!wallet) {
        return {
          balance: 0,
          reservedBalance: 0,
          pendingBalance: 0,
          usableBalance: 0,
        };
      }

      return {
        balance: Number(wallet.balance),
        reservedBalance: Number(wallet.reservedBalance),
        pendingBalance: 0,
        usableBalance: Number(wallet.balance) - Number(wallet.reservedBalance),
      };
    } else {
      // Owner logic - check OwnerProfile
      const owner = await client.ownerProfile.findFirst({
        where: {
          OR: [{ id: userIdStr }, { userId: userIdStr }],
        },
      });

      if (!owner)
        return {
          balance: 0,
          reservedBalance: 0,
          pendingBalance: 0,
          usableBalance: 0,
        };

      return {
        balance: Number(owner.walletBalance || 0),
        reservedBalance: Number(owner.reservedBalance || 0),
        pendingBalance: Number(owner.pendingBalance || 0),
        inProgressBalance: Number(owner.inProgressBalance || 0),
        disputeBalance: Number(owner.disputeBalance || 0),
        usableBalance:
          Number(owner.walletBalance || 0) - Number(owner.reservedBalance || 0),
      };
    }
  }

  /**
   * Get usable balance (balance - reserved)
   */
  async getUsableBalance(userId, role = "user", tx) {
    const wallet = await this.getWallet(userId, role, tx);
    return wallet.usableBalance;
  }

  /**
   * Increment balance (Credit)
   */
  async credit(userId, role, amount, tx) {
    const userIdStr = userId.toString();
    const amountVal = Number(amount);
    const client = tx || prisma;

    if (role?.toLowerCase() === "user") {
      const wallet = await client.wallet.upsert({
        where: { userId: userIdStr },
        update: { balance: { increment: amountVal } },
        create: { userId: userIdStr, balance: amountVal, reservedBalance: 0 },
      });

      return Number(wallet.balance);
    } else {
      await client.ownerProfile.updateMany({
        where: {
          OR: [{ id: userIdStr }, { userId: userIdStr }],
        },
        data: { walletBalance: { increment: amountVal } },
      });

      const updatedOwner = await client.ownerProfile.findFirst({
        where: {
          OR: [{ id: userIdStr }, { userId: userIdStr }],
        },
      });
      return Number(updatedOwner?.walletBalance || 0);
    }
  }

  /**
   * Decrement balance (Debit)
   */
  async debit(userId, role, amount, tx) {
    const userIdStr = userId.toString();
    const amountVal = Number(amount);

    const operation = async (t) => {
      if (role?.toLowerCase() === "user") {
        const rows = await t.$queryRaw`SELECT id, balance, "reservedBalance" FROM "Wallet" WHERE "userId" = ${userIdStr} FOR UPDATE`;
        if (!rows || rows.length === 0) throw new Error("Insufficient balance or wallet not found");
        
        const wallet = rows[0];
        const usable = Number(wallet.balance) - Number(wallet.reservedBalance);
        if (usable < amountVal) throw new Error("Insufficient usable balance");

        const updated = await t.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: amountVal } },
        });
        return Number(updated.balance);
      } else {
        const rows = await t.$queryRaw`SELECT id, "walletBalance", "reservedBalance" FROM "OwnerProfile" WHERE ("id" = ${userIdStr} OR "userId" = ${userIdStr}) FOR UPDATE`;
        if (!rows || rows.length === 0) throw new Error("Owner profile not found");
        
        const owner = rows[0];
        const usable = Number(owner.walletBalance) - Number(owner.reservedBalance);
        if (usable < amountVal) throw new Error("Insufficient usable balance");

        const updated = await t.ownerProfile.update({
          where: { id: owner.id },
          data: { walletBalance: { decrement: amountVal } },
        });
        return Number(updated.walletBalance);
      }
    };

    const result = tx ? await operation(tx) : await prisma.$transaction(operation);
    return result;
  }

  /**
   * Reserve balance
   */
  async reserve(userId, role, amount, tx) {
    const userIdStr = userId.toString();
    const amountVal = Number(amount);

    const operation = async (t) => {
      if (role?.toLowerCase() === "user") {
        const rows = await t.$queryRaw`SELECT id, balance, "reservedBalance" FROM "Wallet" WHERE "userId" = ${userIdStr} FOR UPDATE`;
        if (!rows || rows.length === 0) throw new Error("Insufficient usable balance");
        
        const wallet = rows[0];
        const usable = Number(wallet.balance) - Number(wallet.reservedBalance);
        if (usable < amountVal) throw new Error("Insufficient usable balance");

        const updated = await t.wallet.update({
          where: { id: wallet.id },
          data: { reservedBalance: { increment: amountVal } },
        });
        return Number(updated.reservedBalance);
      } else {
        const rows = await t.$queryRaw`SELECT id, "walletBalance", "reservedBalance" FROM "OwnerProfile" WHERE ("id" = ${userIdStr} OR "userId" = ${userIdStr}) FOR UPDATE`;
        if (!rows || rows.length === 0) throw new Error("Owner profile not found");
        
        const owner = rows[0];
        const usable = Number(owner.walletBalance) - Number(owner.reservedBalance);
        if (usable < amountVal) throw new Error("Insufficient usable balance");

        const updated = await t.ownerProfile.update({
          where: { id: owner.id },
          data: { reservedBalance: { increment: amountVal } },
        });
        return Number(updated.reservedBalance);
      }
    };

    const result = tx ? await operation(tx) : await prisma.$transaction(operation);
    return result;
  }

  /**
   * Release reserved balance
   */
  async release(userId, role, amount, shouldDebit = false, tx) {
    const userIdStr = userId.toString();
    const amountVal = Number(amount);

    const operation = async (t) => {
      if (role?.toLowerCase() === "user") {
        const rows = await t.$queryRaw`SELECT id, "reservedBalance" FROM "Wallet" WHERE "userId" = ${userIdStr} FOR UPDATE`;
        if (!rows || rows.length === 0) throw new Error("Wallet not found");
        
        const wallet = rows[0];
        if (Number(wallet.reservedBalance) < amountVal) {
          throw new Error("Release amount exceeds reserved balance");
        }

        const updated = await t.wallet.update({
          where: { id: wallet.id },
          data: {
            reservedBalance: { decrement: amountVal },
            balance: shouldDebit ? { decrement: amountVal } : undefined,
          },
        });
        return Number(updated.reservedBalance);
      } else {
        const rows = await t.$queryRaw`SELECT id, "reservedBalance" FROM "OwnerProfile" WHERE ("id" = ${userIdStr} OR "userId" = ${userIdStr}) FOR UPDATE`;
        if (!rows || rows.length === 0) throw new Error("Owner profile not found");
        
        const owner = rows[0];
        if (Number(owner.reservedBalance) < amountVal) {
          throw new Error("Release amount exceeds reserved balance");
        }

        const updated = await t.ownerProfile.update({
          where: { id: owner.id },
          data: {
            reservedBalance: { decrement: amountVal },
            walletBalance: shouldDebit ? { decrement: amountVal } : undefined,
          },
        });
        return Number(updated.reservedBalance);
      }
    };

    const result = tx ? await operation(tx) : await prisma.$transaction(operation);
    return result;
  }
}

export default new WalletService();
