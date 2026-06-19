/**
 * @file scoring.mapper.ts
 * @description Maps raw cricket/sport scoring data models between backend API responses and structured contract models.
 */

import { MatchScore, BallEvent } from "../../../contracts/scoring.contract";

export class ScoringMapper {
  /**
   * Maps raw match details and score updates to client MatchScore models.
   */
  public static toMatchScore(raw: any): MatchScore {
    if (!raw) {
      throw new Error("ScoringMapper: Raw match score payload is required");
    }

    return {
      id: raw.id || raw._id || "",
      teamAId: raw.teamAId || raw.teamA || "",
      teamBId: raw.teamBId || raw.teamB || "",
      scorerId: raw.scorerId || raw.scorer || "",
      scoreA: raw.scoreA !== undefined ? Number(raw.scoreA) : 0,
      scoreB: raw.scoreB !== undefined ? Number(raw.scoreB) : 0,
      oversA: raw.oversA !== undefined ? Number(raw.oversA) : 0.0,
      oversB: raw.oversB !== undefined ? Number(raw.oversB) : 0.0,
      wicketsA: raw.wicketsA !== undefined ? Number(raw.wicketsA) : 0,
      wicketsB: raw.wicketsB !== undefined ? Number(raw.wicketsB) : 0,
      status: [
        "SCHEDULED",
        "LIVE",
        "COMPLETED",
        "ABANDONED",
        "DELAYED",
      ].includes(raw.status)
        ? raw.status
        : "SCHEDULED",
      sportType: raw.sportType || raw.sport || "CRICKET",
      currentInnings:
        raw.currentInnings !== undefined ? Number(raw.currentInnings) : 1,
    };
  }

  /**
   * Maps ball-by-ball events for live game status feeds.
   */
  public static toBallEvent(raw: any): BallEvent {
    if (!raw) {
      throw new Error("ScoringMapper: Raw ball event payload is required");
    }

    return {
      matchId: raw.matchId || raw.match || "",
      batsmanId: raw.batsmanId || raw.batsman || "",
      bowlerId: raw.bowlerId || raw.bowler || "",
      runs: raw.runs !== undefined ? Number(raw.runs) : 0,
      extraRuns: raw.extraRuns !== undefined ? Number(raw.extraRuns) : 0,
      extraType: ["NONE", "WIDE", "NO_BALL", "BYE", "LEG_BYE"].includes(
        raw.extraType
      )
        ? raw.extraType
        : "NONE",
      isWicket: Boolean(raw.isWicket),
      wicketType: [
        "BOWLED",
        "CAUGHT",
        "RUN_OUT",
        "LBW",
        "STUMPED",
        "NONE",
      ].includes(raw.wicketType)
        ? raw.wicketType
        : undefined,
    };
  }

  /**
   * Maps a collection of raw match scores.
   */
  public static toMatchScoreList(rawArray: any[]): MatchScore[] {
    if (!Array.isArray(rawArray)) {
      return [];
    }
    return rawArray.map((raw) => this.toMatchScore(raw));
  }
}
