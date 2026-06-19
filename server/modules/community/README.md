# Community Module

## Overview

The Community module handles the social feed, user posts, stories, and interactions (likes/comments).

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers.
- `community.controller.js`: Logic for posts, comments, and activity tracking.
- `community.validator.js`: Validation for post creation and commenting.

## API Endpoints

All endpoints are mounted at `/api/community`.

### Feed & Stats

- `GET /`: Paginated list of all community posts.
- `GET /stats`: Global community metrics.
- `GET /user-posts/:targetUserId`: Specific user's post history.
- `GET /user-stories/:targetUserId`: Specific user's active stories.

### User Actions (Authenticated)

- `POST /`: Create a post (Supports direct multipart upload).
- `GET /upload-url`: Get pre-signed URL for background media upload.
- `POST /confirm-post`: Finalize post after background upload.
- `POST /:id/like`: Toggle like on a post.
- `POST /:id/comment`: Add a comment to a post.
- `GET /my-activity`: History of current user's interactions.

## Media Flow

1. **Direct Upload**: Simple multipart/form-data for images.
2. **Background Upload**: Recommended for large videos/images. Uses `upload-url` -> `confirm-post` flow.
