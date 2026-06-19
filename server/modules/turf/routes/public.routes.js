import express from "express";
import { getStates, getCities } from "../location.controller.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { locationQuerySchema } from "../turf.validator.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: Geospatial data and turf coverage areas
 */

/**
 * @swagger
 * /location/states:
 *   get:
 *     summary: Get list of states with active turfs
 *     tags: [Location]
 *     responses:
 *       200:
 *         description: Array of state names
 */
router.get("/states", getStates);

/**
 * @swagger
 * /location/cities:
 *   get:
 *     summary: Get list of cities with active turfs
 *     tags: [Location]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *         description: Optional state filter
 *     responses:
 *       200:
 *         description: Array of city names
 */
router.get("/cities", validate(locationQuerySchema), getCities);

export default router;
