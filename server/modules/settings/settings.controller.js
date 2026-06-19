import { prisma } from "../../config/prisma.js";
import { logAdminAction } from "../../utils/auditLogger.js";

export const getPayoutSettings = async (req, res) => {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { key: "PAYOUT_CONFIG" },
    });
    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          key: "PAYOUT_CONFIG",
          value: {
            payoutDay: 6, // 0 = Sunday, 6 = Saturday
            settlementTimeHrs: 48,
            minPayoutAmount: 500,
            coinConversionRate: 1,
            platformFeePercentage: 5,
            gstPercentage: 18,
            gatewayFeePercentage: 2,
            cashbackPercentage: 5,
          },
          description: "Global payout configuration",
        },
      });
    }
    res.status(200).json({
      success: true,
      settings: settings.value,
      payoutSettings: settings.value,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicSettings = async (req, res) => {
  try {
    let settings = await prisma.systemSetting.findUnique({
      where: { key: "PAYOUT_CONFIG" },
    });
    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          key: "PAYOUT_CONFIG",
          value: {
            payoutDay: 6, // 0 = Sunday, 6 = Saturday
            settlementTimeHrs: 48,
            minPayoutAmount: 500,
            coinConversionRate: 1,
            platformFeePercentage: 5,
            gstPercentage: 18,
            gatewayFeePercentage: 2,
            cashbackPercentage: 5,
          },
          description: "Global payout configuration",
        },
      });
    }

    // Only return safe settings needed by the frontend
    const publicSettings = {
      platformFeePercentage: settings.value.platformFeePercentage || 5,
      gstPercentage: settings.value.gstPercentage || 18,
      cashbackPercentage: settings.value.cashbackPercentage || 5,
    };

    res.status(200).json({ success: true, payoutSettings: publicSettings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePayoutSettings = async (req, res) => {
  const {
    payoutDay,
    settlementTimeHrs,
    minPayoutAmount,
    platformFeePercentage,
    gstPercentage,
    gatewayFeePercentage,
    cashbackPercentage,
  } = req.body;

  try {
    const settings = await prisma.systemSetting.upsert({
      where: { key: "PAYOUT_CONFIG" },
      update: {
        value: {
          payoutDay,
          settlementTimeHrs,
          minPayoutAmount,
          coinConversionRate: 1,
          platformFeePercentage,
          gstPercentage,
          gatewayFeePercentage,
          cashbackPercentage,
        },
        updatedBy: req.user.id,
      },
      create: {
        key: "PAYOUT_CONFIG",
        value: {
          payoutDay,
          settlementTimeHrs,
          minPayoutAmount,
          coinConversionRate: 1,
          platformFeePercentage,
          gstPercentage,
          gatewayFeePercentage,
          cashbackPercentage,
        },
        updatedBy: req.user.id,
        description: "Global payout configuration",
      },
    });

    await logAdminAction(
      req,
      "UPDATE_PAYOUT_SETTINGS",
      "SYSTEM_SETTINGS",
      settings.id,
      req.body
    );

    res.status(200).json({ success: true, settings: settings.value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlatformConfigs = async (req, res) => {
  try {
    const configs = await prisma.platformConfig.findMany();
    const configMap = {};
    configs.forEach((cfg) => {
      configMap[cfg.key] = cfg.value;
    });
    res.status(200).json({ success: true, configs, configMap });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePlatformConfigs = async (req, res) => {
  try {
    const updates = req.body.configs || req.body;
    if (!updates || typeof updates !== "object") {
      return res.status(400).json({
        message: "Invalid payload. Expected key-value configuration pairs.",
      });
    }

    const updatedConfigs = [];
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value !== "string" && typeof value !== "number") continue;

      const config = await prisma.platformConfig.upsert({
        where: { key },
        update: {
          value: String(value),
          updatedBy: req.user?.id,
        },
        create: {
          key,
          value: String(value),
          updatedBy: req.user?.id,
          description: `Admin updated config: ${key}`,
        },
      });
      updatedConfigs.push(config);
    }

    await logAdminAction(
      req,
      "UPDATE_PLATFORM_CONFIGS",
      "SYSTEM_SETTINGS",
      null,
      updates
    );

    res.status(200).json({ success: true, configs: updatedConfigs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
