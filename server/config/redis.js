/**
 * Shared Redis connection pool.
 *
 * Rules:
 *  - BullMQ queues and workers MUST use `bullmqConnection` (maxRetriesPerRequest: null).
 *  - All other uses (rate-limit, presence, live state) use `redisClient`.
 *  - Never create a new Redis() anywhere else in the codebase.
 */
import net from "net";
import Redis from "ioredis";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

if (!process.env.REDIS_URL && process.env.NODE_ENV === "production") {
  logger.error(
    "[REDIS] FATAL: REDIS_URL env var is NOT set in production! Falling back to localhost will likely fail."
  );
} else if (!process.env.REDIS_URL) {
  logger.warn(
    "[REDIS] WARNING: REDIS_URL env var is not set. Falling back to localhost."
  );
}

const checkRedisReachable = (url) => {
  return new Promise((resolve) => {
    try {
      let urlWithProtocol = url;
      if (!url.startsWith("redis://") && !url.startsWith("rediss://")) {
        urlWithProtocol = "redis://" + url;
      }
      const parsed = new URL(urlWithProtocol);
      const port = parsed.port || 6379;
      const host = parsed.hostname || "localhost";

      const socket = net.createConnection({
        port: parseInt(port),
        host: host,
        timeout: 5000, // Increased timeout to 5 seconds for cloud connections
      });

      socket.on("connect", () => {
        socket.destroy();
        resolve(true);
      });

      socket.on("error", () => {
        socket.destroy();
        resolve(false);
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
    } catch (e) {
      resolve(false);
    }
  });
};

// Simple in-memory fallback MockRedis
class MockRedis {
  constructor(name = "Mock") {
    this.name = name;
    this.store = new Map();
    this.sets = new Map();
    this.lists = new Map();
    this.geo = new Map();
    this.callbacks = {};
  }

  async ping() {
    // ioredis returns "PONG" — the health check just needs the promise to
    // resolve. Mirror the real reply so callers that compare strings work.
    return "PONG";
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, val, ...args) {
    // Honor common SET option flags so dev-mode (no real Redis) behaves like
    // production for code that uses SETNX / SETXX semantics — single-use
    // tokens, distributed locks, etc.
    const flags = args.map((a) => String(a).toUpperCase());
    const onlyIfAbsent = flags.includes("NX");
    const onlyIfExists = flags.includes("XX");
    if (onlyIfAbsent && this.store.has(key)) return null;
    if (onlyIfExists && !this.store.has(key)) return null;
    this.store.set(key, String(val));
    return "OK";
  }

  async incr(key) {
    const val = Number(this.store.get(key) || 0) + 1;
    this.store.set(key, String(val));
    return val;
  }

  async expire(key, seconds) {
    return 1;
  }

  async sadd(key, ...members) {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    const set = this.sets.get(key);
    let added = 0;
    const flatMembers = members.flat();
    for (const m of flatMembers) {
      if (!set.has(String(m))) {
        set.add(String(m));
        added++;
      }
    }
    return added;
  }

  async sismember(key, member) {
    const set = this.sets.get(key);
    return set && set.has(String(member)) ? 1 : 0;
  }

  async smembers(key) {
    const set = this.sets.get(key);
    return set ? Array.from(set) : [];
  }

  async srem(key, ...members) {
    const set = this.sets.get(key);
    if (!set) return 0;
    let removed = 0;
    const flatMembers = members.flat();
    for (const m of flatMembers) {
      if (set.has(String(m))) {
        set.delete(String(m));
        removed++;
      }
    }
    return removed;
  }

  async scard(key) {
    const set = this.sets.get(key);
    return set ? set.size : 0;
  }

  async geoadd(key, lng, lat, member) {
    if (!this.geo.has(key)) {
      this.geo.set(key, new Map());
    }
    this.geo
      .get(key)
      .set(String(member), { lng: Number(lng), lat: Number(lat) });
    return 1;
  }

  async georadius(key, lng, lat, radius, unit) {
    const geoMap = this.geo.get(key);
    if (!geoMap) return [];

    const results = [];
    const R = 6371; // Earth radius in km
    const targetLng = Number(lng);
    const targetLat = Number(lat);

    for (const [member, coords] of geoMap.entries()) {
      const dLat = ((coords.lat - targetLat) * Math.PI) / 180;
      const dLon = ((coords.lng - targetLng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((targetLat * Math.PI) / 180) *
          Math.cos((coords.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c; // Distance in km

      const maxDist = Number(radius);
      if (d <= maxDist) {
        results.push(member);
      }
    }
    return results;
  }

  async zrem(key, ...members) {
    let removed = 0;
    const geoMap = this.geo.get(key);
    const flatMembers = members.flat();
    if (geoMap) {
      for (const m of flatMembers) {
        if (geoMap.delete(String(m))) {
          removed++;
        }
      }
    }
    const set = this.sets.get(key);
    if (set) {
      for (const m of flatMembers) {
        if (set.delete(String(m))) {
          removed++;
        }
      }
    }
    return removed;
  }

  async zadd(key, score, member) {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    this.sets.get(key).add(String(member));
    return 1;
  }

  async rpop(key) {
    const list = this.lists.get(key);
    if (!list || list.length === 0) return null;
    return list.pop();
  }

  async lpush(key, ...values) {
    if (!this.lists.has(key)) {
      this.lists.set(key, []);
    }
    const list = this.lists.get(key);
    const flatValues = values.flat();
    for (const val of flatValues) {
      list.unshift(String(val));
    }
    return list.length;
  }

  async ltrim(key, start, stop) {
    const list = this.lists.get(key);
    if (!list) return "OK";
    const s = Number(start);
    const e = Number(stop);

    const actualStart = s < 0 ? list.length + s : s;
    const actualEnd = e < 0 ? list.length + e : e;

    this.lists.set(key, list.slice(actualStart, actualEnd + 1));
    return "OK";
  }

  async lrange(key, start, stop) {
    const list = this.lists.get(key);
    if (!list) return [];
    const s = Number(start);
    const e = Number(stop);

    const actualStart = s < 0 ? list.length + s : s;
    const actualEnd = e === -1 ? list.length - 1 : e < 0 ? list.length + e : e;

    return list.slice(actualStart, actualEnd + 1);
  }

  async del(key) {
    const deleted =
      this.store.delete(key) ||
      this.sets.delete(key) ||
      this.lists.delete(key) ||
      this.geo.delete(key);
    return deleted ? 1 : 0;
  }

  async quit() {
    return "OK";
  }

  async call(command, ...args) {
    const cmd = command.toLowerCase();
    if (typeof this[cmd] === "function") {
      return this[cmd](...args);
    }
    return null;
  }

  // Pub/Sub Mock Methods
  async psubscribe(pattern) {
    return "OK";
  }

  async punsubscribe(pattern) {
    return "OK";
  }

  async publish(channel, message) {
    return 1;
  }

  async subscribe(channel) {
    return "OK";
  }

  async unsubscribe(channel) {
    return "OK";
  }

  on(event, cb) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(cb);
    if (event === "connect" || event === "ready") {
      setTimeout(() => cb(), 10);
    }
    return this;
  }
}

// Perform active top-level check
const isProduction = process.env.NODE_ENV === "production";
const isRedisAvailable = isProduction || (await checkRedisReachable(REDIS_URL));

function createRedisClient(name, url, isBullMQ = false) {
  if (!isRedisAvailable) {
    logger.warn(
      `[REDIS] Redis is offline/unreachable on local environment. Using MockRedis for ${name}.`
    );
    return new MockRedis(name);
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: isBullMQ ? null : 3,
      connectTimeout: 5000,
      enableReadyCheck: false,
    });

    client.on("connect", () =>
      logger.info(`[REDIS] ${name} client connected.`)
    );
    client.on("error", (err) =>
      logger.error(`[REDIS] ${name} client error: ${err.message || err}`)
    );

    return client;
  } catch (err) {
    logger.error(
      `[REDIS] Failed to initialize Redis ${name}: ${err.message || err}`
    );
    return new MockRedis(name);
  }
}

// ── General-purpose client (presence, rate-limit, live state) ──────────────
export const redisClient = createRedisClient("General", REDIS_URL);

// ── BullMQ-specific client (maxRetriesPerRequest MUST be null for BullMQ) ──
export const bullmqConnection = createRedisClient("BullMQ", REDIS_URL, true);

// ── Socket.io Redis Adapter Clients ────────────────────────────────────────
export const pubClient = createRedisClient("Pub", REDIS_URL);
export const subClient = createRedisClient("Sub", REDIS_URL);

export default redisClient;
