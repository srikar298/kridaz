import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { login } from "@redux/slices/authSlice";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import {
  MessageCircle,
  Users,
  MapPin,
  Coins,
  Trophy,
  Info,
  Calendar,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { GiCricketBat, GiGloves, GiRun } from "react-icons/gi";
import CoinAnimation from "@components/CoinAnimation";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import GlobalBackButton from "@/shared/components/GlobalBackButton";
import { Button } from "@kridaz/ui";
import { useGetMyTeamsQuery } from "@redux/api/teamApi";

// Custom cricket ball SVG icon for Bowler role
const CricketBallIcon = ({ size = 12, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
  >
    <path d="M0 0h24v24H0z" fill="none" />
    <path
      fill="currentColor"
      d="m3.62 15.85l.53.53l-.73.73c.3.5.63.97 1.01 1.4L18.51 4.43c-.44-.38-.91-.71-1.4-1.01l-.73.73l-.53-.53l.57-.57A9.96 9.96 0 0 0 12 2C6.49 2 2 6.49 2 12c0 1.59.38 3.09 1.05 4.42zM14.8 4.67l.53.53l-1.75 1.75l-.53-.53zM12 7.47l.53.53l-1.75 1.75l-.53-.53zm-2.8 2.8l.53.53l-1.75 1.75l-.53-.53zm-2.8 2.8l.53.53l-1.75 1.75l-.53-.53zm13.98-4.92l-.53-.53l.73-.73c-.3-.5-.63-.97-1.01-1.4L5.49 19.57c.44.38.91.71 1.4 1.01l.73-.73l.53.53l-.57.57C8.92 21.61 10.41 22 12 22c5.51 0 10-4.49 10-10c0-1.59-.38-3.09-1.05-4.42zM9.2 19.33l-.53-.53l1.75-1.75l.53.53zm2.8-2.8l-.53-.53l1.75-1.75l.53.53zm2.8-2.8l-.53-.53l1.75-1.75l.53.53zm2.8-2.8l-.53-.53l1.75-1.75l.53.53z"
    />
  </svg>
);

const JoinGameDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { gameId } = useParams();
  const { gateInteraction } = useLoginOnDemand();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTeamTab, setActiveTeamTab] = useState("teamA");

  // Transaction / Join state
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [joiningSlot, setJoiningSlot] = useState(null);

  // Invite state
  const [inviteData, setInviteData] = useState(null);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [verifyingInvite, setVerifyingInvite] = useState(false);

  // Team Opponent state
  const { data: myTeamsData } = useGetMyTeamsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [showTeamApplyModal, setShowTeamApplyModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [applying, setApplying] = useState(false);

  // Dynamic Role Pluralizer helper
  const getPluralRole = (role) => {
    let r = role ? role.toUpperCase() : "PLAYERS";
    if (r === "BATSMAN") return "BATSMEN";
    if (r === "BOWLER") return "BOWLERS";
    if (r === "ALL-ROUNDER") return "ALL-ROUNDERS";
    if (r === "WICKET KEEPER") return "WICKET KEEPERS";
    return r;
  };

  // Get cricket-specific icons for roles
  const getRoleIcon = (role) => {
    const r = role ? role.toLowerCase() : "";
    if (r.includes("bat")) return GiCricketBat;
    if (r.includes("bowl")) return CricketBallIcon;
    if (r.includes("keep")) return GiGloves;
    if (r.includes("all")) return GiRun;
    return Users;
  };

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/hosted-game/${gameId}`);
      if (res.data.success && res.data.game) {
        setGame(res.data.game);
      } else {
        toast.error("Game not found");
        navigate("/join-games");
      }
    } catch (err) {
      toast.error("Failed to load match details");
      navigate("/join-games");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameId) {
      fetchGameDetails();
    } else {
      navigate("/join-games");
    }

    // Check for deep-link inviteToken
    const params = new URLSearchParams(window.location.search);
    const token = params.get("inviteToken");
    if (token) {
      handleVerifyInvite(token);
    }
  }, [gameId]);

  const handleVerifyInvite = async (token) => {
    try {
      setVerifyingInvite(true);
      const res = await axiosInstance.get(
        `/api/hosted-game/verify-invite?token=${token}`
      );
      if (res.data.success) {
        setInviteData({
          ...res.data,
          token,
        });
        setShowInvitePopup(true);
      }
    } catch (err) {
      console.error("Invite verification failed:", err);
      toast.error(
        err.response?.data?.message || "Invalid or expired invite link"
      );
    } finally {
      setVerifyingInvite(false);
    }
  };
  const handleApplyAsOpponent = async () => {
    if (!selectedTeamId) return toast.error("Please select a team");
    gateInteraction(
      async () => {
        try {
          setApplying(true);
          const res = await axiosInstance.post(
            `/api/hosted-game/apply-opponent-team`,
            {
              gameId: game.id,
              teamId: selectedTeamId,
            }
          );
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
      },
      { title: "Apply as Opponent", message: "Sign in to challenge this team." }
    );
  };

  const handleManageApplication = async (teamId, status) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(
        `/api/hosted-game/manage-opponent-application`,
        {
          gameId: game.id,
          teamId,
          action: status,
        }
      );
      if (res.data.success) {
        toast.success(`Application ${status.toLowerCase()}ed!`);
        fetchGameDetails();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to manage application"
      );
      if (
        err.response?.data?.message
          ?.toLowerCase()
          .includes("insufficient coins")
      ) {
        navigate("/wallet");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSlot = async () => {
    if (!inviteData) return;

    gateInteraction(
      async () => {
        try {
          const res = await axiosInstance.post(`/api/hosted-game/claim-slot`, {
            token: inviteData.token,
          });
          if (res.data.success) {
            setShowInvitePopup(false);

            if (res.data.newToken && res.data.updatedRole) {
              dispatch(
                login({
                  token: res.data.newToken,
                  role: res.data.updatedRole,
                })
              );
              localStorage.setItem("authToken", res.data.newToken);
              toast.success(
                "You've been assigned as Umpire! Redirecting to your dashboard..."
              );
              setTimeout(() => navigate("/umpire/dashboard"), 1200);
            } else {
              toast.success("Slot claimed successfully!");
              fetchGameDetails();
            }
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to claim slot");
        }
      },
      {
        title: "Claim Your Invited Slot",
        message: "Welcome to the game! Sign in to secure your reserved spot.",
      }
    );
  };

  const handleJoinGame = async () => {
    if (!joiningSlot) return;

    const isTeamB = joiningSlot.team === "B";
    const isTeamMatch = game?.matchPreferences?.opponentType === "TEAM";

    gateInteraction(
      async () => {
        try {
          let res;
          if (isTeamMatch && isTeamB) {
            const teamId = game.teams?.find((t) => t.teamKey === "teamB")?.id;
            res = await axiosInstance.post(`/api/hosted-game/pay-team-share`, {
              gameId: game.id,
              teamId: teamId
            });
          } else {
            res = await axiosInstance.post(`/api/hosted-game/join`, {
              gameId: game.id,
              team: joiningSlot.team,
              slotIndex: joiningSlot.index,
              role: joiningSlot.role,
            });
          }
          if (res.data.success) setShowCoinAnim(true);
        } catch (err) {
          const errorMsg = err.response?.data?.message || "Failed to join game";
          toast.error(errorMsg);
          if (
            errorMsg.toLowerCase().includes("insufficient coins") ||
            errorMsg.toLowerCase().includes("insufficient wallet balance")
          ) {
            navigate("/wallet");
          }
        }
      },
      {
        title: "Join the Match",
        message:
          "Ready to hit the field? Sign in to secure your spot and start playing with the community.",
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
          <span className="text-xs font-black uppercase tracking-widest text-white/50">
            Fetching Match Ledger...
          </span>
        </div>
      </div>
    );
  }
  if (!game) return null;

  const isTransactionFree =
    [
      "PRACTICE",
      "NET_BOWLERS",
      "UMPIRE",
      "SCORER",
      "STREAMER",
      "COACH",
    ].includes(game.gameType) ||
    [
      "PRACTICE",
      "NET_BOWLERS",
      "NEED_UMPIRE",
      "NEED_SCORER",
      "NEED_STREAMER",
      "NEED_COACH",
    ].includes(game.requestType);

  const currentUserId = user?.id || user?._id;
  const isHost = currentUserId && game.hostId === currentUserId;

  return (
    <div className="min-h-screen bg-background text-white px-1 md:px-3 pt-4 pb-24 relative overflow-hidden font-inter">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="w-full pb-20">
          {/* Top Navigation Row */}
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 mb-8">
            <GlobalBackButton />

            <div className="flex items-center gap-4">
              <span className="text-primary text-[12px] font-black uppercase tracking-widest">
                {game.sport ||
                  (game.gameType === "SCORING_MATCH"
                    ? "LIVE MATCH"
                    : game.gameType?.replace("_", " "))}
              </span>
              {game.shortId && (
                <Button
                  onClick={() => {
                    navigator.clipboard?.writeText(game.shortId);
                    toast.success("Game ID copied!");
                  }}
                  className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-[12px] font-black uppercase tracking-widest group"
                >
                  ID:{" "}
                  <span className="text-secondary group-hover:underline">
                    {game.shortId}
                  </span>
                </Button>
              )}
            </div>
          </div>

          <div className="max-w-4xl mx-auto mb-8">
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4 font-open-sans">
              {game.name ? (
                <span>{game.name}</span>
              ) : (
                <>
                  Match{" "}
                  <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                    Intelligence
                  </span>
                </>
              )}
            </h1>

            {/* Clean Meta Info Bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-4 pb-4 border-b border-white/5 text-[11px] md:text-xs font-bold uppercase text-white/70 tracking-wider">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-primary" />
                <span className="text-white">
                  {new Date(game.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  <span className="text-primary">{game.time}{game.endTime ? ` - ${game.endTime}` : ''}</span>
                </span>
              </div>

              <div className="w-1 h-1 rounded-full bg-white/20 hidden md:block"></div>

              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary" />
                <span className="text-white truncate max-w-[200px] md:max-w-none">
                  {game.name ||
                    game.customVenue ||
                    game.turf?.name ||
                    game.city ||
                    "HYDERABAD"}
                  , {game.state || "TELANGANA"}
                </span>
              </div>

              <div className="w-1 h-1 rounded-full bg-white/20"></div>

              <div className="flex items-center gap-1.5">
                <Coins size={14} className="text-primary" />
                <span className="text-white">
                  {game.perPlayerCharge
                    ? `${game.perPlayerCharge} Coins`
                    : "FREE ENTRY"}
                </span>
              </div>

              <div className="w-1 h-1 rounded-full bg-white/20 hidden md:block"></div>

              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-primary shrink-0" />
                {game.umpire ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${game.umpire.id || game.umpire._id}`);
                    }}
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  >
                    {game.umpire.profilePicture ? (
                      <img
                        src={game.umpire.profilePicture}
                        alt={game.umpire.name}
                        className="w-4 h-4 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-neutral-800 flex items-center justify-center text-[8px] font-bold text-white uppercase shrink-0">
                        {game.umpire.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="text-white hover:text-primary transition-colors truncate text-left max-w-[120px]">
                      {game.umpire.name || "Verified Umpire"}
                    </span>
                  </Button>
                ) : (
                  <span className="text-white">Unmanaged</span>
                )}
              </div>

              <div className="w-1 h-1 rounded-full bg-white/20"></div>

              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-primary" />
                <span className="text-primary">
                  {game.gameMode || "REGULAR"}
                </span>
              </div>
            </div>

            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
              Secure your slot and deploy on the field
            </p>
          </div>

          {/* Team Tabs Selection (only for non-QUICK matches) */}
          {(game.gameMode !== "QUICK" ||
            game.matchPreferences?.opponentType === "TEAM") &&
            !isTransactionFree && (
              <div className="max-w-4xl mx-auto mb-8 border-b border-white/10 flex gap-6">
                <Button
                  onClick={() => setActiveTeamTab("teamA")}
                  className={`pb-4 text-sm font-black uppercase tracking-wider relative transition-colors ${
                    activeTeamTab === "teamA"
                      ? "text-primary"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {game.teams?.teamA?.name || "Team A"}
                  {activeTeamTab === "teamA" && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_var(--primary)]"
                    />
                  )}
                </Button>
                <Button
                  onClick={() => setActiveTeamTab("teamB")}
                  className={`pb-4 text-sm font-black uppercase tracking-wider relative transition-colors ${
                    activeTeamTab === "teamB"
                      ? "text-primary"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {game.teams?.teamB?.name || "Team B"}
                  {activeTeamTab === "teamB" && (
                    <motion.div
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_var(--primary)]"
                    />
                  )}
                </Button>
              </div>
            )}

          {/* Match Configuration & Guidelines Section */}
          <div className="max-w-4xl mx-auto mb-8 bg-neutral-900/50 border border-white/5 rounded-[8px] p-6 shadow-2xl space-y-6 text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
              <Trophy size={18} className="text-primary" />
              <h3 className="font-open-sans text-base font-black text-white uppercase tracking-tight">
                Match Settings & Guidelines
              </h3>
            </div>

            {/* Quick Match Specs Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/40 border border-white/5 p-3 rounded-[8px] flex flex-col justify-between">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Experience Level</span>
                <span className="text-sm font-black text-white">{game.matchPreferences?.experienceLevel || "Any Level"}</span>
              </div>
              <div className="bg-black/40 border border-white/5 p-3 rounded-[8px] flex flex-col justify-between">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Game Vibe</span>
                <span className="text-sm font-black text-white">{game.matchPreferences?.gameVibe || "Casual / Fun"}</span>
              </div>
              <div className="bg-black/40 border border-white/5 p-3 rounded-[8px] flex flex-col justify-between">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Demographics</span>
                <span className="text-sm font-black text-white">
                  {game.matchPreferences?.genderPreference || "Co-ed (Mixed)"}
                  {game.matchPreferences?.ageGroup && game.matchPreferences.ageGroup !== "Any Age" ? ` (${game.matchPreferences.ageGroup})` : ""}
                </span>
              </div>
              <div className="bg-black/40 border border-white/5 p-3 rounded-[8px] flex flex-col justify-between">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Equipment</span>
                <span className="text-sm font-black text-white">
                  {game.matchPreferences?.equipmentStatus || "Everyone brings their own"}
                </span>
              </div>
              {game.format && (
                <div className="bg-black/40 border border-white/5 p-3 rounded-[8px] flex flex-col justify-between">
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Format</span>
                  <span className="text-sm font-black text-white">{game.format}</span>
                </div>
              )}
              {game.ballType && (
                <div className="bg-black/40 border border-white/5 p-3 rounded-[8px] flex flex-col justify-between">
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Ball Type</span>
                  <span className="text-sm font-black text-white">{game.ballType}</span>
                </div>
              )}
              {game.groundType && (
                <div className="bg-black/40 border border-white/5 p-3 rounded-[8px] flex flex-col justify-between">
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Ground Type</span>
                  <span className="text-sm font-black text-white">{game.groundType}</span>
                </div>
              )}
              {game.oversPerInnings && (
                <div className="bg-black/40 border border-white/5 p-3 rounded-[8px] flex flex-col justify-between">
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Overs Per Innings</span>
                  <span className="text-sm font-black text-white">{game.oversPerInnings} Overs</span>
                </div>
              )}
              {game.maxMembers > 0 && (
                <div className="bg-black/40 border border-white/5 p-3 rounded-[8px] flex flex-col justify-between">
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Players Per Team</span>
                  <span className="text-sm font-black text-white">{game.maxMembers} Players</span>
                </div>
              )}
              {(game.perSeatCharge || game.perPlayerCharge) ? (
                <div className="bg-black/40 border border-white/5 p-3 rounded-[8px] flex flex-col justify-between">
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-1">Entry Fee</span>
                  <span className="text-sm font-black text-white">
                    {game.perSeatCharge ? `₹${game.perSeatCharge}/seat` : `₹${game.perPlayerCharge}/player`}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Config rules row */}
            <div className="flex flex-wrap gap-3">
              <div className={`px-3 py-1.5 rounded-[6px] border text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${game.matchPreferences?.autoApprovePlayers ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${game.matchPreferences?.autoApprovePlayers ? "bg-emerald-400" : "bg-amber-400"}`} />
                {game.matchPreferences?.autoApprovePlayers ? "Auto-Approval Enabled" : "Manual Approval Required"}
              </div>
              <div className={`px-3 py-1.5 rounded-[6px] border text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${game.matchPreferences?.splitCostWithMultiplePlayers ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-neutral-500/10 border-neutral-500/20 text-neutral-400"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${game.matchPreferences?.splitCostWithMultiplePlayers ? "bg-cyan-400" : "bg-white/40"}`} />
                {game.matchPreferences?.splitCostWithMultiplePlayers ? "Split Cost Match" : "Host Sponsored"}
              </div>
              {game.matchPreferences?.opponentType && (
                <div className="px-3 py-1.5 rounded-[6px] bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {game.matchPreferences.opponentType === "TEAM" ? "Challenging a Team" : "Individual Roster Slots"}
                </div>
              )}
            </div>

            {/* Description / Requirements Text */}
            {(game.description || game.matchPreferences?.requirements) && (
              <div className="space-y-2 pt-2 border-t border-white/[0.06] text-left">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Host's Notes</span>
                <p className="text-sm font-medium text-white/80 italic leading-relaxed">
                  "{game.description || game.matchPreferences?.requirements}"
                </p>
              </div>
            )}

            {/* Description Tags */}
            {game.matchPreferences?.descriptionTags && (
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">Description Tags</span>
                <div className="flex flex-wrap gap-2">
                  {game.matchPreferences.descriptionTags.split(",").map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Venue Card */}
          {game.turf && (
            <div className="max-w-4xl mx-auto mb-8 bg-neutral-900/50 border border-white/5 rounded-[8px] overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/[0.08] flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <h3 className="font-open-sans text-base font-black text-white uppercase tracking-tight">Venue Details</h3>
              </div>
              <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6">
                {/* Image Slider */}
                <div className="w-full md:w-1/2 rounded-[16px] overflow-hidden flex gap-2 overflow-x-auto snap-x snap-mandatory custom-scrollbar relative">
                  {(game.turf.images && game.turf.images.length > 0) ? (
                    game.turf.images.map((img, idx) => (
                      <div key={idx} className="min-w-full snap-center relative aspect-video">
                        <img
                          src={img}
                          alt={game.turf.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="min-w-full snap-center relative aspect-video bg-neutral-800 flex items-center justify-center">
                      <span className="text-white/40 text-xs font-bold uppercase">No Image Available</span>
                    </div>
                  )}
                </div>
                
                {/* Venue Info */}
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-xl font-black text-white mb-2">{game.turf.name}</h4>
                  <p className="text-sm text-white/60 mb-4 flex items-start gap-2">
                    <MapPin size={16} className="text-white/40 mt-0.5 shrink-0" />
                    <span>{game.turf.location || game.turf.address || game.turf.city}</span>
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    {game.isPlatformBooking && game.groundCost > 0 && (
                      <div className="bg-black/40 border border-white/5 px-4 py-2 rounded-[8px]">
                        <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider block mb-1">Turf Price</span>
                        <span className="text-sm font-black text-primary">₹{game.groundCost}</span>
                      </div>
                    )}
                    {game.isPlatformBooking && (
                      <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-[8px] flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary" />
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Platform Booked</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Slot Grid Container */}
          <div className="max-w-4xl mx-auto bg-neutral-900/50 border border-white/5 rounded-[8px] p-6 shadow-2xl">
            {game.gameMode === "QUICK" &&
            game.matchPreferences?.opponentType !== "TEAM" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <h3 className="font-open-sans text-base font-black text-white uppercase tracking-tight">
                    Casual Match Pool
                  </h3>
                  <span className="font-inter text-[10px] font-bold bg-primary/15 text-primary border border-primary/20 px-2.5 py-1 rounded-[8px]">
                    {
                      (game.quickSlots || []).filter((s) => s.status !== "OPEN")
                        .length
                    }
                    /{(game.quickSlots || []).length} Filled
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                  {(game.quickSlots || []).map((slot, sIdx) => {
                    const isJoined = slot.status !== "OPEN";
                    const RoleIcon = getRoleIcon(slot.role || "");
                    return (
                      <div
                        key={sIdx}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <Button
                          disabled={isJoined}
                          onClick={() => {
                            if (!isAuthenticated) {
                              toast.error("Please login to join this game");
                              navigate("/login");
                              return;
                            }
                            const currentUserId = user?.id || user?._id;
                            const hasAlreadyJoined = (
                              game.quickSlots || []
                            ).some(
                              (s) =>
                                s.userId === currentUserId ||
                                s.user?._id === currentUserId ||
                                s.user?.id === currentUserId
                            );
                            if (hasAlreadyJoined) {
                              toast.error(
                                "You have already joined a slot in this game."
                              );
                              return;
                            }
                            setJoiningSlot({
                              team: "QUICK",
                              index: sIdx,
                              role: slot.role,
                            });
                            setShowConfirm(true);
                          }}
                          className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-black ${isJoined ? "border-white/15 cursor-not-allowed" : "border-white/10 hover:border-primary hover:shadow-[0_0_12px_rgba(191,243,103,0.35)]"}`}
                        >
                          {isJoined ? (
                            slot.user?.profilePicture ? (
                              <img
                                src={slot.user.profilePicture}
                                alt=""
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full flex items-center justify-center font-inter text-[11px] font-bold text-white">
                                {(slot.user?.name ||
                                  slot.customPlayer
                                    ?.name)?.[0]?.toUpperCase() || "P"}
                              </div>
                            )
                          ) : (
                            <span className="text-white/25 text-lg font-bold">
                              +
                            </span>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#08080a] border border-white/10 flex items-center justify-center">
                            <RoleIcon size={10} className="text-primary" />
                          </div>
                        </Button>
                        <span className="font-inter text-[9px] text-white/40 uppercase tracking-wide text-center truncate w-full">
                          {isJoined
                            ? (
                                slot.user?.name || slot.customPlayer?.name
                              )?.split(" ")[0] || "Player"
                            : slot.role || "Player"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Team slots */}
                {(() => {
                  const teamKey = activeTeamTab;
                  const team = game.teams?.[teamKey] || { slots: [] };
                  const isOpponentTeamPending =
                    teamKey === "teamB" && 
                    !game.teams?.teamB?.linkedTeamId &&
                    game.gameMode !== "PROFESSIONAL" && 
                    game.gameMode !== "PRO";

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
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">
                              Pending Applications
                            </h4>
                            {(game?.gameApplications || []).filter(
                              (a) => a.status === "PENDING"
                            ).length > 0 ? (
                              <div className="space-y-3 max-w-sm mx-auto">
                                {(game?.gameApplications || [])
                                  .filter((a) => a.status === "PENDING")
                                  .map((app) => (
                                    <div
                                      key={app.teamId}
                                      className="flex items-center justify-between bg-neutral-900 p-3 rounded-[8px] border border-white/5"
                                    >
                                      <div className="flex items-center gap-3">
                                        {app.teamLogo ? (
                                          <img
                                            src={app.teamLogo}
                                            className="w-8 h-8 rounded-full object-cover"
                                            alt="team"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-[10px] text-white">
                                            {app.teamName?.[0] || "T"}
                                          </div>
                                        )}
                                        <span className="text-white text-xs font-bold uppercase text-left max-w-[120px] truncate">
                                          {app.teamName || "Opponent"}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() =>
                                            handleManageApplication(
                                              app.teamId,
                                              "REJECT"
                                            )
                                          }
                                          className="bg-red-500/20 hover:bg-red-500/40 text-red-500 text-[10px] px-3 py-1 font-bold uppercase rounded-[4px] transition-colors"
                                        >
                                          Reject
                                        </Button>
                                        <Button
                                          onClick={() =>
                                            handleManageApplication(
                                              app.teamId,
                                              "APPROVE"
                                            )
                                          }
                                          className="bg-primary/20 hover:bg-primary/40 text-primary text-[10px] px-3 py-1 font-bold uppercase rounded-[4px] transition-colors"
                                        >
                                          Accept
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                                No applications yet
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="bg-black border border-white/10 rounded-[8px] p-6 text-center flex flex-col items-center">
                              <ShieldCheck
                                size={40}
                                className="text-primary/40 mb-4"
                              />
                              <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2">
                                Challenge this Team
                              </h4>
                              <p className="text-white/40 text-xs mb-6 max-w-sm mx-auto">
                                Gather your squad and challenge the host's team.
                                You will need to reserve the required entry coins
                                for your team.
                              </p>
                              {(() => {
                                const myApp = (game?.gameApplications || []).find(
                                  (a) => a.captainId === currentUserId
                                );
                                if (myApp?.status === "PENDING") {
                                  return (
                                    <span className="text-primary font-bold text-xs uppercase bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                                      Application Pending
                                    </span>
                                  );
                                }
                                if (myApp?.status === "REJECTED") {
                                  return (
                                    <span className="text-red-500 font-bold text-xs uppercase bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                                      Application Rejected
                                    </span>
                                  );
                                }
                                if (myApp?.status === "APPROVED") {
                                  return (
                                    <span className="text-green-500 font-bold text-xs uppercase bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                                      Application Approved
                                    </span>
                                  );
                                }
                                return (
                                  <Button
                                    onClick={() => setShowTeamApplyModal(true)}
                                    className="bg-primary text-black hover:bg-primary/90 font-black uppercase text-xs px-6 py-3 rounded-[8px] shadow-[0_0_15px_rgba(191,243,103,0.3)] transition-all"
                                  >
                                    Apply as Opponent
                                  </Button>
                                );
                              })()}
                            </div>

                            {/* Show applied teams to non-hosts too */}
                            {(game?.gameApplications || []).filter((a) => a.status === "PENDING").length > 0 && (
                              <div className="bg-neutral-900 border border-white/5 rounded-[8px] p-4 mt-4">
                                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
                                  Teams that applied
                                </h4>
                                <div className="space-y-2">
                                  {(game?.gameApplications || [])
                                    .filter((a) => a.status === "PENDING")
                                    .map((app) => (
                                      <div
                                        key={app.teamId}
                                        onClick={() => navigate(`/team/${app.teamId}`)}
                                        className="flex items-center gap-3 bg-black p-2 rounded-[6px] border border-white/5 cursor-pointer hover:border-white/20 transition-colors"
                                      >
                                        {app.teamLogo ? (
                                          <img src={app.teamLogo} className="w-6 h-6 rounded-full object-cover" />
                                        ) : (
                                          <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-[8px] text-white">
                                            {app.teamName?.[0] || "T"}
                                          </div>
                                        )}
                                        <span className="text-white text-[11px] font-bold uppercase truncate">
                                          {app.teamName || "Opponent Team"}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                        <h3 className="font-open-sans text-base font-black text-white uppercase tracking-tight">
                          {team.name} Squad
                        </h3>
                        <span className="font-inter text-[10px] font-bold bg-primary/15 text-primary border border-primary/20 px-2.5 py-1 rounded-[8px]">
                          {team.slots.filter((s) => s.status !== "OPEN").length}
                          /{team.slots.length} Filled
                        </span>
                      </div>

                      {teamKey === "teamB" && game?.matchPreferences?.opponentType === "TEAM" && (() => {
                         const acceptedApp = (game?.gameApplications || []).find(a => a.status === "APPROVED");
                         if(!acceptedApp) return null;
                         const advancePaid = acceptedApp.advancePaid || 0;
                         const advanceRefunded = acceptedApp.advanceRefunded || 0;
                         const currentAdvance = Math.max(0, advancePaid - advanceRefunded);
                         const targetPlayers = parseInt(game.matchPreferences.opponentTargetPlayers) || 2;
                         const memberShare = acceptedApp.totalRequired / targetPlayers;
                         const memberSlotsCount = team.slots.filter(s => s.status !== "OPEN" && s.userId !== acceptedApp.captainId).length;
                         const teamCollected = currentAdvance + (memberSlotsCount * memberShare);

                         return (
                           <div className="bg-primary/5 border border-primary/20 rounded-[8px] p-4 flex flex-col md:flex-row justify-between gap-4">
                             <div>
                               <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-1">Squad Funding</p>
                               <p className="text-xl font-black text-white">{teamCollected} / {acceptedApp.totalRequired} <span className="text-sm text-primary">Coins</span></p>
                             </div>
                             <div className="flex gap-4">
                               <div className="text-right">
                                 <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-1">Captain Advance</p>
                                 <p className="text-sm font-black text-primary">{currentAdvance} Coins</p>
                               </div>
                               <div className="text-right">
                                 <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-1">Member Share</p>
                                 <p className="text-sm font-black text-white">{memberShare} Coins</p>
                               </div>
                             </div>
                           </div>
                         );
                      })()}

                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                        {team.slots.map((slot, sIdx) => {
                          const isJoined = slot.status !== "OPEN";
                          const RoleIcon = getRoleIcon(slot.role || "");
                          return (
                            <div
                              key={sIdx}
                              className="flex flex-col items-center gap-1.5"
                            >
                              <Button
                                disabled={isJoined}
                                onClick={() => {
                                  if (!isAuthenticated) {
                                    toast.error(
                                      "Please login to join this game"
                                    );
                                    navigate("/login");
                                    return;
                                  }
                                  const currentUserId = user?.id || user?._id;
                                  const hasAlreadyJoined =
                                    game.teams?.teamA?.slots?.some(
                                      (s) =>
                                        s.userId === currentUserId ||
                                        s.user?._id === currentUserId ||
                                        s.user?.id === currentUserId
                                    ) ||
                                    game.teams?.teamB?.slots?.some(
                                      (s) =>
                                        s.userId === currentUserId ||
                                        s.user?._id === currentUserId ||
                                        s.user?.id === currentUserId
                                    );
                                  if (hasAlreadyJoined) {
                                    toast.error(
                                      "You have already joined a slot in this game."
                                    );
                                    return;
                                  }
                                  setJoiningSlot({
                                    team: teamKey === "teamA" ? "A" : "B",
                                    index: sIdx,
                                    role: slot.role,
                                  });
                                  setShowConfirm(true);
                                }}
                                className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-black ${isJoined ? "border-white/15 cursor-not-allowed" : "border-white/10 hover:border-primary hover:shadow-[0_0_12px_rgba(191,243,103,0.35)]"}`}
                              >
                                {isJoined ? (
                                  slot.user?.profilePicture ? (
                                    <img
                                      src={slot.user.profilePicture}
                                      alt=""
                                      className="w-full h-full rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full rounded-full flex items-center justify-center font-inter text-[11px] font-bold text-white">
                                      {(slot.user?.name ||
                                        slot.customPlayer
                                          ?.name)?.[0]?.toUpperCase() || "P"}
                                    </div>
                                  )
                                ) : (
                                  <span className="text-white/25 text-lg font-bold">
                                    +
                                  </span>
                                )}
                                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#08080a] border border-white/10 flex items-center justify-center">
                                  <RoleIcon
                                    size={10}
                                    className="text-primary"
                                  />
                                </div>
                              </Button>
                              <span className="font-inter text-[9px] text-white/40 uppercase tracking-wide text-center truncate w-full">
                                {isJoined
                                  ? (
                                      slot.user?.name || slot.customPlayer?.name
                                    )?.split(" ")[0] || "Player"
                                  : slot.role || "Player"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Bottom hint */}
            <div className="flex items-center justify-center gap-1.5 pt-6 mt-8 border-t border-white/[0.06]">
              <Info size={12} className="text-primary" />
              <span className="font-inter text-[10px] text-white/30 uppercase tracking-widest">
                Tap an available slot to register
              </span>
            </div>
          </div>
        </div>
      </div>

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
                  {game.matchPreferences?.splitCost
                    ? Math.ceil(Number(game.groundCost || 0) / 2)
                    : 0}{" "}
                  Coins
                </span>{" "}
                will be reserved from your wallet for your team.
              </p>

              <div className="text-left mb-6">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
                  Select Your Team
                </label>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {(() => {
                    const eligibleTeams = myTeamsData?.teams?.filter(t => {
                      const currentUserId = currentUser?.id || currentUser?._id;
                      if (t.ownerId === currentUserId) return true;
                      return t.members?.some(
                        m => (m.userId === currentUserId || m.user?.id === currentUserId || m.user?._id === currentUserId) && m.role === "CAPTAIN"
                      );
                    }) || [];
                    
                    return eligibleTeams.length > 0 ? (
                      eligibleTeams.map((t) => (
                        <div
                        key={t.id || t._id}
                        onClick={() => setSelectedTeamId(t.id || t._id)}
                        className={`flex items-center gap-3 p-3 rounded-[8px] cursor-pointer border transition-colors ${selectedTeamId === (t.id || t._id) ? "bg-primary/10 border-primary" : "bg-neutral-900 border-white/5 hover:border-white/20"}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                          {(t.image || t.logo) ? (
                            <img
                              src={t.image || t.logo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            t.name?.[0]
                          )}
                        </div>
                        <span className="text-sm font-bold text-white truncate">
                          {t.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-white/40">
                      You don't have any eligible teams (Admin/Captain) yet. Create one or request promotion.
                    </p>
                  );
                })()}
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-background border border-border p-10 rounded-[8px] max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(191,243,103,0.1)]">
                <Coins size={40} className="text-primary" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-4 font-open-sans">
                Join Protocol
              </h2>
              <p className="text-muted-foreground mb-10 text-sm leading-relaxed">
                Participation requires{" "}
                <span className="text-primary font-black">
                  {joiningSlot?.team === "B" && game?.matchPreferences?.opponentType === "TEAM" ? 
                    ((game?.matchPreferences?.applications?.find(a => a.status === "APPROVED")?.totalRequired || 0) / (parseInt(game?.matchPreferences?.opponentTargetPlayers) || 2))
                    : (game?.perPlayerCharge || 0)} Coins
                </span>
                . These will be securely escrowed until match confirmation.
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-4 bg-card border border-border rounded-[8px] font-black text-[9px] md:text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Abort
                </Button>
                <Button
                  onClick={() => {
                    setShowConfirm(false);
                    handleJoinGame();
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-primary to-primary text-black font-black rounded-[8px] text-[9px] md:text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(191,243,103,0.25)] hover:scale-105 transition-all"
                >
                  Confirm
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CoinAnimation
        show={showCoinAnim}
        amount={game?.perPlayerCharge}
        onComplete={() => {
          setShowCoinAnim(false);
          navigate("/join-games");
          toast.success("Deployment Successful! Request Sent.");
        }}
      />

      {/* Invite Redemption Popup */}
      <AnimatePresence>
        {showInvitePopup && inviteData && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInvitePopup(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-background border border-primary/20 p-8 rounded-[8px] max-w-md w-full shadow-[0_0_50px_rgba(191,243,103,0.15)]"
            >
              <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={40} className="text-primary" />
              </div>

              <h2 className="text-3xl font-black text-white uppercase tracking-tighter text-center mb-2">
                Claim Your Slot
              </h2>
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] text-center mb-6">
                Reserved For You
              </p>

              <div className="bg-card border border-white/5 rounded-[8px] p-5 mb-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/40 uppercase">
                    Match
                  </span>
                  <span className="text-sm font-black text-white uppercase">
                    {inviteData.game.gameType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/40 uppercase">
                    Date/Time
                  </span>
                  <span className="text-sm font-black text-white">
                    {new Date(inviteData.game.date).toLocaleDateString()} •{" "}
                    {inviteData.game.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/40 uppercase">
                    Location
                  </span>
                  <span className="text-sm font-black text-white uppercase truncate ml-4">
                    {inviteData.game.city}, {inviteData.game.state}
                  </span>
                </div>
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase">
                    Cost
                  </span>
                  <span className="text-lg font-black text-primary">
                    {inviteData.mustPay
                      ? `${inviteData.perPlayerCharge} Coins`
                      : "FREE"}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setShowInvitePopup(false)}
                  className="flex-1 py-4 bg-card border border-border rounded-[8px] font-black text-[9px] md:text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Ignore
                </Button>
                <Button
                  onClick={handleClaimSlot}
                  className="flex-1 py-4 bg-gradient-to-r from-primary to-primary text-black font-black rounded-[8px] text-[9px] md:text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(191,243,103,0.25)] hover:scale-105 transition-all"
                >
                  Join Match
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JoinGameDetails;
