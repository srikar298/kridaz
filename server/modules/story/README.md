# Story Module

## Overview

The Story module provides 24-hour ephemeral media content, allowing users to share moments that disappear after a day.

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers (user, admin).
- `story.controller.js`: Logic for story creation, feed aggregation, and automatic expiry logic.
- `story.service.js`: (Planned) Logic for follower-based story discovery.

## API Endpoints

All endpoints are mounted at `/api/story`.

### User Flow

- `GET /feed`: View active stories from followed users and communities.
- `POST /upload-url`: Get pre-signed URL for background media upload.
- `POST /confirm-upload`: Register story after media is uploaded.
- `POST /:id/view`: Mark a story as read.
- `DELETE /:id`: Remove a story manually.

### Admin

- `GET /admin/all`: Audit all stories (including expired ones).
- `DELETE /admin/:id`: Force delete inappropriate content.

## Lifecycle

Stories are naturally short-lived. The feed only returns stories created within the last 24 hours.
