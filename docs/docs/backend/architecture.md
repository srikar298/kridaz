# Backend Architecture: Vertical Slice (Micro-Apps)

The Kridaz backend is structured using a **Domain-Centric Vertical Slice architecture**. This design is intended to scale to large teams (20+ developers) by eliminating merge conflicts in central files and making every feature module autonomous.

## The Problem: Central Bottlenecks

In a traditional MVC architecture, features are split horizontally (`controllers/`, `routes/`, `models/`). When 20 developers work on different features, they all edit the same central files:

1. `app.js` (for rate limiting, security, and mounting)
2. `routes/index.js` (to register the route)
3. Large shared controllers.

This leads to "Merge Conflict Hell."

## The Solution: Vertical Slices

Kridaz encapsulates everything related to a domain (e.g., **Booking**, **Wallet**, **Auth**) into a single folder in `server/modules/`.

### 1. Autonomous Modules

Each module contains its own:

- **Routes**: Actor-based (User, Owner, Admin).
- **Controller**: The "glue" logic.
- **Service**: Pure business logic (calculating prices, slot availability).
- **Validators**: Schema validation.
- **Documentation**: A dedicated `README.md`.

### 2. Decentralized Security & Rate Limiting

Security is no longer hardcoded in `app.js`. If the **Wallet** module needs a `paymentLimiter`, it is applied directly in `server/modules/wallet/wallet.routes.js`.

- **Benefit**: You can see exactly how a feature is protected by looking at its own route file.

### 3. Dynamic Module Autoloader

We use a `MODULE_MANIFEST` system in `server/modules/loader.js`.

- To add a new domain, you just add it to the manifest.
- The server automatically mounts it at `/api/<module-name>`.
- No one ever needs to edit the central routing hub or `app.js` to add a feature.

## Directory Structure

```
server/modules/<domain>/
├── routes/
│   ├── user.routes.js     # User endpoints
│   ├── owner.routes.js    # Owner endpoints
│   └── admin.routes.js    # Admin endpoints
├── <domain>.routes.js     # Entry point (auto-loaded)
├── <domain>.controller.js # Request/Response glue
├── <domain>.service.js    # Pure business logic
├── <domain>.validator.js  # Zod/Joi schemas
└── README.md              # Documentation
```

## Actor Hubs (The Middle Layer)

While modules are autonomous, we maintain "Actor Hubs" in `server/routes/` for centralized actor-level concerns:

- `user/user.routes.js`: Main hub for player-specific traffic.
- `owner/owner.routes.js`: Main hub for venue owner traffic.
- `admin/admin.routes.js`: Main hub for platform administration.

This ensures strict Role-Based Access Control (RBAC) across the entire platform.
