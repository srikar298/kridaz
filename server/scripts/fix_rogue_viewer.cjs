const fs = require('fs');
const p = 'server/modules/scoring/scoring.service.js';
let lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);

// Remove the lines starting around 1968
// Since removing lines shifts the index, we delete from bottom up.
lines.splice(1967, 3);
lines.splice(675, 3);

fs.writeFileSync(p, lines.join('\n'), 'utf8');
console.log('Removed invalid viewer checks');
