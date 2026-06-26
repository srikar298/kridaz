const fs = require('fs');
const path = 'server/modules/scoring/scoring.service.js';
let content = fs.readFileSync(path, 'utf8');

const target = `    { gameId: game.id, role: "SCORER", shortId: game.shortId },
    getAccessSecret(),
    { expiresIn: "8h" }
  return true;
};
export const toggleMatchTimer = async (scoringId, viewer) => {`;

const replacement = `    { gameId: game.id, role: "SCORER", shortId: game.shortId },
    getAccessSecret(),
    { expiresIn: "8h" }
  );
  return { token };
};

/**
 * Delete match permanently (placeholder for actual implementation)
 */
export const deleteScoringMatch = async (matchId, userId) => {
  const game = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!game) {
    throw new NotFoundError("MATCH_NOT_FOUND");
  }
  if (game.hostId !== userId) {
    throw new ForbiddenError("Only the host can delete this match");
  }

  // Delete the match
  await prisma.hostedGame.delete({ where: { id: matchId } });
  return true;
};

export const toggleMatchTimer = async (scoringId, viewer) => {`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('Restored and patched deleteScoringMatch');
