/**
 * Formats a batter's dismissal status into human-readable cricket notation.
 * Used on the public scorecard and timeline.
 * 
 * @param {Object} stat - MatchPlayerStat object
 * @param {Object} [namesMap] - Optional map of user/invite ID to player names
 */
export const formatOutStatus = (stat, namesMap = {}) => {
  const status = stat.outStatus || "NOT_OUT";
  if (status === "NOT_OUT") return "not out";

  const getName = (id) => {
    if (!id) return "";
    return namesMap[id] || stat.user?.name || "Player";
  };

  const bowlerName = getName(stat.dismissedById);
  const fielderName = getName(stat.caughtById);

  switch (status) {
    case "BOWLED":
      return bowlerName ? `b ${bowlerName}` : "bowled";
    case "LBW":
      return bowlerName ? `lbw b ${bowlerName}` : "lbw";
    case "CAUGHT":
      if (stat.dismissedById && stat.caughtById && stat.dismissedById === stat.caughtById) {
        return `c & b ${bowlerName}`;
      }
      return fielderName && bowlerName
        ? `c ${fielderName} b ${bowlerName}`
        : "caught";
    case "STUMPED":
      return fielderName && bowlerName
        ? `st †${fielderName} b ${bowlerName}`
        : bowlerName
          ? `st b ${bowlerName}`
          : "stumped";
    case "HIT_WICKET":
      return bowlerName ? `hit wicket b ${bowlerName}` : "hit wicket";
    case "RUN_OUT":
      return fielderName ? `run out (${fielderName})` : "run out";
    case "MANKAD":
      return "Mankad (run out)";
    case "RETIRED_HURT":
      return "retired hurt";
    case "RETIRED_OUT":
      return "retired out";
    case "OBSTRUCTING_FIELD":
      if (stat.obstructionMode === "DEFLECT_BALL") return "obstructing the field (deflected ball)";
      if (stat.obstructionMode === "KNOCKED_AWAY") return "obstructing the field (knocked away)";
      return "obstructing the field";
    case "HIT_BALL_TWICE":
      return "hit ball twice";
    case "HANDLED_BALL":
      return "handled the ball";
    case "TIMED_OUT":
      return "timed out";
    default:
      return status.toLowerCase().replace(/_/g, " ");
  }
};

/**
 * Formats a ball-by-ball timeline event's dismissal description.
 * 
 * @param {Object} ball - MatchBall timeline object
 */
export const formatBallDismissal = (ball) => {
  if (!ball.isWicket) return "";

  const batter = ball.batter?.name || "Batter";
  const bowler = ball.bowler?.name || "Bowler";
  const fielder = ball.fielder?.name || "";

  const type = ball.wicketType || "";

  switch (type) {
    case "BOWLED":
      return `${batter} bowled by ${bowler}`;
    case "LBW":
      return `${batter} lbw bowled ${bowler}`;
    case "CAUGHT":
      return fielder 
        ? `${batter} caught ${fielder} bowled ${bowler}` 
        : `${batter} caught bowled ${bowler}`;
    case "STUMPED":
      return fielder
        ? `${batter} stumped ${fielder} bowled ${bowler}`
        : `${batter} stumped bowled ${bowler}`;
    case "HIT_WICKET":
      return `${batter} hit wicket bowled ${bowler}`;
    case "RUN_OUT":
      return fielder
        ? `${batter} run out (${fielder})`
        : `${batter} run out`;
    case "MANKAD":
      return `${batter} run out (Mankad)`;
    case "RETIRED_HURT":
      return `${batter} retired hurt`;
    case "RETIRED_OUT":
      return `${batter} retired out`;
    case "OBSTRUCTING_FIELD":
      if (ball.obstructionMode === "DEFLECT_BALL") return `${batter} out for obstructing the field (deflected ball)`;
      if (ball.obstructionMode === "KNOCKED_AWAY") return `${batter} out for obstructing the field (knocked away)`;
      return `${batter} out for obstructing the field`;
    case "HIT_BALL_TWICE":
      return `${batter} out for hitting the ball twice`;
    case "HANDLED_BALL":
      return `${batter} out for handled ball`;
    case "TIMED_OUT":
      return `${batter} timed out`;
    default:
      return `${batter} out (${type.toLowerCase().replace(/_/g, " ")})`;
  }
};
