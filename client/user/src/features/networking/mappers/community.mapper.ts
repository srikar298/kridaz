/**
 * @file community.mapper.ts
 * @description Adapts social media posts, stories, and comments to structure-guaranteed contract interfaces.
 */

import {
  CommunityPost,
  CommunityStory,
} from "../../../contracts/community.contract";

export class CommunityMapper {
  /**
   * Adapts raw post objects securely, supporting complex nested author shapes and legacy image/video fields.
   */
  public static toCommunityPost(raw: any): CommunityPost {
    if (!raw) {
      throw new Error("CommunityMapper: Raw post payload is required");
    }

    return {
      id: raw.id || raw._id || "",
      title: raw.title || raw.caption || "Community Post",
      content: raw.content || undefined,
      mediaUrl:
        raw.mediaUrl ||
        (Array.isArray(raw.mediaUrls) && raw.mediaUrls.length > 0
          ? raw.mediaUrls[0]
          : undefined),
      mediaType: ["IMAGE", "VIDEO"].includes(raw.mediaType?.toUpperCase())
        ? (raw.mediaType.toUpperCase() as any)
        : raw.mediaType
          ? "IMAGE"
          : undefined,
      mediaStatus: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"].includes(
        raw.mediaStatus?.toUpperCase()
      )
        ? (raw.mediaStatus.toUpperCase() as any)
        : "COMPLETED",
      authorId: raw.authorId || raw.creatorId || "",
      authorName: raw.authorName || raw.author?.name || "Anonymous",
      authorPicture:
        raw.authorPicture || raw.author?.profilePicture || undefined,
      likesCount:
        raw.likesCount !== undefined
          ? Number(raw.likesCount)
          : Array.isArray(raw.likes)
            ? raw.likes.length
            : 0,
      commentsCount:
        raw.commentsCount !== undefined
          ? Number(raw.commentsCount)
          : Array.isArray(raw.comments)
            ? raw.comments.length
            : 0,
      createdAt: raw.createdAt || new Date().toISOString(),
    };
  }

  /**
   * Adapts raw story models with status safeguards and temporal expiry.
   */
  public static toCommunityStory(raw: any): CommunityStory {
    if (!raw) {
      throw new Error("CommunityMapper: Raw story payload is required");
    }

    return {
      id: raw.id || raw._id || "",
      mediaUrl: raw.mediaUrl || raw.rawMediaUrl || raw.hlsUrl || "",
      mediaType: ["IMAGE", "VIDEO"].includes(raw.mediaType?.toUpperCase())
        ? (raw.mediaType.toUpperCase() as any)
        : "IMAGE",
      mediaStatus: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"].includes(
        raw.mediaStatus?.toUpperCase()
      )
        ? (raw.mediaStatus.toUpperCase() as any)
        : "PENDING",
      authorId: raw.authorId || raw.userId || "",
      authorName: raw.authorName || raw.user?.name || "Anonymous",
      authorPicture: raw.authorPicture || raw.user?.profilePicture || undefined,
      expiresAt:
        raw.expiresAt ||
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: raw.createdAt || new Date().toISOString(),
    };
  }

  /**
   * Adapts a list of raw posts.
   */
  public static toPostList(rawArray: any[]): CommunityPost[] {
    if (!Array.isArray(rawArray)) {
      return [];
    }
    return rawArray.map((raw) => this.toCommunityPost(raw));
  }

  /**
   * Adapts a list of raw stories.
   */
  public static toStoryList(rawArray: any[]): CommunityStory[] {
    if (!Array.isArray(rawArray)) {
      return [];
    }
    return rawArray.map((raw) => this.toCommunityStory(raw));
  }
}
