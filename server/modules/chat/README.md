# Chat Module

## Overview

The Chat module provides real-time P2P messaging, group chats, and community-based conversations.

## Architecture

This module follows the **Vertical Slice** pattern:

- `routes/`: Actor-specific sub-routers.
- `chat.controller.js`: Logic for chat creation and participant management.
- `message.controller.js`: Logic for sending, clearing, and forwarding messages.
- `chat.service.js`: (Planned) Logic for socket-based event dispatching.

## API Endpoints

All endpoints are mounted at `/api/chat`.

### Chat Management

- `POST /`: Access/Create 1-on-1 chat.
- `GET /`: Fetch all active chats and invitations.
- `POST /group`: Create a group or community.
- `PUT /group/update`: Update group profile.
- `POST /respond-invite`: Accept/Reject group invitations.
- `PUT /pin`: Pin a chat to the top of the list.

### Messaging

- `POST /message`: Send a message.
- `GET /message/:chatId`: Fetch message history.
- `POST /message/forward`: Forward messages to other chats.
- `POST /message/broadcast`: Send message to multiple recipients.
- `PUT /message/:chatId/read`: Sync read status.
- `GET /message/:chatId/media`: Filter shared photos/videos.

## Real-time Integration

This module works in tandem with the WebSocket backend to provide instant notifications and message delivery.
