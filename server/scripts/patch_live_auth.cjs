const fs = require('fs');
const path = 'server/modules/scoring/scoring.service.js';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `  if (!hostedGame) {
    throw new NotFoundError("Match not found");
  }`;

const replacementStr = `  if (!hostedGame) {
    throw new NotFoundError("Match not found");
  }
  if (viewer?.id !== hostedGame.hostId) {
    throw new ForbiddenError("Only the host can manage live broadcast");
  }`;

content = content.split(targetStr).join(replacementStr);
fs.writeFileSync(path, content, 'utf8');
console.log('Patched goLiveSession and endLiveSession');
