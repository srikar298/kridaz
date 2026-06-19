# Blog Module

## Overview

The Blog module serves sports-related articles, news updates, and community highlights to Kridaz users.

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers (currently `user`).
- `blog.controller.js`: Logic for retrieving blog lists and detailed content.

## API Endpoints

Mounted at `/api/blog` (and `/api/user/blogs` for legacy frontend support).

### User Actions

- `GET /`: Retrieve a list of all active blog posts.
- `GET /:id`: View the full content of a specific blog.
- `POST /:id/like`: Record user engagement on an article.

## Roadmap

- **Admin Flow**: Add endpoints for creating and editing blogs via `routes/admin.routes.js`.
- **Search**: Implement full-text search across article titles and content.
