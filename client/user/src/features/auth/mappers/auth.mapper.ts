/**
 * @file auth.mapper.ts
 * @description Authentication data mapper adapting backend payload schemas to normalized client models.
 * Ensures domain models remain decoupled from backend-specific serialization.
 */

import {
  IUserProfile,
  IAuthUserContract,
} from "../../../contracts/user.contract";

export class AuthMapper {
  /**
   * Adapts backend user data to standard client IUserProfile interface.
   * Resolves ID naming variations (e.g. _id vs id) and guarantees safe fallback values.
   */
  public static toUserProfile(raw: any): IUserProfile {
    if (!raw) {
      throw new Error("AuthMapper: Raw user payload is required");
    }

    return {
      id: raw.id || raw._id || "",
      name: raw.name || raw.fullName || "User",
      fullName: raw.fullName || raw.name || "",
      email: raw.email || "",
      phoneNumber: raw.phoneNumber || "",
      profilePicture: raw.profilePicture || "",
      location: raw.location || "",
      role: raw.role || "USER",
      isVerified: Boolean(raw.isVerified),
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Adapts standard auth API contract responses into local identity states.
   */
  public static toIdentityState(response: IAuthUserContract): {
    user: IUserProfile | null;
    role: string | null;
    isLoggedIn: boolean;
  } {
    if (!response || !response.success || !response.user) {
      return {
        user: null,
        role: null,
        isLoggedIn: false,
      };
    }

    return {
      user: this.toUserProfile(response.user),
      role: response.role,
      isLoggedIn: true,
    };
  }
}
