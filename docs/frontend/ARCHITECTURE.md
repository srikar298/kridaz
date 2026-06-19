# Frontend Architecture Specification

## 🏛 Overview

Kridaz's frontend is designed for high modularity, scalability, and developer productivity. It follows a **Layered Architecture** pattern, separating concerns between UI, Business Logic, and Data Fetching.

## 📁 Directory Structure & Responsibilities

### 1. UI Layer (`src/components`)

Purely visual components. They should not contain business logic or API calls.

- **`common/`**: Primitive components (Button, Input, Modal, Toast).
- **`layout/`**: Structural components (Navbar, Sidebar, Footer, PageWrapper).
- **`features/`**: Feature-specific UI (ReviewCard, TurfList, BookingSummary).

### 2. Behavioral Layer (`src/hooks`)

Manages side effects, local state, and orchestrates services.

- **`useAuth.js`**: Authentication state and actions.
- **`useTurf.js`**: Turf discovery and filtering logic.

### 3. Service Layer (`src/services`)

Handles raw communication with external APIs.

- **`api.js`**: Axios instance with global interceptors for auth headers and error handling.
- **`rtk-query/`**: (Future) RTK Query API definitions for auto-caching and synchronization.

## 🔄 State Management Strategy

### Global State (Redux Toolkit)

Used for cross-cutting concerns:

- **`authSlice`**: User profile, roles, and session tokens.
- **`uiSlice`**: Global modal states, theme, and loading overlays.

### Server State (RTK Query)

**Recommended standard for all data fetching:**

- Automatic caching and revalidation.
- Loading/Error states handled out-of-the-box.
- Polling and optimistic updates for bookings.

## 🛡 Security & Access Control

### Role-Based Access Control (RBAC)

Implemented via the `ProtectedRoute` component:

- **`allowedRoles`**: Array of roles permitted to view the page (`['admin', 'owner']`).
- **Redirection**: Unauthorized users are sent to `/login` or an "Access Denied" page.

### Data Sanitization

- All user input is sanitized before submission.
- Environment variables are used for sensitive URLs and API keys.

## 🎨 Design System & Styling

- **Utility-First**: Tailwind CSS for rapid, consistent styling.
- **Theming**: DaisyUI for standard component semantics.
- **Responsive**: Mobile-first approach using Tailwind's `sm`, `md`, `lg` breakpoints.

## 🚥 Development Workflow

1. **Scaffold Component**: Create in `components/features/[feature]`.
2. **Define Logic**: Use or create a custom hook in `hooks/`.
3. **Register Page**: Add to `pages/` and update `router.jsx`.
4. **Test**: Verify responsiveness and RBAC protection.
