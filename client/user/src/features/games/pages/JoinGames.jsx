import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import {
  Users,
  MapPin,
  Search,
  Filter,
  Coins,
  ChevronDown,
  Trophy,
  Info,
  Zap,
  X,
  MessageCircle,
} from "lucide-react";
import { fetchStates, fetchCities } from "@utils/locationService";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import GameCard from "../components/GameCard";

const JoinGames = () => {
  const navigate = useNavigate();
  const { gateInteraction } = useLoginOnDemand();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("All Sports");
  const [matchTypeFilter, setMatchTypeFilter] = useState("All Matches");
  const [userLocation, setUserLocation] = useState({ city: "", state: "" });

  // Location filter state
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchGames = async (city = "", state = "", sport = "All Sports") => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (city) params.append("city", city);
      if (state) params.append("state", state);
      if (sport !== "All Sports") params.append("gameType", sport);

      const res = await axiosInstance.get(`/api/hosted-game/list?${params.toString()}`);
      setGames(res.data.games || []);
    } catch (err) {
      toast.error("Failed to fetch games");
    } finally {
      setLoading(false);
    }
  };

  const normalizeString = (str) => {
    return str
      ? str
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
      : "";
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoadingStates(true);
        const statesData = await fetchStates();
        setStates(statesData);
        setLoadingStates(false);

        let uCity = "";
        let uState = "";
        try {
          const userRes = await axiosInstance.get(`/api/user/auth/getMe`);
          const user = userRes.data.user;
          if (user?.city || user?.state) {
            uCity = user.city || "";
            uState = user.state || "";
          }
        } catch (e) {
          // ignore auth errors if user not logged in
        }

        let matchedState = "";
        if (uState) {
          matchedState =
            statesData.find(
              (s) => normalizeString(s) === normalizeString(uState)
            ) || "";
        }

        let matchedCity = "";
        if (matchedState && uCity) {
          const citiesData = await fetchCities(matchedState);
          setCities(citiesData);
          matchedCity =
            citiesData.find(
              (c) => normalizeString(c) === normalizeString(uCity)
            ) || "";
        }

        if (matchedCity || matchedState) {
          setUserLocation({ city: matchedCity, state: matchedState });
          setSelectedState(matchedState);
          setSelectedCity(matchedCity);
          fetchGames(matchedCity, matchedState);
        } else {
          fetchGames();
        }
      } catch (err) {
        fetchGames();
      }
    };
    initializePage();

    // Check for deep-link inviteToken
    const params = new URLSearchParams(window.location.search);
    const token = params.get("inviteToken");
    if (token) {
      handleVerifyInvite(token);
    }
  }, []);

  const handleVerifyInvite = async (token) => {
    try {
      const res = await axiosInstance.get(
        `/api/hosted-game/verify-invite?token=${token}`
      );
      if (res.data.success && res.data.gameId) {
        navigate(`/join-games/${res.data.gameId}?inviteToken=${token}`, {
          replace: true,
        });
      }
    } catch (err) {
      console.error("Invite verification failed:", err);
      toast.error(
        err.response?.data?.message || "Invalid or expired invite link"
      );
    }
  };

  // When a state is selected, load its cities
  useEffect(() => {
    if (!selectedState) {
      setCities([]);
      return;
    }
    const loadCities = async () => {
      setLoadingCities(true);
      const data = await fetchCities(selectedState);
      setCities(data);
      setLoadingCities(false);
    };
    loadCities();
  }, [selectedState]);

  const handleStateChange = (state) => {
    setSelectedState(state);
    setSelectedCity("");
    fetchGames("", state, sportFilter);
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    fetchGames(city, selectedState, sportFilter);
  };

  const handleClearLocation = () => {
    setSelectedState("");
    setSelectedCity("");
    setCities([]);
    fetchGames("", "", sportFilter);
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const filteredGames = games.filter((game) => {
    if (!game) return false;
    const currentUserId = user?.id || user?._id;
    const isLiveGame =
      game.scoringStatus === "IN_PROGRESS" ||
      game.gameType === "SCORING_MATCH" ||
      game.isLive;

    if (matchTypeFilter === "My Hosted Games") {
      if (
        !currentUserId ||
        (game.hostId !== currentUserId &&
          game.host?._id !== currentUserId &&
          game.host?.id !== currentUserId)
      ) {
        return false;
      }
    } else if (matchTypeFilter === "Live") {
      if (!isLiveGame) return false;
    } else if (matchTypeFilter === "Quick") {
      if (
        game.gameMode?.toUpperCase() !== "QUICK" ||
        (game.requestType && game.requestType !== "MATCH")
      )
        return false;
    } else if (matchTypeFilter === "Professional") {
      if (
        game.gameMode?.toUpperCase() !== "PROFESSIONAL" ||
        (game.requestType && game.requestType !== "MATCH")
      )
        return false;
    } else if (matchTypeFilter === "Looking for Team") {
      if (game.requestType !== "LOOKING_FOR_TEAM") return false;
    } else if (matchTypeFilter === "Need Opponent (GBNO)") {
      if (game.requestType !== "GBNO") return false;
    } else if (matchTypeFilter === "Practice") {
      if (game.requestType !== "PRACTICE") return false;
    } else if (matchTypeFilter === "Net Bowlers") {
      if (game.requestType !== "NET_BOWLERS") return false;
    } else if (matchTypeFilter === "Professionals Wanted") {
      if (game.gameMode?.toUpperCase() !== "HIRING") return false;
    } else if (matchTypeFilter === "Need Umpire") {
      if (game.requestType !== "NEED_UMPIRE") return false;
    } else if (matchTypeFilter === "Need Scorer") {
      if (game.requestType !== "NEED_SCORER") return false;
    } else if (matchTypeFilter === "Need Streamer") {
      if (game.requestType !== "NEED_STREAMER") return false;
    } else if (matchTypeFilter === "Need Coach") {
      if (game.requestType !== "NEED_COACH") return false;
    } else {
      // By default ('All Matches'), hide live matches unless there's an active search
      if (!search && isLiveGame) return false;
    }

    const searchLower = search ? search.toLowerCase() : "";
    if (!searchLower) return true;

    const gameTypeMatch =
      game.gameType?.toLowerCase().includes(searchLower) || false;
    const turfMatch =
      game.turf?.name?.toLowerCase().includes(searchLower) ||
      game.ground?.name?.toLowerCase().includes(searchLower) ||
      false;
    const cityMatch = game.city?.toLowerCase().includes(searchLower) || false;
    const nameMatch = game.name?.toLowerCase().includes(searchLower) || false;
    const gameModeStr =
      game.gameMode?.toUpperCase() === "QUICK"
        ? "quick game"
        : "professional game";
    const modeMatch = gameModeStr.includes(searchLower);

    return gameTypeMatch || turfMatch || cityMatch || modeMatch || nameMatch;
  });

  return (
    <div className="min-h-screen bg-[#000000] text-white px-2 md:px-4 pt-6 pb-24 relative overflow-hidden font-inter">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#2D2D2D] pb-6 mb-6">
          <div className="relative w-full lg:w-auto">
            <div className="flex items-center justify-between lg:justify-start gap-4 w-full">
              <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none font-open-sans">
                Join{" "}
                <span className="bg-gradient-to-r from-[#55DEE8] to-[#BFF367] bg-clip-text text-transparent">
                  Games
                </span>
              </h1>
              <button
                onClick={() => gateInteraction(() => navigate("/host-game"))}
                className="lg:hidden px-4 py-2.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black text-[10px] uppercase tracking-widest rounded-[16px] flex items-center gap-2 transition-all duration-500 shadow-[0px_8px_24px_rgba(191,243,103,0.15)] whitespace-nowrap"
              >
                <Trophy size={14} /> Host Match
              </button>
            </div>
          </div>

          {/* Desktop Host Match Button */}
          <div className="hidden lg:flex flex-wrap items-center gap-4">
            <button
              onClick={() => gateInteraction(() => navigate("/host-game"))}
              className="px-6 py-3.5 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black text-[11px] uppercase tracking-widest rounded-[16px] flex items-center gap-2.5 transition-all duration-500 shadow-[0px_8px_24px_rgba(191,243,103,0.15)] whitespace-nowrap"
            >
              <Trophy size={16} /> Host Match
            </button>
          </div>
        </div>

        {/* Search & Filter Button Container */}
        <div className="w-full mb-10 flex items-center gap-3">
          <div className="flex-1 relative flex items-center min-h-[56px] bg-[#121212] border border-white/[0.08] rounded-[16px] px-4 transition-all focus-within:border-[#55DEE8]">
            <Search className="text-gray-500 mr-3 shrink-0" size={16} />
            <input
              className="w-full h-full bg-transparent text-white outline-none text-[14px] font-normal placeholder-white/70 py-4"
              placeholder="Search by sport, venue..."
              value={search}
              onChange={handleSearch}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                fetchGames(selectedCity, selectedState, sportFilter)
              }
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="min-h-[56px] w-[56px] md:w-auto md:px-5 bg-[#1B1B1B] border border-white/[0.08] hover:bg-[#222] text-white rounded-[16px] flex items-center justify-center gap-2 transition-all shrink-0 group relative"
          >
            <Filter
              size={20}
              className="group-hover:scale-110 transition-transform duration-300"
            />
            <span className="hidden md:inline text-[14px] font-bold">
              Filters
            </span>
            {(sportFilter !== "All Sports" ||
              selectedState ||
              selectedCity ||
              matchTypeFilter !== "All Matches") && (
              <span className="absolute top-3 right-3 md:top-3.5 md:right-3 w-2 h-2 bg-[#BFF367] rounded-full shadow-[0_0_10px_#BFF367]"></span>
            )}
          </button>
        </div>

        {/* Filter Sidebar Modal */}
        {createPortal(
          <AnimatePresence>
            {isFilterOpen && (
              <div className="fixed inset-0 z-[9999] flex justify-end">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsFilterOpen(false)}
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="relative w-[85%] max-w-sm h-full bg-[#0a0a0c] border-l border-white/10 flex flex-col rounded-l-[24px] shadow-2xl z-10 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                      <Filter className="text-[#BFF367]" size={20} />
                      <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                        Filters
                      </h2>
                    </div>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="text-gray-500 hover:text-white transition-colors p-1.5 bg-white/5 rounded-full hover:bg-white/10"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Filter Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Sport & Match Type Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Sport Filter */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <Trophy size={12} /> Sport
                        </label>
                        <div className="relative">
                          <select
                            className="w-full bg-[#121212] border border-white/5 text-white text-[12px] font-bold uppercase p-4 pr-8 rounded-[8px] appearance-none outline-none focus:border-[#BFF367]/50 cursor-pointer truncate"
                            value={sportFilter}
                            onChange={(e) => {
                              setSportFilter(e.target.value);
                              fetchGames(
                                selectedCity,
                                selectedState,
                                e.target.value
                              );
                            }}
                          >
                            <option value="All Sports">All Sports</option>
                            <option value="Cricket">Cricket</option>
                            <option value="Football">Football</option>
                            <option value="Badminton">Badminton</option>
                            <option value="Basketball">Basketball</option>
                            <option value="Tennis">Tennis</option>
                            <option value="Volleyball">Volleyball</option>
                          </select>
                          <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                          />
                        </div>
                      </div>

                      {/* Match Type Filter */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <Zap size={12} /> Match Type
                        </label>
                        <div className="relative">
                          <select
                            className="w-full bg-[#121212] border border-white/5 text-white text-[12px] font-bold uppercase p-4 pr-8 rounded-[8px] appearance-none outline-none focus:border-[#BFF367]/50 cursor-pointer truncate"
                            value={matchTypeFilter}
                            onChange={(e) => setMatchTypeFilter(e.target.value)}
                          >
                            <option value="All Matches">All Posts</option>
                            <option value="My Hosted Games">My Posts</option>
                            <option value="Live">Live Matches</option>
                            <option value="Quick">Quick Matches</option>
                            <option value="Professional">
                              Professional Matches
                            </option>
                            <option value="Looking for Team">
                              Looking for Team
                            </option>
                            <option value="Need Opponent (GBNO)">
                              Need Opponent (GBNO)
                            </option>
                            <option value="Practice">Practice Matches</option>
                            <option value="Net Bowlers">
                              Net Bowlers Needed
                            </option>
                            <option disabled>── Professionals ──</option>
                            <option value="Professionals Wanted">
                              All Pro Wanted
                            </option>
                            <option value="Need Umpire">Need Umpire</option>
                            <option value="Need Scorer">Need Scorer</option>
                            <option value="Need Streamer">Need Streamer</option>
                            <option value="Need Coach">Need Coach</option>
                          </select>
                          <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* State & City Row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* State Filter */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={12} /> State
                        </label>
                        <div className="relative">
                          <select
                            className="w-full bg-[#121212] border border-white/5 text-white text-[12px] font-bold uppercase p-4 pr-8 rounded-[8px] appearance-none outline-none focus:border-[#BFF367]/50 disabled:opacity-50 cursor-pointer truncate"
                            value={selectedState}
                            onChange={(e) => handleStateChange(e.target.value)}
                            disabled={loadingStates}
                          >
                            <option value="">
                              {loadingStates ? "Loading..." : "All States"}
                            </option>
                            {states.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                          />
                        </div>
                      </div>

                      {/* City Filter */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <MapPin size={12} /> City
                        </label>
                        <div className="relative">
                          <select
                            className="w-full bg-[#121212] border border-white/5 text-white text-[12px] font-bold uppercase p-4 pr-8 rounded-[8px] appearance-none outline-none focus:border-[#BFF367]/50 disabled:opacity-50 cursor-pointer truncate"
                            value={selectedCity}
                            onChange={(e) => handleCityChange(e.target.value)}
                            disabled={!selectedState || loadingCities}
                          >
                            <option value="">
                              {loadingCities ? "Loading..." : "All Cities"}
                            </option>
                            {cities.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="p-6 pb-8 border-t border-white/10 flex gap-3 bg-[#0a0a0c] shrink-0">
                    <button
                      onClick={() => {
                        setSportFilter("All Sports");
                        setMatchTypeFilter("All Matches");
                        handleClearLocation();
                      }}
                      className="flex-1 py-4 border border-white/10 text-white rounded-[8px] text-[11px] font-black uppercase tracking-wider hover:bg-white/5 transition-colors"
                    >
                      Reset All
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 py-4 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black rounded-[8px] text-[11px] font-black uppercase tracking-wider hover:scale-105 shadow-[0_0_20px_rgba(191,243,103,0.2)] hover:shadow-[0_0_30px_rgba(191,243,103,0.35)] transition-all"
                    >
                      Show Results
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Game List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
          {loading ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-[420px] bg-[#0d0d0d] rounded-[8px] border border-[#2D2D2D] animate-pulse"
              />
            ))
          ) : filteredGames.length === 0 ? (
            <div className="col-span-full py-32 text-center bg-[#0d0d0d] rounded-[8px] border border-[#2D2D2D] relative overflow-hidden">
              <div className="absolute inset-0 bg-[#BFF367]/5 blur-[100px]" />
              <div className="relative z-10 space-y-6">
                <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <Info className="text-[#BFF367]/40" size={48} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter font-open-sans">
                    No Active Matches
                  </h3>
                  <p className="text-[#999999] max-w-md mx-auto">
                    The sports ledger is currently empty. Be the first to host a
                    match in this region.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/host-game")}
                  className="px-10 py-4 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black text-xs uppercase tracking-[0.2em] rounded-full shadow-[0_0_20px_rgba(191,243,103,0.25)] hover:scale-105 transition-all"
                >
                  Create Match
                </button>
              </div>
            </div>
          ) : (
            filteredGames.map((game) => {
              const currentUserId = user?.id || user?._id;
              const hostId = game.hostId || game.host?._id || game.host?.id;
              const isHost = currentUserId === hostId;

              return (
                <GameCard
                  key={game.id || game._id}
                  game={game}
                  onSelect={(selectedGame) =>
                    navigate(
                      `/join-games/${selectedGame.id || selectedGame._id}`
                    )
                  }
                  actionButton={
                    !isHost && currentUserId ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/messages?userId=${hostId}`);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[12px] text-xs font-bold text-white transition-all"
                      >
                        <MessageCircle size={14} />
                        Chat with{" "}
                        {game.requestType === "LOOKING_FOR_TEAM"
                          ? "Player"
                          : "Host"}
                      </button>
                    ) : null
                  }
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinGames;
