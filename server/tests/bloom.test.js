import {
  addUsernameToBloom,
  checkUsernameBloom,
  addReelInteractionToBloom,
  checkReelInteractionBloom,
  blacklistOtpIdentifier,
  isOtpBlacklisted,
} from "../utils/bloomFilter.js";
import { redisClient } from "../config/redis.js";

describe("Bloom Filter & High-Speed Membership Testing", () => {
  beforeAll(async () => {
    // Clear test keys before starting
    await redisClient.del("kridaz:usernames:bloom");
    await redisClient.del("kridaz:reels:interactions:bloom");
    await redisClient.del("kridaz:otp:blacklist:bloom");
  }, 10000);

  afterAll(async () => {
    // Cleanup
    await redisClient.del("kridaz:usernames:bloom");
    await redisClient.del("kridaz:reels:interactions:bloom");
    await redisClient.del("kridaz:otp:blacklist:bloom");
  });

  describe("Username Bloom Filter", () => {
    it("should correctly identify a new username as available", async () => {
      const available = await checkUsernameBloom("unique_user_999");
      expect(available).toBe(true);
    });

    it("should correctly identify a taken username after adding it", async () => {
      await addUsernameToBloom("taken_user_1");
      const available = await checkUsernameBloom("taken_user_1");
      expect(available).toBe(false);
    });

    it("should be case-insensitive", async () => {
      await addUsernameToBloom("CaseSensitive");
      const available = await checkUsernameBloom("casesensitive");
      expect(available).toBe(false);
    });
  });

  describe("Reels Interaction Bloom Filter", () => {
    it("should track a new interaction", async () => {
      const userId = "user123";
      const reelId = "reel456";
      const type = "like";

      const existsBefore = await checkReelInteractionBloom(
        userId,
        reelId,
        type
      );
      expect(existsBefore).toBe(false);

      await addReelInteractionToBloom(userId, reelId, type);

      const existsAfter = await checkReelInteractionBloom(userId, reelId, type);
      expect(existsAfter).toBe(true);
    });

    it("should distinguish between different interaction types", async () => {
      const userId = "u1";
      const reelId = "r1";

      await addReelInteractionToBloom(userId, reelId, "view");

      expect(await checkReelInteractionBloom(userId, reelId, "view")).toBe(
        true
      );
      expect(await checkReelInteractionBloom(userId, reelId, "like")).toBe(
        false
      );
    });
  });

  describe("OTP Blacklisting Filter", () => {
    it("should not blacklist an identifier by default", async () => {
      const blocked = await isOtpBlacklisted("9876543210");
      expect(blocked).toBe(false);
    });

    it("should blacklist an identifier when requested", async () => {
      const phone = "1234567890";
      await blacklistOtpIdentifier(phone, 2); // 2 second TTL

      const blocked = await isOtpBlacklisted(phone);
      expect(blocked).toBe(true);
    });

    it("should automatically unblock after TTL expires", async () => {
      const email = "test@example.com";
      await blacklistOtpIdentifier(email, 1); // 1 second TTL

      expect(await isOtpBlacklisted(email)).toBe(true);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const blocked = await isOtpBlacklisted(email);
      expect(blocked).toBe(false);
    });
  });
});
