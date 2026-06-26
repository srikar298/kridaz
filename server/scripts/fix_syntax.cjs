const fs = require('fs');
const p = 'server/modules/scoring/scoring.service.js';
let c = fs.readFileSync(p, 'utf8');

const regex = /\{\s*expiresIn:\s*"8h"\s*\}\r?\n\s*return\s*true;\r?\n\};\r?\nexport\s*const\s*toggleMatchTimer/g;
const replacement = `{ expiresIn: "8h" }
  );
  return { token };
};

export const deleteScoringMatch = async (matchId, userId) => {
  const game = await prisma.hostedGame.findUnique({ where: { id: matchId } });
  if (!game) {
    throw new NotFoundError("MATCH_NOT_FOUND");
  }
  if (game.hostId !== userId) {
    throw new ForbiddenError("Only the host can delete this match");
  }

  await prisma.hostedGame.delete({ where: { id: matchId } });
  return true;
};

export const toggleMatchTimer`;

c = c.replace(regex, replacement);
fs.writeFileSync(p, c, 'utf8');
console.log('Fixed syntax with regex!');
