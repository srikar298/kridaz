import { z } from "zod";

export const matchStatusSchema = z.enum([
  "SCHEDULED",
  "LIVE",
  "COMPLETED",
  "ABANDONED",
  "DELAYED",
]);

export const matchScoreSchema = z.object({
  id: z.string().uuid(),
  teamAId: z.string().uuid(),
  teamBId: z.string().uuid(),
  scorerId: z.string().uuid(),
  scoreA: z.number().nonnegative().default(0),
  scoreB: z.number().nonnegative().default(0),
  oversA: z.number().nonnegative().default(0.0),
  oversB: z.number().nonnegative().default(0.0),
  wicketsA: z.number().nonnegative().default(0),
  wicketsB: z.number().nonnegative().default(0),
  status: matchStatusSchema,
  sportType: z.string().min(1),
  currentInnings: z.number().min(1).max(2).default(1),
});

export const ballEventSchema = z.object({
  matchId: z.string().uuid(),
  batsmanId: z.string().uuid(),
  bowlerId: z.string().uuid(),
  runs: z.number().min(0).max(6),
  extraRuns: z.number().min(0).default(0),
  extraType: z
    .enum(["NONE", "WIDE", "NO_BALL", "BYE", "LEG_BYE"])
    .default("NONE"),
  isWicket: z.boolean().default(false),
  wicketType: z
    .enum(["BOWLED", "CAUGHT", "RUN_OUT", "LBW", "STUMPED", "NONE"])
    .optional(),
});

export type MatchStatus = z.infer<typeof matchStatusSchema>;
export type MatchScore = z.infer<typeof matchScoreSchema>;
export type BallEvent = z.infer<typeof ballEventSchema>;
