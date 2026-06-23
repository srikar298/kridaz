const fs = require('fs');

const path = 'client/user/src/features/games/pages/HostGame.jsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `                    {[
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
                        id: "LOOKING_FOR_TEAM",
                        label: "Looking for Team",
                        icon: <UserCheck size={20} />,
                        desc: "Find a team to join",
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
                      {
                        id: "NET_BOWLERS",
                        label: "Net Bowlers",
                        icon: <Zap size={20} />,
                        desc: "Need bowlers for nets",
                      },
                    ]`;

const replacement1 = `                    {[
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
                    ]`;

if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
    console.log("Replaced grid options array successfully.");
} else {
    console.log("Failed to find target1");
}

const target2 = `                <div>
                  <h2 className="text-sm font-bold text-white/70 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-[3px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
                    Hire Professionals
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        id: "NEED_UMPIRE",
                        label: "Need Umpire",
                        icon: <ShieldCheck size={20} />,
                        desc: "Hire an official",
                      },
                      {
                        id: "NEED_SCORER",
                        label: "Need Scorer",
                        icon: <CheckCircle2 size={20} />,
                        desc: "Hire a scorer",
                      },
                      {
                        id: "NEED_STREAMER",
                        label: "Need Streamer",
                        icon: <Zap size={20} />,
                        desc: "Live broadcast",
                      },
                      {
                        id: "NEED_COACH",
                        label: "Need Coach",
                        icon: <UserCheck size={20} />,
                        desc: "Hire a trainer",
                      },
                    ].map((req) => (
                      <button
                        type="button"
                        key={req.id}
                        onClick={() => {
                          setGameData({
                            ...gameData,
                            requestType: req.id,
                            gameMode: "HIRING",
                          });
                        }}
                        className="group relative rounded-[16px] p-[1.5px] transition-all duration-300 cursor-pointer overflow-hidden text-center flex flex-col text-left"
                      >
                        {/* Gradient Border Overlay - Only visible on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[16px]" />

                        {/* Normal Border Overlay - Fades out on hover */}
                        <div className="absolute inset-0 border-[1.5px] border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[16px]" />

                        <div className="relative bg-background rounded-[15px] p-3 sm:p-4 h-full w-full flex flex-col items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-card text-white/70 flex items-center justify-center mb-2 group-hover:text-primary transition-colors">
                            {req.icon}
                          </div>
                          <h3
                            className="text-[10px] sm:text-xs font-black mb-1 uppercase text-white tracking-widest text-center w-full"
                            style={{ fontFamily: "'Open Sans', sans-serif" }}
                          >
                            {req.label}
                          </h3>
                          <p
                            className="text-[9px] text-white/50 tracking-wider text-center w-full"
                            style={{ fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 }}
                          >
                            {req.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>`;

if (content.includes(target2)) {
    content = content.replace(target2, "");
    console.log("Removed target2 successfully.");
} else {
    // If exact match fails, let's use a simpler match
    const hireProfStart = `                <div>\n                  <h2 className="text-sm font-bold text-white/70 mb-3 uppercase tracking-widest flex items-center gap-2">\n                    <div className="w-[3px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />\n                    Hire Professionals\n                  </h2>`;
    const hireProfEnd = `                      </button>\n                    ))}\n                  </div>\n                </div>`;
    
    const s = content.indexOf(hireProfStart);
    const e = content.indexOf(hireProfEnd, s);
    if (s !== -1 && e !== -1) {
        content = content.substring(0, s) + content.substring(e + hireProfEnd.length);
        console.log("Removed Hire Professionals via substring");
    } else {
        console.log("Failed to find target2 string indices.");
    }
}

fs.writeFileSync(path, content);
console.log("Done.");
