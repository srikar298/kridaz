# Kridaz Developer Guide

Welcome to the Kridaz development team! This guide will help you understand the project structure and how to contribute effectively.

## 🏗 Scalable Folder Structure

### Backend (`/server`)

We use a **Vertical Slice Domain-Driven Architecture**. Each feature area is completely encapsulated within its own module in the `server/modules/` directory.

- **`modules/`**:
  - `[feature]/[feature].controller.js`: Request controllers and business boundaries.
  - `[feature]/[feature].validator.js`: Zod schemas for sanitization and input validation.
  - `[feature]/[feature].service.js`: Database queries, helper functions, and transactions.
  - `[feature]/routes/[actor].routes.js`: Sub-routers mapped per-actor (e.g., `admin.routes.js`, `user.routes.js`, `public.routes.js`).
- **`routes/`**: Main gateway routing hub.
  - `index.js`: Dynamically autoloads all module-level routing definitions.
  - `[actor]/[actor].routes.js`: Maps actor-level global middlewares (e.g. `userAuth`) and attaches the module sub-routers.

**How to add a new backend feature:**

1. Create a new folder in `server/modules/[new-feature]`.
2. Define your logic in `controller.js` and input validation in `validator.js`.
3. Create a `routes/` directory inside your new module containing `user.routes.js`, `admin.routes.js`, or `public.routes.js` as needed.
4. Mount the sub-router inside the centralized actor hub under `server/routes/[actor]/[actor].routes.js` or let `index.js` auto-load it if it is a public vertical slice.

---

### Frontend (`/client/user`)

We use a **Layered Component Architecture**.

- **`components/`**: UI building blocks.
  - `common/`: Reusable, generic components (Buttons, Modals, Inputs).
  - `layout/`: Shell components (Navbar, Footer, Sidebar).
  - `[feature]/`: Feature-specific components (e.g., `reviews/`, `auth/`).
- **`pages/`**: View-level components that compose other components.
- **`services/`**: Centralized API communication using Axios.
- **`hooks/`**: Custom React hooks for shared stateful logic.
- **`redux/`**: Global state management.

**How to add a new page:**

1. Create a new component in `client/user/src/pages/`.
2. If it needs a new route, add it to `client/user/src/router.jsx`.
3. Use components from `components/` to build your UI.
4. Use `src/services/api.js` for any backend communication.

**Deep Dive Documentation:**

- [Frontend Architecture](docs/frontend/ARCHITECTURE.md)
- [State Management (RTK/RTK Query)](docs/frontend/STATE_MANAGEMENT.md)
- [Component Design Standards](docs/frontend/COMPONENT_DESIGN.md)
- [API Integration Standards](docs/frontend/API_INTEGRATION.md)

---

## 🛡 Validation & Error Handling

### Backend Validation

Always use **Zod** for request validation.

```javascript
// example.validator.js
import { z } from "zod";
export const exampleSchema = z.object({
  name: z.string().min(3),
});

// routes.js
router.post("/", validate(exampleSchema), controller.handler);
```

### Frontend Error Resilience

- Use the global `ErrorBoundary` for catching runtime crashes.
- All API calls through `services/api.js` automatically handle 401 (unauthorized) errors.

---

## 🛠 Tech Stack

- **Database**: PostgreSQL (Prisma ORM)
- **Backend**: Node.js, Express
- **Frontend**: React, Redux Toolkit, Tailwind CSS
- **Tools**: Axios (API), Zod (Validation), Lucide (Icons)

---

## 🚀 CI/CD Pipeline

We use GitHub Actions for automated testing and builds. The configuration is located in `.github/workflows/ci.yml`.

- **On Push/PR to Main**:
  - Runs server-side tests (Jest).
  - Builds the React frontend to catch build errors.
  - Performs security audits on dependencies.

## 🚦 Getting Started

1. Clone the repo.
2. Run `pnpm install` in the root workspace.
3. Set up your `.env` in `server/`.
4. Run `pnpm dev` in the root workspace to boot all services concurrently.

Happy coding! 🚀
