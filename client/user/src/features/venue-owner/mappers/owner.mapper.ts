/**
 * @file owner.mapper.ts
 * @description Adapts raw partner profiles and dashboard details to structured, type-safe models matching database patterns.
 */

export interface IOwnerProfile {
  id: string;
  userId: string;
  businessName: string;
  verified: boolean;
  walletBalance: number;
  reservedBalance: number;
  pendingBalance: number;
  inProgressBalance: number;
  disputeBalance: number;
  withdrawnBalance: number;
  rating: number;
  numReviews: number;
  bio?: string;
  coachingLevel?: string;
  experience?: string;
  specialization?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class OwnerMapper {
  /**
   * Adapts a raw owner payload securely, resolving balances, ratings, and legacy field names.
   */
  public static toOwnerProfile(raw: any): IOwnerProfile {
    if (!raw) {
      throw new Error("OwnerMapper: Raw owner payload is required");
    }

    return {
      id: raw.id || raw._id || "",
      userId: raw.userId || raw.user?.id || "",
      businessName: raw.businessName || raw.companyName || "Unnamed Business",
      verified: Boolean(raw.verified),
      walletBalance:
        typeof raw.walletBalance === "number"
          ? raw.walletBalance
          : parseFloat(raw.walletBalance || raw.balance || 0),
      reservedBalance:
        typeof raw.reservedBalance === "number"
          ? raw.reservedBalance
          : parseFloat(raw.reservedBalance || 0),
      pendingBalance:
        typeof raw.pendingBalance === "number"
          ? raw.pendingBalance
          : parseFloat(raw.pendingBalance || 0),
      inProgressBalance:
        typeof raw.inProgressBalance === "number"
          ? raw.inProgressBalance
          : parseFloat(raw.inProgressBalance || 0),
      disputeBalance:
        typeof raw.disputeBalance === "number"
          ? raw.disputeBalance
          : parseFloat(raw.disputeBalance || 0),
      withdrawnBalance:
        typeof raw.withdrawnBalance === "number"
          ? raw.withdrawnBalance
          : parseFloat(raw.withdrawnBalance || 0),
      rating: raw.rating !== undefined ? Number(raw.rating) : 0,
      numReviews:
        raw.numReviews !== undefined
          ? Number(raw.numReviews)
          : raw.reviewsCount !== undefined
            ? Number(raw.reviewsCount)
            : 0,
      bio: raw.bio || undefined,
      coachingLevel: raw.coachingLevel || undefined,
      experience: raw.experience || undefined,
      specialization: raw.specialization || undefined,
      createdAt: raw.createdAt || undefined,
      updatedAt: raw.updatedAt || undefined,
    };
  }

  /**
   * Adapts a list of raw owner profiles.
   */
  public static toOwnerProfileList(rawArray: any[]): IOwnerProfile[] {
    if (!Array.isArray(rawArray)) {
      return [];
    }
    return rawArray.map((raw) => this.toOwnerProfile(raw));
  }
}
