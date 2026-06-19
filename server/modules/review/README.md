# Review Module

## Overview

The Review module handles user ratings and feedback for Turfs (venues), contributing to reputation scores and helping other users discover quality venues.

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers (currently `user`).
- `review.controller.js`: Logic for submitting and fetching venue reviews.

## API Endpoints

Mounted at `/api/review` (and `/api/user/review` for legacy frontend compatibility).

### User Actions

- `GET /:id`: Retrieve a paginated list of reviews for a specific turf (by turf ID).
- `POST /:id`: Submit a new review and rating for a specific turf.

## Roadmap

- **Owner Flow**: Add an owner dashboard route to allow turf managers to reply to user reviews.
- **Moderation**: Implement an admin route to flag and remove inappropriate reviews.
