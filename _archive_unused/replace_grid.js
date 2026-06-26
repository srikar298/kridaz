const fs = require('fs');

const path = 'client/user/src/features/games/pages/HostGame.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the first grid array
const oldGridStart = `                    {[
                      {
                        id: "TOURNAMENT",
                        label: "Host Tournament",
                        icon: <Trophy size={20} className="text-[#FFD700]" />,
                        desc: "League, Knockout, IPL Style",
                      },`;

const oldGridEnd = `                      {
                        id: "NET_BOWLERS",
                        label: "Net Bowlers",
                        icon: <Zap size={20} />,
                        desc: "Need bowlers for nets",
                      },
                    ].map((req) => (`;

const newGrid = `                    {[
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
                    ].map((req) => (`;

const startIndex = content.indexOf(oldGridStart);
const endIndex = content.indexOf(oldGridEnd) + oldGridEnd.length;

if (startIndex !== -1 && content.indexOf(oldGridEnd) !== -1) {
  content = content.substring(0, startIndex) + newGrid + content.substring(endIndex);
  console.log("Grid options updated.");
} else {
  console.log("Failed to find grid options.");
}

// Remove Hire Professionals
const hireProfStart = `                <div>
                  <h2 className="text-sm font-bold text-white/70 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-[3px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                    Hire Professionals
                  </h2>`;

const hireProfEnd = `                      </button>
                    ))}
                  </div>
                </div>`;

const hireStartIndex = content.indexOf(hireProfStart);
const hireEndIndex = content.indexOf(hireProfEnd, hireStartIndex) + hireProfEnd.length;

if (hireStartIndex !== -1 && hireEndIndex !== -1) {
  content = content.substring(0, hireStartIndex) + content.substring(hireEndIndex);
  console.log("Hire professionals removed.");
} else {
  console.log("Failed to find hire professionals section.");
}

fs.writeFileSync(path, content);
console.log("Done.");
