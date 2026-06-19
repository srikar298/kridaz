/**
 * @file turf.mapper.ts
 * @description Adapts raw backend turf responses and payloads to standard Turf contract models.
 * Ensures consistent usage of data fields across the application.
 */

import { Turf } from "../../../contracts/turf.contract";

export class TurfMapper {
  /**
   * Adapts raw turf data from backend schema/API response to client-side Turf model.
   * Handles price conversion, rating/reviews safety, and list fallback values.
   */
  public static toClientModel(raw: any): Turf {
    if (!raw) {
      throw new Error("TurfMapper: Raw turf payload is required");
    }

    return {
      id: raw.id || raw._id || "",
      name: raw.name || "Unnamed Turf",
      location: raw.location || raw.address || "",
      price:
        typeof raw.price === "number"
          ? raw.price
          : parseFloat(raw.price || raw.pricePerHour || 0),
      rating: raw.rating !== undefined ? Number(raw.rating) : undefined,
      reviewsCount:
        raw.reviewsCount !== undefined ? Number(raw.reviewsCount) : undefined,
      images: Array.isArray(raw.images)
        ? raw.images
        : raw.image
          ? [raw.image]
          : [],
      sports: Array.isArray(raw.sports)
        ? raw.sports
        : Array.isArray(raw.sportTypes)
          ? raw.sportTypes
          : [],
      status: ["APPROVED", "PENDING", "REJECTED"].includes(raw.status)
        ? raw.status
        : "PENDING",
      createdAt: raw.createdAt || undefined,
      updatedAt: raw.updatedAt || undefined,
    };
  }

  /**
   * Adapts an array of raw turf responses.
   */
  public static toClientList(rawArray: any[]): Turf[] {
    if (!Array.isArray(rawArray)) {
      return [];
    }
    return rawArray.map((raw) => this.toClientModel(raw));
  }
}
