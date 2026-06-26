const fs = require('fs');

const path = 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/server/modules/scoring/scoring.service.js';
let content = fs.readFileSync(path, 'utf8');

// Also manually fix goLiveSession and endLiveSession auth checking
content = content.replace(
  '  if (!hostedGame) {\n    throw new NotFoundError("Match not found");\n  }',
  '  if (!hostedGame) {\n    throw new NotFoundError("Match not found");\n  }\n\n  if (viewer?.id !== hostedGame.hostId) {\n    throw new ForbiddenError("Only the host can manage live broadcast");\n  }'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched goLiveSession and endLiveSession auth checks');
