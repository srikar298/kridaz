const fs = require('fs');

const path = 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/server/modules/scoring/scoring.service.js';
let content = fs.readFileSync(path, 'utf8');

const authFunction = `
const verifyScoringAuth = async (scoringId, viewer) => {
  if (!viewer || (!viewer.id && viewer.role?.toLowerCase() !== "scorer")) {
    const err = new UnauthorizedError("Authentication required.");
    err.meta = { code: "AUTH_REQUIRED" };
    throw err;
  }
  const scoring = await prisma.cricketMatch.findUnique({
    where: { id: scoringId },
    select: { gameId: true }
  });
  if (!scoring) throw new NotFoundError("Match not found", { code: "MATCH_NOT_FOUND" });
  
  const game = await prisma.hostedGame.findUnique({
    where: { id: scoring.gameId },
    select: { hostId: true, umpireId: true, scorerId: true }
  });
  
  const role = (viewer.role || "").toLowerCase();
  const isScorerToken = role === "scorer";
  const isHost = viewer.id && game?.hostId === viewer.id;
  const isAssignedUmpire = viewer.id && game?.umpireId === viewer.id;
  const isAssignedScorer = viewer.id && game?.scorerId === viewer.id;
  
  if (!isScorerToken && !isHost && !isAssignedUmpire && !isAssignedScorer) {
    const err = new ForbiddenError("Not authorized to modify this match");
    err.meta = { code: "FORBIDDEN" };
    throw err;
  }
  return true;
};
`;

// Insert authFunction after the imports, before HOSTED_GAME_SCORING_INCLUDE
content = content.replace('const HOSTED_GAME_SCORING_INCLUDE', authFunction + '\nconst HOSTED_GAME_SCORING_INCLUDE');

// Functions to patch: signature and add verifyScoringAuth call as first line.
const toPatch = [
  { name: 'finalizeMatch', sig: '(scoringId', newSig: '(scoringId, viewer' },
  { name: 'advanceToNextInnings', sig: '(scoringId, battingTeamId', newSig: '(scoringId, battingTeamId, viewer' },
  { name: 'updateMatchStatus', sig: '(scoringId, newStatus', newSig: '(scoringId, newStatus, viewer' },
  { name: 'reviseTargetAndOvers', sig: '(scoringId, revisedTarget, revisedOvers', newSig: '(scoringId, revisedTarget, revisedOvers, viewer' },
  { name: 'setMatchOfficials', sig: '(scoringId, umpireId, scorerId, streamerId', newSig: '(scoringId, umpireId, scorerId, streamerId, viewer' },
  { name: 'substitutePlayer', sig: '(scoringId, outPlayerId, inPlayerId, role', newSig: '(scoringId, outPlayerId, inPlayerId, role, viewer' },
  { name: 'useReview', sig: '(scoringId, teamId, isSuccessful', newSig: '(scoringId, teamId, isSuccessful, viewer' },
  { name: 'setPowerplayOvers', sig: '(scoringId, startOver, endOver, type', newSig: '(scoringId, startOver, endOver, type, viewer' },
  { name: 'updateTossResult', sig: '(scoringId, tossWinner, tossDecision', newSig: '(scoringId, tossWinner, tossDecision, viewer' },
  { name: 'updateActivePlayers', sig: '(scoringId, players', newSig: '(scoringId, players, viewer' },
  { name: 'revertLastBall', sig: '(scoringId', newSig: '(scoringId, viewer' },
  { name: 'processScoreUpdate', sig: '(scoringId, payload', newSig: '(scoringId, payload, viewer' },
  { name: 'toggleMatchTimer', sig: '(scoringId', newSig: '(scoringId, viewer' },
  { name: 'addPenaltyRuns', sig: '(scoringId, runs, teamId', newSig: '(scoringId, runs, teamId, viewer' },
  { name: 'updateCommentarySettings', sig: '(scoringId, settings', newSig: '(scoringId, settings, viewer' }
];

toPatch.forEach(patch => {
  const oldStr = `export const ${patch.name} = async ${patch.sig}) => {`;
  const newStr = `export const ${patch.name} = async ${patch.newSig}) => {\n  await verifyScoringAuth(scoringId, viewer);`;
  content = content.replace(oldStr, newStr);
});

// Also manually fix goLiveSession and endLiveSession
// goLiveSession(matchId) -> goLiveSession(matchId, viewer)
// endLiveSession(matchId) -> endLiveSession(matchId, viewer)
content = content.replace('export const goLiveSession = async (matchId) => {', 'export const goLiveSession = async (matchId, viewer) => {');
content = content.replace('export const endLiveSession = async (matchId) => {', 'export const endLiveSession = async (matchId, viewer) => {');

fs.writeFileSync(path, content, 'utf8');
console.log('Patched scoring.service.js');
