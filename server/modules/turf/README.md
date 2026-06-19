# Turf Module

## Overview

The Turf module manages sports ground registration, discovery, amenities, and owner-specific management.

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers (user, owner, admin).
- `turf.controller.js`: Logic for registration, search, and availability.
- `turf.validator.js`: Schemas for ground registration and updates.

## API Endpoints

All endpoints are mounted at `/api/turf`.

### User (Discovery)

- `GET /all`: Browse available grounds.
- `GET /locations`: List cities/areas with active grounds.
- `GET /details/:id`: Detailed ground profile.
- `GET /timeSlot`: Check availability for specific dates.

### Owner (Management)

- `POST /register`: Onboard a new ground (Requires images).
- `GET /all`: List grounds owned by the authenticated owner.
- `GET /:id/details`: View ground performance and slot statuses.
- `PUT /:id`: Update ground pricing or amenities.

### Admin (Global)

- `GET /all`: Global ground audit for platform administrators.

## Media Management

Ground registration supports multiple image uploads (max 10) via multipart/form-data.
