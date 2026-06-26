const fs = require('fs');

let extracted = fs.readFileSync('extracted_sections.txt', 'utf8');

// Replace the rogue </div> that caused the syntax error
extracted = extracted.replace('              ) : null}\n            </div>\n\n            {/* Pricing / Quick Settings Section */}', '              ) : null}\n\n            {/* Pricing / Quick Settings Section */}');

// We also need to change gameData.requestType === "MATCH" to "QUICK_MATCH" || "PRO_MATCH" because there is no MATCH anymore.
// Wait, actually let's just make it check for QUICK_MATCH or PRO_MATCH
extracted = extracted.replace('{gameData.requestType === "MATCH" && (', '{(gameData.requestType === "QUICK_MATCH" || gameData.requestType === "PRO_MATCH") && (');


let content = fs.readFileSync('client/user/src/features/games/pages/HostGame.jsx', 'utf8');

const anchor = `            ) : null}

            {(gameData.requestType !== "MATCH" || gameData.gameMode) &&
              gameData.requestType && (
                <div className="flex justify-end mt-2">`;

if (content.includes(anchor)) {
    const replacement = `            ) : null}\n\n${extracted}\n\n            {(gameData.requestType !== "MATCH" || gameData.gameMode) &&
              gameData.requestType && (
                <div className="flex justify-end mt-2">`;
    content = content.replace(anchor, replacement);
    fs.writeFileSync('client/user/src/features/games/pages/HostGame.jsx', content, 'utf8');
    console.log("Successfully injected settings sections into HostGame.jsx");
} else {
    console.log("Anchor not found in HostGame.jsx");
}
