import { z } from "zod";

export const startScoringSchema = z.object({
  body: z
    .object({
      gameId: z.string().min(1).optional(),
      matchId: z.string().min(1).optional(),
      battingTeamId: z.string().min(1).optional(),
      battingTeam: z.string().min(1).optional(),
    })
    .refine((data) => data.gameId || data.matchId, {
      message: "Either gameId or matchId is required",
      path: ["gameId"],
    }),
});

export const updateScoreSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
    ballData: z.object({
      // Off-the-bat runs only. Max is 6 (boundary). 7 isn't a legal cricket
      // outcome from striking the ball — overthrows / extras land on
      // `extraRuns`. Previous cap of 7 was too generous; meanwhile a 4 + 4
      // overthrow boundary case (Law 19.8) was rejected entirely. Now: 6 off
      // the bat, and extraRuns covers anything above.
      runs: z.number().int().min(0).max(6),
      // Wides/no-balls/byes/leg-byes/penalty + overthrows. Cap at 10 to allow
      // pathological-but-legal cases like a no-ball + 4 overthrows + 4 byes.
      extraRuns: z.number().int().min(0).max(10).optional(),
      isExtra: z.boolean().optional(),
      extraType: z
        .enum(["NONE", "WIDE", "NO_BALL", "BYE", "LEG_BYE", "PENALTY"])
        .optional(),
      isWicket: z.boolean().optional(),
      wicketType: z.string().optional(),
      isOverthrow: z.boolean().optional(),
      overthrowRuns: z.number().int().min(0).max(6).optional(),
      isDeadBall: z.boolean().optional(),
      obstructionMode: z.string().optional(),
      didCross: z.boolean().optional(),
      isBoundary: z.boolean().optional(),
      isFour: z.boolean().optional(),
      isSix: z.boolean().optional(),
      batsmanId: z.string().min(1, "Batsman ID is required"),
      bowlerId: z.string().min(1, "Bowler ID is required"),
    }),
  }),
});

export const tossSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
    wonByTeamId: z.string().min(1, "Winning team ID is required"),
    decision: z.enum(["BAT", "BOWL"]),
  }),
});

export const setupScoringGameSchema = z.object({
  body: z.object({
    matchName: z.string().min(1, "Match Name is required"),
    format: z.string().optional(),
    ballType: z.string().optional(),
    groundType: z.string().optional(),
    maxMembers: z.number().int().positive().optional(),
    teamAId: z.string().optional(),
    teamBId: z.string().optional(),
    teamAData: z.any().optional(),
    teamBData: z.any().optional(),
    teamAPlayers: z.array(z.any()).optional(),
    teamBPlayers: z.array(z.any()).optional(),
    venueId: z.string().optional().nullable(),
    customVenue: z.string().optional().nullable(),
    sportType: z.string().optional(),
    professionals: z.array(z.any()).optional(),
    customProfessionals: z.array(z.any()).optional(),
    tossWinner: z.string().optional(),
    tossDecision: z.string().optional(),
    powerPlayOvers: z.number().int().optional(),
    powerPlayMapping: z.array(z.number()).optional(),
    scoringPassword: z
      .string()
      .min(4, "Password must be at least 4 characters")
      .optional()
      .nullable()
      .or(z.literal("")),
    youtubeLiveUrl: z.string().url().optional().nullable().or(z.literal("")),
    customDays: z.number().int().min(1).max(10).optional(),
    customOversPerDay: z.number().int().min(1).max(100).optional(),
    slowOverRateConfig: z.any().optional(),
  }),
});

export const undoLastBallSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
  }),
});

export const completeMatchSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
  }),
});

export const startNextInningsSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
    battingTeamId: z.string().min(1, "Batting Team ID is required"),
    isFollowOn: z.boolean().optional(),
    isSuperOver: z.boolean().optional(),
  }),
});

export const setPlayersSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
    strikerId: z.string().min(1).optional().nullable(),
    nonStrikerId: z.string().min(1).optional().nullable(),
    bowlerId: z.string().min(1).optional().nullable(),
    wicketKeeperId: z.string().min(1).optional().nullable(),
  }),
});

export const updateHouseRulesSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
    houseRules: z
      .object({
        enforceConsecutiveOverBlock: z.boolean().nullable().optional(),
        enforceFreeHit: z.boolean().nullable().optional(),
        penaltyEnabled: z.boolean().nullable().optional(),
        wideIsLegalBall: z.boolean().nullable().optional(),
        noBallIsLegalBall: z.boolean().nullable().optional(),
        ballsPerOver: z.number().int().min(1).max(12).nullable().optional(),
        playersPerTeam: z.number().int().min(2).max(30).nullable().optional(),
        lastManStands: z.boolean().nullable().optional(),
        maxRunsPerBall: z.number().int().min(1).max(12).nullable().optional(),
      })
      .refine((obj) => Object.keys(obj).length > 0, {
        message: "At least one rule must be supplied",
      }),
  }),
});
