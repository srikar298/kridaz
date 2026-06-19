/**
 * @file reels.mapper.ts
 * @description Adapts reel data packages between backend payloads and client reels contracts.
 */

import { Reel } from "../../../contracts/reels.contract";

export class ReelsMapper {
  /**
   * Adapts a raw backend Reel object to the client-side Reel structure, mapping legacy properties.
   */
  public static toReel(raw: any): Reel {
    if (!raw) {
      throw new Error("ReelsMapper: Raw reel payload is required");
    }

    return {
      id: raw.id || raw._id || "",
      videoUrl: raw.videoUrl || raw.rawVideoUrl || raw.hlsUrl || "",
      thumbnailUrl: raw.thumbnailUrl || undefined,
      title: raw.title || raw.caption || "Untitled Reel",
      description: raw.description || raw.caption || undefined,
      userId: raw.userId || raw.creatorId || "",
      likesCount:
        raw.likesCount !== undefined
          ? Number(raw.likesCount)
          : raw.likes !== undefined
            ? Number(raw.likes)
            : 0,
      commentsCount:
        raw.commentsCount !== undefined
          ? Number(raw.commentsCount)
          : raw.comments !== undefined
            ? Number(raw.comments)
            : 0,
      viewsCount:
        raw.viewsCount !== undefined
          ? Number(raw.viewsCount)
          : raw.views !== undefined
            ? Number(raw.views)
            : 0,
      tags: Array.isArray(raw.tags)
        ? raw.tags
        : Array.isArray(raw.hashtags)
          ? raw.hashtags
          : [],
      createdAt: raw.createdAt || undefined,
    };
  }

  /**
   * Adapts a collection of raw Reels.
   */
  public static toReelList(rawArray: any[]): Reel[] {
    if (!Array.isArray(rawArray)) {
      return [];
    }
    return rawArray.map((raw) => this.toReel(raw));
  }
}
