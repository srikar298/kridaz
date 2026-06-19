# Kridaz Architecture

## Overview

Kridaz is a unified platform for turf booking and partner management (Venue Owners, Coaches, Umpires).

## Directory Structure

### Backend (`/server`)

- **`modules/`**: Domain-driven, self-contained vertical slices. Each module contains its own controllers, services, validators, and localized route trees (e.g. `routes/admin.routes.js`, `routes/user.routes.js`, `routes/public.routes.js`).
- **`routes/`**: Centralized **Actor Gateways** (e.g., `admin.routes.js`, `owner.routes.js`, `user.routes.js`) that mount authentication wrappers and delegate directly to modular sub-routers.
  - **`index.js`**: Central application gateway that registers and configures all system endpoints dynamically, maintaining complete actor segregation.
- **`middleware/`**: Shared middleware including JWT authentication, standard request logging, and general error-handling boundaries.

### Frontend (`/client/user`)

- **`src/components/`**: Atomic components and layout elements.
- **`src/pages/`**: Unified page components for all users and partners.
- **`src/services/`**: Centralized API communication layer.
- **`src/hooks/`**: Custom React hooks for shared logic.
- **`src/store/`**: Redux state management.

## Key Design Patterns

1. **Unified Domain**: Single frontend domain for all user personas, controlled by RBAC.
2. **Schema-First Validation**: Every API request is validated against **Zod** schemas before processing.
3. **Centralized Error Handling**: Global error boundary on frontend and unified middleware on backend.
4. **Partner Dropdown**: Dynamic navigation pattern for secondary portals.

## 📈 Scalability Features

### Vertical Scalability (Features)

- **Module Isolation**: Adding a new feature (e.g., "Tournaments") only requires creating a new folder in `server/modules/` and registering a route. It doesn't affect existing code.
- **Zod Validation**: Centralized schemas ensure that as the API grows, validation logic remains consistent and easy to update.

### Horizontal Scalability (Architecture)

- **Stateless API**: The backend is stateless, relying on JWT for authentication, making it ready for horizontal scaling behind a load balancer.
- **Unified Frontend**: By merging portals into one domain, we reduce deployment overhead and share state/components efficiently across all user roles.

### Team Scalability (Developer Experience)

- **Standardized Documentation**: With `DEVELOPER_GUIDE.md` and module-specific READMEs, new developers can onboard and start working on specific features with minimal friction.
- **Consistent Layering**: The separation of Controllers, Validators, and Services ensures that multiple developers can work on different layers without merge conflicts.

## Technologies

- **Backend**: Node.js, Express, PostgreSQL (Prisma ORM), Zod.
- **Frontend**: React, Vite, Redux Toolkit, Tailwind CSS, Axios.
- **Testing**: Jest, Supertest.
