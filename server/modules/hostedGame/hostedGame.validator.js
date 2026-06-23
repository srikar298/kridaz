import { z } from "zod";

export const createHostedGameSchema = z.object({
  body: z.object({
    gameType: z.string().min(1, "Game type is required"),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    city: z.string().nullish(),
    state: z.string().nullish(),
    perPlayerCharge: z.coerce
      .number()
      .min(0, "Charge must be non-negative")
      .nullish()
      .default(0),
    playerCount: z.coerce
      .number()
      .int()
      .min(2, "Player count must be at least 2")
      .nullish(),
    gameMode: z.enum(["PROFESSIONAL", "FRIENDLY", "QUICK", "HIRING"]).nullish(),
    groundId: z.string().nullish(),
    umpireId: z.string().nullish(),
    streamerId: z.string().nullish(),
  }),
});

export const joinGameRequestSchema = z.object({
  params: z.object({
    gameId: z.string().min(1, "Game ID is required"),
  }),
  body: z.object({
    role: z.string().min(1, "Role is required"),
  }),
});
