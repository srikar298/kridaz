const fs = require('fs');
const mod = fs.readFileSync('kridaz_hostgame_mod.jsx', 'utf8');

const s1 = mod.indexOf('{gameData.requestType === "MATCH" && (');
const e1 = mod.indexOf('                <div className="flex gap-3 pt-4 mt-4">');

if (s1 !== -1 && e1 !== -1) {
    fs.writeFileSync('extracted_sections.txt', mod.substring(s1, e1));
    console.log("Extracted successfully.");
} else {
    console.log("Could not find start or end index.");
}
