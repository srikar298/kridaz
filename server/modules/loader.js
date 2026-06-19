/**
 * @module ModuleLoader
 * @description Domain Module Autoloader for the Kridaz API.
 *
 * CONVENTION:
 *   A module is "auto-mountable" by listing it in MODULE_MANIFEST below.
 *   The loader finds its route file, dynamically imports it, and mounts it
 *   on a declared path — all without touching any other file.
 *
 * HOW TO ADD A NEW DOMAIN MODULE:
 *   1. Create  server/modules/yourModule/yourModule.routes.js
 *   2. Add an entry to MODULE_MANIFEST below
 *   3. DONE — no other files need to be touched.
 *
 * WHAT DOES NOT BELONG HERE:
 *   "Hub-dependent" modules (auth, community, wallet, player, turf, review,
 *   dispute, notification, blog) are mounted inside the actor routers
 *   (user/owner/admin) because they require complex nested auth layering.
 *   They must NOT be added to this manifest.
 */

import { Router } from "express";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import logger from "../utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {Object} ModuleManifestEntry
 * @property {string} module      - Directory name inside server/modules/
 * @property {string} mountPath   - The URL path to mount the router at (e.g. "/booking")
 * @property {string} [routeFile] - Override the default "{module}.routes.js" filename
 * @property {string} description - Short description for the startup log
 */

/**
 * The authoritative registry of all auto-mountable domain modules.
 *
 * Order here determines router precedence when paths overlap.
 * More specific paths should come before general ones.
 *
 * @type {ModuleManifestEntry[]}
 */
const MODULE_MANIFEST = [
  {
    module: "booking",
    mountPath: "/booking",
    description: "Venue slot reservations & payment lifecycle",
  },
  {
    module: "team",
    mountPath: "/team",
    description: "Team management, invites & opponent matching",
  },
  {
    module: "hostedGame",
    mountPath: "/hosted-game",
    description: "Game hosting, player slots & live scoring",
  },
  {
    module: "payment",
    mountPath: "/payment",
    description: "Razorpay webhooks & payment gateway callbacks",
  },
  {
    module: "professional",
    mountPath: "/professional",
    description: "Coaches, umpires & professional service profiles",
  },
  {
    module: "chat",
    mountPath: "/chat",
    description: "Real-time P2P and group messaging",
  },
  {
    module: "reels",
    mountPath: "/reels",
    description: "Short-form video feed (create, like, comment)",
  },
  {
    module: "story",
    mountPath: "/story",
    description: "24-hour ephemeral story content",
  },
  {
    module: "scoring",
    mountPath: "/scoring",
    description: "Cricket match scoring engine & ball-by-ball events",
  },
  {
    // scorer.routes.js lives inside the scoring module (same domain)
    module: "scoring",
    routeFile: "scorer.routes.js",
    mountPath: "/scorer",
    description: "Scorer role assignment, acceptance & scoring actions",
  },
  {
    module: "webhooks",
    mountPath: "/webhooks",
    description: "Incoming external webhooks (Sentry, etc.)",
  },
  {
    module: "tournament",
    mountPath: "/tournament",
    description: "Tournament creation and management",
  },
];

/**
 * Resolves the absolute path to a module's route file.
 * Uses `routeFile` override if provided, otherwise falls back to `{module}.routes.js`.
 *
 * @param {ModuleManifestEntry} entry
 * @returns {string} Absolute filesystem path
 */
const resolveRouteFilePath = (entry) => {
  const fileName = entry.routeFile ?? `${entry.module}.routes.js`;
  return join(__dirname, entry.module, fileName);
};

/**
 * Dynamically loads and mounts all modules defined in MODULE_MANIFEST.
 * Returns a single configured Express router with all domain modules attached.
 *
 * This function is async because it uses dynamic `import()` for each module.
 * Call it once at server startup with top-level await.
 *
 * @returns {Promise<Router>} A fully configured Express router
 */
export const createDomainRouter = async () => {
  const router = Router();

  const mounted = [];
  const skipped = [];
  const failed = [];

  for (const entry of MODULE_MANIFEST) {
    const routeFilePath = resolveRouteFilePath(entry);

    if (!existsSync(routeFilePath)) {
      skipped.push({
        path: entry.mountPath,
        reason: `Route file not found: ${entry.module}/${entry.routeFile ?? `${entry.module}.routes.js`}`,
      });
      continue;
    }

    try {
      // pathToFileURL handles Windows path separators correctly
      const fileUrl = pathToFileURL(routeFilePath).href;
      const moduleExport = await import(fileUrl);
      const moduleRouter = moduleExport.default;

      if (!moduleRouter || typeof moduleRouter !== "function") {
        failed.push({
          path: entry.mountPath,
          reason: `No valid default export in ${entry.module}/${entry.routeFile ?? `${entry.module}.routes.js`}`,
        });
        continue;
      }

      router.use(entry.mountPath, moduleRouter);

      mounted.push({
        path: entry.mountPath,
        module: entry.module,
        description: entry.description,
      });
    } catch (err) {
      failed.push({ path: entry.mountPath, reason: err.message });
      logger.error(
        `[ModuleLoader] Failed to load "${entry.module}" → ${entry.mountPath}:`,
        err
      );
    }
  }

  // ── Startup Registry Log ─────────────────────────────────────────────────────
  // This log is your "at-a-glance" view of the entire domain routing table.
  // If an endpoint is mysteriously 404ing, check here first.
  const divider = "─".repeat(60);
  logger.info(`\n${divider}`);
  logger.info("📦  KRIDAZ DOMAIN MODULE REGISTRY");
  logger.info(divider);

  if (mounted.length > 0) {
    logger.info("✅  Mounted:");
    mounted.forEach(({ path, description }) => {
      logger.info(`    /api${path.padEnd(20)} → ${description}`);
    });
  }

  if (skipped.length > 0) {
    logger.warn("⏭️   Skipped (route file missing):");
    skipped.forEach(({ path, reason }) =>
      logger.warn(`    ${path} — ${reason}`)
    );
  }

  if (failed.length > 0) {
    logger.error("❌  Failed (check errors above):");
    failed.forEach(({ path, reason }) =>
      logger.error(`    ${path} — ${reason}`)
    );
  }

  logger.info(`${divider}\n`);

  return router;
};
