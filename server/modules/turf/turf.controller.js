// Dummy comment to trigger nodemon restart after schema update
import { prisma } from "../../config/prisma.js";
import { uploadToR2 } from "../../utils/r2Upload.js";
import { startOfDay, parseISO, addDays, format, parse } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import { findNearby, updateGeoPoint } from "../../utils/geo.util.js";
import {
  getOrSetCache,
  generateCacheKey,
  invalidateCache,
} from "../../utils/cache.js";
import logger from "../../utils/logger.js";
import { getGroundRecommendations } from "../../services/recommendation.service.js";
import { computeLowestHourlyRate } from "../../utils/turfPricing.js";
import { wrapped } from "../../utils/envelope.js";
import { meiliClient } from "../../config/search.js";

// --- USER OPERATIONS ---

export const getAllTurfs = async (req, res) => {
  const { searchTerm, city, state, lat, lng, radius, limit, page } = req.query;
  try {
    const isVal = (v) =>
      v && v !== "" && v !== "null" && v !== "undefined" && v !== "Select";

    const where = {
      status: "approved",
      isActive: true,
    };

    if (isVal(state)) where.state = { contains: state, mode: "insensitive" };

    if (isVal(searchTerm) && searchTerm !== "All") {
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { sportTypes: { has: searchTerm } },
      ];
    }

    const take = limit ? Math.min(parseInt(limit), 50) : 20;
    const skip = page ? (parseInt(page) - 1) * take : 0;

    const cacheKey = generateCacheKey("turfs:list", {
      searchTerm,
      city,
      state,
      lat,
      lng,
      radius,
      limit,
      page,
    });

    const turfSelect = {
      id: true,
      name: true,
      description: true,
      location: true,
      image: true,
      images: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
      pricePerHour: true,
      sportTypes: true,
      groundTypes: true,
      facilities: true,
      generatedSlots: true,
      owner: {
        select: {
          id: true,
          businessName: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profilePicture: true,
            },
          },
        },
      },
      reviews: { select: { rating: true } },
    };

    const formattedTurfs = await getOrSetCache(
      cacheKey,
      async () => {
        let resultTurfs = [];

        // --- Meilisearch Integration ---
        try {
          const index = meiliClient.index('turfs');
          const filters = ["isActive = true"];
          
          if (isVal(state)) filters.push(`state = '${state}'`);
          if (isVal(city)) filters.push(`city = '${city}'`);
          
          if (lat && lng) {
            const r = radius ? parseFloat(radius) : 40000; // meters
            filters.push(`_geoRadius(${lat}, ${lng}, ${r})`);
          }

          const searchQuery = (isVal(searchTerm) && searchTerm !== "All") ? searchTerm : "";

          const searchRes = await index.search(searchQuery, {
            filter: filters,
            limit: take,
            offset: skip,
            sort: lat && lng ? [`_geoPoint(${lat}, ${lng}):asc`] : []
          });

          const turfIds = searchRes.hits.map(h => h.id);

          if (turfIds.length > 0) {
            const rawTurfs = await prisma.turf.findMany({
              where: { id: { in: turfIds }, status: "approved" },
              select: turfSelect
            });
            
            // Restore Meilisearch sorting order
            resultTurfs = rawTurfs.sort((a, b) => turfIds.indexOf(a.id) - turfIds.indexOf(b.id));
          }
        } catch (searchError) {
          logger.warn("Meilisearch failed, falling back to basic Prisma query", searchError);
          // Fallback if Meilisearch is down
          resultTurfs = await prisma.turf.findMany({
            where,
            select: turfSelect,
            take,
            skip,
            orderBy: { createdAt: "desc" },
          });
        }


        // Fetch today's booked timeslots count for these turfs in batch
        const turfIds = resultTurfs.map((t) => t.id);
        const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
        const startOfToday = fromZonedTime(startOfDay(new Date()), timeZone);
        const endOfToday = addDays(startOfToday, 1);

        const bookedSlots =
          turfIds.length > 0
            ? await prisma.timeSlot.groupBy({
                by: ["turfId"],
                where: {
                  turfId: { in: turfIds },
                  startTime: { gte: startOfToday, lt: endOfToday },
                },
                _count: { id: true },
              })
            : [];

        const bookedCountMap = {};
        bookedSlots.forEach((bs) => {
          bookedCountMap[bs.turfId] = bs._count.id;
        });

        return resultTurfs.map((t) => {
          const totalRating = t.reviews.reduce((acc, r) => acc + r.rating, 0);
          const avgRating =
            t.reviews.length > 0 ? totalRating / t.reviews.length : 0;

          let parsedSlots = [];
          if (Array.isArray(t.generatedSlots)) {
            parsedSlots = t.generatedSlots;
          } else if (typeof t.generatedSlots === "string") {
            try {
              parsedSlots = JSON.parse(t.generatedSlots);
              if (typeof parsedSlots === "string") {
                parsedSlots = JSON.parse(parsedSlots);
              }
            } catch (e) {
              parsedSlots = [];
            }
          }

          const activeSlots = Array.isArray(parsedSlots)
            ? parsedSlots.filter((s) => s.isActive !== false)
            : [];
          const bookedCount = bookedCountMap[t.id] || 0;
          const slotsLeft = Math.max(0, activeSlots.length - bookedCount);

          return {
            ...t,
            _id: t.id,
            avgRating,
            slotsLeft,
            owner: t.owner
              ? {
                  id: t.owner.id,
                  businessName: t.owner.businessName,
                  user: t.owner.user
                    ? {
                        id: t.owner.user.id,
                        name: t.owner.user.name,
                        username: t.owner.user.username,
                        profilePicture: t.owner.user.profilePicture,
                      }
                    : null,
                }
              : null,
          };
        });
      },
      900
    ); // 15 minute TTL

    return wrapped(res, { turfs: formattedTurfs });
  } catch (err) {
    logger.error("Error in getAllTurfs", err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Returns distinct states and cities from approved turfs
 * so the frontend can populate filter dropdowns.
 */
export const getTurfLocations = async (req, res) => {
  try {
    const turfs = await prisma.turf.findMany({
      where: { status: "approved", isActive: true },
      select: { city: true, state: true },
    });

    const locationMap = {};
    const states = new Set();

    for (const t of turfs) {
      const state = t.state || "";
      const city = t.city || "";
      if (!state && !city) continue;

      if (state) {
        states.add(state);
        if (!locationMap[state]) locationMap[state] = [];
        if (city && !locationMap[state].includes(city)) {
          locationMap[state].push(city);
        }
      }
    }

    // Sort cities within each state
    for (const s of Object.keys(locationMap)) {
      locationMap[s].sort();
    }

    return res.status(200).json({
      states: [...states].sort(),
      citiesByState: locationMap,
    });
  } catch (err) {
    logger.error("Error in getTurfLocations", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getTurfById = async (req, res) => {
  const { id } = req.params;
  try {
    const turf = await prisma.turf.findUnique({
      where: { id },
      include: {
        owner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phone: true,
                profilePicture: true,
              },
            },
          },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    const totalRating = turf.reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating =
      turf.reviews.length > 0 ? totalRating / turf.reviews.length : 0;

    const formattedTurf = {
      ...turf,
      _id: turf.id,
      avgRating,
      owner: turf.owner
        ? {
            id: turf.owner.id,
            name: turf.owner.user?.name || "",
            email: turf.owner.user?.email || "",
            phone: turf.owner.user?.phone || "",
            profilePicture: turf.owner.user?.profilePicture || null,
            userId: turf.owner.user
              ? {
                  id: turf.owner.user.id,
                  name: turf.owner.user.name,
                  username: turf.owner.user.username,
                  profilePicture: turf.owner.user.profilePicture,
                }
              : null,
          }
        : null,
    };

    // Expiry check side effect
    if (
      turf.slotsConfigDuration === "Fixed Weeks" &&
      turf.slotsConfigExpiry &&
      new Date() > new Date(turf.slotsConfigExpiry)
    ) {
      if (!turf.slotsNeedsUpdate) {
        await prisma.turf.update({
          where: { id: turf.id },
          data: { slotsNeedsUpdate: true },
        });
        formattedTurf.slotsNeedsUpdate = true;
      }
    }

    return wrapped(res, { turf: formattedTurf });
  } catch (error) {
    logger.error("Error in getTurfById", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getTimeSlotByTurfId = async (req, res) => {
  const { date, turfId } = req.query;
  if (!date || !turfId) {
    return res.status(400).json({ message: "Date and turfId are required" });
  }

  try {
    const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
    const selectedDate = parseISO(date);
    const startOfSelectedDate = fromZonedTime(
      startOfDay(selectedDate),
      timeZone
    );
    const endOfSelectedDate = addDays(startOfSelectedDate, 1);

    const turfDetails = await prisma.turf.findUnique({
      where: { id: turfId },
      select: {
        id: true,
        openTime: true,
        closeTime: true,
        pricePerHour: true,
        generatedSlots: true,
        availableDays: true,
        offDays: true,
        slotsNeedsUpdate: true,
        slotsConfigDuration: true,
        slotsConfigExpiry: true,
      },
    });

    if (!turfDetails) {
      return res.status(404).json({ message: "Turf not found" });
    }

    const bookedTime = await prisma.timeSlot.findMany({
      where: {
        turfId: turfId,
        startTime: { gte: startOfSelectedDate },
        endTime: { lte: endOfSelectedDate },
      },
    });

    // If configuration needs update (current date > expiry), block all slots
    if (
      turfDetails.slotsNeedsUpdate ||
      (turfDetails.slotsConfigDuration === "Fixed Weeks" &&
        turfDetails.slotsConfigExpiry &&
        new Date() > turfDetails.slotsConfigExpiry)
    ) {
      return res.status(200).json({
        timeSlots: { ...turfDetails, generatedSlots: [] },
        bookedTime: [],
        message:
          "This venue's configuration has expired and needs a review by the owner.",
      });
    }

    // Check if the SELECTED DATE is beyond the configuration expiry
    if (
      turfDetails.slotsConfigDuration === "Fixed Weeks" &&
      turfDetails.slotsConfigExpiry &&
      startOfSelectedDate > turfDetails.slotsConfigExpiry
    ) {
      return res.status(200).json({
        timeSlots: { ...turfDetails, generatedSlots: [] },
        bookedTime: [],
        message:
          "Reservations for this date are not yet open. The venue configuration only covers the upcoming weeks.",
      });
    }

    return wrapped(res, { timeSlots: turfDetails, bookedTime });
  } catch (error) {
    logger.error("Error in getTimeSlotByTurfId", error);
    return res.status(500).json({ message: error.message });
  }
};

// --- OWNER OPERATIONS ---

export const turfRegister = async (req, res) => {
  const ownerData = req.owner;
  try {
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [
          ...(ownerData.ownerId ? [{ id: ownerData.ownerId }] : []),
          { userId: ownerData.id },
        ],
      },
    });

    if (!ownerProfile) {
      return res
        .status(404)
        .json({ success: false, message: "Owner profile not found" });
    }

    const imageFiles =
      req.files?.images || (Array.isArray(req.files) ? req.files : []);

    if (!imageFiles || imageFiles.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "At least one turf image is required",
        });
    }

    const uploadFile = (file, folder) => {
      return uploadToR2(file.buffer, folder);
    };

    const uploadPromises = imageFiles.map((file) =>
      uploadFile(file, "kridaz/turfs")
    );
    const imageUrls = await Promise.all(uploadPromises);

    // Upload verification documents if present
    const verificationDocs = [
      "saleDeed",
      "electricityBill",
      "gstRegistration",
      "rentalAgreement",
      "ownershipAgreement",
      "googleProfileScreenshot",
    ];
    const verificationData = {};
    for (const doc of verificationDocs) {
      if (req.files?.[doc]?.[0]) {
        verificationData[doc] = await uploadFile(
          req.files[doc][0],
          "kridaz/turf_documents"
        );
      }
    }

    const {
      name,
      description,
      location,
      youtubeUrl,
      openTime,
      closeTime,
      availableDays,
      offDays,
      generatedSlots,
      slotDuration,
      breakTime,
      city,
      state,
      latitude,
      longitude,
      managerContacts,
      slotsConfigDuration,
      slotsConfigWeeks,
      price,
      sportTypes,
      groundTypes,
      facilities,
      inviteToken,
    } = req.body;

    let configExpiry = null;
    if (slotsConfigDuration === "Fixed Weeks" && slotsConfigWeeks) {
      configExpiry = new Date();
      configExpiry.setDate(
        configExpiry.getDate() + Number(slotsConfigWeeks) * 7
      );
    }

    const parsedSlots = generatedSlots ? JSON.parse(generatedSlots) : [];
    const slotLowestHourly = computeLowestHourlyRate(parsedSlots);

    const turfData = {
      name,
      description,
      location,
      youtubeUrl,
      openTime,
      closeTime,
      image: imageUrls[0],
      images: imageUrls,
      ownerId: ownerProfile.id,
      status: "pending",
      city,
      state,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      slotDuration: Number(slotDuration) || 60,
      breakTime: Number(breakTime) || 0,
      pricePerHour: slotLowestHourly ?? (parseFloat(price) || 0),
      availableDays: Array.isArray(availableDays)
        ? availableDays
        : availableDays
          ? [availableDays]
          : [],
      offDays: Array.isArray(offDays) ? offDays : offDays ? [offDays] : [],
      sportTypes: Array.isArray(sportTypes)
        ? sportTypes
        : sportTypes
          ? [sportTypes]
          : [],
      groundTypes: Array.isArray(groundTypes)
        ? groundTypes
        : groundTypes
          ? [groundTypes]
          : [],
      facilities: Array.isArray(facilities)
        ? facilities
        : facilities
          ? [facilities]
          : [],
      generatedSlots: parsedSlots,
      managerContacts: managerContacts ? JSON.parse(managerContacts) : [],
      slotsConfigDuration: slotsConfigDuration || "Until Changed",
      slotsConfigWeeks: Number(slotsConfigWeeks) || 1,
      slotsConfigExpiry: configExpiry,
      slotsNeedsUpdate: false,
      policies: req.body.policies || "",
      verificationData,
      isActive: true,
    };

    let newTurf;
    if (inviteToken) {
      const invite = await prisma.venueInvite.findUnique({
        where: { token: inviteToken },
      });
      if (
        !invite ||
        invite.status !== "PENDING" ||
        new Date() > invite.expiresAt
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired invite token" });
      }
      // Update the existing turf
      newTurf = await prisma.turf.update({
        where: { id: invite.turfId },
        data: turfData,
      });
      // Mark invite as ACCEPTED
      await prisma.venueInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED" },
      });
    } else {
      newTurf = await prisma.turf.create({
        data: turfData,
      });
    }

    if (latitude && longitude) {
      await updateGeoPoint(
        "Turf",
        newTurf.id,
        parseFloat(latitude),
        parseFloat(longitude)
      );
    }

    await invalidateCache("turfs:list:*");

    // Sync to Meilisearch
    try {
      const index = meiliClient.index('turfs');
      await index.addDocuments([{
        id: newTurf.id,
        name: newTurf.name,
        address: newTurf.address || newTurf.location,
        city: newTurf.city,
        state: newTurf.state,
        zipcode: newTurf.zipcode,
        pricePerHour: newTurf.pricePerHour,
        isActive: newTurf.isActive,
        isPlatformBooking: newTurf.isPlatformBooking,
        createdAtTimestamp: new Date(newTurf.createdAt).getTime(),
        _geo: newTurf.latitude && newTurf.longitude ? { lat: newTurf.latitude, lng: newTurf.longitude } : undefined,
        images: newTurf.images || []
      }]);
    } catch (e) {
      logger.error("Meilisearch sync failed on register", e);
    }

    return res.status(201).json({
      success: true,
      message: "Turf registered and sent for admin approval",
      turf: { ...newTurf, _id: newTurf.id },
    });
  } catch (err) {
    logger.error("Error in turfRegister", err);
    logger.error(err.stack);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTurfByOwner = async (req, res) => {
  const ownerData = req.owner;
  try {
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [
          ...(ownerData.ownerId ? [{ id: ownerData.ownerId }] : []),
          { userId: ownerData.id },
        ],
      },
    });

    if (!ownerProfile) {
      return res
        .status(404)
        .json({ success: false, message: "Owner profile not found" });
    }

    const turfs = await prisma.turf.findMany({
      where: { ownerId: ownerProfile.id },
      include: {
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedTurfs = turfs.map((t) => {
      const totalRating = t.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating =
        t.reviews.length > 0 ? totalRating / t.reviews.length : 0;

      return {
        ...t,
        _id: t.id,
        avgRating,
        numReviews: t.reviews.length,
      };
    });

    // Side effect: Check for expiry
    Promise.all(
      formattedTurfs.map(async (t) => {
        if (
          t.slotsConfigDuration === "Fixed Weeks" &&
          t.slotsConfigExpiry &&
          new Date() > new Date(t.slotsConfigExpiry)
        ) {
          if (!t.slotsNeedsUpdate) {
            await prisma.turf.update({
              where: { id: t.id },
              data: { slotsNeedsUpdate: true },
            });
          }
        }
      })
    ).catch((err) =>
      logger.error("Error updating turf expiry in background:", err)
    );

    return res.status(200).json(formattedTurfs);
  } catch (err) {
    logger.error("Error getting turfs by ownerId", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const editTurfById = async (req, res) => {
  const ownerData = req.owner;
  try {
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [
          ...(ownerData.ownerId ? [{ id: ownerData.ownerId }] : []),
          { userId: ownerData.id },
        ],
      },
    });

    if (!ownerProfile) {
      return res
        .status(404)
        .json({ success: false, message: "Owner profile not found" });
    }

    const { id } = req.params;
    const {
      sportTypes,
      groundTypes,
      facilities,
      sportsType,
      price,
      ...otherDetails
    } = req.body;

    const updatedTurfData = { ...otherDetails };

    if (sportTypes) {
      updatedTurfData.sportTypes = Array.isArray(sportTypes)
        ? sportTypes
        : [sportTypes];
      if (sportsType && !updatedTurfData.sportTypes.includes(sportsType)) {
        updatedTurfData.sportTypes.push(sportsType);
      }
    } else if (sportsType) {
      updatedTurfData.sportTypes = [sportsType];
    }

    if (groundTypes) {
      updatedTurfData.groundTypes = Array.isArray(groundTypes)
        ? groundTypes
        : [groundTypes];
    }

    if (facilities) {
      updatedTurfData.facilities = Array.isArray(facilities)
        ? facilities
        : [facilities];
    }

    if (req.body.availableDays) {
      updatedTurfData.availableDays = Array.isArray(req.body.availableDays)
        ? req.body.availableDays
        : [req.body.availableDays];
    }

    if (req.body.offDays) {
      updatedTurfData.offDays = Array.isArray(req.body.offDays)
        ? req.body.offDays
        : [req.body.offDays];
    }

    if (req.body.generatedSlots) {
      updatedTurfData.generatedSlots = JSON.parse(req.body.generatedSlots);
    }

    if (req.body.managerContacts) {
      updatedTurfData.managerContacts = JSON.parse(req.body.managerContacts);
    }

    if (req.body.slotDuration)
      updatedTurfData.slotDuration = Number(req.body.slotDuration);
    if (req.body.breakTime !== undefined)
      updatedTurfData.breakTime = Number(req.body.breakTime);
    if (price) updatedTurfData.pricePerHour = parseFloat(price);

    // Slots are the source of truth for headline pricing — override any explicit `price`
    // when active slots are present so cards display the lowest hourly rate.
    if (updatedTurfData.generatedSlots) {
      const slotLowestHourly = computeLowestHourlyRate(
        updatedTurfData.generatedSlots
      );
      if (slotLowestHourly != null)
        updatedTurfData.pricePerHour = slotLowestHourly;
    }

    if (req.body.city) updatedTurfData.city = req.body.city;
    if (req.body.state) updatedTurfData.state = req.body.state;
    if (req.body.latitude) {
      updatedTurfData.latitude = parseFloat(req.body.latitude);
    } else {
      delete updatedTurfData.latitude;
    }

    if (req.body.longitude) {
      updatedTurfData.longitude = parseFloat(req.body.longitude);
    } else {
      delete updatedTurfData.longitude;
    }

    if (req.body.slotsConfigDuration)
      updatedTurfData.slotsConfigDuration = req.body.slotsConfigDuration;
    if (req.body.slotsConfigWeeks)
      updatedTurfData.slotsConfigWeeks = Number(req.body.slotsConfigWeeks);

    if (
      req.body.slotsConfigDuration === "Fixed Weeks" &&
      req.body.slotsConfigWeeks
    ) {
      const configExpiry = new Date();
      configExpiry.setDate(
        configExpiry.getDate() + Number(req.body.slotsConfigWeeks) * 7
      );
      updatedTurfData.slotsConfigExpiry = configExpiry;
    } else if (req.body.slotsConfigDuration === "Until Changed") {
      updatedTurfData.slotsConfigExpiry = null;
    }

    updatedTurfData.slotsNeedsUpdate = false;

    const turf = await prisma.turf.findFirst({
      where: {
        id,
        ownerId: ownerProfile.id,
      },
    });

    if (!turf) {
      return res
        .status(404)
        .json({ success: false, message: "Turf not found" });
    }

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => {
        return uploadToR2(file.buffer, "kridaz/turfs");
      });

      const imageUrls = await Promise.all(uploadPromises);
      updatedTurfData.image = imageUrls[0];
      updatedTurfData.images = imageUrls;
    }

    // Logic for pending updates
    if (turf.status === "approved") {
      await prisma.turf.update({
        where: { id },
        data: {
          pendingUpdates: updatedTurfData,
          status: "pending",
        },
      });
    } else {
      await prisma.turf.update({
        where: { id },
        data: {
          ...updatedTurfData,
          status: "pending",
        },
      });
    }

    await invalidateCache("turfs:list:*");

    const allTurfs = await prisma.turf.findMany({
      where: { ownerId: ownerProfile.id },
    });
    const formattedAllTurfs = allTurfs.map((t) => ({ ...t, _id: t.id }));
    return res.status(200).json({
      success: true,
      message: "Changes saved and sent for admin review",
      allTurfs: formattedAllTurfs,
    });
  } catch (err) {
    logger.error("Error updating turf:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getTurfDetailsWithSlots = async (req, res) => {
  const { id } = req.params;

  try {
    const turf = await prisma.turf.findUnique({
      where: { id },
      include: {
        timeSlots: {
          include: {
            booking: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                    phone: true,
                    profilePicture: true,
                  },
                },
              },
            },
          },
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!turf) {
      return res
        .status(404)
        .json({ success: false, message: "Turf not found" });
    }

    const processedSlots = turf.timeSlots.map((s) => {
      const booking = s.booking[0]; // Assuming one booking per slot
      return {
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        isBooked: !!booking,
        bookingDetails: booking
          ? {
              user: booking.user
                ? {
                    name: booking.user.name,
                    email: booking.user.email,
                    phoneNumber: booking.user.phone,
                    profileImage: booking.user.profilePicture,
                  }
                : {
                    name: booking.guestName,
                    email: booking.guestEmail,
                    phoneNumber: booking.guestPhone,
                    isGuest: true,
                  },
              totalPrice: booking.totalPrice,
              bookedAt: booking.createdAt,
              bookingSource: booking.bookingSource,
              status: booking.status,
            }
          : null,
      };
    });

    const bookings = processedSlots
      .filter((s) => s.isBooked)
      .map((s) => s.bookingDetails);

    // Generate virtual slots
    const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
    const today = startOfDay(toZonedTime(new Date(), timeZone));

    const allSlots = [...processedSlots];
    const existingSlotTimes = new Set(
      processedSlots.map(
        (s) =>
          `${new Date(s.startTime).getTime()}-${new Date(s.endTime).getTime()}`
      )
    );

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(today, i);
      const dayName = format(currentDate, "EEEE");

      if (turf.offDays && turf.offDays.includes(dayName)) continue;
      if (turf.availableDays && !turf.availableDays.includes(dayName)) continue;

      const generatedSlots = turf.generatedSlots || [];
      for (const template of generatedSlots) {
        if (template.isActive === false) continue;

        try {
          const startTime = parse(template.startTime, "hh:mm a", currentDate);
          const endTime = parse(template.endTime, "hh:mm a", currentDate);

          const utcStart = fromZonedTime(startTime, timeZone);
          const utcEnd = fromZonedTime(endTime, timeZone);

          const timeKey = `${utcStart.getTime()}-${utcEnd.getTime()}`;

          if (!existingSlotTimes.has(timeKey)) {
            allSlots.push({
              id: `virtual_${timeKey}`,
              startTime: utcStart,
              endTime: utcEnd,
              isBooked: false,
              bookingDetails: null,
              price: template.price || turf.pricePerHour,
              isActive: true,
            });
          }
        } catch (err) {
          continue;
        }
      }
    }

    allSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const stats = {
      totalBookings: bookings.filter((b) => b.status !== "CANCELLED").length,
      totalRevenue: bookings
        .filter((b) => b.status !== "CANCELLED")
        .reduce((acc, b) => acc + b.totalPrice, 0),
    };

    return res.status(200).json({
      success: true,
      turf: { ...turf, _id: turf.id },
      slots: allSlots,
      stats,
    });
  } catch (err) {
    logger.error("Error getting turf details with slots:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- ADMIN OPERATIONS ---

export const adminGetAllTurfs = async (req, res) => {
  if (req.admin.role?.toUpperCase() !== "ADMIN") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const turfs = await prisma.turf.findMany({
      include: {
        owner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phone: true,
                profilePicture: true,
              },
            },
          },
        },
        reviews: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedTurfs = turfs.map((t) => {
      const totalRating = t.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avgRating =
        t.reviews.length > 0 ? totalRating / t.reviews.length : 0;

      return {
        ...t,
        _id: t.id,
        avgRating,
        owner: t.owner
          ? {
              id: t.owner.id,
              name: t.owner.user?.name || "",
              email: t.owner.user?.email || "",
              phoneNumber: t.owner.user?.phone || "",
              profileImage: t.owner.user?.profilePicture || null,
              userId: t.owner.user
                ? {
                    id: t.owner.user.id,
                    name: t.owner.user.name,
                    username: t.owner.user.username,
                  }
                : null,
            }
          : null,
      };
    });

    return res.status(200).json({ turfs: formattedTurfs });
  } catch (error) {
    logger.error("Error in adminGetAllTurfs: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const adminApproveTurf = async (req, res) => {
  const { id } = req.params;
  const { name, designation } = req.body;
  try {
    const turf = await prisma.turf.findUnique({
      where: { id },
    });

    if (!turf)
      return res
        .status(404)
        .json({ success: false, message: "Turf not found" });

    const verificationData = {
      adminName: name,
      adminDesignation: designation,
      verifiedAt: new Date(),
      action: "approved",
    };

    let updateData = {
      status: "approved",
      verificationData,
    };

    if (
      turf.pendingUpdates &&
      typeof turf.pendingUpdates === "object" &&
      Object.keys(turf.pendingUpdates).length > 0
    ) {
      updateData = {
        ...updateData,
        ...turf.pendingUpdates,
        pendingUpdates: {},
      };
    }

    const updatedTurf = await prisma.turf.update({
      where: { id },
      data: updateData,
    });

    if (updatedTurf.latitude && updatedTurf.longitude) {
      await updateGeoPoint(
        "Turf",
        updatedTurf.id,
        updatedTurf.latitude,
        updatedTurf.longitude
      );
    }

    await invalidateCache("turfs:list:*");
    await invalidateCache(`turfs:id:${id}`);

    // Sync to Meilisearch
    try {
      const index = meiliClient.index('turfs');
      await index.updateDocuments([{
        id: updatedTurf.id,
        name: updatedTurf.name,
        address: updatedTurf.address || updatedTurf.location,
        city: updatedTurf.city,
        state: updatedTurf.state,
        zipcode: updatedTurf.zipcode,
        pricePerHour: updatedTurf.pricePerHour,
        isActive: updatedTurf.isActive,
        isPlatformBooking: updatedTurf.isPlatformBooking,
        _geo: updatedTurf.latitude && updatedTurf.longitude ? { lat: updatedTurf.latitude, lng: updatedTurf.longitude } : undefined,
        images: updatedTurf.images || []
      }]);
    } catch (e) {
      logger.error("Meilisearch sync failed on edit", e);
    }

    return res.status(200).json({
      success: true,
      message: "Turf approved and changes merged",
      turf: { ...updatedTurf, _id: updatedTurf.id },
    });
  } catch (err) {
    logger.error("Error in adminApproveTurf", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminRejectTurf = async (req, res) => {
  const { id } = req.params;
  const { name, designation, reason } = req.body;
  try {
    const updatedTurf = await prisma.turf.update({
      where: { id },
      data: {
        status: "rejected",
        verificationData: {
          adminName: name,
          adminDesignation: designation,
          verifiedAt: new Date(),
          action: "rejected",
          reason,
        },
      },
    });

    await invalidateCache("turfs:list:*");

    return res.status(200).json({
      success: true,
      message: "Turf rejected",
      turf: { ...updatedTurf, _id: updatedTurf.id },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminDecommissionTurf = async (req, res) => {
  const { id } = req.params;
  const { name, designation } = req.body;
  try {
    const updatedTurf = await prisma.turf.update({
      where: { id },
      data: {
        status: "decommissioned",
        isActive: false,
        verificationData: {
          adminName: name,
          adminDesignation: designation,
          verifiedAt: new Date(),
          action: "decommissioned",
        },
      },
    });

    await invalidateCache("turfs:list:*");

    return res.status(200).json({
      success: true,
      message: "Venue decommissioned. Owner must re-apply for verification.",
      turf: { ...updatedTurf, _id: updatedTurf.id },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminSoftDeleteTurf = async (req, res) => {
  const { id } = req.params;
  const { name, designation } = req.body;
  try {
    const updatedTurf = await prisma.turf.update({
      where: { id },
      data: {
        status: "deleted",
        isActive: false,
        verificationData: {
          adminName: name,
          adminDesignation: designation,
          verifiedAt: new Date(),
          action: "deleted",
        },
      },
    });

    await invalidateCache("turfs:list:*");

    return res.status(200).json({
      success: true,
      message: "Venue moved to deleted list.",
      turf: { ...updatedTurf, _id: updatedTurf.id },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const adminHardDeleteTurf = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction([
      prisma.timeSlot.deleteMany({ where: { turfId: id } }),
      prisma.booking.deleteMany({ where: { turfId: id } }),
      prisma.review.deleteMany({ where: { turfId: id } }),
      prisma.turf.delete({ where: { id } }),
    ]);

    await invalidateCache("turfs:list:*");

    return res
      .status(200)
      .json({
        success: true,
        message: "Venue and all associated data permanently deleted",
      });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleTurfVisibility = async (req, res) => {
  const ownerData = req.owner;
  const { id } = req.params;
  try {
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [
          ...(ownerData.ownerId ? [{ id: ownerData.ownerId }] : []),
          { userId: ownerData.id },
        ],
      },
    });

    if (!ownerProfile) {
      return res
        .status(404)
        .json({ success: false, message: "Owner profile not found" });
    }

    const turf = await prisma.turf.findFirst({
      where: {
        id,
        ownerId: ownerProfile.id,
      },
    });

    if (!turf)
      return res
        .status(404)
        .json({ success: false, message: "Turf not found" });

    const updatedTurf = await prisma.turf.update({
      where: { id },
      data: { isActive: !turf.isActive },
    });

    await invalidateCache("turfs:list:*");

    return res.status(200).json({
      success: true,
      message: `Turf listing ${updatedTurf.isActive ? "enabled" : "disabled"}`,
      isActive: updatedTurf.isActive,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTurf = async (req, res) => {
  const ownerData = req.owner;
  const { id } = req.params;
  try {
    const ownerProfile = await prisma.ownerProfile.findFirst({
      where: {
        OR: [
          ...(ownerData.ownerId ? [{ id: ownerData.ownerId }] : []),
          { userId: ownerData.id },
        ],
      },
    });

    if (!ownerProfile) {
      return res
        .status(404)
        .json({ success: false, message: "Owner profile not found" });
    }

    const turf = await prisma.turf.findFirst({
      where: {
        id,
        ownerId: ownerProfile.id,
      },
    });

    if (!turf)
      return res
        .status(404)
        .json({ success: false, message: "Turf not found or unauthorized" });

    await prisma.$transaction([
      prisma.timeSlot.deleteMany({ where: { turfId: id } }),
      prisma.booking.deleteMany({ where: { turfId: id } }),
      prisma.review.deleteMany({ where: { turfId: id } }),
      prisma.turf.delete({ where: { id } }),
    ]);

    await invalidateCache("turfs:list:*");

    return res
      .status(200)
      .json({ success: true, message: "Arena decommissioned successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Toggle turf like/wishlist
export const toggleTurfLike = async (req, res) => {
  const { turfId } = req.body;
  const userId = req.user.id;

  try {
    const existing = await prisma.turfLike.findUnique({
      where: { userId_turfId: { userId, turfId } },
    });

    if (existing) {
      await prisma.turfLike.delete({ where: { id: existing.id } });
      return res
        .status(200)
        .json({ success: true, message: "Unliked successfully", liked: false });
    }

    await prisma.turfLike.create({ data: { userId, turfId } });
    return res
      .status(200)
      .json({ success: true, message: "Liked successfully", liked: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all liked turfs for the user
export const getLikedTurfs = async (req, res) => {
  const userId = req.user.id;

  try {
    const liked = await prisma.turfLike.findMany({
      where: { userId },
      include: {
        turf: true,
      },
    });

    const rawTurfs = liked.map((item) => item.turf).filter(Boolean);

    // Fetch today's booked timeslots count in batch
    const turfIds = rawTurfs.map((t) => t.id);
    const timeZone = process.env.TIMEZONE || "Asia/Kolkata";
    const startOfToday = fromZonedTime(startOfDay(new Date()), timeZone);
    const endOfToday = addDays(startOfToday, 1);

    const bookedSlots =
      turfIds.length > 0
        ? await prisma.timeSlot.groupBy({
            by: ["turfId"],
            where: {
              turfId: { in: turfIds },
              startTime: { gte: startOfToday, lt: endOfToday },
            },
            _count: { id: true },
          })
        : [];

    const bookedCountMap = {};
    bookedSlots.forEach((bs) => {
      bookedCountMap[bs.turfId] = bs._count.id;
    });

    const turfs = rawTurfs.map((t) => {
      const activeSlots = Array.isArray(t.generatedSlots)
        ? t.generatedSlots.filter((s) => s.isActive !== false)
        : [];
      const bookedCount = bookedCountMap[t.id] || 0;
      const slotsLeft = Math.max(0, activeSlots.length - bookedCount);

      return {
        ...t,
        _id: t.id,
        slotsLeft,
      };
    });

    return res.status(200).json({ success: true, turfs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Record turf share interaction
export const recordTurfShare = async (req, res) => {
  const { turfId } = req.body;
  const userId = req.user?.id || null;

  try {
    await prisma.turfInteraction.create({
      data: { userId, turfId, interactionType: "SHARE" },
    });
    return res
      .status(200)
      .json({ success: true, message: "Share recorded successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Record general turf interaction (VIEW, CLICK, etc.)
export const recordTurfInteraction = async (req, res) => {
  const { turfId, type, duration } = req.body;
  const userId = req.user?.id || null;

  try {
    await prisma.turfInteraction.create({
      data: {
        userId,
        turfId,
        interactionType: type || "VIEW",
        duration: duration || 0,
      },
    });
    return res
      .status(200)
      .json({ success: true, message: "Interaction recorded successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Fetch personalized turf recommendations feed
export const getTurfRecommendations = async (req, res) => {
  const userId = req.user?.id || null;
  const { lat, lng, limit } = req.query;

  try {
    const data = await getGroundRecommendations(userId, lat, lng, limit || 15);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Fetch similar turf recommendations based on turf details and location proximity
export const getSimilarTurfs = async (req, res) => {
  const { id } = req.params;
  const { limit = 4 } = req.query;
  const userId = req.user?.id || null;

  try {
    const currentTurf = await prisma.turf.findUnique({
      where: { id },
    });

    if (!currentTurf) {
      return res
        .status(404)
        .json({ success: false, message: "Turf not found" });
    }

    // Call recommendation service with current turf coordinates as baseline
    const recommendations = await getGroundRecommendations(
      userId,
      currentTurf.latitude,
      currentTurf.longitude,
      parseInt(limit) + 1
    );

    // Filter out the current turf itself from recommendation results
    const filteredRecs = recommendations
      .filter((t) => t.id !== id)
      .slice(0, parseInt(limit));

    return res.status(200).json({
      success: true,
      count: filteredRecs.length,
      data: filteredRecs,
    });
  } catch (err) {
    logger.error("[RECS] Failed to fetch similar recommendations:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
