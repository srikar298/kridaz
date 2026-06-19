import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";

// @desc    Get all feature flags
// @route   GET /api/features
// @access  Public
export const getAllFeatureFlags = async (req, res) => {
  try {
    const flags = await prisma.featureFlag.findMany({});
    // Convert array to an object map { key: enabled } for easier frontend consumption
    const flagMap = flags.reduce((acc, flag) => {
      acc[flag.key] = flag.enabled;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: flags,
      flagsMap: flagMap,
    });
  } catch (error) {
    logger.error("Error in getAllFeatureFlags:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Toggle feature flag
// @route   PUT /api/admin/features/:key
// @access  Private/Admin
export const toggleFeatureFlag = async (req, res) => {
  try {
    const { key } = req.params;
    const { enabled } = req.body;

    const existingFlag = await prisma.featureFlag.findUnique({
      where: { key },
    });

    if (!existingFlag) {
      return res
        .status(404)
        .json({ success: false, message: "Feature flag not found" });
    }

    const updatedFlag = await prisma.featureFlag.update({
      where: { key },
      data: {
        enabled: enabled !== undefined ? enabled : !existingFlag.enabled,
      },
    });

    res.status(200).json({ success: true, data: updatedFlag });
  } catch (error) {
    logger.error("Error in toggleFeatureFlag:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Create/Seed initial feature flags (Internal use or setup)
// @route   POST /api/admin/features/seed
// @access  Private/Admin
export const seedFeatureFlags = async (req, res) => {
  try {
    const defaultFlags = [
      {
        key: "find_professionals",
        name: "Find Professionals Section",
        description:
          "Show the Find Professionals card section on the landing page.",
        enabled: true,
      },
      {
        key: "join_games",
        name: "Join Games Near You Section",
        description:
          "Show the Join Games Near You card section on the landing page.",
        enabled: true,
      },
    ];

    await prisma.$transaction(
      defaultFlags.map((df) =>
        prisma.featureFlag.upsert({
          where: { key: df.key },
          update: {
            name: df.name,
            description: df.description,
            enabled: df.enabled,
          },
          create: df,
        })
      )
    );

    const allFlags = await prisma.featureFlag.findMany({});
    res.status(200).json({
      success: true,
      data: allFlags,
      message: "Flags seeded successfully",
    });
  } catch (error) {
    logger.error("Error in seedFeatureFlags:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
