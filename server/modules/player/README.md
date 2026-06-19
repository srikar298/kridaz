# Player Module

## Overview

The Player module focuses on user profiles, discovery (search/nearby), and social networking (following/followers).

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers.
- `player.controller.js`: Business logic for networking and profile management.
- `player.service.js`: (Planned) Data fetching for complex graph relations.

## API Endpoints

All endpoints are mounted at `/api/player`.

### Discovery

- `GET /search`: Search players by name/location.
- `GET /nearby`: Find players within proximity (Requires location data).
- `POST /location`: Update user's latitude/longitude.

### Profile & Social

- `GET /:id`: Public profile view.
- `POST /:id/follow`: Follow a player.
- `POST /:id/unfollow`: Unfollow a player.
- `GET /network`: Current user's social connections.
- `GET /:id/network`: Target player's social connections.

## Security

- Discovery/Profile: Publicly accessible or protected by basic auth.
- Network actions: Strictly requires `userAuth` middleware.
