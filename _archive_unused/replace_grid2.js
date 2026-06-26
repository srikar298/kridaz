const fs = require('fs');

const path = 'client/user/src/features/games/pages/HostGame.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Find the start of the grid options array
const gridOptionsStart = content.indexOf('{[\\n                      {\\n                        id: "TOURNAMENT",');
const gridOptionsEnd = content.indexOf('].map((req) => (\\n                      <button\\n                        type="button"\\n                        key={req.id}');

if (gridOptionsStart !== -1 && gridOptionsEnd !== -1) {
  const newGrid = `{[
                      {
                        id: "TOURNAMENT",
                        label: "Host Tournament",
                        icon: <Trophy size={20} className="text-[#FFD700]" />,
                        desc: "League, Knockout, IPL Style",
                      },
                      {
                        id: "MATCH",
                        label: "Host a Match",
                        icon: <Trophy size={20} />,
                        desc: "Quick or Pro Matches",
                      },
                      {
                        id: "LOOKING_FOR",
                        label: "Looking For",
                        icon: <Search size={20} />,
                        desc: "Hire or find players",
                      },
                      {
                        id: "GBNO",
                        label: "Ground Booked",
                        icon: <MapPin size={20} />,
                        desc: "Need Opponent",
                      },
                      {
                        id: "PRACTICE",
                        label: "Practice Match",
                        icon: <ShieldCheck size={20} />,
                        desc: "Friendly Practice",
                      },
                    `;
  content = content.substring(0, gridOptionsStart) + newGrid + content.substring(gridOptionsEnd);
  console.log("Replaced grid options array successfully.");
} else {
  console.log("Failed to find grid options array bounds.", {
    gridOptionsStart,
    gridOptionsEnd
  });
}

// 2. Find and remove the Hire Professionals section
const hireProfStartStr = `                <div>\\n                  <h2 className="text-sm font-bold text-white/70 mb-3 uppercase tracking-widest flex items-center gap-2">`;
const hireProfStartIndex = content.indexOf(hireProfStartStr);

if (hireProfStartIndex === -1) {
    // try a regex approach
    const match = content.match(/<div>\\s*<h2 className="text-sm font-bold text-white\\/70 mb-3 uppercase tracking-widest flex items-center gap-2">\\s*<div className="w-\\[3px\\] h-\\[14px\\] bg-gradient-to-b from-secondary to-primary rounded-full" \\/>\\s*Hire Professionals/);
    if(match) {
        const startIndex = match.index;
        const endIndexStr = `                    ))}\\n                  </div>\\n                </div>`;
        const endIndex = content.indexOf(endIndexStr, startIndex);
        if(endIndex !== -1) {
             content = content.substring(0, startIndex) + content.substring(endIndex + endIndexStr.length);
             console.log("Removed Hire professionals section via regex match.");
        }
    } else {
        console.log("Could not find Hire Professionals section.");
    }
}

fs.writeFileSync(path, content);
console.log("Script completed.");
