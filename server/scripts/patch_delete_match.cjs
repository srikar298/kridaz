const fs = require('fs');
const path = 'server/modules/scoring/scoring.service.js';
let content = fs.readFileSync(path, 'utf8');

const target1 = `export const deleteScoringMatch = async (matchId, userId) => {
  // Add appropriate validation
  const game = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!game) {
    throw new NotFoundError("MATCH_NOT_FOUND");
  }`;

const replacement1 = `export const deleteScoringMatch = async (matchId, userId) => {
  const game = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!game) {
    throw new NotFoundError("MATCH_NOT_FOUND");
  }
  if (game.hostId !== userId) {
    throw new ForbiddenError("Only the host can delete this match");
  }`;

content = content.replace(target1, replacement1);
fs.writeFileSync(path, content, 'utf8');
console.log('Patched deleteScoringMatch');
