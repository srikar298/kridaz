# Reels Module

## Overview

The Reels module provides a short-form video experience, including upload, feed discovery, interactions (likes/views), and creator analytics.

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers.
- `reels.controller.js`: Request handling and interaction logic.
- `reels.validator.js`: Input validation for interactions and uploads.

## API Endpoints

All endpoints are mounted at `/api/reels`.

### Feed & Discovery

- `GET /feed`: Main paginated reels feed (Supports optional auth).
- `GET /recommended`: Trending and curated reels.
- `POST /:reelId/heartbeat`: Analytics tracking for watch time.

### Creator Flow

- `GET /upload-url`: Get an R2 pre-signed URL for direct video upload.
- `POST /confirm-upload`: Register the reel in the database after R2 upload completes.
- `GET /analytics`: Detailed performance metrics for the creator's reels.
- `DELETE /:reelId`: Remove a reel (Creator or Admin only).

### Social Interactions

- `POST /:reelId/interact`: Like/View interactions.
- `POST /:reelId/comment`: Post a comment on a reel.

## Performance Notes

- **Direct Upload**: Uses R2 pre-signed URLs to offload video traffic from the Node.js server.
- **Heartbeats**: Essential for feeding the recommendation engine with retention data.
