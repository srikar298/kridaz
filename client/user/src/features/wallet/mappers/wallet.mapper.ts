/**
 * @file wallet.mapper.ts
 * @description Adapts raw ledger profiles, transaction streams, and wallet balances to structured contracts.
 */

import { Wallet, Transaction } from "../../../contracts/wallet.contract";

export class WalletMapper {
  /**
   * Adapts a raw transaction model with robust decimal and status normalizations.
   */
  public static toTransaction(raw: any): Transaction {
    if (!raw) {
      throw new Error("WalletMapper: Raw transaction payload is required");
    }

    return {
      id: raw.id || raw._id || "",
      walletId: raw.walletId || "",
      amount:
        typeof raw.amount === "number"
          ? raw.amount
          : parseFloat(raw.amount || 0),
      type: ["DEPOSIT", "WITHDRAW", "PAYMENT", "REFUND"].includes(
        raw.type?.toUpperCase()
      )
        ? (raw.type.toUpperCase() as any)
        : "DEPOSIT",
      status: ["PENDING", "SUCCESS", "FAILED"].includes(
        raw.status?.toUpperCase()
      )
        ? (raw.status.toUpperCase() as any)
        : "PENDING",
      description: raw.description || undefined,
      createdAt: raw.createdAt || new Date().toISOString(),
    };
  }

  /**
   * Adapts a raw wallet model with balance safeguards and nested transaction mappings.
   */
  public static toWallet(raw: any): Wallet {
    if (!raw) {
      throw new Error("WalletMapper: Raw wallet payload is required");
    }

    const rawTxns = Array.isArray(raw.transactions) ? raw.transactions : [];

    return {
      id: raw.id || raw._id || "",
      userId: raw.userId || "",
      balance:
        typeof raw.balance === "number"
          ? raw.balance
          : parseFloat(raw.balance || raw.walletBalance || 0),
      currency: raw.currency || "INR",
      transactions: rawTxns.map((t: any) => this.toTransaction(t)),
    };
  }
}
