import React, { useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Trophy, Gamepad2, Users, Crown } from "lucide-react";
import { Button } from "@kridaz/ui";

// Lazy-load the existing heavy pages as tab content
import MyHostedGames from "./MyHostedGames";
import MyJoinedGames from "./MyJoinedGames";
import { useGetMyTournamentsQuery } from "@redux/api/tournamentApi";

const TABS = [
  { key: "joined-game", label: "Joined Games", icon: <Gamepad2 size={14} /> },
  { key: "hosted-game", label: "Hosted Games", icon: <Crown size={14} /> },
  { key: "hosted-tournament", label: "Hosted Tournaments", icon: <Trophy size={14} /> },
  { key: "joined-tournament", label: "Joined Tournaments", icon: <Users size={14} /> },
];

const GamesHistory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get("tab") || "joined-game";

  const setActiveTab = useCallback(
    (tab) => {
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams]
  );

  // Tournament data for the tournament tabs
  const { data: tournamentsRes, isLoading: tournamentsLoading } =
    useGetMyTournamentsQuery(undefined, {
      skip: activeTab !== "hosted-tournament" && activeTab !== "joined-tournament",
    });

  const tournaments = tournamentsRes?.data || [];

  const hostedTournaments = useMemo(
    () => tournaments.filter((t) => t.isOwner || t.role === "ORGANIZER"),
    [tournaments]
  );
  const joinedTournaments = useMemo(
    () => tournaments.filter((t) => t.isRegistered || t.role === "PARTICIPANT"),
    [tournaments]
  );

  const hostedSubTab = searchParams.get("sub") || "drafted"; // drafted, live, ended

  const setActiveSubTab = useCallback(
    (sub) => {
      setSearchParams({ tab: "hosted-tournament", sub }, { replace: true });
    },
    [setSearchParams]
  );

  const filteredHostedTournaments = useMemo(() => {
    return hostedTournaments.filter((t) => {
      if (hostedSubTab === "drafted") return t.status === "DRAFT";
      if (hostedSubTab === "live") return t.status === "PUBLISHED" || t.status === "ONGOING";
      if (hostedSubTab === "ended") return t.status === "COMPLETED";
      return true;
    });
  }, [hostedTournaments, hostedSubTab]);

  const renderTournamentCards = (list, emptyText) => {
    if (tournamentsLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }

    if (!list || list.length === 0) {
      return (
        <div className="py-20 text-center bg-neutral-800/20 rounded-xl border-2 border-dashed border-neutral-800">
          <Trophy size={48} className="mx-auto mb-4 text-neutral-700" />
          <h3 className="text-lg font-black uppercase tracking-wider text-white/60 mb-2">
            {emptyText}
          </h3>
          <p className="text-sm text-neutral-500">
            Tournaments you create or join will appear here
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {list.map((tournament) => (
          <div
            key={tournament.id || tournament._id}
            onClick={() => {
              if (tournament.status === "DRAFT") {
                navigate(`/tournament/create?id=${tournament.id || tournament._id}`);
              } else {
                navigate(`/tournament/${tournament.id || tournament._id}`);
              }
            }}
            className="bg-neutral-800/50 border border-neutral-800 rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              {tournament.logoUrl ? (
                <img
                  src={tournament.logoUrl}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover border border-neutral-700"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-neutral-700">
                  <Trophy size={22} className="text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black uppercase tracking-wider text-white group-hover:text-primary transition-colors truncate">
                  {tournament.name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-500">
                  {tournament.sport && (
                    <span className="bg-neutral-900 px-2 py-1 rounded-md font-bold">
                      {tournament.sport}
                    </span>
                  )}
                  {tournament.format && (
                    <span className="bg-neutral-900 px-2 py-1 rounded-md font-bold">
                      {tournament.format}
                    </span>
                  )}
                  {tournament.maxTeams && (
                    <span className="bg-neutral-900 px-2 py-1 rounded-md font-bold">
                      {tournament.maxTeams} Teams
                    </span>
                  )}
                  {tournament.status && (
                    <span
                      className={`px-2 py-1 rounded-md font-black text-[10px] uppercase tracking-wider ${
                        tournament.status === "PUBLISHED"
                          ? "bg-green-500/10 text-green-500"
                          : tournament.status === "DRAFT"
                            ? "bg-amber-500/10 text-amber-500"
                            : tournament.status === "COMPLETED"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-neutral-700 text-neutral-400"
                      }`}
                    >
                      {tournament.status}
                    </span>
                  )}
                </div>
                {tournament.startDate && (
                  <p className="text-[11px] text-neutral-600 mt-2 font-bold">
                    {new Date(tournament.startDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {tournament.endDate &&
                      ` — ${new Date(tournament.endDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}`}
                  </p>
                )}
              </div>
              {tournament.prizePool > 0 && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-neutral-500 font-bold uppercase">Prize</p>
                  <p className="text-sm font-black text-[#FFD700]">₹{tournament.prizePool}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "joined-game":
        return <MyJoinedGames embedded />;
      case "hosted-game":
        return <MyHostedGames embedded />;
      case "hosted-tournament":
        return (
          <div className="space-y-6">
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveSubTab("drafted")}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors ${
                  hostedSubTab === "drafted"
                    ? "bg-primary text-black"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                }`}
              >
                Drafted
              </Button>
              <Button
                onClick={() => setActiveSubTab("live")}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors ${
                  hostedSubTab === "live"
                    ? "bg-primary text-black"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                }`}
              >
                Live
              </Button>
              <Button
                onClick={() => setActiveSubTab("ended")}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors ${
                  hostedSubTab === "ended"
                    ? "bg-primary text-black"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                }`}
              >
                Ended
              </Button>
            </div>
            {renderTournamentCards(filteredHostedTournaments, "No tournaments found in this section")}
          </div>
        );
      case "joined-tournament":
        return renderTournamentCards(joinedTournaments, "No joined tournaments yet");
      default:
        return <MyJoinedGames embedded />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-400">
          Game History
        </h1>
        <p className="text-xs text-neutral-500 mt-1 font-bold uppercase tracking-wider">
          All your matches and tournaments in one place
        </p>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
            {TABS.map((tab) => (
              <Button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "bg-primary text-black"
                    : "bg-neutral-800/50 text-neutral-500 hover:text-white hover:bg-neutral-800"
                }`}
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default GamesHistory;
