import swaggerJsdoc from "swagger-jsdoc";
import * as schemas from "./swagger_schemas.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Kridaz API Documentation",
      version: "1.0.0",
      description:
        "Complete API reference for Kridaz - Sports Venue Booking & Social Platform",
      contact: {
        name: "Kridaz Support",
        url: "https://kridaz.com",
        email: "support@kridaz.com",
      },
    },
    servers: [
      {
        url: "http://localhost:6001/api",
        description: "Development server",
      },
      {
        url: "https://prod-api.kridaz.com/api",
        description: "Production server (Railway)",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        CookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "auth_token",
        },
      },
      schemas: {
        User: schemas.UserSchema,
        Owner: schemas.OwnerSchema,
        Turf: schemas.TurfSchema,
        Booking: schemas.BookingSchema,
        Reel: schemas.ReelSchema,
        Message: schemas.MessageSchema,
        Chat: schemas.ChatSchema,
        WalletTransaction: schemas.WalletTransactionSchema,
        CommunityPost: schemas.CommunityPostSchema,
        CommunityComment: schemas.CommunityCommentSchema,
        Story: schemas.StorySchema,
        Team: schemas.TeamSchema,
        HostedGame: schemas.HostedGameSchema,
        Professional: schemas.ProfessionalSchema,
        Dispute: schemas.DisputeSchema,
        ErrorResponse: schemas.ErrorResponseSchema,
        PaginatedResponse: schemas.PaginatedResponseSchema,
      },
    },
    tags: [
      { name: "Auth", description: "Authentication & User Profiles" },
      { name: "Booking", description: "Venue & Match Bookings" },
      { name: "Payment", description: "Razorpay Payments & Transactions" },
      { name: "Wallet", description: "User Wallet & Credits" },
      { name: "Reels", description: "Short-form Video Feed" },
      { name: "Turf", description: "Sports Venues & Field Management" },
      { name: "Owner", description: "Venue Owner Operations" },
      { name: "Admin", description: "Platform Administration" },
      { name: "Player", description: "Player Profiles & Leaderboards" },
      { name: "Team", description: "Team Management" },
      { name: "Story", description: "User Stories" },
      { name: "Chat", description: "Messaging & Conversations" },
      { name: "Community", description: "Social Feed & Posts" },
      { name: "Scoring", description: "Live Match Scoring" },
      { name: "YouTube", description: "YouTube Live Streaming Integration" },
      { name: "Facebook", description: "Facebook Social Integration" },
      { name: "Notification", description: "System Notifications" },
      { name: "Dispute", description: "Booking & Transaction Disputes" },
      { name: "HostedGame", description: "Public Hosted Games" },
      { name: "Professional", description: "Professional Sports Services" },
      { name: "Marketing", description: "Marketing Campaigns" },
      { name: "Feature", description: "Platform Feature Management" },
      { name: "Blog", description: "CMS & Blogs" },
      { name: "Upload", description: "Media Upload Utilities" },
    ],
  },
  apis: ["./routes/*.js", "./routes/**/*.js", "./modules/**/*.routes.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
