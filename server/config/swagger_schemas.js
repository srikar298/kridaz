// swagger_schemas.js
// Source of truth: keep in sync with server/prisma/schema.prisma
// Last synced: 2026-05-17

// ── IDENTITY & PROFILES ────────────────────────────────────────────────────────

export const UserSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    username: { type: "string" },
    name: { type: "string" },
    role: {
      type: "string",
      enum: ["USER", "OWNER", "ADMIN", "UMPIRE", "COACH", "SCORER", "STREAMER"],
    },
    profilePicture: { type: "string", nullable: true },
    avatar: { type: "string", nullable: true },
    phone: { type: "string", nullable: true },
    city: { type: "string", nullable: true },
    state: { type: "string", nullable: true },
    walletBalance: { type: "number" },
    status: { type: "string", enum: ["active", "blocked"] },
    isVerified: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const OwnerSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    businessName: { type: "string" },
    verified: { type: "boolean" },
    walletBalance: { type: "number" },
    rating: { type: "number" },
    numReviews: { type: "integer" },
  },
};

// ── TURF ──────────────────────────────────────────────────────────────────────

export const TurfSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    ownerId: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
    location: { type: "string" },
    city: { type: "string" },
    state: { type: "string" },
    image: { type: "string" },
    images: { type: "array", items: { type: "string" } },
    sportTypes: { type: "array", items: { type: "string" } },
    pricePerHour: { type: "number" },
    openTime: { type: "string" },
    closeTime: { type: "string" },
    isActive: { type: "boolean" },
    slug: { type: "string", nullable: true },
    status: { type: "string", enum: ["pending", "approved", "rejected"] },
  },
};

// ── BOOKING & WALLET ──────────────────────────────────────────────────────────

export const BookingSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    turfId: { type: "string", format: "uuid" },
    timeSlotId: { type: "string", format: "uuid", nullable: true },
    totalPrice: { type: "number" },
    paidAmount: { type: "number" },
    balanceAmount: { type: "number" },
    advanceAmount: { type: "number" },
    platformFee: { type: "number" },
    gstAmount: { type: "number" },
    ownerRevenue: { type: "number" },
    status: {
      type: "string",
      // Matches BookingStatus enum in schema.prisma
      enum: [
        "PENDING",
        "CONFIRMED",
        "PLAYING",
        "IN_REVIEW_WINDOW",
        "COMPLETED",
        "CANCELLED",
        "DISPUTED",
      ],
    },
    revenueStatus: {
      type: "string",
      enum: ["PENDING", "IN_PROGRESS", "SETTLED", "FROZEN", "REFUNDED"],
    },
    paymentStatus: { type: "string", nullable: true },
    paymentMethod: { type: "string", nullable: true },
    paymentType: { type: "string", enum: ["PARTIAL", "FULL"] },
    orderId: { type: "string", nullable: true },
    playStartTime: { type: "string", format: "date-time", nullable: true },
    playEndTime: { type: "string", format: "date-time", nullable: true },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const WalletTransactionSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    amount: { type: "number" },
    type: { type: "string", enum: ["TOPUP", "DEBIT", "REFUND", "OFFER"] },
    status: {
      type: "string",
      enum: ["PENDING", "SUCCESS", "FAILED", "RESERVED"],
    },
    description: { type: "string", nullable: true },
    razorpayOrderId: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
  },
};

// ── FEED & MEDIA ──────────────────────────────────────────────────────────────

export const ReelSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    // FK is creatorId, not userId — synced with schema.prisma
    creatorId: { type: "string", format: "uuid" },
    caption: { type: "string", nullable: true },
    hashtags: { type: "array", items: { type: "string" } },
    rawVideoUrl: { type: "string", nullable: true },
    hlsUrl: { type: "string", nullable: true },
    thumbnailUrl: { type: "string", nullable: true },
    aspectRatio: { type: "number" },
    duration: { type: "number", nullable: true },
    status: {
      type: "string",
      enum: ["pending", "processing", "ready", "failed"],
    },
    isPrivate: { type: "boolean" },
    views: { type: "integer" },
    likes: { type: "integer" },
    shares: { type: "integer" },
    comments: { type: "integer" },
    completionCount: { type: "integer" },
    avgWatchTime: { type: "number" },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const StorySchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    mediaUrl: { type: "string", nullable: true },
    hlsUrl: { type: "string", nullable: true },
    rawMediaUrl: { type: "string", nullable: true },
    placeholder: { type: "string", nullable: true },
    content: { type: "string", nullable: true },
    mediaType: { type: "string", enum: ["image", "video", "text"] },
    status: { type: "string", enum: ["pending", "ready", "failed"] },
    durationDays: { type: "integer" },
    expiresAt: { type: "string", format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
  },
};

// Community posts are backed by the `Post` model (authorId is the creator FK)
export const PostSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    // schema.prisma maps `creatorId` column to `authorId` relation field
    authorId: { type: "string", format: "uuid" },
    title: { type: "string", nullable: true },
    content: { type: "string", nullable: true },
    mediaType: { type: "string", enum: ["image", "video", "text"] },
    mediaUrls: { type: "array", items: { type: "string" } },
    placeholder: { type: "string", nullable: true },
    hashtags: { type: "array", items: { type: "string" } },
    status: {
      type: "string",
      enum: ["pending", "processing", "ready", "failed"],
    },
    createdAt: { type: "string", format: "date-time" },
  },
};

// Alias kept for backwards API compatibility
export const CommunityPostSchema = PostSchema;

export const CommunityCommentSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    postId: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    content: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
};

// ── TEAM ──────────────────────────────────────────────────────────────────────

export const TeamSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: "string", nullable: true },
    teamCode: { type: "string", nullable: true },
    logo: { type: "string", nullable: true },
    image: { type: "string", nullable: true },
    ownerId: { type: "string", format: "uuid" },
    city: { type: "string", nullable: true },
    sportType: { type: "string" },
    visibility: { type: "string", enum: ["PUBLIC", "PRIVATE"] },
    captainName: { type: "string", nullable: true },
    captainPhone: { type: "string", nullable: true },
    qrCode: { type: "string", nullable: true },
    memberCount: { type: "integer" },
    matchesPlayed: { type: "integer" },
    totalScore: { type: "integer" },
    createdAt: { type: "string", format: "date-time" },
  },
};

// ── GAME & PROFESSIONALS ──────────────────────────────────────────────────────

export const HostedGameSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    hostId: { type: "string", format: "uuid" },
    turfId: { type: "string", format: "uuid", nullable: true },
    sportType: { type: "string" },
    date: { type: "string", format: "date" },
    time: { type: "string" },
    totalPlayers: { type: "integer" },
    joinedPlayers: { type: "integer" },
    pricePerPlayer: { type: "number" },
    status: {
      type: "string",
      enum: [
        "open",
        "full",
        "cancelled",
        "completed",
        "LIVE",
        "COMPLETED",
        "ENDED",
      ],
    },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const ProfessionalSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["COACH", "REFEREE", "SCORER", "STREAMER"] },
    bio: { type: "string" },
    experience: { type: "integer" },
    rating: { type: "number" },
    verified: { type: "boolean" },
  },
};

export const DisputeSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    bookingId: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    reason: { type: "string" },
    description: { type: "string" },
    status: { type: "string", enum: ["PENDING", "RESOLVED", "REJECTED"] },
    createdAt: { type: "string", format: "date-time" },
  },
};

// ── NOTIFICATIONS (previously missing from Swagger) ───────────────────────────

export const NotificationSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    title: { type: "string" },
    message: { type: "string" },
    type: { type: "string", nullable: true },
    link: { type: "string", nullable: true },
    isRead: { type: "boolean" },
    metadata: { type: "object", nullable: true },
    createdAt: { type: "string", format: "date-time" },
  },
};

// ── CHAT & MESSAGING ──────────────────────────────────────────────────────────

export const MessageSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    chatId: { type: "string", format: "uuid" },
    senderId: { type: "string", format: "uuid" },
    content: { type: "string" },
    type: { type: "string", enum: ["TEXT", "IMAGE", "VIDEO", "FILE"] },
    createdAt: { type: "string", format: "date-time" },
  },
};

export const ChatSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["DIRECT", "GROUP"] },
    name: { type: "string", nullable: true },
    lastMessageId: { type: "string", format: "uuid", nullable: true },
    createdAt: { type: "string", format: "date-time" },
  },
};

// ── SHARED RESPONSE WRAPPERS ──────────────────────────────────────────────────

export const ErrorResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string" },
    error: { type: "string", nullable: true },
  },
};

export const PaginatedResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    data: { type: "array", items: { type: "object" } },
    pagination: {
      type: "object",
      properties: {
        total: { type: "integer" },
        page: { type: "integer" },
        limit: { type: "integer" },
        pages: { type: "integer" },
      },
    },
  },
};
