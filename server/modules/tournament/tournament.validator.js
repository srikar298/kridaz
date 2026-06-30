import { z } from "zod";

export const createTournamentSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Tournament name must be at least 3 characters")
      .max(100),
    sport: z.string().min(1, "Sport is required"),
    format: z.string().min(1, "Format is required"),
    details: z.any().optional(),
    logoUrl: z.string().optional().nullable(),
    organizerName: z.string().optional().nullable(),
    organizerNumber: z.string().optional().nullable(),
    organizerEmail: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    ballType: z.string().optional().nullable(),
    pitchType: z.string().optional().nullable(),
    matchType: z.string().optional().nullable(),
    maxTeams: z.coerce.number().optional().nullable(),
    entryFee: z.coerce.number().min(0).optional(),
    advanceFee: z.coerce.number().min(0).optional(),
    prizePool: z.coerce.number().min(0).optional(),
    numberOfWinners: z.coerce.number().min(1).optional(),
    venues: z.array(z.any()).optional(),
    officials: z.array(z.any()).optional(),
  }),
});

export const updateTournamentSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100).optional(),
    sport: z.string().optional(),
    format: z.string().optional(),
    entryFee: z.coerce.number().min(0).optional(),
    advanceFee: z.coerce.number().min(0).optional(),
    prizePool: z.coerce.number().min(0).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "COMPLETED"]).optional(),
    currentStep: z.coerce.number().min(1).max(10).optional(),
    details: z.any().optional(), // Can hold any JSON data for draft progress
    logoUrl: z.string().optional().nullable(),
    organizerName: z.string().optional().nullable(),
    organizerNumber: z.string().optional().nullable(),
    organizerEmail: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    ballType: z.string().optional().nullable(),
    pitchType: z.string().optional().nullable(),
    matchType: z.string().optional().nullable(),
    maxTeams: z.coerce.number().optional().nullable(),
    numberOfWinners: z.coerce.number().min(1).optional(),
    venues: z.array(z.any()).optional(),
    officials: z.array(z.any()).optional(),
  }),
});
