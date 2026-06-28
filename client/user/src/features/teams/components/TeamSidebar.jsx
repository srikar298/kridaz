import React, { useState } from "react";
import {
  useGetMyTeamsQuery,
  useGetOpponentTeamsQuery,
} from "@redux/api/teamApi";
import { useGetMyScoringGamesQuery } from "@redux/api/scoringApi";
import { Plus, Users, Search, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AddOpponentModal from "./AddOpponentModal";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Input } from "@kridaz/ui";


const TeamSidebar = ({ onSelectTeam, selectedTeamId, onCreateTeam }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("myTeams"); // 'myTeams', 'opponentTeams', 'scoringMatches'
  const [isAddOpponentOpen, setIsAddOpponentOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: myData, isLoading: isMyLoading } = useGetMyTeamsQuery(
    undefined,
    {
      pollingInterval: activeTab === "myTeams" ? 15000 : undefined,
    }
  );
  const { data: oppData, isLoading: isOppLoading } = useGetOpponentTeamsQuery(
    undefined,
    {
      skip: activeTab !== "opponentTeams",
      pollingInterval: activeTab === "opponentTeams" ? 15000 : undefined,
    }
  );
  const { data: scoringData, isLoading: isScoringLoading } =
    useGetMyScoringGamesQuery(undefined, {
      skip: activeTab !== "scoringMatches",
      pollingInterval: activeTab === "scoringMatches" ? 15000 : undefined,
    });

  let data = null;
  let isLoading = false;
  if (activeTab === "myTeams") {
    data = myData;
    isLoading = isMyLoading;
  } else if (activeTab === "opponentTeams") {
    data = oppData;
    isLoading = isOppLoading;
  } else if (activeTab === "scoringMatches") {
    data = scoringData;
    isLoading = isScoringLoading;
  }

  const items =
    activeTab === "scoringMatches" ? data?.games || [] : data?.teams || [];
  const currentUserId = data?.currentUserId;

  const filteredItems = items.filter((item) => {
    const title = item.name || item.title || "";
    const code = item.teamCode || item.shortId || "";
    return (
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="w-full md:w-80 h-full border-r border-[rgba(255,255,255,0.08)] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[rgba(255,255,255,0.08)] bg-background">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-2">
            <h2 className="text-[18px] sm:text-[20px] font-[700] text-foreground tracking-tight uppercase font-inter truncate">
              {activeTab === "myTeams"
                ? "My Teams"
                : activeTab === "opponentTeams"
                  ? "Opponents"
                  : "My Matches"}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => navigate("/start-scoring-match")}
              className="flex items-center justify-center px-4 h-8 bg-primary text-background rounded-[16px] hover:scale-105 shadow-md shadow-primary/20 transition-all duration-300 shrink-0"
              title="Start Scoring"
            >
              <span className="text-[10px] font-[800] uppercase tracking-widest font-inter">
                Start Scoring
              </span>
            </Button>
            <div className="relative">
              <Button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-8 h-8 flex items-center justify-center bg-card text-foreground border border-[rgba(255,255,255,0.08)] rounded-[8px] hover:bg-[rgba(255,255,255,0.08)] hover:scale-105 transition-all duration-300 shrink-0"
                title="Add New"
              >
                <Plus
                  size={18}
                  strokeWidth={3}
                  className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-45" : ""}`}
                />
              </Button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-card border border-[rgba(255,255,255,0.08)] rounded-[16px] shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden z-50"
                    >
                      <div className="flex flex-col py-1">
                        <Button
                          onClick={() => {
                            onCreateTeam();
                            setIsDropdownOpen(false);
                          }}
                          className="px-4 py-2.5 text-left text-[14px] text-[rgba(255,255,255,0.70)] hover:text-foreground hover:bg-[rgba(255,255,255,0.08)] font-[500] font-inter transition-colors"
                        >
                          <span className="text-primary font-[800] text-[10px] uppercase tracking-wider block mb-0.5">
                            My Teams
                          </span>
                          Create New Squad
                        </Button>
                        <div className="h-px bg-[rgba(255,255,255,0.08)] w-full" />
                        <Button
                          onClick={() => {
                            setIsAddOpponentOpen(true);
                            setIsDropdownOpen(false);
                          }}
                          className="px-4 py-2.5 text-left text-[14px] text-[rgba(255,255,255,0.70)] hover:text-foreground hover:bg-[rgba(255,255,255,0.08)] font-[500] font-inter transition-colors"
                        >
                          <span className="text-primary font-[800] text-[10px] uppercase tracking-wider block mb-0.5">
                            Opponents
                          </span>
                          Add Rival Team
                        </Button>
                        <div className="h-px bg-[rgba(255,255,255,0.08)] w-full" />
                        <Button
                          onClick={() => {
                            navigate("/start-scoring-match");
                            setIsDropdownOpen(false);
                          }}
                          className="px-4 py-2.5 text-left text-[14px] text-[rgba(255,255,255,0.70)] hover:text-foreground hover:bg-[rgba(255,255,255,0.08)] font-[500] font-inter transition-colors"
                        >
                          <span className="text-[rgba(255,255,255,0.70)] font-[800] text-[10px] uppercase tracking-wider block mb-0.5">
                            Matches
                          </span>
                          Start Scoring Match
                        </Button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.40)] text-[14px]" />
            <Input
              type="text"
              placeholder="Search..."
              className="w-full bg-card border border-[rgba(255,255,255,0.08)] rounded-[16px] py-2.5 pl-10 pr-4 text-foreground text-[14px] focus:outline-none focus:border-primary transition-colors font-[600] tracking-wider font-inter"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-card rounded-[12px] border border-[rgba(255,255,255,0.08)]">
          <Button
            onClick={() => setActiveTab("myTeams")}
            className={`flex-1 py-1.5 text-[10px] font-[800] font-inter uppercase tracking-widest rounded-[8px] transition-all ${activeTab === "myTeams" ? "bg-card text-primary border border-[rgba(255,255,255,0.08)] shadow-[0_2px_8px_rgba(0,0,0,0.5)]" : "text-[rgba(255,255,255,0.40)] hover:text-foreground border border-transparent"}`}
          >
            My Teams
          </Button>
          <Button
            onClick={() => setActiveTab("opponentTeams")}
            className={`flex-1 py-1.5 text-[10px] font-[800] font-inter uppercase tracking-widest rounded-[8px] transition-all ${activeTab === "opponentTeams" ? "bg-card text-primary border border-[rgba(255,255,255,0.08)] shadow-[0_2px_8px_rgba(0,0,0,0.5)]" : "text-[rgba(255,255,255,0.40)] hover:text-foreground border border-transparent"}`}
          >
            Opponents
          </Button>
          <Button
            onClick={() => setActiveTab("scoringMatches")}
            className={`flex-1 py-1.5 text-[10px] font-[800] font-inter uppercase tracking-widest rounded-[8px] transition-all ${activeTab === "scoringMatches" ? "bg-card text-primary border border-[rgba(255,255,255,0.08)] shadow-[0_2px_8px_rgba(0,0,0,0.5)]" : "text-[rgba(255,255,255,0.40)] hover:text-foreground border border-transparent"}`}
          >
            Matches
          </Button>
        </div>
      </div>

      {/* Team/Match List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-card border border-[rgba(255,255,255,0.08)] animate-pulse rounded-[16px]"
              />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const isMatch = activeTab === "scoringMatches";
            const itemId = isMatch ? item.id : item._id;
            const isSelected = selectedTeamId === itemId;

            const statusColors = {
              NOT_STARTED: {
                bg: "bg-[rgba(255,255,255,0.08)]",
                text: "text-[rgba(255,255,255,0.40)]",
              },
              LIVE: { bg: "bg-red-500/20", text: "text-red-400" },
              PAUSED: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
              COMPLETED: { bg: "bg-primary/10", text: "text-primary" },
            };
            // Games created on Flutter (or any hosted-game without a scoring
            // session yet) come through with `cricketMatch === null`. We show
            // them with a "Setup & Score" CTA instead of "Launch App", since
            // a CricketMatch row needs to be created on first open.
            const hasScoringSession = !!item.cricketMatch;
            const effectiveStatus = hasScoringSession
              ? item.scoringStatus
              : "NOT_STARTED";
            const statusStyle =
              statusColors[effectiveStatus] || statusColors["NOT_STARTED"];
            const statusLabel = hasScoringSession
              ? effectiveStatus === "NOT_STARTED"
                ? "SETUP"
                : effectiveStatus
              : "NOT SET UP";
            if (isMatch)
              return (
                <div
                  key={itemId}
                  className="w-full flex flex-col p-4 rounded-[16px] bg-card border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-[800] text-primary text-[14px] truncate flex-1 mr-2 font-inter">
                      {item.name || item.title || "(unnamed match)"}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-[800] font-inter px-2 py-1 rounded-[4px] uppercase ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        {statusLabel}
                      </span>
                      {item.shortId && (
                        <span className="text-[10px] font-[800] font-inter text-background bg-primary px-2 py-1 rounded-[4px] uppercase">
                          {item.shortId}
                        </span>
                      )}
                    </div>
                  </div>
                  {(item.format || item.ballType || item.gameType) && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] text-[rgba(255,255,255,0.40)] uppercase font-[800] font-inter">
                        {item.format || item.gameType}
                      </span>
                      {item.ballType && (
                        <>
                          <span className="text-[rgba(255,255,255,0.20)]">
                            •
                          </span>
                          <span className="text-[10px] text-[rgba(255,255,255,0.40)] uppercase font-[800] font-inter">
                            {item.ballType}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 text-center bg-card rounded-[8px] py-1.5 border border-[rgba(255,255,255,0.08)]">
                      <span className="text-[12px] text-foreground font-[700] font-inter">
                        {item.teams?.[0]?.name || "TBD"}
                      </span>
                    </div>
                    <div className="flex items-center justify-center text-[10px] text-[rgba(255,255,255,0.40)] font-[800] font-inter">
                      VS
                    </div>
                    <div className="flex-1 text-center bg-card rounded-[8px] py-1.5 border border-[rgba(255,255,255,0.08)]">
                      <span className="text-[12px] text-foreground font-[700] font-inter">
                        {item.teams?.[1]?.name || "TBD"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    {hasScoringSession ? (
                      <>
                        <a
                          href={`/scoring/${item.id}`}
                          className="flex-1 text-center text-[10px] uppercase font-[800] font-inter tracking-widest text-primary border border-primary/30 rounded-[8px] py-2 hover:bg-primary/10 transition-colors"
                        >
                          Launch App
                        </a>
                        <a
                          href={`/analytics/${item.shortId || item.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center text-[10px] uppercase font-[800] font-inter tracking-widest text-primary border border-primary/30 rounded-[8px] py-2 hover:bg-primary/10 transition-colors"
                        >
                          Watch Live
                        </a>
                      </>
                    ) : (
                      <a
                        href={`/scoring/${item.id}`}
                        className="flex-1 text-center text-[10px] uppercase font-[800] font-inter tracking-widest text-background bg-primary rounded-[8px] py-2 hover:opacity-90 transition-opacity shadow-sm shadow-primary/20"
                      >
                        ⚡ Start Scoring
                      </a>
                    )}
                  </div>
                </div>
              );

            return (
              <motion.button
                key={itemId}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (activeTab === "scoringMatches") {
                    navigate(`/scoring/${item.shortId || item._id || item.id}`);
                  } else {
                    onSelectTeam(item);
                  }
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-[16px] transition-all group font-inter border ${isSelected ? "bg-card border-primary shadow-lg shadow-primary/10" : "bg-card border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.20)] hover:bg-card/50"}`}
              >
                <div className="relative shrink-0">
                  <div
                    className={`w-12 h-12 rounded-[12px] bg-background border-2 flex items-center justify-center text-primary font-[800] overflow-hidden transition-colors ${isSelected ? "border-primary" : "border-[rgba(255,255,255,0.08)] group-hover:border-primary/50"}`}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[18px]">
                        {item.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-card text-primary text-[8px] px-1.5 py-0.5 rounded-[4px] border border-[rgba(255,255,255,0.08)] font-[800] uppercase">
                    {item.sportType?.slice(0, 3)}
                  </div>
                </div>
                <div className="flex-1 text-left overflow-hidden ml-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`font-[800] text-[14px] truncate transition-colors ${isSelected ? "text-primary" : "text-[rgba(255,255,255,0.80)] group-hover:text-foreground"}`}
                    >
                      {item.name}
                    </h4>
                    <span className="text-[10px] font-[800] text-[rgba(255,255,255,0.40)] uppercase bg-[rgba(255,255,255,0.08)] px-1.5 py-0.5 rounded-[4px]">
                      {item.teamCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[rgba(255,255,255,0.40)] uppercase font-[800] tracking-widest">
                      {item.sportType}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.20)]" />
                    <span className="text-[10px] text-[rgba(255,255,255,0.40)] font-[600]">
                      {item.members?.length + (item.customMembers?.length || 0)}{" "}
                      Members
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className={`transition-all ${isSelected ? "text-primary" : "text-[rgba(255,255,255,0.20)] -rotate-90 md:rotate-0"}`}
                />
              </motion.button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-[16px] bg-card border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-4">
              <Users className="text-[rgba(255,255,255,0.20)]" size={32} />
            </div>
            <p className="text-[rgba(255,255,255,0.70)] text-[14px] font-[800] font-inter uppercase">
              No teams found
            </p>
            <p className="text-[rgba(255,255,255,0.40)] text-[12px] mt-2 font-[500] font-inter">
              Start by creating your first squad or adding an opponent.
            </p>
          </div>
        )}
      </div>

      <AddOpponentModal
        isOpen={isAddOpponentOpen}
        onClose={() => setIsAddOpponentOpen(false)}
        myTeams={(myData?.teams || []).filter((t) =>
          t.members?.some(
            (m) =>
              m.user === currentUserId ||
              m._id === currentUserId ||
              (typeof m === "string" && m === currentUserId)
          )
        )}
      />

    </div>
  );
};

export default TeamSidebar;
