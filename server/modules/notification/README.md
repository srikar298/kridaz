# Notification Module

## Overview

The Notification module manages real-time alerts, push notifications, and in-app messages for Users and Turf Owners.

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers (currently `user`).
- `notification.controller.js`: Logic for fetching and clearing user notifications.
- `notification.service.js`: (Planned) Shared logic for triggering FCM and Socket notifications.

## API Endpoints

Mounted at `/api/notification` (and `/api/user/notifications` for legacy support).

### User Actions

- `GET /`: Retrieve all active and past notifications.
- `PUT /mark-all-read`: Update all pending alerts to 'read' status.
- `PUT /:id/mark-read`: Sync status for a specific notification.
- `DELETE /clear`: Flush the notification inbox.

## Tech Stack

- **Socket.io**: Real-time delivery when the user is online.
- **Firebase (FCM)**: Mobile push notifications for background alerts.
