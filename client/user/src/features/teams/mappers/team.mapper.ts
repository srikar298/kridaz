/**
 * @file team.mapper.ts
 * @description Adapts raw team and team member profiles from the backend to clean, type-safe contract interfaces.
 */

import { Team, TeamMember } from "../../../contracts/team.contract";

export class TeamMapper {
  /**
   * Adapts a raw team member profile safely with logical defaults.
   */
  public static toTeamMember(raw: any): TeamMember {
    if (!raw) {
      throw new Error("TeamMapper: Raw team member payload is required");
    }

    return {
      id: raw.id || raw._id || "",
      teamId: raw.teamId || raw.team || "",
      userId: raw.userId || raw.user || undefined,
      name: raw.name || raw.user?.name || "Player",
      role: ["CAPTAIN", "VICE_CAPTAIN", "PLAYER", "GUEST"].includes(raw.role)
        ? raw.role
        : "PLAYER",
      status: ["PENDING", "ACCEPTED", "DECLINED"].includes(raw.status)
        ? raw.status
        : "PENDING",
    };
  }

  /**
   * Adapts raw team profiles securely with normalized lists and fallback properties.
   */
  public static toTeam(raw: any): Team {
    if (!raw) {
      throw new Error("TeamMapper: Raw team payload is required");
    }

    const rawMembers = Array.isArray(raw.members) ? raw.members : [];

    return {
      id: raw.id || raw._id || "",
      name: raw.name || "Unnamed Team",
      code: raw.code || raw.teamCode || "",
      logo: raw.logo || raw.image || undefined,
      sportType: raw.sportType || "CRICKET",
      creatorId: raw.creatorId || raw.ownerId || "",
      members: rawMembers.map((m: any) => this.toTeamMember(m)),
      createdAt: raw.createdAt || undefined,
    };
  }

  /**
   * Adapts a collection of raw team objects.
   */
  public static toTeamList(rawArray: any[]): Team[] {
    if (!Array.isArray(rawArray)) {
      return [];
    }
    return rawArray.map((raw) => this.toTeam(raw));
  }
}
