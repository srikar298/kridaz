import { Router } from "express";
import userBlogRouter from "./routes/user.routes.js";
import adminBlogRouter from "./routes/admin.routes.js";

/**
 * Blog Domain Router
 * Mounts actor-specific sub-routers for the Blog module.
 *
 * Routes:
 * /api/blog/...
 */

const blogRouter = Router();

// Mount Actor Sub-Routers
blogRouter.use("/user", userBlogRouter);
blogRouter.use("/admin", adminBlogRouter);

// Fallback / Root - Map to user routes
blogRouter.use("/", userBlogRouter);

export default blogRouter;
