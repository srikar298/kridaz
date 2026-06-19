# Team Module

## Overview

The Team module handles team creation, squad management, invitations, and match challenges (rivalries).

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers.
- `team.controller.js`: Request handling.
- `team.service.js`: Business logic and database interactions.
- `team.validator.js`: Input validation schemas.

## API Endpoints

All endpoints are mounted at `/api/team`.

### Public

- `GET /all`: Discovery feed for teams.
- `GET /find-by-code/:code`: Search for a team by its unique alphanumeric code.
- `GET /:id`: Full team profile and squad details.

### User (Authenticated)

- `POST /`: Create a new team (Generates unique QR and Team Code).
- `GET /`: Get "My Teams" (Teams owned or joined).
- `POST /:id/invite`: Invite players to join your team.
- `POST /join/:token`: Join a team using an invite link.
- `POST /:id/request-opponent`: Challenge another team.
- `POST /:id/handle-opponent-request`: Accept or reject a challenge.

## Implementation Details

- **Team Code**: Unique 10-character alphanumeric ID used for quick search and joining.
- **QR Code**: Generated on team creation to allow players to scan and view the "Team Pass".
- **PostGIS**: Teams are indexed by location to allow nearby "Rival Discovery".
