import { z } from "zod";

export const teamMemberRoleSchema = z.enum([
  "CAPTAIN",
  "VICE_CAPTAIN",
  "PLAYER",
  "GUEST",
]);

export const teamMemberSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  name: z.string().min(1),
  role: teamMemberRoleSchema.default("PLAYER"),
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED"]).default("PENDING"),
});

export const teamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, "Team name must be at least 3 characters"),
  code: z.string().min(5),
  logo: z.string().optional(),
  sportType: z.string().min(1, "Sport type is required"),
  creatorId: z.string().uuid(),
  members: z.array(teamMemberSchema).default([]),
  createdAt: z.string().datetime().optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters"),
  sportType: z.string().min(1, "Sport type is required"),
  logo: z.string().optional(),
});

export const teamInviteSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export type TeamMemberRole = z.infer<typeof teamMemberRoleSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type Team = z.infer<typeof teamSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type TeamInviteInput = z.infer<typeof teamInviteSchema>;
