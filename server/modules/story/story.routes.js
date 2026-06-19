import express from "express";
import userStoryRouter from "./routes/user.routes.js";
import adminStoryRouter from "./routes/admin.routes.js";

/**
 * Story Domain Router
 * Mounts actor-specific sub-routers for the Story module.
 *
 * Routes:
 * /api/story/user/...
 * /api/story/admin/...
 */

const storyRouter = express.Router();

// Mount Actor Sub-Routers
storyRouter.use("/user", userStoryRouter);
storyRouter.use("/admin", adminStoryRouter);

// Fallback / Root - Map to user routes
storyRouter.use("/", userStoryRouter);

export default storyRouter;
