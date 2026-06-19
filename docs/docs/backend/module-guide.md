# Backend Module Guide

This guide explains how to work with, find, or create a module in the Kridaz backend.

## How to Find a Feature

If you are asked to work on a specific feature, go directly to its domain folder:
`server/modules/<feature_name>/`

**Examples:**

- Turf booking logic? `server/modules/booking/`
- User wallet/payments? `server/modules/wallet/`
- Reels/Shorts feed? `server/modules/reels/`

## Creating a New Module

Follow these steps to create a new "Micro-App" within Kridaz:

### 1. Create the Directory Structure

```bash
mkdir -p server/modules/new-feature/routes
```

### 2. Define the Entry Router

Create `server/modules/new-feature/new-feature.routes.js`:

```javascript
import { Router } from "express";
import userSubRouter from "./routes/user.routes.js";

const router = Router();
router.use("/user", userSubRouter); // Mounts at /api/new-feature/user
export default router;
```

### 3. Implement Controllers & Services

- **Controller**: Handle `req` and `res`.
- **Service**: Write the logic here (database calls, calculations). _Never put complex logic in the controller._

### 4. Apply Security & Rate Limiting

Do not edit `app.js`. Apply protection in your module's route file:

```javascript
import { authLimiter } from "../../../middleware/rateLimiter.middleware.js";

router.post("/action", authLimiter, controller.handleAction);
```

### 5. Register in the Manifest

Open `server/modules/loader.js` (or the manifest file) and add your module:

```javascript
const MODULE_MANIFEST = [
  // ... existing modules
  { name: "new-feature", route: "new-feature.routes.js" },
];
```

## Standards & Best Practices

1. **No Logic in Controllers**: The controller is just a messenger. The **Service** layer is where the brain lives.
2. **Atomic Commits**: Since features are isolated in folders, your commits should ideally stay within your module folder.
3. **Self-Document**: Every module must have a `README.md` explaining its purpose and any special setup required.
4. **Use Shared Types**: Import schemas and constants from `packages/common` and `packages/shared-constants`.
