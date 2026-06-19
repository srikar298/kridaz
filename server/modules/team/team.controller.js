import crypto from "crypto";
import { prisma } from "../../config/prisma.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import { createUniqueTeamCode } from "./team.service.js";
import { updateGeoPoint } from "../../utils/geo.util.js";
import logger from "../../utils/logger.js";
import generateQRCode from "../../utils/generateQRCode.js";
import { sanitizeUser } from "../../utils/sanitizeUser.js";
const mapTeamUserAvatar = (team) => {
  if (!team) return null;
  const formatted = { ...team };
  formatted._id = team.id;
  if (formatted.owner) {
    formatted.owner = {
      ...formatted.owner,
      _id: formatted.owner.id,
      avatar: formatted.owner.profilePicture || null,
    };
  }
  if (Array.isArray(formatted.members)) {
    formatted.members = formatted.members.map((m) => {
      const formattedMember = { ...m };
      formattedMember._id = m.id;
      if (formattedMember.user) {
        formattedMember.user = sanitizeUser({
          ...formattedMember.user,
          _id: formattedMember.user.id,
          avatar: formattedMember.user.profilePicture || null,
        });
        // Flatten user fields to the root of the member object for frontend backwards compatibility
        formattedMember.username =
          formattedMember.user.username || formattedMember.user.name;
        formattedMember.profilePic =
          formattedMember.user.profilePicture ||
          formattedMember.user.avatar ||
          null;
        formattedMember.phone = formattedMember.user.phone || null;
      }
      return formattedMember;
    });
  }

  // Combine Team_A and Team_B into opponents list symmetrically
  const opponentsList = [
    ...(formatted.Team_A || []),
    ...(formatted.Team_B || []),
  ];
  formatted.opponents = opponentsList.map((opp) => {
    const mappedOpp = { ...opp };
    mappedOpp._id = opp.id;
    if (mappedOpp.owner) {
      mappedOpp.owner = {
        ...mappedOpp.owner,
        _id: mappedOpp.owner.id,
        avatar: mappedOpp.owner.profilePicture || null,
      };
    }
    return mappedOpp;
  });
  delete formatted.Team_A;
  delete formatted.Team_B;

  // Map opponent requests received to opponentRequests array for the frontend
  if (Array.isArray(formatted.opponentRequestsReceived)) {
    formatted.opponentRequests = formatted.opponentRequestsReceived.map(
      (req) => {
        const formattedReq = { ...req };
        formattedReq._id = req.id;
        if (formattedReq.from) {
          formattedReq.fromTeam = {
            ...formattedReq.from,
            _id: formattedReq.from.id,
          };
        }
        return formattedReq;
      }
    );
  }

  return formatted;
};

// @route   POST /api/team
// @desc    Create a new team with a unique team code
export const createTeam = async (req, res) => {
  try {
    const {
      name,
      description,
      sport,
      sportType,
      captainName,
      captainPhone,
      captainContact,
      city,
      latitude,
      longitude,
      lat,
      lng,
    } = req.body;

    const rawLat = latitude || lat;
    const rawLng = longitude || lng;
    const finalLat =
      rawLat &&
      rawLat !== "undefined" &&
      rawLat !== "null" &&
      !isNaN(parseFloat(rawLat))
        ? parseFloat(rawLat)
        : null;
    const finalLng =
      rawLng &&
      rawLng !== "undefined" &&
      rawLng !== "null" &&
      !isNaN(parseFloat(rawLng))
        ? parseFloat(rawLng)
        : null;

    logger.info("Creating team for user:", req.user?.id, "Body:", req.body);

    if (!req.user?.id) {
      logger.error("Team creation failed: No user ID in request");
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Team name is required" });
    }

    const teamCode = await createUniqueTeamCode();

    let imageUrl = req.body.image || req.body.logo || "";
    if (req.file) {
      logger.info("Uploading team image to Cloudinary...");
      imageUrl = await uploadToCloudinary(req.file.buffer, "teams");
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        sportType: sport || sportType || "CRICKET",
        captainName: captainName || req.user.name || "N/A",
        captainPhone: captainPhone || captainContact || req.user.phone || "N/A",
        logo: imageUrl,
        image: imageUrl,
        city: city || "N/A",
        teamCode,
        ownerId: req.user.id,
        latitude: finalLat,
        longitude: finalLng,
        members: {
          create: [{ userId: req.user.id, role: "CAPTAIN", status: "JOINED" }],
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    // Generate QR Code for join link
    const frontendUrl =
      process.env.USER_URL ||
      process.env.CLIENT_URLS?.split(",")[0] ||
      "https://kridaz.com";
    const qrUrl = `${frontendUrl}/team/${team.id}`;
    let newTeam = team;
    try {
      logger.info("Generating QR code for team join link:", qrUrl);
      const qrCodeUrl = await generateQRCode(qrUrl);
      newTeam = await prisma.team.update({
        where: { id: team.id },
        data: { qrCode: qrCodeUrl },
        include: { members: { include: { user: true } } },
      });
    } catch (qrError) {
      logger.error("Failed to generate team QR code:", qrError);
    }

    logger.info("Team created successfully:", newTeam.id);

    // PostGIS Sync
    if (finalLat && finalLng) {
      await updateGeoPoint(
        "Team",
        newTeam.id,
        parseFloat(finalLat),
        parseFloat(finalLng)
      );
    }

    return res.status(201).json({
      success: true,
      team: mapTeamUserAvatar(newTeam),
      message: "Team created successfully",
    });
  } catch (error) {
    logger.error("Create team error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create team",
    });
  }
};

// @route   GET /api/team/my-teams
// @desc    Get all teams where user is a member or owner
export const getMyTeams = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch teams where user is owner or member
    const teams = await prisma.team.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId: userId } } }],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                profilePicture: true,
              },
            },
          },
        },
        customMembers: true,
        owner: {
          select: { id: true, name: true, profilePicture: true },
        },
        Team_A: {
          select: {
            id: true,
            name: true,
            teamCode: true,
            sportType: true,
            city: true,
            logo: true,
            image: true,
            owner: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
        },
        Team_B: {
          select: {
            id: true,
            name: true,
            teamCode: true,
            sportType: true,
            city: true,
            logo: true,
            image: true,
            owner: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Fetch opponent teams (teams that have any of the user's teams as an opponent)
    const myTeamIds = teams.map((t) => t.id);
    const opponentTeamsRaw = await prisma.team.findMany({
      where: {
        OR: [
          { Team_A: { some: { id: { in: myTeamIds } } } },
          { Team_B: { some: { id: { in: myTeamIds } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        teamCode: true,
        sportType: true,
        members: {
          select: { userId: true },
        },
        image: true,
        logo: true,
      },
    });

    return res.status(200).json({
      success: true,
      teams: teams.map((t) => mapTeamUserAvatar(t)),
      opponentTeams: opponentTeamsRaw,
    });
  } catch (error) {
    logger.error("Get teams error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch teams" });
  }
};

// @route   GET /api/team/all
// @desc    Get all platform teams for discovery (Players → Teams tab)
export const getAllTeams = async (req, res) => {
  try {
    const { city, sportType, search, lat, lng, radius } = req.query;

    let teams;

    // 1. GeoNear if coordinates provided
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const distanceLimit = parseFloat(radius) || 10000; // 10km default

      // Pre-format search patterns to avoid literal '%undefined%' or '%null%' javascript string coercion
      const searchPattern = search ? `%${search}%` : null;
      const sportTypePattern = sportType || null;
      const cityPattern = city ? `%${city}%` : null;

      // PostGIS raw query for proximity discovery with Haversine fallback
      try {
        teams = await prisma.$queryRaw`
          SELECT t.*, 
                 u.name as "ownerName", u."profilePicture" as "ownerAvatar", u.username as "ownerUsername",
                 ST_Distance(t."geoPoint", ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography) as distance,
                 (SELECT COUNT(*)::int FROM "TeamMember" tm WHERE tm."teamId" = t.id AND tm.status = 'JOINED') as "memberCount"
          FROM "Team" t
          LEFT JOIN "User" u ON t."ownerId" = u.id
          WHERE t.visibility = 'PUBLIC'
            AND ST_DWithin(t."geoPoint", ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography, ${distanceLimit})
            AND (${searchPattern} IS NULL OR t.name ILIKE ${searchPattern} OR t."teamCode" ILIKE ${searchPattern})
            AND (${sportTypePattern} IS NULL OR t."sportType" ILIKE ${sportTypePattern})
            AND (${cityPattern} IS NULL OR t.city ILIKE ${cityPattern})
          ORDER BY distance ASC
          LIMIT 50
        `;
      } catch (postgisError) {
        logger.warn(
          `PostGIS proximity query failed, falling back to Haversine/Decimal approximation: ${postgisError.message}`
        );

        // Haversine formula fallback using standard Decimal coordinates (latitude and longitude)
        // distance is in meters, 6371000 is Earth radius in meters
        const radLat = (latitude * Math.PI) / 180;
        const radLng = (longitude * Math.PI) / 180;

        teams = await prisma.$queryRaw`
          SELECT t.*, 
                 u.name as "ownerName", u."profilePicture" as "ownerAvatar", u.username as "ownerUsername",
                 (6371000 * acos(
                    cos(${radLat}) * cos(radians(t.latitude::double precision)) * 
                    cos(radians(t.longitude::double precision) - ${radLng}) + 
                    sin(${radLat}) * sin(radians(t.latitude::double precision))
                 )) as distance,
                 (SELECT COUNT(*)::int FROM "TeamMember" tm WHERE tm."teamId" = t.id AND tm.status = 'JOINED') as "memberCount"
          FROM "Team" t
          LEFT JOIN "User" u ON t."ownerId" = u.id
          WHERE t.visibility = 'PUBLIC'
            AND t.latitude IS NOT NULL 
            AND t.longitude IS NOT NULL
            AND (6371000 * acos(
                    cos(${radLat}) * cos(radians(t.latitude::double precision)) * 
                    cos(radians(t.longitude::double precision) - ${radLng}) + 
                    sin(${radLat}) * sin(radians(t.latitude::double precision))
                 )) <= ${distanceLimit}
            AND (${searchPattern} IS NULL OR t.name ILIKE ${searchPattern} OR t."teamCode" ILIKE ${searchPattern})
            AND (${sportTypePattern} IS NULL OR t."sportType" ILIKE ${sportTypePattern})
            AND (${cityPattern} IS NULL OR t.city ILIKE ${cityPattern})
          ORDER BY distance ASC
          LIMIT 50
        `;
      }
    } else {
      // 2. Standard discovery search
      const teamsRaw = await prisma.team.findMany({
        where: {
          visibility: "PUBLIC",
          AND: [
            search
              ? {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { teamCode: { contains: search, mode: "insensitive" } },
                  ],
                }
              : {},
            sportType
              ? { sportType: { equals: sportType, mode: "insensitive" } }
              : {},
            city ? { city: { contains: city, mode: "insensitive" } } : {},
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
              username: true,
            },
          },
          members: {
            where: { status: "JOINED" },
            include: {
              user: {
                select: { id: true, name: true, profilePicture: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // Format to match expected output structure
      teams = teamsRaw.map((t) => {
        const formatted = mapTeamUserAvatar(t);
        return {
          ...formatted,
          memberCount: t.members.length,
          matchesPlayed: Math.floor(Math.random() * 20),
          totalScore: Math.floor(Math.random() * 1000),
        };
      });
    }

    return res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    logger.error("Get all teams error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch teams" });
  }
};

// ─── Team Details ───────────────────────────────────────────────────────────

// @route   GET /api/team/code/:code
// @desc    Get team details by team code
export const getTeamByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const team = await prisma.team.findUnique({
      where: { teamCode: code },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                sportTypes: true,
              },
            },
          },
        },
        Team_A: {
          select: {
            id: true,
            name: true,
            teamCode: true,
            sportType: true,
            city: true,
            logo: true,
            image: true,
            owner: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
        },
        Team_B: {
          select: {
            id: true,
            name: true,
            teamCode: true,
            sportType: true,
            city: true,
            logo: true,
            image: true,
            owner: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
        },
        opponentRequestsReceived: {
          include: {
            from: {
              select: {
                id: true,
                name: true,
                image: true,
                logo: true,
                teamCode: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "No team found with this code. Please check the Team ID and try again.",
      });
    }

    return res
      .status(200)
      .json({ success: true, team: mapTeamUserAvatar(team) });
  } catch (error) {
    logger.error("Find team by code error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while searching for team",
    });
  }
};

// @route   GET /api/team/:id
// @desc    Get team by DB ID
export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            username: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                sportTypes: true,
              },
            },
          },
        },
        customMembers: true,
        Team_A: {
          select: {
            id: true,
            name: true,
            teamCode: true,
            sportType: true,
            city: true,
            logo: true,
            image: true,
            owner: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
        },
        Team_B: {
          select: {
            id: true,
            name: true,
            teamCode: true,
            sportType: true,
            city: true,
            logo: true,
            image: true,
            owner: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
        },
        opponentRequestsReceived: {
          include: {
            from: {
              select: {
                id: true,
                name: true,
                image: true,
                logo: true,
                teamCode: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    // Generate QR code if missing
    if (!team.qrCode) {
      const frontendUrl =
        process.env.USER_URL ||
        process.env.CLIENT_URLS?.split(",")[0] ||
        "https://kridaz.com";
      const qrUrl = `${frontendUrl}/team/${team.id}`;
      try {
        logger.info("Generating missing QR code for team:", team.id);
        const qrCodeUrl = await generateQRCode(qrUrl);
        const updatedTeam = await prisma.team.update({
          where: { id: team.id },
          data: { qrCode: qrCodeUrl },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profilePicture: true,
                    sportTypes: true,
                  },
                },
              },
            },
            Team_A: {
              select: {
                id: true,
                name: true,
                teamCode: true,
                sportType: true,
                city: true,
                logo: true,
                image: true,
                owner: {
                  select: {
                    id: true,
                    name: true,
                    profilePicture: true,
                    username: true,
                  },
                },
              },
            },
            Team_B: {
              select: {
                id: true,
                name: true,
                teamCode: true,
                sportType: true,
                city: true,
                logo: true,
                image: true,
                owner: {
                  select: {
                    id: true,
                    name: true,
                    profilePicture: true,
                    username: true,
                  },
                },
              },
            },
            opponentRequestsReceived: {
              include: {
                from: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    logo: true,
                    teamCode: true,
                  },
                },
              },
            },
          },
        });
        return res
          .status(200)
          .json({ success: true, team: mapTeamUserAvatar(updatedTeam) });
      } catch (qrError) {
        logger.error("Failed to generate team QR code:", qrError);
      }
    }

    return res
      .status(200)
      .json({ success: true, team: mapTeamUserAvatar(team) });
  } catch (error) {
    logger.error("Get team error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch team details" });
  }
};

// @route   PUT /api/team/:id
// @desc    Update team details
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      sportType,
      captainName,
      captainPhone,
      captainContact,
      city,
      visibility,
      latitude,
      longitude,
      lat,
      lng,
    } = req.body;

    const rawLat = latitude || lat;
    const rawLng = longitude || lng;
    const finalLat =
      rawLat &&
      rawLat !== "undefined" &&
      rawLat !== "null" &&
      !isNaN(parseFloat(rawLat))
        ? parseFloat(rawLat)
        : undefined;
    const finalLng =
      rawLng &&
      rawLng !== "undefined" &&
      rawLng !== "null" &&
      !isNaN(parseFloat(rawLng))
        ? parseFloat(rawLng)
        : undefined;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    if (team.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to update this team" });
    }

    let imageUrl = team.image;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, "teams");
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name: name || team.name,
        description: description || team.description,
        sportType: sportType || team.sportType,
        captainName: captainName || team.captainName,
        captainPhone: captainPhone || captainContact || team.captainPhone,
        city: city || team.city,
        visibility: visibility || team.visibility,
        latitude: finalLat,
        longitude: finalLng,
        image: imageUrl,
        logo: imageUrl,
      },
    });

    // PostGIS Sync
    if (finalLat !== undefined && finalLng !== undefined) {
      await updateGeoPoint("Team", id, finalLat, finalLng);
    }

    return res.status(200).json({
      success: true,
      team: mapTeamUserAvatar(updatedTeam),
      message: "Team updated successfully",
    });
  } catch (error) {
    logger.error("Update team error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/team/:id
// @desc    Delete a team
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    if (team.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized to delete this team" });
    }

    await prisma.$transaction([
      prisma.teamMember.deleteMany({ where: { teamId: id } }),
      prisma.teamCustomMember.deleteMany({ where: { teamId: id } }),
      prisma.teamOpponentRequest.deleteMany({
        where: { OR: [{ fromId: id }, { toId: id }] },
      }),
      prisma.team.delete({ where: { id } }),
    ]);

    return res
      .status(200)
      .json({ success: true, message: "Team deleted successfully" });
  } catch (error) {
    logger.error("Delete team error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/team/:id/request-opponent
// @desc    Send a request to another team (found by teamCode) to be opponents
export const requestOpponent = async (req, res) => {
  try {
    const { id } = req.params; // my team ID
    const { targetTeamId, targetTeamCode } = req.body;

    const myTeam = await prisma.team.findUnique({ where: { id } });
    if (!myTeam) {
      return res
        .status(404)
        .json({ success: false, message: "Your team not found" });
    }

    // Only owner can send opponent request
    if (myTeam.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the team owner can send opponent requests",
      });
    }

    let targetTeam;
    if (targetTeamId) {
      targetTeam = await prisma.team.findUnique({
        where: { id: targetTeamId },
      });
    } else if (targetTeamCode) {
      targetTeam = await prisma.team.findUnique({
        where: { teamCode: targetTeamCode.toUpperCase() },
      });
    }

    if (!targetTeam) {
      return res
        .status(404)
        .json({ success: false, message: "Target team not found" });
    }

    // Prevent requesting your own team
    if (targetTeam.id === myTeam.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot add your own team as an opponent",
      });
    }

    // Check if already opponents
    const alreadyOpponents = await prisma.team.findFirst({
      where: {
        id: myTeam.id,
        OR: [
          { Team_A: { some: { id: targetTeam.id } } },
          { Team_B: { some: { id: targetTeam.id } } },
        ],
      },
    });
    if (alreadyOpponents) {
      return res.status(400).json({
        success: false,
        message: "This team is already your opponent",
      });
    }

    // Check if request already pending
    const alreadyRequested = await prisma.teamOpponentRequest.findFirst({
      where: {
        fromId: myTeam.id,
        toId: targetTeam.id,
        status: "PENDING",
      },
    });
    if (alreadyRequested) {
      return res
        .status(400)
        .json({ success: false, message: "Opponent request already sent" });
    }

    // Create request
    await prisma.teamOpponentRequest.create({
      data: {
        fromId: myTeam.id,
        toId: targetTeam.id,
        status: "PENDING",
      },
    });

    // Notify the owner of the target team
    await prisma.notification.create({
      data: {
        userId: targetTeam.ownerId,
        type: "OPPONENT_REQUEST",
        title: "New Rival Challenge!",
        message: `Team "${myTeam.name}" wants to link as an opponent. Check your team dashboard to accept.`,
        metadata: {
          fromTeamId: myTeam.id,
          targetTeamId: targetTeam.id,
          teamCode: myTeam.teamCode,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Opponent request sent to team "${targetTeam.name}"`,
    });
  } catch (error) {
    logger.error("Opponent request error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/team/:id/handle-opponent-request
// @desc    Accept or Reject an opponent request
export const handleOpponentRequest = async (req, res) => {
  try {
    const { id } = req.params; // my team ID (the one who received the request)
    const { requestId, action } = req.body; // action: ACCEPTED or REJECTED

    const myTeam = await prisma.team.findUnique({ where: { id } });
    if (!myTeam) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    if (myTeam.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const request = await prisma.teamOpponentRequest.findUnique({
      where: { id: requestId },
      include: { from: true },
    });

    if (
      !request ||
      request.toId !== myTeam.id ||
      request.status !== "PENDING"
    ) {
      return res
        .status(404)
        .json({ success: false, message: "Valid pending request not found" });
    }

    if (action === "ACCEPTED") {
      await prisma.$transaction([
        // Update request status
        prisma.teamOpponentRequest.update({
          where: { id: requestId },
          data: { status: "ACCEPTED" },
        }),
        // Link teams as opponents (many-to-many)
        prisma.team.update({
          where: { id: myTeam.id },
          data: { Team_B: { connect: { id: request.fromId } } },
        }),
        // Notify the requester
        prisma.notification.create({
          data: {
            userId: request.from.ownerId,
            type: "OPPONENT_ACCEPTED",
            title: "Challenge Accepted!",
            message: `Team "${myTeam.name}" has accepted your opponent request. You are now linked rivals!`,
            metadata: { teamId: myTeam.id, teamName: myTeam.name },
          },
        }),
      ]);

      return res
        .status(200)
        .json({ success: true, message: "Opponent request accepted" });
    } else {
      await prisma.teamOpponentRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
      return res
        .status(200)
        .json({ success: true, message: "Opponent request rejected" });
    }
  } catch (error) {
    logger.error("Handle opponent request error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/team/:id/invite
// @desc    Invite members to the team (existing users or custom)
export const inviteMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { invitees } = req.body;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    if (team.ownerId !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized to invite" });
    }

    const results = [];

    for (let invitee of invitees) {
      if (invitee.userId) {
        const existingMember = await prisma.teamMember.findFirst({
          where: { teamId: id, userId: invitee.userId },
        });

        if (existingMember) {
          results.push({
            user: invitee.userId,
            status: "already_exists",
            message: "User already in team",
          });
          continue;
        }

        await prisma.teamMember.create({
          data: {
            teamId: id,
            userId: invitee.userId,
            role: "PLAYER",
            status: "PENDING",
          },
        });

        await prisma.notification.create({
          data: {
            userId: invitee.userId,
            type: "TEAM_INVITE",
            title: "Team Invitation",
            message: `You have been invited to join the team "${team.name}"`,
            metadata: { teamId: team.id },
          },
        });

        results.push({ user: invitee.userId, status: "invited" });
      } else {
        // Invite non-registered user
        const orConditions = [];
        if (invitee.email) orConditions.push({ email: invitee.email });
        if (invitee.phone) orConditions.push({ phone: invitee.phone });

        let existingUser = null;
        if (orConditions.length > 0) {
          existingUser = await prisma.user.findFirst({
            where: { OR: orConditions },
          });
        }

        if (existingUser) {
          // Auto-add existing user instead of failing
          const existingMember = await prisma.teamMember.findFirst({
            where: { teamId: id, userId: existingUser.id },
          });

          if (existingMember) {
            results.push({
              email: invitee.email,
              phone: invitee.phone,
              status: "already_exists",
              message: "User already in team",
            });
            continue;
          }

          // Create team member entry
          await prisma.teamMember.create({
            data: {
              teamId: id,
              userId: existingUser.id,
              role: "PLAYER",
              status: "PENDING",
            },
          });

          // Send notification to existing user
          await prisma.notification.create({
            data: {
              userId: existingUser.id,
              type: "TEAM_INVITE",
              title: "Team Invitation",
              message: `You have been invited to join the team "${team.name}"`,
              metadata: { teamId: team.id },
            },
          });

          results.push({
            user: existingUser.id,
            status: "auto_added_existing_user",
            existingUserId: existingUser.id,
            existingUserName: existingUser.name,
            profilePicture: existingUser.profilePicture,
          });
          continue;
        }

        const inviteToken = crypto.randomUUID();
        const customMember = await prisma.teamCustomMember.create({
          data: {
            teamId: id,
            name: invitee.name,
            email: invitee.email,
            phone: invitee.phone,
            inviteToken,
            status: "PENDING",
          },
        });

        results.push({
          name: invitee.name,
          token: inviteToken,
          status: "invited_custom",
          customMemberId: customMember.id,
        });
      }
    }

    return res
      .status(200)
      .json({ success: true, message: "Invites processed", results });
  } catch (error) {
    logger.error("Invite error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to process invites" });
  }
};

// @route   POST /api/team/join/:token
// @desc    Join team via custom invite token
export const joinTeam = async (req, res) => {
  try {
    const { token } = req.params;

    const customMember = await prisma.teamCustomMember.findFirst({
      where: { inviteToken: token, status: "PENDING" },
      include: { team: true },
    });

    if (!customMember) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired invite token" });
    }

    await prisma.$transaction(async (tx) => {
      // Mark custom member as joined
      await tx.teamCustomMember.update({
        where: { id: customMember.id },
        data: { status: "JOINED" },
      });

      // If user is logged in, add them as a formal member
      if (req.user) {
        const exists = await tx.teamMember.findFirst({
          where: { teamId: customMember.teamId, userId: req.user.id },
        });
        if (!exists) {
          await tx.teamMember.create({
            data: {
              teamId: customMember.teamId,
              userId: req.user.id,
              role: "PLAYER",
              status: "JOINED",
            },
          });
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: "Successfully joined the team",
      team: { id: customMember.teamId, name: customMember.team.name },
    });
  } catch (error) {
    logger.error("Join team error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to join team" });
  }
};
// @route   POST /api/team/:id/request-join
// @desc    Request to join a team
export const requestToJoin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team)
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });

    // Check if already a member or pending
    const existingMember = await prisma.teamMember.findFirst({
      where: { teamId: id, userId },
    });
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member or have a pending request",
      });
    }

    await prisma.teamMember.create({
      data: {
        teamId: id,
        userId: userId,
        role: "PLAYER",
        status: "PENDING",
      },
    });

    // Create notification for owner
    await prisma.notification.create({
      data: {
        userId: team.ownerId,
        type: "TEAM_JOIN_REQUEST",
        title: "Join Request",
        message: `${req.user.name || req.user.username || "A user"} wants to join your team "${team.name}"`,
        metadata: { teamId: team.id, userId: userId },
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Join request sent successfully" });
  } catch (error) {
    logger.error("Request to join error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/team/:id/handle-join-request
// @desc    Accept or reject a member join request
export const handleJoinRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, action } = req.body;
    const currentUserId = req.user.id;

    if (!["ACCEPT", "REJECT"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    // Verify team ownership
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team)
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });

    if (team.ownerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Only team owner can handle requests",
      });
    }

    const memberRequest = await prisma.teamMember.findFirst({
      where: { teamId: id, userId, status: "PENDING" },
    });

    if (!memberRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Pending request not found" });
    }

    if (action === "ACCEPT") {
      await prisma.teamMember.update({
        where: { id: memberRequest.id },
        data: { status: "JOINED" },
      });

      await prisma.notification.create({
        data: {
          userId,
          type: "TEAM_JOIN_ACCEPTED",
          title: "Join Request Accepted",
          message: `Your request to join ${team.name} has been accepted!`,
          metadata: { teamId: team.id },
        },
      });

      res.status(200).json({ success: true, message: "Join request accepted" });
    } else {
      await prisma.teamMember.delete({
        where: { id: memberRequest.id },
      });

      await prisma.notification.create({
        data: {
          userId,
          type: "TEAM_JOIN_REJECTED",
          title: "Join Request Rejected",
          message: `Your request to join ${team.name} has been declined.`,
          metadata: { teamId: team.id },
        },
      });

      res.status(200).json({ success: true, message: "Join request rejected" });
    }
  } catch (error) {
    logger.error("Handle join request error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/team/opponents
// @desc    Get all opponent teams linked to my teams
export const getOpponentTeams = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch teams where user is owner or joined member
    const myTeams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId, status: "JOINED" } } },
        ],
      },
      select: {
        Team_A: {
          select: {
            id: true,
            name: true,
            teamCode: true,
            sportType: true,
            city: true,
            logo: true,
            image: true,
            owner: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
        },
        Team_B: {
          select: {
            id: true,
            name: true,
            teamCode: true,
            sportType: true,
            city: true,
            logo: true,
            image: true,
            owner: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Flatten and unique
    const opponentTeamsMap = new Map();
    myTeams.forEach((team) => {
      const combined = [...(team.Team_A || []), ...(team.Team_B || [])];
      combined.forEach((opp) => {
        opponentTeamsMap.set(opp.id, mapTeamUserAvatar(opp));
      });
    });

    res.status(200).json({
      success: true,
      teams: Array.from(opponentTeamsMap.values()),
    });
  } catch (error) {
    logger.error("Get opponent teams error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
