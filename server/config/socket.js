import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient as redis, pubClient, subClient } from "./redis.js";
import { prisma } from "./prisma.js";
import logger from "../utils/logger.js";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";
import jwt from "jsonwebtoken";
import { getAccessSecret } from "../utils/jwtSecrets.js";
import { activeSocketConnections } from "../utils/metrics.js";
let io;

const socketConfig = (server) => {
  io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: process.env.CLIENT_URLS
        ? process.env.CLIENT_URLS.split(",").map((url) => url.trim())
        : [
            "https://kridaz.com",
            "https://owner.kridaz.com",
            "https://kridaz.vercel.app",
          ],
    },
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    // Allow anonymous connections for public live scoring
    if (!token) {
      return next();
    }

    try {
      let decoded = null;

      // Try standard access token first
      try {
        decoded = jwt.verify(token, getAccessSecret());
      } catch (err) {
        // Try overlay token
        if (!decoded && process.env.OVERLAY_TOKEN_SECRET) {
          try {
            decoded = jwt.verify(token, process.env.OVERLAY_TOKEN_SECRET);
          } catch (e) {
            // ignore
          }
        }
        // Try scoring token
        if (!decoded && process.env.JWT_SCORING_SECRET) {
          try {
            decoded = jwt.verify(token, process.env.JWT_SCORING_SECRET);
          } catch (e) {
            // ignore
          }
        }

        // If all verifications fail, throw
        if (!decoded) {
          throw new Error("Invalid token signatures");
        }
      }

      socket.user = decoded;
      socket.userId = decoded.id || decoded.user?.id || null;
      next();
    } catch (err) {
      // Return AUTH error so client knows token is invalid
      return next(new Error("AUTH"));
    }
  });

  const schedulePresenceBroadcast = async () => {
    try {
      // Use distributed lock to prevent N broadcasts from N instances
      const lockKey = "kridaz:presence:broadcast:lock";
      // Attempt to set lock with a 1000ms expiration, only if it does not exist (NX)
      const acquired = await redis.set(lockKey, "locked", "PX", 1000, "NX");

      if (acquired) {
        const count = await redis.scard("kridaz:online:users");
        io.emit(SOCKET.ONLINE_USERS_COUNT, { count });
      }
    } catch (e) {
      /* silent */
    }
  };

  io.on("connection", (socket) => {
    activeSocketConnections.inc();

    socket.on("setup", async (userData) => {
      const userId = userData?.id;
      if (!userId) return;

      socket.userId = userId;
      socket.join(userId);

      // Update lastSeen in Postgres
      prisma.user
        .update({
          where: { id: userId },
          data: { lastSeen: new Date() },
        })
        .catch(() => {});

      await redis.sadd("kridaz:online:users", userId.toString());
      await redis.expire("kridaz:online:users", 86400);
      schedulePresenceBroadcast();

      const onlineUserIds = await redis.smembers("kridaz:online:users");
      io.emit("online users", onlineUserIds);

      socket.emit("connected");
    });

    socket.on(SOCKET.JOIN_CHAT, (room) => socket.join(room));

    socket.on(SOCKET.JOIN_MATCH, async (matchId) => {
      if (!matchId) return;
      socket.join(matchId);
      logger.info(`[Socket] Socket ${socket.id} joined match room: ${matchId}`);
      try {
        if (!matchId.includes("-")) {
          const game = await prisma.hostedGame.findUnique({
            where: { shortId: matchId },
            select: { id: true },
          });
          if (game) socket.join(game.id);
        }
      } catch (e) {
        // ignore
      }
    });

    // Counterpart so viewers stop receiving score updates when they navigate
    // away. Without this, every JOIN_MATCH accumulated a phantom subscriber
    // and every ball was broadcast to dead sockets.
    socket.on(SOCKET.LEAVE_MATCH, async (matchId) => {
      if (!matchId) return;
      socket.leave(matchId);
      logger.info(`[Socket] Socket ${socket.id} left match room: ${matchId}`);
      try {
        if (!matchId.includes("-")) {
          const game = await prisma.hostedGame.findUnique({
            where: { shortId: matchId },
            select: { id: true },
          });
          if (game) socket.leave(game.id);
        }
      } catch (e) {
        /* best-effort cleanup */
      }
    });

    socket.on(SOCKET.OVERLAY_JOIN, async ({ matchId, token }) => {
      if (!matchId || !token) {
        logger.warn(`[Socket] Overlay join rejected: missing parameters`);
        socket.emit("error", "Missing matchId or token");
        return;
      }
      try {
        if (!process.env.OVERLAY_TOKEN_SECRET) {
          throw new Error("OVERLAY_TOKEN_SECRET is not configured");
        }
        const decoded = jwt.verify(token, process.env.OVERLAY_TOKEN_SECRET);
        
        // Resolve match/game ID
        let resolvedGameId = matchId;
        if (!matchId.includes("-")) {
          const game = await prisma.hostedGame.findUnique({
            where: { shortId: matchId },
            select: { id: true },
          });
          if (game) {
            resolvedGameId = game.id;
          }
        }

        if (decoded.matchId !== resolvedGameId) {
          logger.warn(`[Socket] Overlay token matchId mismatch: token has ${decoded.matchId}, requested ${resolvedGameId}`);
          socket.emit("error", "Unauthorized: matchId mismatch");
          return;
        }

        socket.join(matchId);
        if (resolvedGameId !== matchId) {
          socket.join(resolvedGameId);
        }
        logger.info(
          `[Socket] Socket ${socket.id} joined overlay match room: ${matchId} (resolved: ${resolvedGameId})`
        );
      } catch (err) {
        logger.warn(`[Socket] Overlay token verification failed: ${err.message}`);
        socket.emit("error", "Unauthorized: invalid overlay token");
      }
    });

    socket.on("typing", (room) => socket.in(room).emit("typing", room));
    socket.on("stop typing", (room) =>
      socket.in(room).emit("stop typing", room)
    );

    socket.on("new message", (newMessageReceived) => {
      const chat = newMessageReceived.chat;
      if (!chat) return;

      // Handle both legacy 'users' and new Prisma 'participants'
      const participants = chat.participants || chat.users || [];
      const sender = newMessageReceived.sender;
      const senderId = sender?.userId || sender?.ownerId || sender?.id;

      participants.forEach((p) => {
        const targetId = p.userId || p.ownerId || p.user;
        if (targetId && targetId !== senderId) {
          socket.in(targetId).emit(SOCKET.MESSAGE_RECEIVED, newMessageReceived);
        }
      });
    });

    socket.on("messages read", ({ chatId, userId }) => {
      socket.in(chatId).emit("messages read", { chatId, userId });
    });

    socket.on("delete message", (data) => {
      const { chatId, messageIds } = data;
      socket.in(chatId).emit("message deleted", { chatId, messageIds });
    });

    // COMMENTARY_AUDIO_PLAYED removed to prevent premature audio deletion
    // files are automatically cleaned up after 30s in commentary.service.js

    socket.on("location:update", async (data) => {
      const { lat: rawLat, lng: rawLng, radiusKm, accuracy } = data || {};
      // Fuzz the location: round to 3 decimal places for privacy (~100m radius)
      const lat = parseFloat(parseFloat(rawLat).toFixed(3));
      const lng = parseFloat(parseFloat(rawLng).toFixed(3));
      if (!socket.userId || isNaN(lat) || isNaN(lng)) return;

      const now = Date.now();
      if (socket.lastLocationUpdate && now - socket.lastLocationUpdate < 2000)
        return;
      socket.lastLocationUpdate = now;

      // Server-side privacy gate: respect User.locationSharingEnabled.
      // Cached on the socket so we read DB at most once per connection.
      if (socket.shareLocation === undefined) {
        try {
          const u = await prisma.user.findUnique({
            where: { id: socket.userId },
            select: { locationSharingEnabled: true },
          });
          socket.shareLocation = u?.locationSharingEnabled !== false;
        } catch {
          socket.shareLocation = true;
        }
      }
      if (socket.shareLocation === false) return;

      // Reject low-accuracy fixes (typical indoor GPS can be 1-3km off).
      if (typeof accuracy === "number" && accuracy > 200) return;

      try {
        await redis.set(
          `kridaz:location:${socket.userId}`,
          JSON.stringify({ lat, lng, updatedAt: now }),
          "EX",
          300
        );

        // Throttle DB writes to once every 2 minutes; Redis is the source of truth for live.
        if (
          !socket.lastDbLocationWrite ||
          now - socket.lastDbLocationWrite > 120000
        ) {
          await prisma.$executeRaw`
              UPDATE "User"
              SET latitude = ${lat},
                  longitude = ${lng}
              WHERE id = ${socket.userId}
            `;
          await prisma.$executeRaw`
              UPDATE "UserProfile"
              SET latitude = ${lat},
                  longitude = ${lng}
              WHERE "userId" = ${socket.userId}
            `;
          socket.lastDbLocationWrite = now;
        }

        await redis.geoadd(
          "kridaz:geo:online",
          lng,
          lat,
          socket.userId.toString()
        );

        // Honor radius from payload (clamped to [1, 100] km). Default 25 km for a sane city-scale fanout.
        const requestedRadius = Number(radiusKm);
        const broadcastRadiusKm = Math.min(
          Math.max(Number.isFinite(requestedRadius) ? requestedRadius : 25, 1),
          100
        );
        const nearbyUserIds = await redis.georadius(
          "kridaz:geo:online",
          lng,
          lat,
          broadcastRadiusKm,
          "km"
        );

        if (nearbyUserIds) {
          nearbyUserIds.forEach((uid) => {
            if (uid !== socket.userId.toString()) {
              io.to(uid).emit("nearby:location:update", {
                userId: socket.userId,
                lat,
                lng,
              });
            }
          });
        }
      } catch (err) {
        logger.error("Location update error:", err);
      }
    });

    socket.on("scoring:acquire_lock", async ({ matchId }) => {
      if (!matchId) return;
      socket.join(`scoring_wait_${matchId}`);

      const lockKey = `kridaz:scoring_lock:${matchId}`;
      const currentLock = await redis.get(lockKey);

      let isStale = false;
      if (currentLock && currentLock !== socket.id) {
        try {
          const sockets = await io.in(currentLock).fetchSockets();
          if (sockets.length === 0) {
            isStale = true; // The socket that held the lock is no longer connected
          }
        } catch (err) {
          isStale = true; // Assume stale if we can't verify across redis nodes
        }
      }

      if (!currentLock || currentLock === socket.id || isStale) {
        // Grant lock
        await redis.set(lockKey, socket.id, "EX", 10800); // 3 hours
        socket.scoringMatchId = matchId;
        socket.emit("scoring:lock_granted", { matchId });
      } else {
        // Deny lock
        socket.emit("scoring:lock_denied", { matchId });
      }
    });

    socket.on("scoring:release_lock", async ({ matchId }) => {
      if (!matchId) return;
      const lockKey = `kridaz:scoring_lock:${matchId}`;
      const currentLock = await redis.get(lockKey);

      if (currentLock === socket.id) {
        await redis.del(lockKey);
        socket.scoringMatchId = null;
        socket.leave(`scoring_wait_${matchId}`);
        io.to(`scoring_wait_${matchId}`).emit("scoring:lock_released", {
          matchId,
        });
      }
    });

    socket.on("disconnect", async () => {
      activeSocketConnections.dec();

      if (socket.scoringMatchId) {
        const lockKey = `kridaz:scoring_lock:${socket.scoringMatchId}`;
        const currentLock = await redis.get(lockKey);
        if (currentLock === socket.id) {
          await redis.del(lockKey);
          io.to(`scoring_wait_${socket.scoringMatchId}`).emit(
            "scoring:lock_released",
            { matchId: socket.scoringMatchId }
          );
        }
      }

      if (socket.userId) {
        const lastSeen = new Date();
        prisma.user
          .update({
            where: { id: socket.userId },
            data: { lastSeen },
          })
          .catch(() => {});

        await redis.srem("kridaz:online:users", socket.userId.toString());
        await redis
          .zrem("kridaz:geo:online", socket.userId.toString())
          .catch(() => {});
        await redis.del(`kridaz:location:${socket.userId}`).catch(() => {});
        schedulePresenceBroadcast();

        const onlineUserIds = await redis.smembers("kridaz:online:users");
        io.emit("online users", onlineUserIds);

        io.emit("user last seen", { userId: socket.userId, lastSeen });
      }
    });
  });
};

export const getIO = () => io;
export default socketConfig;
