import { prisma } from "../../config/prisma.js";
import WalletService from "../../services/wallet.service.js";
import WalletBlockingService from "../../services/walletBlocking.service.js";
import logger from "../../utils/logger.js";
import NotificationService from "../../services/notification.service.js";

// --- USER OPERATIONS ---

// Get all professionals with filters
export const getAllProfessionals = async (req, res) => {
  const { role, sport, city, state, searchTerm } = req.query;
  try {
    const where = {
      user: {
        role: {
          in: [
            "COACH",
            "UMPIRE",
            "STREAMER",
            "COMMENTATOR",
            "SCORER",
            "CHEERLEADER",
          ],
        },
      },
    };

    if (role && role !== "All") {
      where.user.role = role.toUpperCase();
    }

    if (city && city !== "All") {
      where.user.city = { contains: city, mode: "insensitive" };
    }

    if (state && state !== "All") {
      where.user.state = { contains: state, mode: "insensitive" };
    }

    if (searchTerm) {
      where.OR = [
        { user: { name: { contains: searchTerm, mode: "insensitive" } } },
        { specialization: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (sport && sport !== "All") {
      where.user.sportTypes = { has: sport };
    }

    const professionals = await prisma.ownerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            city: true,
            state: true,
            profilePicture: true,
            sportTypes: true,
          },
        },
      },
      orderBy: [{ rating: "desc" }, { numReviews: "desc" }],
      take: 100,
    });

    const mappedProfessionals = professionals.map((prof) => ({
      id: prof.id,
      userId: prof.user?.id,
      name: prof.user?.name || "",
      role: prof.user?.role || "",
      city: prof.user?.city || "",
      state: prof.user?.state || "",
      image: prof.user?.profilePicture || null,
      gameTypes: prof.user?.sportTypes || [],
      specialization: prof.specialization,
      experience: prof.experience,
      rating: prof.rating,
      numReviews: prof.numReviews,
    }));

    return res.status(200).json({ professionals: mappedProfessionals });
  } catch (error) {
    logger.error("Error in getAllProfessionals:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get unique states and cities for filters
export const getProfessionalFilters = async (req, res) => {
  try {
    const roles = [
      "COACH",
      "UMPIRE",
      "STREAMER",
      "COMMENTATOR",
      "SCORER",
      "CHEERLEADER",
    ];

    const statesData = await prisma.user.findMany({
      where: { role: { in: roles } },
      select: { state: true },
      distinct: ["state"],
    });

    const citiesData = await prisma.user.findMany({
      where: { role: { in: roles } },
      select: { city: true },
      distinct: ["city"],
    });

    return res.status(200).json({
      states: statesData.map((s) => s.state).filter(Boolean),
      cities: citiesData.map((c) => c.city).filter(Boolean),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get professional by ID with availability and reviews
export const getProfessionalById = async (req, res) => {
  const { id } = req.params;
  const { date } = req.query; // Optional date for availability
  try {
    const professional = await prisma.ownerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            city: true,
            state: true,
            profilePicture: true,
            sportTypes: true,
            phone: true,
            gender: true,
            dob: true,
            lastSeen: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, profilePicture: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!professional)
      return res.status(404).json({ message: "Professional not found" });

    // Fetch follower and following counts
    const followersCount = await prisma.userRelationship.count({
      where: { targetId: professional.userId, type: "FOLLOW" },
    });

    const followingCount = await prisma.userRelationship.count({
      where: { userId: professional.userId, type: "FOLLOW" },
    });

    // Check if the current logged-in user is following this professional
    let isFollowing = false;
    if (req.user && req.user.id) {
      const relationship = await prisma.userRelationship.findUnique({
        where: {
          userId_targetId_type: {
            userId: req.user.id,
            targetId: professional.userId,
            type: "FOLLOW",
          },
        },
      });
      isFollowing = !!relationship;
    }

    // Fetch professional's posts
    const posts = await prisma.post.findMany({
      where: { authorId: professional.userId, status: "ready" },
      include: {
        likes: { select: { id: true } },
        comments: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const formattedPosts = posts.map((p) => ({
      id: p.id,
      content: p.content || p.title,
      mediaType: p.mediaType,
      mediaUrls: p.mediaUrls,
      likesCount: p.likes.length,
      commentsCount: p.comments.length,
      createdAt: p.createdAt,
    }));

    // Fetch availability for the specific date
    let availability = null;
    if (date) {
      availability = await prisma.professionalAvailability.findFirst({
        where: { professionalId: id, date },
      });
    }

    return res.status(200).json({
      professional,
      availability,
      reviews: professional.reviews,
      followersCount,
      followingCount,
      isFollowing,
      posts: formattedPosts,
    });
  } catch (error) {
    logger.error("Error in getProfessionalById:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Book a professional (Reserve Coins)
export const bookProfessional = async (req, res) => {
  const userId = (req.user.id || req.user.user).toString();
  const { professionalId, date, slots, totalAmount, bookingType, message } =
    req.body;

  try {
    const usableBalance = await WalletService.getUsableBalance(userId, "user");
    if (usableBalance < totalAmount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Reserve balance using WalletService (it uses tx internally if passed)
      await WalletService.reserve(userId, "user", totalAmount, tx);

      // 2. Create a pending booking
      const booking = await tx.professionalBooking.create({
        data: {
          userId,
          professionalId,
          date,
          slots,
          totalAmount: parseFloat(totalAmount),
          bookingType,
          message,
          status: "PENDING",
        },
      });

      // 3. Mark slots as pending/unavailable in availability
      const availability = await tx.professionalAvailability.findUnique({
        where: { professionalId_date: { professionalId, date } },
      });

      if (availability) {
        const updatedSlots = availability.slots.map((slot) => {
          if (slots.some((s) => s.startTime === slot.startTime)) {
            return {
              ...slot,
              isAvailable: false,
              bookedBy: userId,
              bookingId: booking.id,
            };
          }
          return slot;
        });

        await tx.professionalAvailability.update({
          where: { id: availability.id },
          data: { slots: updatedSlots },
        });
      }

      // Fetch user and professional details for notification
      const user = await tx.user.findUnique({ where: { id: userId } });
      const professional = await tx.ownerProfile.findUnique({
        where: { id: professionalId },
        include: { user: true },
      });

      NotificationService.publishEvent("PRO_BOOKING_CREATED", {
        recipientId: professional.userId,
        recipientModel: "OwnerProfile",
        email: professional.user?.email,
        phone: professional.user?.phone,
        customerName: user?.name,
        date: date,
        bookingType: bookingType,
        totalAmount: totalAmount,
      });
    });

    return res
      .status(201)
      .json({ message: "Booking request sent successfully. Coins reserved." });
  } catch (error) {
    logger.error("Error in bookProfessional:", error);
    return res.status(500).json({ message: error.message });
  }
};

// --- PROFESSIONAL OPERATIONS ---

// Update availability (Set slots)
export const updateAvailability = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId)
    return res
      .status(403)
      .json({ message: "Only partners can set availability" });
  const { date, slots } = req.body;

  try {
    const availability = await prisma.professionalAvailability.upsert({
      where: { professionalId_date: { professionalId, date } },
      update: { slots },
      create: { professionalId, date, slots },
    });
    return res
      .status(200)
      .json({ message: "Availability updated", availability });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get professional bookings (Requests)
export const getMyBookings = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId)
    return res
      .status(403)
      .json({ message: "Only partners can view their bookings" });
  try {
    const bookings = await prisma.professionalBooking.findMany({
      where: { professionalId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ bookings });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Handle booking request (Accept/Reject)
export const handleBookingRequest = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });
  const { bookingId, status, rejectionReason } = req.body;

  try {
    const booking = await prisma.professionalBooking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.professionalId !== professionalId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await prisma.$transaction(async (tx) => {
      if (status === "ACCEPTED") {
        // 1. Deduct coins from user (Release + Debit)
        await WalletService.release(
          booking.userId,
          "user",
          booking.totalAmount,
          true,
          tx
        );

        // 2. Add coins to professional
        await WalletService.credit(
          professionalId,
          "owner",
          booking.totalAmount,
          tx
        );

        // Fetch the professional's userId
        const profProfile = await tx.ownerProfile.findUnique({
          where: { id: professionalId },
          select: { userId: true },
        });
        if (!profProfile) {
          throw new Error("Professional profile not found");
        }
        const profUserId = profProfile.userId;

        // 3. Create wallet transactions
        await tx.walletTransaction.createMany({
          data: [
            {
              userId: booking.userId,
              amount: booking.totalAmount,
              type: "DEBIT",
              status: "SUCCESS",
              description: `Paid for ${booking.bookingType} session with professional`,
            },
            {
              userId: profUserId,
              amount: booking.totalAmount,
              type: "CREDIT",
              status: "SUCCESS",
              description: `Earnings from ${booking.bookingType} session`,
            },
          ],
        });

        await tx.professionalBooking.update({
          where: { id: bookingId },
          data: { status: "ACCEPTED" },
        });

        // 4. Auto-create tasks for the booked slots
        const user = await tx.user.findUnique({
          where: { id: booking.userId },
        });
        if (user) {
          // Check if customer exists in directory
          let customer = await tx.professionalCustomer.findFirst({
            where: { professionalId, userId: booking.userId },
          });

          if (!customer) {
            customer = await tx.professionalCustomer.create({
              data: {
                professionalId,
                userId: booking.userId,
                name: user.name,
                email: user.email,
                phone: user.phone,
              },
            });
          }

          // Generate tasks per slot
          if (booking.slots && Array.isArray(booking.slots)) {
            const tasks = booking.slots.map((slot) => ({
              professionalId,
              customerId: customer.id,
              title: `${booking.bookingType} with ${user.name}`,
              description: booking.message || "Auto-generated from booking",
              date: new Date(booking.date),
              startTime: slot.startTime,
              endTime: slot.endTime,
              reminderMinutes: 30,
            }));

            await tx.professionalTask.createMany({ data: tasks });
          }
        }
      } else if (status === "REJECTED") {
        // 1. Release reserved balance for user
        await WalletService.release(
          booking.userId,
          "user",
          booking.totalAmount,
          false,
          tx
        );

        // 2. Make slots available again
        const availability = await tx.professionalAvailability.findUnique({
          where: {
            professionalId_date: {
              professionalId: booking.professionalId,
              date: booking.date,
            },
          },
        });

        if (availability) {
          const updatedSlots = availability.slots.map((slot) => {
            if (booking.slots.some((s) => s.startTime === slot.startTime)) {
              return {
                ...slot,
                isAvailable: true,
                bookedBy: null,
                bookingId: null,
              };
            }
            return slot;
          });

          await tx.professionalAvailability.update({
            where: { id: availability.id },
            data: { slots: updatedSlots },
          });
        }

        await tx.professionalBooking.update({
          where: { id: bookingId },
          data: { status: "REJECTED", rejectionReason },
        });

        const user = await tx.user.findUnique({
          where: { id: booking.userId },
        });
        const professional = await tx.ownerProfile.findUnique({
          where: { id: professionalId },
          include: { user: true },
        });

        NotificationService.publishEvent("PRO_BOOKING_REJECTED", {
          recipientId: booking.userId,
          recipientModel: "User",
          email: user?.email,
          phone: user?.phone,
          professionalName: professional.user?.name,
          date: booking.date,
          bookingType: booking.bookingType,
          totalAmount: booking.totalAmount,
        });
      }
    });

    // We can also publish ACCEPTED event after transaction
    if (status === "ACCEPTED") {
      const user = await prisma.user.findUnique({
        where: { id: booking.userId },
      });
      const professional = await prisma.ownerProfile.findUnique({
        where: { id: professionalId },
        include: { user: true },
      });

      NotificationService.publishEvent("PRO_BOOKING_ACCEPTED", {
        recipientId: booking.userId,
        recipientModel: "User",
        email: user?.email,
        phone: user?.phone,
        professionalName: professional.user?.name,
        date: booking.date,
        bookingType: booking.bookingType,
        totalAmount: booking.totalAmount,
      });
    }

    return res
      .status(200)
      .json({ message: `Booking ${status.toLowerCase()} successfully` });
  } catch (error) {
    logger.error("Error in handleBookingRequest:", error);
    return res.status(500).json({ message: error.message });
  }
};

// --- REVIEW OPERATIONS ---

export const addProfessionalReview = async (req, res) => {
  const userId = (req.user.id || req.user.user).toString();
  const { professionalId, rating, comment } = req.body;
  try {
    const review = await prisma.review.create({
      data: {
        userId,
        professionalId,
        rating: parseInt(rating),
        comment,
      },
    });

    // Update professional rating and numReviews
    const professional = await prisma.ownerProfile.findUnique({
      where: { id: professionalId },
    });
    if (professional) {
      const currentRating = professional.rating || 0;
      const currentReviews = professional.numReviews || 0;
      const newNumReviews = currentReviews + 1;
      const newRating =
        (currentRating * currentReviews + rating) / newNumReviews;

      await prisma.ownerProfile.update({
        where: { id: professionalId },
        data: {
          rating: newRating,
          numReviews: newNumReviews,
        },
      });
    }

    return res.status(201).json({ message: "Review added", review });
  } catch (error) {
    logger.error("Error in addProfessionalReview:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const replyToReview = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });
  const { reviewId, reply } = req.body;
  try {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.professionalId !== professionalId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        reply,
        replyDate: new Date(),
      },
    });

    return res
      .status(200)
      .json({ message: "Reply added", review: updatedReview });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateProfessionalProfile = async (req, res) => {
  const userId = req.user.id;
  if (!userId) return res.status(403).json({ message: "Unauthorized" });
  const {
    name,
    bio,
    hourlyPrice,
    gameTypes,
    city,
    state,
    specialization,
    experience,
    certifications,
    gender,
    dob,
    address,
    pinCode,
    coachingLevel,
    availabilityTimings,
    availabilityMode,
    preferredLocations,
    trainingTypes,
    ageGroups,
    languages,
    achievements,
    // New fields
    profilePicture,
    bannerUrl,
    instagram,
    linkedin,
    youtube,
    streamPlatforms,
    matchesCovered,
    camerasSupported,
    streamQuality,
    liveScoringSupport,
    matchFormats,
    liveCommentarySupported,
    panelDiscussionEnabled,
    structuredAchievements,
    portfolio,
    isOnline,
  } = req.body;

  try {
    let updatedProfessional = null;

    // 1. Get OwnerProfile outside of transaction to avoid holding locks
    let owner = await prisma.ownerProfile.findUnique({
      where: { userId: userId },
      select: { id: true, userId: true, businessDetails: true },
    });

    if (!owner) {
      owner = await prisma.ownerProfile.create({
        data: {
          userId: userId,
          businessName: name || "Independent Professional",
          gender: gender || "Other",
        },
        select: { id: true, userId: true, businessDetails: true },
      });
    }

    const professionalId = owner.id;

    await prisma.$transaction(
      async (tx) => {
        // 2. Update User details if name, city, state, gameTypes or profilePicture are provided
        const userUpdate = {};
        if (name) userUpdate.name = name;
        if (city) userUpdate.city = city;
        if (state) userUpdate.state = state;
        if (gameTypes) userUpdate.sportTypes = gameTypes;
        if (profilePicture !== undefined)
          userUpdate.profilePicture = profilePicture;

        if (Object.keys(userUpdate).length > 0) {
          await tx.user.update({
            where: { id: owner.userId },
            data: userUpdate,
          });
        }

        // Merge businessDetails safely for backwards-compatibility
        const existingDetails =
          owner.businessDetails && typeof owner.businessDetails === "object"
            ? owner.businessDetails
            : {};
        const newBusinessDetails = {
          ...existingDetails,
          address,
          pinCode,
          specialization,
          experience,
          preferredLocations:
            preferredLocations || existingDetails.preferredLocations,
          availabilityMode:
            availabilityMode || existingDetails.availabilityMode,
          availabilityTimings:
            availabilityTimings || existingDetails.availabilityTimings,
          portfolio: portfolio || existingDetails.portfolio,
        };

        // 3. Update OwnerProfile details
        const updateData = {
          bio,
          price: hourlyPrice ? parseFloat(hourlyPrice) : undefined,
          gender,
          dob: dob ? new Date(dob) : undefined,
          coachingLevel,
          isOnline: isOnline !== undefined ? !!isOnline : undefined,
          bannerUrl: bannerUrl !== undefined ? bannerUrl : undefined,
          instagram: instagram !== undefined ? instagram : undefined,
          linkedin: linkedin !== undefined ? linkedin : undefined,
          youtube: youtube !== undefined ? youtube : undefined,
          streamPlatforms:
            streamPlatforms !== undefined ? streamPlatforms : undefined,
          matchesCovered:
            matchesCovered !== undefined ? String(matchesCovered) : undefined,
          camerasSupported:
            camerasSupported !== undefined
              ? parseInt(camerasSupported) || null
              : undefined,
          streamQuality:
            streamQuality !== undefined ? streamQuality : undefined,
          liveScoringSupport:
            liveScoringSupport !== undefined ? !!liveScoringSupport : undefined,
          matchFormats: matchFormats !== undefined ? matchFormats : undefined,
          liveCommentarySupported:
            liveCommentarySupported !== undefined
              ? !!liveCommentarySupported
              : undefined,
          panelDiscussionEnabled:
            panelDiscussionEnabled !== undefined
              ? !!panelDiscussionEnabled
              : undefined,
          structuredAchievements:
            structuredAchievements !== undefined
              ? structuredAchievements
              : undefined,
          portfolio: portfolio !== undefined ? portfolio : undefined,
          trainingTypes,
          ageGroups,
          languages,
          achievements,
          experience,
          specialization,
          certifications:
            certifications !== undefined
              ? Array.isArray(certifications)
                ? certifications.map((cert) =>
                    typeof cert === "object" && cert !== null
                      ? JSON.stringify(cert)
                      : String(cert)
                  )
                : []
              : undefined,
          businessDetails: newBusinessDetails,
        };

        updatedProfessional = await tx.ownerProfile.update({
          where: { id: professionalId },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                city: true,
                state: true,
                profilePicture: true,
              },
            },
          },
        });
      },
      {
        timeout: 25000, // 25 seconds timeout to prevent dev environment transaction timeout issues
      }
    );

    return res.status(200).json({
      message: "Profile updated successfully",
      professional: updatedProfessional,
    });
  } catch (error) {
    logger.error("Error in updateProfessionalProfile:", error);
    return res.status(500).json({ message: error.message });
  }
};

// --- PRACTICE SCHEDULING & CUSTOMERS ---

export const getProfessionalTasks = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });

  const { startDate, endDate } = req.query;

  try {
    const tasks = await prisma.professionalTask.findMany({
      where: {
        professionalId,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return res.status(200).json({ tasks });
  } catch (error) {
    logger.error("Error in getProfessionalTasks:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const createProfessionalTask = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });

  const {
    title,
    description,
    date,
    startTime,
    endTime,
    customerId,
    reminderMinutes,
  } = req.body;

  try {
    // Basic slot validation to ensure max 2 tasks per slot
    const existingTasksInSlot = await prisma.professionalTask.count({
      where: {
        professionalId,
        date: new Date(date),
        startTime,
      },
    });

    if (existingTasksInSlot >= 2) {
      return res
        .status(400)
        .json({ message: "Maximum of 2 tasks allowed per 2-hour slot." });
    }

    const task = await prisma.professionalTask.create({
      data: {
        professionalId,
        title,
        description,
        date: new Date(date),
        startTime,
        endTime,
        customerId: customerId || null,
        reminderMinutes: parseInt(reminderMinutes) || 30,
      },
      include: {
        customer: true,
      },
    });

    return res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    logger.error("Error in createProfessionalTask:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getProfessionalCustomers = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });

  try {
    const customers = await prisma.professionalCustomer.findMany({
      where: { professionalId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ customers });
  } catch (error) {
    logger.error("Error in getProfessionalCustomers:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const createProfessionalCustomer = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });

  const { name, email, phone, userId } = req.body;

  try {
    const customer = await prisma.professionalCustomer.create({
      data: {
        professionalId,
        name,
        email,
        phone,
        userId: userId || null,
      },
    });

    return res
      .status(201)
      .json({ message: "Customer added successfully", customer });
  } catch (error) {
    logger.error("Error in createProfessionalCustomer:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateWorkingHours = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });

  const { workingHours } = req.body;

  try {
    const updatedProfile = await prisma.ownerProfile.update({
      where: { id: professionalId },
      data: { workingHours },
    });

    return res.status(200).json({
      message: "Working hours updated successfully",
      workingHours: updatedProfile.workingHours,
    });
  } catch (error) {
    logger.error("Error in updateWorkingHours:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getUserProfessionalBookings = async (req, res) => {
  const userId = (req.user.id || req.user.user).toString();
  try {
    const bookings = await prisma.professionalBooking.findMany({
      where: { userId },
      include: {
        professional: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                profilePicture: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    logger.error("Error in getUserProfessionalBookings:", error);
    return res.status(500).json({ message: error.message });
  }
};

// --- ON-DEMAND MATCHING & VERIFICATION OPERATIONS ---

export const toggleOnlineStatus = async (req, res) => {
  const userId = req.user.id;
  const { isOnline, latitude, longitude } = req.body;
  try {
    const owner = await prisma.ownerProfile.findUnique({
      where: { userId: userId },
      select: { id: true, isOnline: true },
    });
    if (!owner)
      return res
        .status(403)
        .json({ message: "Only professionals can toggle online status" });

    const professionalId = owner.id;
    const isCurrentlyOnline = owner.isOnline;
    const newIsOnline = !!isOnline;

    const updated = await prisma.$transaction(async (tx) => {
      if (newIsOnline && !isCurrentlyOnline) {
        // Toggling ON
        await tx.professionalOnlineSession.create({
          data: { professionalId },
        });
      } else if (!newIsOnline && isCurrentlyOnline) {
        // Toggling OFF
        const activeSession = await tx.professionalOnlineSession.findFirst({
          where: { professionalId, offlineAt: null },
          orderBy: { createdAt: "desc" },
        });
        if (activeSession) {
          const offlineAt = new Date();
          const durationHours =
            (offlineAt.getTime() - activeSession.onlineAt.getTime()) /
            (1000 * 60 * 60);
          await tx.professionalOnlineSession.update({
            where: { id: activeSession.id },
            data: { offlineAt, durationHours },
          });
        }
      }

      return await tx.ownerProfile.update({
        where: { id: professionalId },
        data: {
          isOnline: newIsOnline,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          lastLocationUpdate: latitude && longitude ? new Date() : null,
        },
      });
    });
    return res.status(200).json({ success: true, isOnline: updated.isOnline });
  } catch (error) {
    logger.error("Error in toggleOnlineStatus:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const createMatchRequest = async (req, res) => {
  const userId = (req.user.id || req.user.user).toString();
  const {
    groundId,
    customLocation,
    roles,
    minBudget,
    maxBudget,
    expiresAt,
    matchDate,
    matchStartTime,
    matchEndTime,
  } = req.body;
  try {
    if (!groundId && !customLocation) {
      return res
        .status(400)
        .json({ message: "Ground ID or Custom Location is mandatory." });
    }
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one role must be specified." });
    }
    const limitMinBudget = minBudget ? parseFloat(minBudget) : 500.0;
    const limitMaxBudget = maxBudget ? parseFloat(maxBudget) : 10000.0;

    let latitude = 0.0;
    let longitude = 0.0;
    if (groundId) {
      const ground = await prisma.turf.findUnique({ where: { id: groundId } });
      if (!ground)
        return res.status(404).json({ message: "Ground not found." });
      latitude = parseFloat(ground.latitude);
      longitude = parseFloat(ground.longitude);
    } else {
      if (
        !customLocation ||
        !customLocation.latitude ||
        !customLocation.longitude
      ) {
        return res.status(400).json({
          message: "Custom location coordinates (lat, lon) are required.",
        });
      }
      latitude = parseFloat(customLocation.latitude);
      longitude = parseFloat(customLocation.longitude);
    }

    const usableBalance = await WalletService.getUsableBalance(userId, "user");
    if (usableBalance < limitMaxBudget) {
      return res.status(400).json({
        message: `Insufficient wallet balance. You need at least ₹${limitMaxBudget} to request matching.`,
      });
    }

    const requestTimeout = expiresAt
      ? new Date(expiresAt)
      : new Date(Date.now() + 120000);

    const candidateProfiles = await prisma.ownerProfile.findMany({
      where: {
        isOnline: true,
        price: { lte: limitMaxBudget },
        user: {
          role: { in: roles },
        },
      },
      include: { user: true },
    });

    const candidatesWithDistance = candidateProfiles.map((prof) => {
      if (!prof.latitude || !prof.longitude)
        return { ...prof, distance: Infinity };
      const lat1 = parseFloat(prof.latitude);
      const lon1 = parseFloat(prof.longitude);
      const lat2 = latitude;
      const lon2 = longitude;

      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return { ...prof, distance };
    });

    // Sorting logic based on multiple tiers:
    // 1. Trust Score (Primary)
    // 2. Acceptance Rate (Tie-breaker 1)
    // 3. DAAT (Tie-breaker 2)
    // 4. Distance (Fallback tie-breaker)
    const sortEngine = (a, b) => {
      const tsA = a.trustScore || 100;
      const tsB = b.trustScore || 100;
      if (tsB !== tsA) return tsB - tsA;

      const arA = a.acceptanceRate30d || 100;
      const arB = b.acceptanceRate30d || 100;
      if (arB !== arA) return arB - arA;

      const daatA = a.avgDailyActivePct || 0;
      const daatB = b.avgDailyActivePct || 0;
      if (daatB !== daatA) return daatB - daatA;

      return a.distance - b.distance;
    };

    // Architecture spec: 50km initial radius, expand to 100km if < 3 candidates
    let matchedPros = candidatesWithDistance
      .filter((prof) => prof.distance <= 50.0)
      .sort(sortEngine);

    if (matchedPros.length < 3) {
      matchedPros = candidatesWithDistance
        .filter((prof) => prof.distance <= 100.0)
        .sort(sortEngine);
    }

    if (matchedPros.length === 0) {
      return res.status(404).json({
        message:
          "No professionals found matching your criteria in the nearby area. Try expanding your budget or changing the role.",
      });
    }

    const candidateIds = matchedPros.map((p) => p.id);
    const firstCandidateId = candidateIds[0];

    const { matchRequest, offer } = await prisma.$transaction(async (tx) => {
      // Deactivate other searching requests for same user to avoid collision
      await tx.professionalMatchRequest.updateMany({
        where: { userId, status: "SEARCHING" },
        data: { status: "EXPIRED" },
      });

      const newReq = await tx.professionalMatchRequest.create({
        data: {
          userId,
          groundId: groundId || null,
          customLocation: customLocation || null,
          latitude,
          longitude,
          roles: { set: roles },
          minBudget: limitMinBudget,
          maxBudget: limitMaxBudget,
          matchDate: matchDate || null,
          matchStartTime: matchStartTime || null,
          matchEndTime: matchEndTime || null,
          queuePositions: candidateIds,
          currentPositionIndex: 0,
          lastRoutedAt: new Date(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min request TTL
        },
      });

      const createdOffer = await tx.professionalMatchOffer.create({
        data: {
          requestId: newReq.id,
          professionalId: firstCandidateId,
          status: "PENDING",
        },
      });

      return { matchRequest: newReq, offer: createdOffer };
    });

    const { getIO } = await import("../../config/socket.js");
    const io = getIO();
    if (io) {
      const firstProf = matchedPros[0];
      io.to(firstProf.userId).emit("professional:match_offer", {
        offerId: offer.id,
        requestId: matchRequest.id,
        groundName: groundId ? "Selected Venue" : "Custom Location",
        budget: `${limitMinBudget} - ${limitMaxBudget}`,
        expiresAt: new Date(Date.now() + 60000), // Offer expires in 60s for this specific pro
      });
    }

    return res
      .status(201)
      .json({ success: true, matchRequest, matchedCount: matchedPros.length });
  } catch (error) {
    logger.error("Error in createMatchRequest:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const acceptMatchOffer = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });
  const { offerId } = req.params;

  try {
    const offer = await prisma.professionalMatchOffer.findUnique({
      where: { id: offerId },
      include: { request: { include: { user: true } } },
    });

    if (!offer) return res.status(404).json({ message: "Offer not found." });
    if (offer.status !== "PENDING" || offer.request.status !== "SEARCHING") {
      return res
        .status(400)
        .json({ message: "This request is no longer available." });
    }

    const userId = offer.request.userId;
    const limitMaxBudget = parseFloat(offer.request.maxBudget);
    const usableBalance = await WalletService.getUsableBalance(userId, "user");

    if (usableBalance < limitMaxBudget) {
      return res.status(400).json({
        message:
          "Customer no longer has sufficient wallet balance for this booking.",
      });
    }

    const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const argon2 = await import("argon2");
    const otpHash = await argon2.hash(plainOtp);

    let matchEndParsed = null;
    if (offer.request.matchDate && offer.request.matchEndTime) {
      matchEndParsed = new Date(
        `${offer.request.matchDate}T${offer.request.matchEndTime}:00Z`
      );
      if (isNaN(matchEndParsed.getTime())) {
        matchEndParsed = null;
      }
    }

    const booking = await prisma.$transaction(async (tx) => {
      // 1. Reserve coins now that a professional accepted
      await WalletService.reserve(userId, "user", limitMaxBudget, tx);

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: limitMaxBudget,
          type: "PRO_MATCH",
          status: "RESERVED",
          description: `Reserved for professional matchmaking: ${offer.request.roles.join(", ")}`,
        },
      });

      await tx.professionalMatchRequest.update({
        where: { id: offer.requestId },
        data: { status: "MATCHED" },
      });

      await tx.professionalMatchOffer.update({
        where: { id: offerId },
        data: { status: "ACCEPTED" },
      });

      await tx.professionalMatchOffer.updateMany({
        where: { requestId: offer.requestId, id: { not: offerId } },
        data: { status: "EXPIRED" },
      });

      return tx.onDemandProfessionalBooking.create({
        data: {
          requestId: offer.requestId,
          userId: offer.request.userId,
          professionalId,
          role: offer.request.roles[0],
          groundId: offer.request.groundId,
          customLocation: offer.request.customLocation,
          latitude: offer.request.latitude,
          longitude: offer.request.longitude,
          hourlyRate: limitMaxBudget,
          matchDate: offer.request.matchDate,
          matchStartTime: offer.request.matchStartTime,
          matchEndTime: offer.request.matchEndTime,
          matchEndParsed,
          otpHash,
          status: "ASSIGNED",
        },
      });
    });

    const { getIO } = await import("../../config/socket.js");
    const io = getIO();
    if (io) {
      io.to(offer.request.userId).emit("professional:match_confirmed", {
        bookingId: booking.id,
        professionalName: req.user.name || "Matched Pro",
        otp: plainOtp,
      });
      io.to(req.user.id).emit("professional:booking_assigned", {
        bookingId: booking.id,
        customerName: offer.request.user.name,
        location: offer.request.customLocation || "Venue",
      });
    }

    const customerUser = await prisma.user.findUnique({
      where: { id: offer.request.userId },
    });
    NotificationService.publishEvent("PRO_ONDEMAND_MATCHED", {
      recipientId: offer.request.userId,
      recipientModel: "User",
      email: customerUser?.email,
      phone: customerUser?.phone,
      professionalName: req.user.name || "A professional",
      date: offer.request.matchDate,
      time: offer.request.matchStartTime,
      amount: limitMaxBudget,
      otp: plainOtp,
    });

    return res.status(200).json({ success: true, booking, otp: plainOtp });
  } catch (error) {
    logger.error("Error in acceptMatchOffer:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const rejectMatchOffer = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });
  const { offerId } = req.params;
  try {
    const offer = await prisma.professionalMatchOffer.findUnique({
      where: { id: offerId },
      include: { request: true },
    });

    if (!offer) return res.status(404).json({ message: "Offer not found." });

    const updatedOffer = await prisma.professionalMatchOffer.update({
      where: { id: offerId },
      data: { status: "REJECTED" },
    });

    const matchReq = offer.request;

    // Sequential routing logic
    if (matchReq.status === "SEARCHING" && matchReq.queuePositions) {
      const queuePositions = matchReq.queuePositions;
      const nextIndex = matchReq.currentPositionIndex + 1;

      if (nextIndex < queuePositions.length) {
        // Route to next candidate
        const nextCandidateId = queuePositions[nextIndex];

        const offer = await prisma.$transaction(async (tx) => {
          await tx.professionalMatchRequest.update({
            where: { id: matchReq.id },
            data: {
              currentPositionIndex: nextIndex,
              lastRoutedAt: new Date(),
            },
          });

          return tx.professionalMatchOffer.create({
            data: {
              requestId: matchReq.id,
              professionalId: nextCandidateId,
              status: "PENDING",
            },
          });
        });

        // Notify next candidate
        const nextProf = await prisma.ownerProfile.findUnique({
          where: { id: nextCandidateId },
        });
        if (nextProf && nextProf.userId) {
          const { getIO } = await import("../../config/socket.js");
          const io = getIO();
          if (io) {
            io.to(nextProf.userId).emit("professional:match_offer", {
              offerId: offer.id,
              requestId: matchReq.id,
              groundName: matchReq.groundId
                ? "Selected Venue"
                : "Custom Location",
              budget: `${matchReq.minBudget} - ${matchReq.maxBudget}`,
              expiresAt: new Date(Date.now() + 60000),
            });
          }
        }
      } else {
        // Exhausted queue
        await prisma.professionalMatchRequest.update({
          where: { id: matchReq.id },
          data: { status: "EXHAUSTED" },
        });

        // Notify user that matching failed
        const { getIO } = await import("../../config/socket.js");
        const io = getIO();
        if (io) {
          io.to(matchReq.userId).emit("professional:match_failed", {
            requestId: matchReq.id,
            reason: "exhausted",
            message:
              "All nearby professionals rejected or timed out. Please try again later or adjust budget/criteria.",
          });
        }
      }
    }

    return res.status(200).json({ success: true, offer: updatedOffer });
  } catch (error) {
    logger.error("Error in rejectMatchOffer:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const verifyOTPCheckIn = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });
  const { bookingId } = req.params;
  const { otp } = req.body;

  try {
    const booking = await prisma.onDemandProfessionalBooking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking)
      return res.status(404).json({ message: "Booking not found." });
    if (booking.professionalId !== professionalId) {
      return res.status(403).json({ message: "Unauthorized booking access." });
    }
    if (booking.status !== "ASSIGNED") {
      return res
        .status(400)
        .json({ message: `Booking status is already ${booking.status}.` });
    }

    const argon2 = await import("argon2");
    const isValid = await argon2.verify(booking.otpHash, otp.toString());
    if (!isValid) {
      return res.status(400).json({
        message: "Invalid OTP code. Please verify with the customer.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await WalletService.release(
        booking.userId,
        "user",
        booking.hourlyRate,
        true,
        tx
      );
      await WalletService.credit(
        professionalId,
        "owner",
        booking.hourlyRate,
        tx
      );

      const profProfile = await tx.ownerProfile.findUnique({
        where: { id: professionalId },
        select: { userId: true },
      });

      await tx.walletTransaction.createMany({
        data: [
          {
            userId: booking.userId,
            amount: booking.hourlyRate,
            type: "DEBIT",
            status: "SUCCESS",
            description: `Paid for on-demand ${booking.role} session (OTP Verified)`,
          },
          {
            userId: profProfile.userId,
            amount: booking.hourlyRate,
            type: "CREDIT",
            status: "SUCCESS",
            description: `Earnings from on-demand ${booking.role} session`,
          },
        ],
      });

      await tx.onDemandProfessionalBooking.update({
        where: { id: bookingId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    });

    NotificationService.publishEvent("PRO_BOOKING_COMPLETED", {
      recipientId: booking.userId,
      recipientModel: "User",
      email: booking.user?.email,
      phone: booking.user?.phone,
      professionalName: req.user.name || "The professional",
      amount: booking.hourlyRate,
      date: booking.matchDate,
    });

    return res.status(200).json({
      success: true,
      message: "Check-in successful. Funds transferred.",
    });
  } catch (error) {
    logger.error("Error in verifyOTPCheckIn:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getMyOnDemandBookings = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) return res.status(403).json({ message: "Unauthorized" });
  try {
    const bookings = await prisma.onDemandProfessionalBooking.findMany({
      where: { professionalId },
      include: {
        user: {
          select: { id: true, name: true, profilePicture: true },
        },
        ground: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Pending offers (not yet accepted/rejected — still awaiting response)
    const pendingOffers = await prisma.professionalMatchOffer.findMany({
      where: {
        professionalId,
        status: "PENDING",
      },
      include: {
        request: {
          include: {
            user: { select: { id: true, name: true, profilePicture: true } },
            ground: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const rejectedOffers = await prisma.professionalMatchOffer.findMany({
      where: {
        professionalId,
        status: { in: ["REJECTED", "EXPIRED"] },
      },
      include: {
        request: {
          include: {
            user: { select: { id: true, name: true, profilePicture: true } },
            ground: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const skippedNotifications = await prisma.bookingNotification.findMany({
      where: { professionalId, action: "SKIPPED" },
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, profilePicture: true } },
            ground: true,
          },
        },
      },
      orderBy: { sentAt: "desc" },
    });

    // Pending offers shown in Active tab with PENDING status
    const pendingBookings = pendingOffers.map((o) => ({
      id: o.id,
      status: "PENDING",
      createdAt: o.createdAt,
      hourlyRate: parseFloat(o.request?.maxBudget || 0),
      matchDate: o.request?.matchDate || null,
      matchStartTime: o.request?.matchStartTime || null,
      matchEndTime: o.request?.matchEndTime || null,
      user: o.request?.user,
      ground: o.request?.ground,
      customLocation: o.request?.customLocation,
      role: o.request?.roles?.[0] || "Professional",
    }));

    const nonAcceptedBookings = [
      ...rejectedOffers.map((o) => ({
        id: o.id,
        status: "NOT_ACCEPTED",
        createdAt: o.createdAt,
        hourlyRate: parseFloat(o.request?.maxBudget || 0),
        user: o.request?.user,
        ground: o.request?.ground,
        customLocation: o.request?.customLocation,
        role: o.request?.roles?.[0] || "Professional",
      })),
      ...skippedNotifications.map((n) => ({
        id: n.id,
        status: "NOT_ACCEPTED",
        createdAt: n.sentAt,
        hourlyRate: n.booking?.hourlyRate || 0,
        user: n.booking?.user,
        ground: n.booking?.ground,
        customLocation: n.booking?.customLocation,
        role: n.booking?.role || "Professional",
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res
      .status(200)
      .json({ bookings, pendingBookings, nonAcceptedBookings });
  } catch (error) {
    logger.error("Error in getMyOnDemandBookings:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getUserOnDemandBookings = async (req, res) => {
  const userId = (req.user.id || req.user.user).toString();
  try {
    // ── Step 1: Auto-expire any SEARCHING requests whose timeout has passed ──
    const timedOutRequests = await prisma.professionalMatchRequest.findMany({
      where: {
        userId,
        status: "SEARCHING",
        expiresAt: { lte: new Date() },
      },
    });

    if (timedOutRequests.length > 0) {
      // Mark them as EXPIRED and expire any pending offers
      await prisma.$transaction(async (tx) => {
        await tx.professionalMatchRequest.updateMany({
          where: {
            id: { in: timedOutRequests.map((r) => r.id) },
            status: "SEARCHING",
          },
          data: { status: "EXPIRED" },
        });

        // Expire any pending offers linked to these requests
        await tx.professionalMatchOffer.updateMany({
          where: {
            requestId: { in: timedOutRequests.map((r) => r.id) },
            status: "PENDING",
          },
          data: { status: "EXPIRED" },
        });

        // Release wallet reservations for the expired requests
        for (const req of timedOutRequests) {
          try {
            await WalletService.release(
              userId,
              "user",
              parseFloat(req.maxBudget),
              false,
              tx
            );
            await tx.walletTransaction.create({
              data: {
                userId,
                amount: req.maxBudget,
                type: "REFUND",
                status: "SUCCESS",
                description: `Refunded reserved coins due to matching failure: ${req.roles.join(", ")}`,
              },
            });
          } catch (walletErr) {
            logger.warn(
              `Failed to release reservation for request ${req.id}:`,
              walletErr.message
            );
          }
        }
      });
    }

    // ── Step 2: Fetch active (still searching) requests ──
    const activeRequests = await prisma.professionalMatchRequest.findMany({
      where: {
        userId,
        status: "SEARCHING",
        expiresAt: { gt: new Date() },
      },
      include: {
        ground: true,
        offers: {
          include: {
            professional: {
              include: {
                user: {
                  select: { name: true, profilePicture: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Step 3: Fetch expired/cancelled/failed requests (last 30 days) ──
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const failedRequests = await prisma.professionalMatchRequest.findMany({
      where: {
        userId,
        status: { in: ["EXPIRED", "CANCELLED"] },
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        ground: true,
        offers: {
          include: {
            professional: {
              include: {
                user: {
                  select: { name: true, profilePicture: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Step 4: Fetch matched requests (successfully matched) ──
    const matchedRequests = await prisma.professionalMatchRequest.findMany({
      where: {
        userId,
        status: "MATCHED",
      },
      include: {
        ground: true,
        offers: {
          include: {
            professional: {
              include: {
                user: {
                  select: { name: true, profilePicture: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Step 5: Fetch all on-demand bookings (successful matches) ──
    const bookings = await prisma.onDemandProfessionalBooking.findMany({
      where: { userId },
      include: {
        professional: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                profilePicture: true,
              },
            },
          },
        },
        ground: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res
      .status(200)
      .json({ activeRequests, failedRequests, matchedRequests, bookings });
  } catch (error) {
    logger.error("Error in getUserOnDemandBookings:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getMyProfessionalProfile = async (req, res) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    let professional = await prisma.ownerProfile.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            city: true,
            state: true,
            profilePicture: true,
            email: true,
            phone: true,
            sportTypes: true,
          },
        },
      },
    });

    if (!professional) {
      // Profile does not exist yet. Fetch user details and return a template.
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          role: true,
          city: true,
          state: true,
          profilePicture: true,
          email: true,
          phone: true,
          sportTypes: true,
        },
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      professional = {
        user: user,
        certifications: [],
      };
    }

    // Deserialize certifications if stored as stringified objects
    const parsedCertifications = (professional.certifications || []).map(
      (cert) => {
        if (typeof cert === "string") {
          try {
            return JSON.parse(cert);
          } catch {
            return { title: cert, description: "", image: null };
          }
        }
        return cert;
      }
    );

    const responseProfessional = {
      ...professional,
      certifications: parsedCertifications,
    };

    return res.status(200).json({ professional: responseProfessional });
  } catch (error) {
    logger.error("Error in getMyProfessionalProfile:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  const userId = req.user.id;

  try {
    const owner = await prisma.ownerProfile.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        rating: true,
        numReviews: true,
        avgDailyActivePct: true,
        acceptanceRate30d: true,
        trustScore: true,
        cityRank: true,
        stateRank: true,
      },
    });

    if (!owner) {
      return res.status(200).json({
        success: true,
        stats: {
          bookings: {
            assigned: 0,
            inProgress: 0,
            completed: 0,
            totalActive: 0,
          },
          earnings: 0,
          avgTime: "0h 0m",
          rating: 0,
          trustScore: 100,
          acceptanceRate: 100,
          daat: 0,
          acceptedRequests: 0,
          rejectedRequests: 0,
          skippedRequests: [],
          graphData: {
            "All Time": [{ name: "No Data", bookings: 0, income: 0 }],
            Today: [{ name: "No Data", bookings: 0, income: 0 }],
            "This Week": [{ name: "No Data", bookings: 0, income: 0 }],
            "This Month": [{ name: "No Data", bookings: 0, income: 0 }],
            "Custom Time": [{ name: "No Data", bookings: 0, income: 0 }],
          },
        },
        activeBooking: null,
      });
    }

    const professionalId = owner.id;

    const [
      bookings,
      skippedNotifications,
      acceptedCount,
      rejectedCount,
      trustEvents,
      professional,
    ] = await Promise.all([
      prisma.onDemandProfessionalBooking.findMany({
        where: { professionalId },
        include: {
          user: { select: { name: true, phone: true, profilePicture: true } },
          ground: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bookingNotification.findMany({
        where: { professionalId, action: "SKIPPED" },
        include: {
          booking: {
            include: {
              user: { select: { name: true } },
              ground: { select: { name: true } },
            },
          },
        },
        orderBy: { sentAt: "desc" },
        take: 10,
      }),
      prisma.professionalMatchOffer.count({
        where: { professionalId, status: "ACCEPTED" },
      }),
      prisma.professionalMatchOffer.count({
        where: { professionalId, status: "REJECTED" },
      }),
      prisma.trustScoreEvent.findMany({
        where: { professionalId },
      }),
      prisma.ownerProfile.findUnique({
        where: { id: professionalId },
        select: { rating: true, numReviews: true },
      }),
    ]);

    // We now use the cached trustScore, acceptanceRate, and daat from OwnerProfile
    const trustScore = owner.trustScore || 100;
    const acceptanceRate = owner.acceptanceRate30d || 100;
    const daat = owner.avgDailyActivePct || 0;
    const cityRank = owner.cityRank || null;
    const stateRank = owner.stateRank || null;

    // Format graph data based on completed bookings
    const graphData = {
      Today: [],
      "This Week": [],
      "This Month": [],
      "All Time": [],
      "Custom Time": [],
    };

    const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
    const assignedBookings = bookings.filter((b) => b.status === "ASSIGNED");
    const inProgressBookings = bookings.filter(
      (b) => b.status === "IN_PROGRESS"
    );

    const activeBooking = bookings.find(
      (b) => b.status === "ASSIGNED" || b.status === "IN_PROGRESS"
    );

    // Aggregate values
    const totalBookings = {
      assigned: assignedBookings.length,
      inProgress: inProgressBookings.length,
      completed: completedBookings.length,
      totalActive: assignedBookings.length + inProgressBookings.length,
    };
    const totalEarnings = completedBookings.reduce(
      (sum, b) => sum + parseFloat(b.hourlyRate || 0),
      0
    );

    // Grouping by day for "All Time"
    const allTimeMap = {};
    completedBookings.forEach((b) => {
      const dateStr = new Date(b.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!allTimeMap[dateStr]) {
        allTimeMap[dateStr] = { name: dateStr, bookings: 0, income: 0 };
      }
      allTimeMap[dateStr].bookings += 1;
      allTimeMap[dateStr].income += parseFloat(b.hourlyRate || 0);
    });

    // Sort keys and take the latest 30 elements or so, but let's just reverse them to show in order
    graphData["All Time"] = Object.values(allTimeMap).sort(
      (a, b) => new Date(a.name) - new Date(b.name)
    );
    if (graphData["All Time"].length === 0) {
      graphData["All Time"] = [{ name: "No Data", bookings: 0, income: 0 }];
    }
    graphData["Today"] = graphData["All Time"];
    graphData["This Week"] = graphData["All Time"];
    graphData["This Month"] = graphData["All Time"];
    graphData["Custom Time"] = graphData["All Time"];

    // Prepare response
    const stats = {
      bookings: totalBookings,
      earnings: totalEarnings,
      avgTime: "0h 0m",
      rating: professional?.rating || 0,
      trustScore,
      cityRank,
      stateRank,
      acceptanceRate,
      daat,
      acceptedRequests: acceptedCount,
      rejectedRequests: rejectedCount,
      skippedRequests: skippedNotifications.map((n) => ({
        id: n.id,
        title: `Booking Request - ${n.booking?.ground?.name || "Custom Venue"}`,
        dateTime: new Date(n.sentAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        pay: `₹${n.booking?.hourlyRate || 0}`,
        userName: n.booking?.user?.name || "Unknown User",
      })),
      graphData: {
        "All Time": graphData["All Time"],
        Today: graphData["All Time"], // Simplification
        "This Week": graphData["All Time"], // Simplification
        "This Month": graphData["All Time"], // Simplification
        "Custom Time": graphData["All Time"], // Simplification
      },
    };

    return res.status(200).json({ success: true, stats, activeBooking });
  } catch (error) {
    logger.error("Error in getDashboardStats:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Complete an on-demand professional booking manually
export const completeProfessionalBooking = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  try {
    const booking = await prisma.onDemandProfessionalBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to complete this booking" });
    }

    await WalletBlockingService.releaseFundsToProfessional(bookingId);

    const updatedBooking = await prisma.onDemandProfessionalBooking.findUnique({
      where: { id: bookingId },
      include: {
        professional: { include: { user: true } },
        user: true,
      },
    });

    if (updatedBooking) {
      NotificationService.publishEvent("PRO_BOOKING_COMPLETED", {
        recipientId: updatedBooking.userId,
        recipientModel: "User",
        email: updatedBooking.user?.email,
        phone: updatedBooking.user?.phone,
        professionalName:
          updatedBooking.professional?.user?.name || "The professional",
        amount: updatedBooking.hourlyRate,
        date: updatedBooking.matchDate,
      });
    }

    return res.status(200).json({ success: true, booking: updatedBooking });
  } catch (error) {
    logger.error("Error in completeProfessionalBooking:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get trust score events history for professional
export const getTrustScoreHistory = async (req, res) => {
  const professionalId = req.user.ownerId;
  if (!professionalId) {
    return res
      .status(403)
      .json({ message: "Unauthorized: Professional profile not found" });
  }

  try {
    const [owner, events] = await Promise.all([
      prisma.ownerProfile.findUnique({
        where: { id: professionalId },
        select: { trustScore: true },
      }),
      prisma.trustScoreEvent.findMany({
        where: { professionalId },
        include: {
          booking: {
            include: {
              ground: { select: { name: true } },
              user: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return res.status(200).json({
      trustScore: owner?.trustScore ?? 100.0,
      events,
    });
  } catch (error) {
    logger.error("Error in getTrustScoreHistory:", error);
    return res.status(500).json({ message: error.message });
  }
};
