import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, ChevronRight, Info, Share2, Users } from "lucide-react";
import toast from "react-hot-toast";

const GRAD = "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)";
const BDR = "#2A2A2A";

export default function JoinGamesSection({
  featureFlags,
  selectedHomeState,
  setSelectedHomeState,
  selectedHomeCity,
  setSelectedHomeCity,
  states,
  loadingStates,
  cities,
  loadingCities,
  selectedGameSport,
  setSelectedGameSport,
  hostedGames,
  hostedGamesLoading,
}) {
  const navigate = useNavigate();

  if (!featureFlags["join_games"]) return null;

  return (
    <section className="py-6 mb-6 w-full">
      <div className="w-full">
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 mb-6 border-b border-white/5 pb-4">
          <div className="relative">
            <div
              className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-16 rounded-full shadow-[0_0_25px_rgba(85,222,232,0.5)] hidden md:block"
              style={{ background: GRAD }}
            ></div>
            <h2
              className="text-[14px] font-black text-white tracking-tighter leading-none"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              JOIN{" "}
              <span
                style={{
                  background: GRAD,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                GAMES
              </span>
            </h2>
            <p
              className="text-xs md:text-sm font-bold text-white/40 uppercase tracking-[0.3em] mt-4"
              style={{ fontFamily: "'Inter 28pt Light', sans-serif" }}
            >
              Community Matchmaking • No Team? No Problem.
            </p>
          </div>

          <Link
            to="/join-games"
            className="group flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-[6px] hover:bg-[#BFF367] hover:text-black hover:border-[#BFF367] transition-all duration-500"
          >
            View More <span className="hidden md:inline">Games</span>{" "}
            <ChevronRight size={16} />
          </Link>
        </div>

        {/* Location Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#BFF367] transition-colors pointer-events-none"
              size={18}
            />
            <select
              value={selectedHomeState}
              onChange={(e) => {
                setSelectedHomeState(e.target.value);
                setSelectedHomeCity("");
              }}
              disabled={loadingStates}
              className="w-full bg-[#111] border border-white/10 rounded-[8px] py-3 pl-12 pr-4 appearance-none text-sm text-white focus:border-[#BFF367] outline-none transition-all font-bold disabled:opacity-50"
            >
              <option value="">
                {loadingStates ? "Loading States..." : "Select State"}
              </option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-[#BFF367] transition-colors pointer-events-none"
              size={18}
            />
            <select
              value={selectedHomeCity}
              onChange={(e) => setSelectedHomeCity(e.target.value)}
              disabled={!selectedHomeState || loadingCities}
              className="w-full bg-[#111] border border-white/10 rounded-[8px] py-3 pl-12 pr-4 appearance-none text-sm text-white focus:border-[#BFF367] outline-none transition-all font-bold disabled:opacity-50"
            >
              <option value="">
                {loadingCities
                  ? "Loading Cities..."
                  : !selectedHomeState
                    ? "Select state first"
                    : "Select City"}
              </option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-2 mb-8 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {[
            "ALL SPORTS",
            "BADMINTON",
            "CRICKET",
            "FOOTBALL",
            "TENNIS",
            "PICKLEBALL",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedGameSport(tab)}
              className="px-6 py-2 rounded-full font-bold text-xs shrink-0 transition-colors border"
              style={
                selectedGameSport === tab
                  ? {
                      background: GRAD,
                      color: "#000",
                      borderColor: "transparent",
                    }
                  : {
                      backgroundColor: "transparent",
                      color: "#888",
                      borderColor: BDR,
                    }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Game Cards */}
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 md:pb-0">
          {hostedGamesLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="min-w-[75vw] md:min-w-0 snap-center h-[360px] rounded-[8px] bg-neutral-900 border animate-pulse"
                style={{ borderColor: BDR }}
              />
            ))
          ) : hostedGames.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-neutral-800 rounded-[8px]">
              <p className="text-neutral-500 font-bold uppercase tracking-widest">
                No games hosted yet
              </p>
            </div>
          ) : (
            hostedGames.slice(0, 5).map((g, i) => {
              const isQuick = g.gameMode === "QUICK";
              const openSlots = isQuick
                ? g.quickSlots.filter((s) => s.status === "OPEN").length
                : (g.teams?.teamA?.slots?.filter((s) => s.status === "OPEN")
                    .length || 0) +
                  (g.teams?.teamB?.slots?.filter((s) => s.status === "OPEN")
                    .length || 0);
              const totalSlots = isQuick
                ? g.quickSlots.length
                : (g.teams?.teamA?.slots?.length || 0) +
                  (g.teams?.teamB?.slots?.length || 0);
              const hostInitial = g.host?.name?.[0]?.toUpperCase() || "?";
              const bgImg =
                g.ground?.images?.[0] ||
                "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80";

              const gameDate = g.date ? new Date(g.date) : null;
              const dateLabel = gameDate
                ? gameDate.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })
                : "—";

              return (
                <div
                  key={g._id || i}
                  className="min-w-[75vw] md:min-w-0 snap-center shrink-0 md:shrink cursor-pointer group"
                  onClick={() => navigate("/join-games")}
                >
                  <div
                    className="relative rounded-[8px] overflow-hidden border border-white/10 flex flex-col"
                    style={{
                      height: 340,
                      background:
                        "linear-gradient(160deg,#0d0d0d 0%,#111 100%)",
                    }}
                  >
                    <div className="absolute inset-0">
                      <img
                        src={bgImg}
                        alt={g.gameType}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-40"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.92) 100%)",
                        }}
                      />
                    </div>

                    <div className="relative z-10 flex flex-col h-full p-5 gap-3">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-2">
                            <div className="px-3 py-1 bg-[#BFF367]/20 border border-[#BFF367]/40 rounded-full inline-flex">
                              <span className="text-[9px] font-black text-[#BFF367] uppercase tracking-widest">
                                {g.gameType}
                              </span>
                            </div>
                            {isQuick && (
                              <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full inline-flex">
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                  QUICK
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard?.writeText(
                                  g.shortId || g._id
                                );
                                toast.success("Game ID copied!");
                              }}
                              className="px-2.5 py-1 bg-black/50 border border-white/15 hover:border-[#BFF367]/40 rounded-[6px] inline-flex items-center gap-1 transition-all"
                              title="Click to copy"
                            >
                              <Info size={9} className="text-[#BFF367]/70" />
                              <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">
                                ID: {g.shortId || g._id.slice(-6).toUpperCase()}
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const shareUrl = `${window.location.origin}/join-games?gameId=${g._id}`;
                                const shareData = {
                                  title: "Kridaz Match Invite",
                                  text: `Join this ${g.gameType} match hosted by ${
                                    g.host?.name || "a player"
                                  }!`,
                                  url: shareUrl,
                                };

                                if (
                                  navigator.share &&
                                  navigator.canShare &&
                                  navigator.canShare(shareData)
                                ) {
                                  navigator.share(shareData).catch(() => {
                                    navigator.clipboard.writeText(shareUrl);
                                    toast.success("Link copied to clipboard!");
                                  });
                                } else {
                                  navigator.clipboard.writeText(shareUrl);
                                  toast.success("Link copied to clipboard!");
                                }
                              }}
                              className="p-1.5 bg-black/50 border border-white/15 hover:border-[#BFF367]/40 rounded-[8px] flex items-center justify-center transition-all"
                              title="Share Match"
                            >
                              <Share2 size={10} className="text-[#BFF367]/70" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-[6px] border border-white/10">
                          <span className="text-[10px] font-black text-[#BFF367]">
                            ₹
                          </span>
                          <span className="text-xs font-black text-white">
                            {g.perPlayerCharge || "FREE"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-px flex-1 bg-[#BFF367]/20" />
                        <span className="text-[8px] font-black text-[#BFF367]/60 uppercase tracking-[0.2em]">
                          ✦ {isQuick ? "Casual Pool" : "Rivalry Ledger"}
                        </span>
                        <div className="h-px flex-1 bg-[#BFF367]/20" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-white font-black uppercase leading-tight tracking-tighter text-xl">
                          {isQuick ? (
                            <>Casual {g.gameType} Match</>
                          ) : (
                            <>
                              {g.teams?.teamA?.name || "TBD"}{" "}
                              <span className="text-[#BFF367]">VS</span>{" "}
                              {g.teams?.teamB?.name || "TBD"}
                            </>
                          )}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <MapPin size={10} className="text-[#BFF367]" />
                          <span className="text-[10px] text-white/50 truncate">
                            {g.ground?.name || g.city || "Self-Arranged Venue"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/50 border border-white/10 rounded-[8px] px-3 py-2">
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">
                            Kickoff Date
                          </p>
                          <p className="text-sm font-black text-white">
                            {dateLabel}
                          </p>
                        </div>
                        <div className="bg-black/50 border border-white/10 rounded-[8px] px-3 py-2">
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5">
                            Precision Time
                          </p>
                          <p className="text-sm font-black text-white">
                            {g.time || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users size={12} className="text-[#BFF367]" />
                          <div>
                            <span className="text-sm font-black text-white">
                              {openSlots} Open
                            </span>
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest leading-none">
                              Available Capacity
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(totalSlots, 5) }).map(
                            (_, idx) => (
                              <div
                                key={idx}
                                className={`w-5 h-5 rounded-full border ${
                                  idx < totalSlots - openSlots
                                    ? "bg-[#BFF367]/30 border-[#BFF367]/50"
                                    : "bg-white/5 border-white/10"
                                }`}
                              />
                            )
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#BFF367]/20 border border-[#BFF367]/40 flex items-center justify-center">
                            <span className="text-[10px] font-black text-[#BFF367]">
                              {hostInitial}
                            </span>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                              Commanded By
                            </p>
                            <p className="text-[11px] font-black text-white uppercase truncate max-w-[80px]">
                              {g.host?.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/join-games");
                          }}
                          className="flex items-center gap-2 text-black px-5 py-2 rounded-[6px] font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(85,222,232,0.4)] hover:scale-105"
                          style={{
                            background:
                              "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)",
                          }}
                        >
                          JOIN <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
