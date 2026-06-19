import { prisma } from "../../config/prisma.js";

/**
 * @desc Get list of states with active turfs
 * @route GET /api/location/states
 */
export const getStates = async (req, res) => {
  try {
    const states = await prisma.turf.findMany({
      where: {
        status: "approved",
        isActive: true,
      },
      select: { state: true },
      distinct: ["state"],
      orderBy: { state: "asc" },
    });
    return res.status(200).json({ states: states.map((s) => s.state) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * @desc Get list of cities with active turfs
 * @route GET /api/location/cities
 */
export const getCities = async (req, res) => {
  const { state } = req.query;
  try {
    const where = { status: "approved", isActive: true };
    if (state) where.state = state;

    const cities = await prisma.turf.findMany({
      where,
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    });
    return res.status(200).json({ cities: cities.map((c) => c.city) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
