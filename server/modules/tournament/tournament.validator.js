import { z } from "zod";

export const createTournamentSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Tournament name must be at least 3 characters").max(100),
    sport: z.string().min(1, "Sport is required"),
    format: z.string().min(1, "Format is required"),
    details: z.object({
      about: z.string().optional(),
      awards: z.string().optional(),
      facilities: z.string().optional(),
      refreshments: z.string().optional(),
    }).optional(),
  }),
});

export const updateTournamentSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100).optional(),
    sport: z.string().optional(),
    format: z.string().optional(),
    entryFee: z.number().min(0).optional(),
    advanceFee: z.number().min(0).optional(),
    prizePool: z.number().min(0).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "COMPLETED"]).optional(),
    currentStep: z.number().min(1).max(8).optional(),
    details: z.any().optional(), // Can hold any JSON data for draft progress
  }),
});
