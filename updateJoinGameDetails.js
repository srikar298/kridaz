const fs = require('fs');
const file = 'client/user/src/features/games/pages/JoinGameDetails.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  /import \{ Button \} from "@kridaz\/ui";/,
  `import { Button } from "@kridaz/ui";\nimport { useGetMyTeamsQuery } from "@redux/api/teamApi";`
);

// 2. State
content = content.replace(
  /(\s*\/\/ Invite state\s*const \[inviteData, setInviteData\] = useState\(null\);\s*const \[showInvitePopup, setShowInvitePopup\] = useState\(false\);\s*const \[verifyingInvite, setVerifyingInvite\] = useState\(false\);)/,
  `$1\n\n  // Team Opponent state\n  const { data: myTeamsData } = useGetMyTeamsQuery(undefined, { skip: !isAuthenticated });\n  const [showTeamApplyModal, setShowTeamApplyModal] = useState(false);\n  const [selectedTeamId, setSelectedTeamId] = useState("");\n  const [applying, setApplying] = useState(false);`
);

// 3. Handlers
const handlersCode = `
  const handleApplyAsOpponent = async () => {
    if (!selectedTeamId) return toast.error("Please select a team");
    gateInteraction(async () => {
      try {
        setApplying(true);
        const res = await axiosInstance.post(\`/api/hosted-game/apply-opponent-team\`, {
          gameId: game.id,
          teamId: selectedTeamId
        });
        if (res.data.success) {
          toast.success("Application sent successfully!");
          setShowTeamApplyModal(false);
          fetchGameDetails();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to apply");
      } finally {
        setApplying(false);
      }
    }, { title: "Apply as Opponent", message: "Sign in to challenge this team."});
  };

  const handleManageApplication = async (teamId, status) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(\`/api/hosted-game/manage-opponent-application\`, {
        gameId: game.id,
        teamId,
        status
      });
      if (res.data.success) {
        toast.success(\`Application \${status.toLowerCase()}ed!\`);
        fetchGameDetails();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to manage application");
      if (err.response?.data?.message?.toLowerCase().includes("insufficient coins")) {
        navigate("/wallet");
      }
    } finally {
      setLoading(false);
    }
  };
`;
content = content.replace(
  /(\s*const handleClaimSlot = async \(\) => \{)/,
  handlersCode + `\n$1`
);

// 4. isHost
content = content.replace(
  /(\s*const isTransactionFree = .*?;)/,
  `$1\n\n  const currentUserId = user?.id || user?._id;\n  const isHost = currentUserId && game.hostId === currentUserId;`
);

// 5. Tabs
content = content.replace(
  /\{game\.gameMode !== "QUICK" && !isTransactionFree && \(/,
  `{(game.gameMode !== "QUICK" || game.matchPreferences?.opponentType === "TEAM") && !isTransactionFree && (`
);

// 6. Quick Grid Condition
content = content.replace(
  /\{game\.gameMode === "QUICK" \? \(/,
  `{game.gameMode === "QUICK" && game.matchPreferences?.opponentType !== "TEAM" ? (`
);

// 7. Render Team Slots / Applications
const teamBCode = `
                {/* Active Team slots */}
                {(() => {
                  const teamKey = activeTeamTab;
                  const team = game.teams?.[teamKey] || { slots: [] };
                  const isOpponentTeamPending = teamKey === "teamB" && !game.teams?.teamB?.linkedTeamId;

                  if (isOpponentTeamPending) {
                    return (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                          <h3 className="font-open-sans text-base font-black text-white uppercase tracking-tight">
                            Opponent Team (TBD)
                          </h3>
                        </div>
                        {isHost ? (
                          <div className="bg-black border border-white/10 rounded-[8px] p-6 text-center">
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Pending Applications</h4>
                            {game.matchPreferences?.applications?.filter(a => a.status === "PENDING").length > 0 ? (
                              <div className="space-y-3 max-w-sm mx-auto">
                                {game.matchPreferences.applications.filter(a => a.status === "PENDING").map(app => (
                                  <div key={app.teamId} className="flex items-center justify-between bg-neutral-900 p-3 rounded-[8px] border border-white/5">
                                    <div className="flex items-center gap-3">
                                      {app.teamLogo ? (
                                        <img src={app.teamLogo} className="w-8 h-8 rounded-full object-cover" alt="team" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-[10px] text-white">
                                          {app.teamName?.[0] || "T"}
                                        </div>
                                      )}
                                      <span className="text-white text-xs font-bold uppercase text-left max-w-[120px] truncate">{app.teamName || "Opponent"}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button onClick={() => handleManageApplication(app.teamId, "REJECT")} className="bg-red-500/20 hover:bg-red-500/40 text-red-500 text-[10px] px-3 py-1 font-bold uppercase rounded-[4px] transition-colors">Reject</Button>
                                      <Button onClick={() => handleManageApplication(app.teamId, "APPROVE")} className="bg-primary/20 hover:bg-primary/40 text-primary text-[10px] px-3 py-1 font-bold uppercase rounded-[4px] transition-colors">Accept</Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">No applications yet</p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-black border border-white/10 rounded-[8px] p-6 text-center flex flex-col items-center">
                            <ShieldCheck size={40} className="text-primary/40 mb-4" />
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Challenge this Team</h4>
                            <p className="text-white/40 text-xs mb-6 max-w-sm mx-auto">Gather your squad and challenge the host's team. You will need to reserve the required entry coins for your team.</p>
                            {game.matchPreferences?.applications?.some(a => a.captainId === currentUserId) ? (
                              <span className="text-primary font-bold text-xs uppercase bg-primary/10 px-4 py-2 rounded-full border border-primary/20">Application Pending</span>
                            ) : (
                              <Button onClick={() => setShowTeamApplyModal(true)} className="bg-primary text-black hover:bg-primary/90 font-black uppercase text-xs px-6 py-3 rounded-[8px] shadow-[0_0_15px_rgba(191,243,103,0.3)] transition-all">
                                Apply as Opponent
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
`;
content = content.replace(
  /\s*\{\/\* Active Team slots \*\/\}\s*\{\(\(\) => \{\s*const teamKey = activeTeamTab;\s*const team = game\.teams\?\.\[teamKey\] \|\| \{ slots: \[\] \};\s*return \(\s*<div className="space-y-6">/,
  `\n${teamBCode}`
);

// 8. Add Modal
const modalCode = `
      {/* Team Apply Modal */}
      <AnimatePresence>
        {showTeamApplyModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTeamApplyModal(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-background border border-border p-8 rounded-[8px] max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(191,243,103,0.1)]">
                <ShieldCheck size={30} className="text-primary" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2 font-open-sans">
                Challenge Team
              </h2>
              <p className="text-white/60 mb-6 text-xs leading-relaxed">
                Select your team to apply. If accepted,{" "}
                <span className="text-primary font-black">
                  {(game.matchPreferences?.opponentTargetPlayers || 0) * (game.perPlayerCharge || 0)} Coins
                </span>{" "}
                will be reserved from your wallet for your team.
              </p>
              
              <div className="text-left mb-6">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
                  Select Your Team
                </label>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {myTeamsData?.data?.length > 0 ? (
                    myTeamsData.data.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTeamId(t.id)}
                        className={\`flex items-center gap-3 p-3 rounded-[8px] cursor-pointer border transition-colors \${selectedTeamId === t.id ? 'bg-primary/10 border-primary' : 'bg-neutral-900 border-white/5 hover:border-white/20'}\`}
                      >
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                          {t.logo ? <img src={t.logo} className="w-full h-full object-cover"/> : t.name[0]}
                        </div>
                        <span className="text-sm font-bold text-white truncate">{t.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-white/40">You don't manage any teams yet. Create one first.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setShowTeamApplyModal(false)}
                  className="flex-1 py-4 bg-card border border-border rounded-[8px] font-black text-[9px] md:text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyAsOpponent}
                  disabled={applying || !selectedTeamId}
                  className="flex-1 py-4 bg-gradient-to-r from-primary to-primary text-black font-black rounded-[8px] text-[9px] md:text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(191,243,103,0.25)] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {applying ? "Applying..." : "Apply Now"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;
content = content.replace(
  /\s*\{\/\* Confirmation Modal \*\/\}/,
  `\n${modalCode}\n      {/* Confirmation Modal */}`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Update Complete!');
