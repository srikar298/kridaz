const fs = require('fs');
const p = 'server/modules/scoring/scoring.service.js';
let c = fs.readFileSync(p, 'utf8');

const regex = /if \(\!hostedGame\) \{\r?\n\s*throw new NotFoundError\("Match not found"\);\r?\n\s*\}/g;

const replacement = `if (!hostedGame) {
    throw new NotFoundError("Match not found");
  }
  if (viewer?.id !== hostedGame.hostId) {
    throw new ForbiddenError("Only the host can manage live broadcast");
  }`;

c = c.replace(regex, replacement);
fs.writeFileSync(p, c, 'utf8');
console.log('Fixed live sessions!');
