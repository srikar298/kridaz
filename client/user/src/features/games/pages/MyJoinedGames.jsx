import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";import { Button, Input, Select, Textarea } from "@kridaz/ui";

import {
  Users,
  LogOut,
  Clock,
  MapPin,
  Trophy,
  Info,
  Calendar,
  User,
  Search,
} from "lucide-react";

const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const isWithin24HoursOfStart = (gameDate, gameTime) => {
  if (!gameDate || !gameTime) return false;
  const matchDateTime = new Date(gameDate);
  const [hours, minutes] = gameTime.split(":");
  matchDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

  const now = new Date();
  const timeDiff = now.getTime() - matchDateTime.getTime();

  // strictly within 24 hours after start
  return timeDiff >= 0 && timeDiff <= 86400000;
};

const MyJoinedGames = () => {
  const [joinedGames, setJoinedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [disputeModal, setDisputeModal] = useState({
    isOpen: false,
    gameId: null,
    reason: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJoinedGames = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/hosted-game/my-joined`,
        { withCredentials: true }
      );
      setJoinedGames(res.data.games);
    } catch (err) {
      toast.error("Failed to fetch your joined games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoinedGames();
  }, []);

  const handleLeave = async (gameId) => {
    if (
      !window.confirm(
        "Are you sure you want to leave this game? Your coins will be refunded or released."
      )
    )
      return;
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/hosted-game/leave`,
        {
          gameId,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(res.data.message);
        fetchJoinedGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave game");
    }
  };

  const handleVoteStarted = async (gameId) => {
    if (
      !window.confirm(
        "Confirm that this game has started? This will eventually release coins to the host once majority is reached."
      )
    )
      return;
    try {
      setActionLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/hosted-game/vote-started`,
        {
          gameId,
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchJoinedGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to vote game started");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeModal.reason.trim()) {
      return toast.error("Please provide a reason for the dispute.");
    }
    try {
      setActionLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/hosted-game/raise-dispute`,
        {
          gameId: disputeModal.gameId,
          reason: disputeModal.reason,
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setDisputeModal({ isOpen: false, gameId: null, reason: "" });
        fetchJoinedGames();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to raise dispute");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredGames = joinedGames
    .filter((game) => {
      const matchesSearch =
        game.host?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.teams?.teamA?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        game.teams?.teamB?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        game.gameType?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterStatus === "ALL" ||
        game.status === filterStatus ||
        game.mySlotStatus === filterStatus;

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
          MY JOINED MATCHES
        </h1>
        <p className="text-neutral-400 text-[20px]" style={SUBHEADING_STYLE}>
          Games you&apos;ve requested to join or have already joined
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
            placeholder="Search by Host, Team or Match Type..."
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
          <option value="JOINED">Joined</option>
          <option value="PENDING">Pending Approval</option>
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
              {joinedGames.length === 0
                ? "No matches joined yet"
                : "No matches found"}
            </h3>
            <p
              className="text-neutral-500 mb-6 text-[20px]"
              style={SUBHEADING_STYLE}
            >
              {joinedGames.length === 0
                ? "Explore games hosted by the community and join one!"
                : "Try adjusting your search filters"}
            </p>
            {joinedGames.length === 0 && (
              <Button
                onClick={() => (window.location.href = "/join-games")}
                className="px-8 py-3 bg-primary text-black font-bold rounded-[8px]"
              >
                Find Games
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
              ).length || 0) +
              (game.teams?.teamB?.slots?.filter(
                (s) => s.status === "JOINED" && s.userId
              ).length || 0) +
              (game.quickSlots?.filter((s) => s.status === "JOINED" && s.userId)
                .length || 0);

            const perPlayerCharge = game.perPlayerCharge || 0;
            const totalPossibleCoins = totalSlotsCount * perPlayerCharge;
            const collectedCoins = joinedSlotsCount * perPlayerCharge;

            return (
              <div
                key={game._id}
                className="bg-neutral-800/50 border border-neutral-800 rounded-[8px] overflow-hidden relative shadow-2xl mb-6"
              >
                {game.status === "CANCELLED" && (
                  <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="bg-red-500 text-white px-6 py-2 rounded-full font-black uppercase italic tracking-tighter transform -rotate-12">
                      GAME CANCELLED
                    </span>
                  </div>
                )}

                <div className="p-6 border-b border-neutral-800">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
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
                        {game.gameMode === "QUICK"
                          ? `${game.gameType} Quick Match`
                          : `${game.teams?.teamA?.name || "TBD"} vs ${game.teams?.teamB?.name || "TBD"}`}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block ${game.mySlotStatus === "PENDING" ? "bg-orange-500/20 text-orange-500" : "bg-green-500/20 text-green-500"}`}
                      >
                        {game.mySlotStatus}
                      </p>
                      <p className="text-xs text-neutral-500 mt-2 font-bold uppercase">
                        {game.myRole}
                      </p>
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
                                game.enue?.name ||
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
                                game.customVenue ||
                                game.ground?.name
                              }
                            >
                              {game.turf?.name ||
                                game.customVenue ||
                                game.enue?.name ||
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
                      <div className="flex flex-wrap gap-2">
                        {game.status !== "CANCELLED" &&
                          game.mySlotStatus === "JOINED" &&
                          game.perPlayerCharge > 0 &&
                          game.coinTransferStatus === "PENDING" && (
                            <>
                              {!game.myVote ? (
                                <Button
                                  onClick={() => handleVoteStarted(game._id)}
                                  disabled={actionLoading}
                                  className="flex items-center gap-2 px-4 py-1.5 bg-green-500/20 text-green-500 text-[10px] font-black rounded-[6px] hover:bg-green-500 hover:text-white transition-all uppercase tracking-wider disabled:opacity-50"
                                >
                                  <Trophy size={12} /> Game Started
                                </Button>
                              ) : (
                                <span className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-black rounded-[6px] uppercase tracking-wider">
                                  Voted Started
                                </span>
                              )}
                              {isWithin24HoursOfStart(game.date, game.time) && (
                                <Button
                                  onClick={() =>
                                    setDisputeModal({
                                      isOpen: true,
                                      gameId: game._id,
                                      reason: "",
                                    })
                                  }
                                  disabled={actionLoading}
                                  className="flex items-center gap-2 px-4 py-1.5 bg-orange-500/20 text-orange-500 text-[10px] font-black rounded-[6px] hover:bg-orange-500 hover:text-black transition-all uppercase tracking-wider disabled:opacity-50"
                                >
                                  <Info size={12} /> Raise Dispute
                                </Button>
                              )}
                            </>
                          )}
                        {game.coinTransferStatus === "DISPUTED" && (
                          <span className="flex items-center gap-2 px-4 py-1.5 bg-orange-500/20 text-orange-500 text-[10px] font-black rounded-[6px] uppercase tracking-wider">
                            Dispute Active
                          </span>
                        )}
                        {game.coinTransferStatus === "COMPLETED" && (
                          <span className="flex items-center gap-2 px-4 py-1.5 bg-green-500/20 text-green-500 text-[10px] font-black rounded-[6px] uppercase tracking-wider">
                            Settled
                          </span>
                        )}

                        {game.status !== "CANCELLED" && (
                          <Button
                            onClick={() => handleLeave(game._id)}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-4 py-1.5 bg-neutral-800 text-neutral-400 text-[10px] font-black rounded-[6px] hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider disabled:opacity-50"
                          >
                            <LogOut size={12} /> Leave Match
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border-t border-neutral-800/50 pt-4">
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
                        {(game.turf?.name || game.enue?.name) && (
                          <p className="text-[8px] text-primary truncate max-w-full px-2 mt-0.5">
                            {game.turf?.name || game.enue?.name}
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
                    </div>
                  </div>
                </div>

                {/* Player Slot Management Section */}
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
                    {game.gameMode !== "QUICK" && (
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
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Team B Slots */}
                    {game.gameMode !== "QUICK" && (
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
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-neutral-900/50 flex items-center justify-between border-t border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                      {game.host?.profilePicture ? (
                        <img
                          src={game.host.profilePicture}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            if (e.target.nextSibling)
                              e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          display: game.host?.profilePicture ? "none" : "flex",
                        }}
                      >
                        <User size={16} className="text-primary" />
                      </div>
                    </div>
                    <div className="text-[10px]">
                      <p className="text-neutral-500 font-bold uppercase">
                        Hosted By
                      </p>
                      <p className="font-black uppercase tracking-tighter">
                        {game.host?.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dispute Modal */}
      {disputeModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-neutral-800 p-8 rounded-[8px] w-full max-w-md animate-slide-up shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                  Raise Dispute
                </h2>
                <p className="text-xs text-neutral-400 font-bold uppercase mt-2">
                  Team will review your issue
                </p>
              </div>
              <Button
                onClick={() =>
                  setDisputeModal({ isOpen: false, gameId: null, reason: "" })
                }
                className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
              >
                ✕
              </Button>
            </div>
            <form onSubmit={handleRaiseDispute} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest block mb-2">
                  Reason for Dispute
                </label>
                <Textarea
                  value={disputeModal.reason}
                  onChange={(e) =>
                    setDisputeModal({ ...disputeModal, reason: e.target.value })
                  }
                  placeholder="Host didn't show up, match didn't happen, etc."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-[8px] p-4 text-white focus:outline-none focus:border-orange-500 transition-colors h-32 resize-none font-medium"
                />
              </div>
              <Button
                type="submit"
                disabled={actionLoading || !disputeModal.reason.trim()}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-black uppercase italic tracking-tighter text-lg rounded-[8px] transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                {actionLoading ? "Submitting..." : "Submit Dispute"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyJoinedGames;
