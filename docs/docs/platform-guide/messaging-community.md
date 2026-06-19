# Chat, Groups & Communities

The **Chat & Community Portal** powers all real-time social interactions on the Kridaz platform. It enables players to chat 1-on-1, organize teams through dedicated group chats, and build nested sports communities with channels.

![Chat & Community Mockup](/img/platform/chat_mockup.png)

## Core Messaging Formats

Kridaz supports three distinct messaging structures to cater to different levels of social engagement:

### 1. Direct Messages (DMs)

- Private 1-on-1 conversations between users (e.g., players, coaches, or venue owners).
- Initiated directly from user profiles, player lists, or when responding to hosted game slots.
- Messages are encrypted in transit and synced in real time.

### 2. Group Chats

- Multi-user conversations where members can coordinate matches, turf bookings, and team schedules.
- Created dynamically by inviting connections (mutual followers).
- Features customizable group profiles (group name, display image) and member management.

### 3. Communities & Channels

- Organization-level wrappers (`isCommunity: true`) that function as a directory of sub-groups (channels).
- Designed for clubs, leagues, or local turf regulars (e.g., _"FC Mumbai Community"_, _"Turf Players Group"_).
- **Sub-Groups (Channels)** are linked to a parent community using the `parentCommunity` identifier.
- Only community admins can add sub-groups/channels or manage administrative rights.

---

## Frontend Architecture

The chat interface is built as a single, fluid dashboard that fits within the viewport. The code is located in the `client/user/src/features/chat/` directory.

### UI Component Hierarchy

- **[Messages Page](file:///Users/prem/kridaz/client/user/src/features/chat/pages/Messages.jsx)**: The outer controller page that handles search parameters, selects the active chat, and renders the split-pane viewport layout.
  - **[ChatSidebar](file:///Users/prem/kridaz/client/user/src/features/chat/components/ChatSidebar.jsx)**: Handles lists of chats, including pinned conversations, searching contacts, and grouping communities into collapsible folders.
    - **[CreateGroupModal](file:///Users/prem/kridaz/client/user/src/features/chat/components/CreateGroupModal.jsx)**: Form to input group name and multi-select connections to invite.
    - **[CreateCommunityModal](file:///Users/prem/kridaz/client/user/src/features/chat/components/CreateCommunityModal.jsx)**: Form to establish a community root with name and description.
  - **[ChatWindow](file:///Users/prem/kridaz/client/user/src/features/chat/components/ChatWindow.jsx)**: Renders the active message feed, message bubble states, typing indicators, and input panel.
    - **[GroupInfoModal](file:///Users/prem/kridaz/client/user/src/features/chat/components/GroupInfoModal.jsx)**: Displays group statistics, member rosters, and admin settings.
    - **[AddGroupToCommunityModal](file:///Users/prem/kridaz/client/user/src/features/chat/components/AddGroupToCommunityModal.jsx)**: Allows community admins to append child groups/channels to the parent community.
    - **[ManageCommunityAdminsModal](file:///Users/prem/kridaz/client/user/src/features/chat/components/ManageCommunityAdminsModal.jsx)**: Grants or revokes administrator rights within a community.

---

## Backend & API Implementation

The backend follows the **Vertical Slice Architecture**, keeping routes, controllers, and services grouped together by module.

### Module Folders

- **[Chat Module](file:///Users/prem/kridaz/server/modules/chat/)**: Handles chat/group creation, participant additions, and message persistence.
- **[Community Module](file:///Users/prem/kridaz/server/modules/community/)**: Oversees the social feed, user posts, stories, and social reactions (likes/comments).

### Key Database Models (PostgreSQL & Prisma)

In the database schema, conversations are stored under a unified `Chat` model:

- `isGroupChat`: Boolean flag determining whether the conversation has multiple participants.
- `isCommunity`: Boolean flag denoting if the entity is a parent community folder.
- `parentCommunityId`: Relation pointing to the parent `Chat` if the row is a sub-group/channel of a community.
- `groupAdmin`: Array of user IDs designating the managers of a group/community.

### REST API Endpoints (`/api/chat`)

- `POST /api/chat`: Access or create a 1-on-1 private chat.
- `GET /api/chat`: Retrieve the list of active chats for the logged-in user.
- `POST /api/chat/group`: Create a group chat or community.
- `POST /api/chat/message`: Save and dispatch a new text/media message.
- `GET /api/chat/message/:chatId`: Retrieve the paginated message history for a specific room.
- `PUT /api/chat/message/:chatId/read`: Mark all messages in a chat as read.

---

## Real-Time Synchronization (WebSockets)

Instant message delivery, presence, and interactive indicators are handled through **Socket.io** located in `server/config/socket.js`.

```
[Client A] --(new message)--> [Server (Socket.io)] --(broadcast)--> [Client B]
   |                                                                   |
   |----(typing)---------------> [Server] --------------(typing)------>|
```

### Event Lifecycle

1. **`setup` (Client -> Server)**: Handshake event. The client sends user metadata. The server joins the socket to a private room based on their `userId` and updates their status to **Online** in Redis (`kridaz:online:users`).
2. **`join chat` (Client -> Server)**: The socket joins a room named after the `chatId` to listen to messages sent in that specific thread.
3. **`typing` & `stop typing` (Client -> Server)**: Triggers visual indicator updates in the active chat header for other participants in real time.
4. **`new message` (Client -> Server -> Clients)**: Relays message payloads to all room participants. The server parses participants and emits `message received` to their specific user rooms.
5. **`messages read` (Client -> Server -> Clients)**: Informs sender and other members that the reader has viewed the chat, clearing unread counters.
6. **`location:update` (Client -> Server -> Nearby Clients)**: Broadcasts the user's geo-coordinates (PostGIS) to nearby players within a 10 km radius via Redis spatial queries (`GEORADIUS`), enabling local matchmaking.
