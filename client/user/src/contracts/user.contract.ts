/**
 * @file user.contract.ts
 * @description Standard TypeScript contract interface representing User entities and identity states in Kridaz/BookMySportz.
 * Adheres to low-level design (LLD) specifications and role-based access control (RBAC).
 */

export type UserRole =
  // Platform Level Roles
  | "BMSP_SUPER_ADMIN"
  | "BMSP_ADMIN"
  | "BMSP_FINANCE_ADMIN"
  | "BMSP_VENUES_ADMIN"
  | "BMSP_REGIONAL_VENUES_ADMIN"
  | "BMSP_BOOKINGS_ADMIN"
  | "BMSP_CUSTOMER_CARE"
  // Venue Level Roles
  | "VENUE_OWNER"
  | "SECONDARY_VENUE_NAME_MANAGER"
  | "VENUE_OPERATIONS_MANAGER"
  | "VENUE_BOOKING_MANAGER"
  // Standard Client Level Roles
  | "USER"
  // System Internal Roles
  | "SYSTEM"
  | "ANONYMOUS";

export interface IUserProfile {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  profilePicture?: string;
  location?: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthUserContract {
  success: boolean;
  user: IUserProfile;
  role: UserRole;
  token?: string;
  following?: string[];
}

export interface INetworkResponse {
  success: boolean;
  following: Array<{
    _id: string;
    name: string;
    profilePicture?: string;
  }>;
}
