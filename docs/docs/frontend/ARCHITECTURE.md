# Frontend Architecture

The Kridaz frontend is built for performance and maintainability, leveraging a modern stack and a layered architecture.

## Tech Stack

- **Framework**: Vite + React
- **State Management**: Redux Toolkit (RTK)
- **Data Fetching**: RTK Query (auto-caching & hooks)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6

## Layered Design

We follow a 3-layer architecture to separate concerns:

### 1. UI Layer (Pure Components)

- **Location**: `client/user/src/components/`
- **Role**: Presentational only. Receives props and renders UI. No API calls or complex logic.
- **Goal**: Reusability and easy testing.

### 2. Behavior Layer (Hooks & Orchestration)

- **Location**: `client/user/src/hooks/`
- **Role**: Manages side effects, local state toggles, and orchestrates API calls using RTK Query.
- **Goal**: Business logic separation from the visual UI.

### 3. Service Layer (API & Storage)

- **Location**: `client/user/src/services/`
- **Role**: Defines RTK Query endpoints, local storage interactions, and external SDK integrations.
- **Goal**: Raw communication abstraction.

## State Management Strategy

- **Server State**: Managed entirely by **RTK Query**. We avoid `useEffect` for data fetching.
- **Global UI State**: Managed by **Redux slices** (e.g., current theme, user session).
- **Local State**: Standard React `useState` / `useReducer` for component-specific logic.

## Directory Structure

```
client/user/src/
├── assets/          # Images, icons, global CSS
├── components/      # UI components (Atomic design)
├── features/        # Feature-based folders (e.g., Booking, Chat)
│   ├── components/
│   ├── hooks/
│   └── slices/
├── layouts/         # Page wrappers (Auth, Main)
├── pages/           # Routed page components
├── services/        # RTK Query API definitions
└── utils/           # Helper functions & constants
```
