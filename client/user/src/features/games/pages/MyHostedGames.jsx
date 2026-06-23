import React, { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import {
  Users,
  Check,
  X,
  Clock,
  MapPin,
  Trophy,
  Info,
  Calendar,
  User,
  PlayCircle,
  Search,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import HireOfficialModal from "@components/official/HireOfficialModal";
import SelectVenueModal from "@components/official/SelectVenueModal";import { Button, Input, Select } from "@kridaz/ui";


const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const isWithinTwoHours = (gameDate, gameTime) => {
  if (!gameDate || !gameTime) return false;
  const matchDateTime = new Date(gameDate);
  const [hours, minutes] = gameTime.split(":");
  matchDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

  const now = new Date();
  const timeDiff = matchDateTime.getTime() - now.getTime();

  // within 2 hours before start, or up to 24 hours after start
  return timeDiff <= 7200000 && timeDiff > -86400000;
};

const MyHostedGames = () => {
  const [myGames, setMyGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const navigate = useNavigate();

  const fetchMyGames = async () => {
    try {
      const res = await axiosInstance.get("/api/hosted-game/my-hosted");
      setMyGames(res.data.games);
    } catch (err) {
      toast.error("Failed to fetch your hosted games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGames();
  }, []);

  const handleApprove = async (gameId, team, slotIndex) => {
    try {
      const res = await axiosInstance.post("/api/hosted-game/approve", {
        gameId,
        team,
        slotIndex,
      });

      if (res.data.success) {
        toast.success("Player approved!");
        fetchMyGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve player");
    }
  };

  const handleReject = async (gameId, team, slotIndex) => {
    if (
      !window.confirm(
        "Reject this player? Their reserved coins will be released."
      )
    )
      return;
    try {
      const res = await axiosInstance.post("/api/hosted-game/reject", {
        gameId,
        team,
        slotIndex,
      });

      if (res.data.success) {
        toast.success("Player rejected and coins released.");
        fetchMyGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject player");
    }
  };

  const handleCancelGame = async (gameId) => {
    if (
      !window.confirm(
        "Cancel this game? All reserved coins for pending players will be released."
      )
    )
      return;
    try {
      const res = await axiosInstance.post("/api/hosted-game/cancel", {
        gameId,
      });

      if (res.data.success) {
        toast.success("Game cancelled successfully.");
        fetchMyGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel game");
    }
  };

  const [hireModal, setHireModal] = useState({
    open: false,
    gameId: null,
    role: null,
  });
  const [venueModal, setVenueModal] = useState({ open: false, gameId: null });

  const handleProfessionalRequest = async (gameId, role, action) => {
    try {
      const endpointMap = {
        streamer: "handle-streamer-request",
        umpire: "handle-umpire-request",
        scorer: "handle-scorer-request",
      };
      const endpoint = endpointMap[role];
      const res = await axiosInstance.post(`/api/hosted-game/${endpoint}`, {
        gameId,
        action,
      });

      if (res.data.success) {
        toast.success(
          `${role.charAt(0).toUpperCase() + role.slice(1)} request ${action.toLowerCase()}d!`
        );
        fetchMyGames();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          `Failed to ${action.toLowerCase()} request`
      );
    }
  };

  const filteredGames = myGames
    .filter((game) => {
      const matchesSearch =
        game.shortId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.teams?.teamA?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        game.teams?.teamB?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        game.gameType?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterStatus === "ALL" || game.status === filterStatus;

      return matchesSearch && matchesFilter;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
    );

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-black tracking-tighter font-open-sans text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary mb-2 uppercase">
          MY HOSTED GAMES
        </h1>
        <p className="text-neutral-400 text-[20px]" style={SUBHEADING_STYLE}>
          Manage your matches and approve players
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            size={20}
          />
          <Input
            type="text"
            placeholder="Search by ID, Team or Match Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-800/50 border border-neutral-800 rounded-[8px] py-3 pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-colors placeholder:text-neutral-600 font-inter"
          />
        </div>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-neutral-800/50 border border-neutral-800 rounded-[8px] py-3 px-4 text-white focus:outline-none focus:border-primary transition-colors appearance-none min-w-[150px] font-inter font-bold"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          [1, 2].map((i) => (
            <div
              key={i}
              className="h-48 bg-neutral-800 rounded-[8px] animate-pulse"
            />
          ))
        ) : filteredGames.length === 0 ? (
          <div className="py-20 text-center bg-neutral-800/20 rounded-[8px] border-2 border-dashed border-neutral-800">
            <Trophy size={48} className="mx-auto mb-4 text-neutral-700" />
            <h3 className="text-2xl md:text-3xl font-black tracking-tighter font-open-sans text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary mb-2 uppercase">
              {myGames.length === 0
                ? "No games hosted yet"
                : "No matches found"}
            </h3>
            <p
              className="text-neutral-500 mb-6 text-[20px]"
              style={SUBHEADING_STYLE}
            >
              {myGames.length === 0
                ? "Start hosting and build your community!"
                : "Try adjusting your search filters"}
            </p>
            {myGames.length === 0 && (
              <Button
                onClick={() => (window.location.href = "/host-game")}
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary text-black font-bold rounded-[8px] uppercase tracking-wider shadow-lg hover:scale-105 transition-all"
              >
                Host Now
              </Button>
            )}
          </div>
        ) : (
          filteredGames.map((game) => {
            const totalSlotsCount =
              (game.teams?.teamA?.slots?.length || 0) +
              (game.teams?.teamB?.slots?.length || 0) +
              (game.quickSlots?.length || 0);

            const joinedSlotsCount =
              (game.teams?.teamA?.slots?.filter(
                (s) => s.status === "JOINED" && s.userId
              )?.length || 0) +
              (game.teams?.teamB?.slots?.filter(
                (s) => s.status === "JOINED" && s.userId
              )?.length || 0) +
              (game.quickSlots?.filter((s) => s.status === "JOINED" && s.userId)
                ?.length || 0);

            const perPlayerCharge = game.perPlayerCharge || 0;
            const totalPossibleCoins = totalSlotsCount * perPlayerCharge;
            const collectedCoins = joinedSlotsCount * perPlayerCharge;

            return (
              <div
                key={game._id}
                className="bg-neutral-800/50 border border-neutral-800 rounded-[8px] overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-neutral-800">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-gradient-to-r from-primary/10 to-primary/10 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {game.gameType}
                        </span>
                        {game.shortId && (
                          <Button
                            onClick={() => {
                              navigator.clipboard?.writeText(game.shortId);
                              toast.success("Game ID copied!");
                            }}
                            className="bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-primary hover:border-primary/40 text-[10px] font-black px-2 py-0.5 rounded-[6px] uppercase tracking-wider transition-all flex items-center gap-1"
                            title="Click to copy Game ID"
                          >
                            <Info size={10} />
                            ID: {game.shortId}
                          </Button>
                        )}
                      </div>
                      <h2 className="text-2xl font-black mt-1 uppercase tracking-tighter font-open-sans">
                        {game.teams?.teamA?.name} vs {game.teams?.teamB?.name}
                      </h2>
                    </div>
                    <div className="text-right">
                    {game.matchPreferences?.isPracticeMatch || game.requestType === "PRACTICE" || ["PRACTICE", "NET_BOWLERS", "UMPIRE", "SCORER", "STREAMER", "COACH"].includes(game.gameType) ? (
                        <div>
                          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-1">
                            Status
                          </p>
                          <span className="bg-green-500/10 text-green-500 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">
                            Active Post
                          </span>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                            Ticket Collections
                          </p>
                          <div className="flex items-center gap-1 justify-end">
                            <p className="text-xl font-black text-primary">
                              {collectedCoins} / {totalPossibleCoins} Coins
                            </p>
                            {game.payoutStatus === "FROZEN" ? (
                              <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-2">
                                Disputed
                              </span>
                            ) : game.payoutStatus === "RELEASED" ? (
                              <span className="bg-green-500/10 text-green-500 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-2">
                                Settled
                              </span>
                            ) : (
                              <span
                                className="bg-blue-500/10 text-blue-500 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ml-2"
                                title="Held safely until game completion"
                              >
                                Escrowed
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div
                        className="flex flex-wrap gap-4 text-[13px] text-neutral-400"
                        style={SUBHEADING_STYLE}
                      >
                        <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-[6px]">
                          <Calendar size={14} className="text-primary" />{" "}
                          {new Date(game.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-[6px]">
                          <Clock size={14} className="text-primary" />{" "}
                          {game.time}
                        </div>
                        <div className="flex items-center gap-1 bg-neutral-900 px-3 py-1.5 rounded-[6px]">
                          <MapPin
                            size={14}
                            className="text-primary min-w-[14px]"
                          />
                          {game.turf?.mapUrl ? (
                            <a
                              href={game.turf.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary hover:underline transition-colors flex items-center gap-1 truncate max-w-[200px]"
                              title={game.turf?.location || game.turf?.name}
                            >
                              {game.turf?.name ||
                                game.customVenue ||
                                "Self-Arranged"}
                              {game.turf?.location && (
                                <span className="text-neutral-500 text-[10px] hidden md:inline ml-1">
                                  - {game.turf.location}
                                </span>
                              )}
                            </a>
                          ) : (
                            <span
                              className="truncate max-w-[200px]"
                              title={
                                game.turf?.location ||
                                game.turf?.name ||
                                game.customVenue
                              }
                            >
                              {game.turf?.name ||
                                game.customVenue ||
                                "Self-Arranged"}
                              {game.turf?.location && (
                                <span className="text-neutral-500 text-[10px] hidden md:inline ml-1">
                                  - {game.turf.location}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {game.status !== "CANCELLED" && (
                          <>
                            {game.gameType?.toLowerCase() === "cricket" &&
                              game.scoringStatus === "NOT_STARTED" && (
                                <Button
                                  onClick={() => {
                                    if (
                                      !isWithinTwoHours(game.date, game.time)
                                    ) {
                                      toast(
                                        "You can only start scoring up to 2 hours before the scheduled time.",
                                        { icon: "⚠️" }
                                      );
                                      return;
                                    }
                                    navigate("/my-teams", {
                                      state: {
                                        openStartScoringModal: true,
                                        initialGameData: game,
                                      },
                                    });
                                  }}
                                  className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-black rounded-[6px] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all uppercase tracking-wider flex items-center gap-1"
                                >
                                  <PlayCircle size={14} /> Start Scoring Match
                                </Button>
                              )}
                            {game.gameType?.toLowerCase() === "cricket" &&
                              game.scoringStatus !== "NOT_STARTED" &&
                              game.scoringStatus !== "ENDED" && (
                                <Button
                                  onClick={() =>
                                    navigate(`/scoring/${game._id}`)
                                  }
                                  className="px-4 py-1.5 bg-primary/20 text-primary border border-primary/30 text-[10px] font-black rounded-[6px] hover:bg-primary/30 transition-all uppercase tracking-wider flex items-center gap-1"
                                >
                                  <PlayCircle size={14} /> Resume Scoring
                                </Button>
                              )}
                            <Button
                              onClick={() => handleCancelGame(game._id)}
                              className="px-4 py-1.5 bg-neutral-800 text-neutral-400 text-[10px] font-black rounded-[6px] hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider"
                            >
                              Cancel Game
                            </Button>
                          </>
                        )}
                        {game.status === "CANCELLED" && (
                          <span className="px-4 py-1.5 bg-neutral-900 text-neutral-500 text-[10px] font-black rounded-full uppercase tracking-wider">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                    {!(game.matchPreferences?.isPracticeMatch || game.requestType === "PRACTICE" || ["PRACTICE", "NET_BOWLERS", "UMPIRE", "SCORER", "STREAMER", "COACH"].includes(game.gameType)) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-neutral-800/50 pt-4 mt-4">
                        <div className="bg-neutral-900/50 p-2 rounded-[8px] flex flex-col items-center justify-center">
                          <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mb-1">
                            Slot Collections
                          </p>
                          <p className="text-xs font-black text-primary">
                            {collectedCoins} / {totalPossibleCoins} Coins
                          </p>
                          <p className="text-[8px] text-neutral-500 mt-0.5">
                            {game.perPlayerCharge || 0} Coins per slot
                          </p>
                        </div>
                        <div className="bg-neutral-900/50 p-2 rounded-[8px] flex flex-col items-center justify-center">
                          <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mb-1">
                            Turf Expense
                          </p>
                          <p className="text-xs font-black text-white">
                            {game.groundCost || 0} Coins
                          </p>
                          {game.turf?.name && (
                            <p className="text-[8px] text-primary truncate max-w-full px-2 mt-0.5">
                              {game.turf.name}
                            </p>
                          )}
                        </div>
                        <div className="bg-neutral-900/50 p-2 rounded-[8px] flex flex-col items-center justify-center">
                          <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mb-1">
                            Professionals
                          </p>
                          {(game.umpireCost || 0) + (game.streamerCost || 0) >
                            0 && (
                            <p className="text-xs font-black text-white">
                              {(game.umpireCost || 0) + (game.streamerCost || 0)}{" "}
                              Coins
                            </p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {game.umpire && (
                              <Link
                                to={
                                  game.umpire._id
                                    ? `/profile/${game.umpire._id}`
                                    : "#"
                                }
                                className="flex flex-col items-center gap-0.5 group"
                              >
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-neutral-700 group-hover:border-primary transition-colors">
                                  {game.umpire.profilePicture ? (
                                    <img
                                      src={game.umpire.profilePicture}
                                      alt={game.umpire.name || "Umpire"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                      <User
                                        size={10}
                                        className="text-neutral-500"
                                      />
                                    </div>
                                  )}
                                </div>
                                <span
                                  className="text-[8px] text-neutral-400 group-hover:text-primary transition-colors truncate max-w-[40px] text-center"
                                  title="Umpire"
                                >
                                  {game.umpire.name?.split(" ")[0] || "Umpire"}
                                </span>
                              </Link>
                            )}
                            {game.scorer && (
                              <Link
                                to={
                                  game.scorer._id
                                    ? `/profile/${game.scorer._id}`
                                    : "#"
                                }
                                className="flex flex-col items-center gap-0.5 group"
                              >
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-neutral-700 group-hover:border-primary transition-colors">
                                  {game.scorer.profilePicture ? (
                                    <img
                                      src={game.scorer.profilePicture}
                                      alt={game.scorer.name || "Scorer"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                      <User
                                        size={10}
                                        className="text-neutral-500"
                                      />
                                    </div>
                                  )}
                                </div>
                                <span
                                  className="text-[8px] text-neutral-400 group-hover:text-primary transition-colors truncate max-w-[40px] text-center"
                                  title="Scorer"
                                >
                                  {game.scorer.name?.split(" ")[0] || "Scorer"}
                                </span>
                              </Link>
                            )}
                            {game.streamer && (
                              <Link
                                to={
                                  game.streamer._id
                                    ? `/profile/${game.streamer._id}`
                                    : "#"
                                }
                                className="flex flex-col items-center gap-0.5 group"
                              >
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-neutral-700 group-hover:border-primary transition-colors">
                                  {game.streamer.profilePicture ? (
                                    <img
                                      src={game.streamer.profilePicture}
                                      alt={game.streamer.name || "Streamer"}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                                      <User
                                        size={10}
                                        className="text-neutral-500"
                                      />
                                    </div>
                                  )}
                                </div>
                                <span
                                  className="text-[8px] text-neutral-400 group-hover:text-primary transition-colors truncate max-w-[40px] text-center"
                                  title="Streamer"
                                >
                                  {game.streamer.name?.split(" ")[0] ||
                                    "Streamer"}
                                </span>
                              </Link>
                            )}
                            {!game.umpire && !game.scorer && !game.streamer && (
                              <span className="text-[10px] text-neutral-600 font-medium">
                                None hired
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="bg-neutral-900/50 p-2 rounded-[8px] flex flex-col items-center justify-center">
                          <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mb-1">
                            Total Hosting Cost
                          </p>
                          <p className="text-xs font-black text-primary">
                            {game.totalCost || 0} Coins
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Player Slot Management Section - Only for transaction games */}
                {!(game.matchPreferences?.isPracticeMatch || game.requestType === "PRACTICE" || ["PRACTICE", "NET_BOWLERS", "UMPIRE", "SCORER", "STREAMER", "COACH"].includes(game.gameType)) && (
                  <div className="p-6 border-t border-neutral-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                        <Users size={16} /> Player Slot Management
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Quick Match Slots */}
                      {game.gameMode === "QUICK" &&
                        game.quickSlots &&
                        game.quickSlots.length > 0 && (
                          <div className="space-y-3 mb-6">
                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 px-2">
                              QUICK MATCH SLOTS
                            </h4>
                            <div className="flex flex-wrap gap-4">
                              {game.quickSlots.map((slot, index) => (
                                <div
                                  key={`Q-${index}`}
                                  className="flex flex-col items-center gap-1 w-16 relative"
                                >
                                  {slot.user || slot.userId ? (
                                    <Link
                                      to={`/profile/${slot.user?._id || slot.userId}`}
                                      className={`w-10 h-10 rounded-full bg-neutral-800 border-2 ${slot.status === "JOINED" ? "border-green-500" : "border-neutral-700"} flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity`}
                                    >
                                      {slot.user?.profilePicture ? (
                                        <img
                                          src={slot.user.profilePicture}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <User
                                          size={16}
                                          className="text-neutral-500"
                                        />
                                      )}
                                    </Link>
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-700 flex items-center justify-center overflow-hidden">
                                      <User
                                        size={16}
                                        className="text-neutral-500"
                                      />
                                    </div>
                                  )}

                                  <div
                                    className={`absolute top-0 right-1 w-3 h-3 rounded-full border-2 border-card ${slot.status === "PENDING" ? "bg-amber-500" : slot.status === "HELD" ? "bg-blue-500" : slot.status === "JOINED" ? "bg-green-500" : "bg-neutral-600"}`}
                                    title={slot.status}
                                  />

                                  <div className="text-center w-full">
                                    {slot.user || slot.userId ? (
                                      <Link
                                        to={`/profile/${slot.user?._id || slot.userId}`}
                                        className="text-[9px] font-bold text-white hover:text-primary transition-colors uppercase tracking-tighter truncate block w-full"
                                      >
                                        {slot.user?.name?.split(" ")[0] || "OPEN"}
                                      </Link>
                                    ) : (
                                      <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-tighter truncate w-full">
                                        OPEN
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Team A Slots */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 px-2">
                          {game.teams?.teamA?.name
                            ? `${game.teams.teamA.name} SLOTS`
                            : "HOME TEAM SLOTS"}
                        </h4>
                        <div className="flex flex-wrap gap-4">
                          {game.teams?.teamA?.slots?.map((slot, index) => (
                            <div
                              key={`A-${index}`}
                              className="flex flex-col items-center gap-1 w-16 relative"
                            >
                              {slot.user ? (
                                <Link
                                  to={`/profile/${slot.user._id || slot.user.id}`}
                                  className={`w-10 h-10 rounded-full bg-neutral-800 border-2 ${slot.status === "JOINED" ? "border-green-500" : "border-neutral-700"} flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity`}
                                >
                                  {slot.user.profilePicture ? (
                                    <img
                                      src={slot.user.profilePicture}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <User
                                      size={16}
                                      className="text-neutral-500"
                                    />
                                  )}
                                </Link>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-700 flex items-center justify-center overflow-hidden">
                                  <User size={16} className="text-neutral-500" />
                                </div>
                              )}

                              <div
                                className={`absolute top-0 right-1 w-3 h-3 rounded-full border-2 border-card ${slot.status === "PENDING" ? "bg-amber-500" : slot.status === "HELD" ? "bg-blue-500" : slot.status === "JOINED" ? "bg-green-500" : "bg-neutral-600"}`}
                                title={slot.status}
                              />

                              <div className="text-center w-full">
                                {slot.user ? (
                                  <Link
                                    to={`/profile/${slot.user._id || slot.user.id}`}
                                    className="text-[9px] font-bold text-white hover:text-primary transition-colors uppercase tracking-tighter truncate block w-full"
                                  >
                                    {slot.user.name?.split(" ")[0] || "OPEN"}
                                  </Link>
                                ) : (
                                  <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-tighter truncate w-full">
                                    {slot.customPlayer?.name?.split(" ")[0] ||
                                      "OPEN"}
                                  </p>
                                )}
                              </div>

                              {slot.status === "PENDING" && (
                                <div className="flex gap-1 mt-1">
                                  <Button
                                    onClick={() =>
                                      handleReject(game._id, "teamA", index)
                                    }
                                    className="p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/40 transition-colors"
                                    title="Reject"
                                  >
                                    <X size={10} />
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleApprove(game._id, "teamA", index)
                                    }
                                    className="p-1 bg-green-500/20 text-green-500 rounded hover:bg-green-500/40 transition-colors"
                                    title="Approve"
                                  >
                                    <Check size={10} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team B Slots */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 px-2">
                          {game.teams?.teamB?.name
                            ? `${game.teams.teamB.name} SLOTS`
                            : "AWAY TEAM SLOTS"}
                        </h4>
                        <div className="flex flex-wrap gap-4">
                          {game.teams?.teamB?.slots?.map((slot, index) => (
                            <div
                              key={`B-${index}`}
                              className="flex flex-col items-center gap-1 w-16 relative"
                            >
                              {slot.user ? (
                                <Link
                                  to={`/profile/${slot.user._id || slot.user.id}`}
                                  className={`w-10 h-10 rounded-full bg-neutral-800 border-2 ${slot.status === "JOINED" ? "border-green-500" : "border-neutral-700"} flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity`}
                                >
                                  {slot.user.profilePicture ? (
                                    <img
                                      src={slot.user.profilePicture}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <User
                                      size={16}
                                      className="text-neutral-500"
                                    />
                                  )}
                                </Link>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-700 flex items-center justify-center overflow-hidden">
                                  <User size={16} className="text-neutral-500" />
                                </div>
                              )}

                              <div
                                className={`absolute top-0 right-1 w-3 h-3 rounded-full border-2 border-card ${slot.status === "PENDING" ? "bg-amber-500" : slot.status === "HELD" ? "bg-blue-500" : slot.status === "JOINED" ? "bg-green-500" : "bg-neutral-600"}`}
                                title={slot.status}
                              />

                              <div className="text-center w-full">
                                {slot.user ? (
                                  <Link
                                    to={`/profile/${slot.user._id || slot.user.id}`}
                                    className="text-[9px] font-bold text-white hover:text-primary transition-colors uppercase tracking-tighter truncate block w-full"
                                  >
                                    {slot.user.name?.split(" ")[0] || "OPEN"}
                                  </Link>
                                ) : (
                                  <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-tighter truncate w-full">
                                    {slot.customPlayer?.name?.split(" ")[0] ||
                                      "OPEN"}
                                  </p>
                                )}
                              </div>

                              {slot.status === "PENDING" && (
                                <div className="flex gap-1 mt-1">
                                  <Button
                                    onClick={() =>
                                      handleReject(game._id, "teamB", index)
                                    }
                                    className="p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/40 transition-colors"
                                    title="Reject"
                                  >
                                    <X size={10} />
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleApprove(game._id, "teamB", index)
                                    }
                                    className="p-1 bg-green-500/20 text-green-500 rounded hover:bg-green-500/40 transition-colors"
                                    title="Approve"
                                  >
                                    <Check size={10} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <HireOfficialModal
        isOpen={hireModal.open}
        onClose={() => setHireModal({ open: false, gameId: null, role: null })}
        gameId={hireModal.gameId}
        role={hireModal.role}
        onInviteSent={fetchMyGames}
      />

      <SelectVenueModal
        isOpen={venueModal.open}
        onClose={() => setVenueModal({ open: false, gameId: null })}
        gameId={venueModal.gameId}
        onVenueSelected={fetchMyGames}
      />
    </div>
  );
};

export default MyHostedGames;
