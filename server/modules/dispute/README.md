# Dispute Module

## Overview

The Dispute module provides ticket management and customer support functionalities, allowing users to raise and track issues related to bookings, payments, and platform usage.

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers (currently `user`).
- `dispute.controller.js`: Logic for managing tickets and conversations.
- `dispute.validator.js`: Joi/Zod schemas for request validation.

## API Endpoints

Mounted at `/api/dispute` (and `/api/user/dispute` for legacy support).

### User Actions

- `GET /`: Retrieve all disputes raised by the current user.
- `POST /raise`: Create a new dispute ticket (requires subject, description, and optional booking reference).
- `GET /:disputeId`: Fetch the full thread and status of a specific dispute.
- `POST /:disputeId/reply`: Add a new message to an existing dispute thread.

## Roadmap

- **Admin Flow**: Develop an admin dashboard route to allow support agents to view, reply to, and resolve disputes.
- **Attachments**: Enable file uploads (screenshots, receipts) for dispute evidence.
