# Auth Module

## Overview

The Auth module handles user registration, multi-step login (Email/OTP), Google OAuth, and profile management.

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers (currently `user`).
- `auth.controller.js`: Logic for registration, login, and profile updates.
- `auth.validator.js`: Joi/Zod schemas for request validation.
- `auth.service.js`: (Planned) Logic for token generation and OTP dispatch.

## API Endpoints

Mounted at `/api/auth` (and `/api/user/auth` for legacy frontend support).

### Registration & Login

- `POST /send-otp`: Dispatches verification codes.
- `POST /register`: Creates a new user identity.
- `POST /login-step1`: Primary credential check.
- `POST /login`: Finalize login with OTP if required.
- `POST /google-auth`: Social login entry point.

### Session & Profile

- `GET /getMe`: Returns the active user's context.
- `POST /logout`: Invalidate session.
- `PUT /updateProfile`: Modify user attributes.
- `GET /check-username`: Verify ID availability during onboarding.

## Security

- **Rate Limiting**: Applied to OTP and Login attempts via `middleware/rateLimiter.middleware.js`.
- **Bot Defense**: Google Turnstile verification is required for sensitive entry points.
- **Tokens**: Uses JWT with HTTP-only cookies and Bearer token fallback.
