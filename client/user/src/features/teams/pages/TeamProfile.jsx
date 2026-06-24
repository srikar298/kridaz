import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Users,
  Trophy,
  MapPin,
  Calendar,
  Shield,
  UserPlus,
  Swords,
  MessageCircle,
  Share2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  QrCode,
  Target,
  Star,
  ArrowRight,
  Play,
  TrendingUp,
  BarChart3,
  Fingerprint,
  Crown,
  Ticket,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetTeamByIdQuery,
  useRequestToJoinMutation,
  useGetMyTeamsQuery,
  useRequestOpponentMutation,
} from "@redux/api/teamApi";
import toast from "react-hot-toast";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import { StartScoringModal, ScoringMatchCard } from "@features/scoring";
import { useGetMyScoringGamesQuery } from "@redux/api/scoringApi";import { Button } from "@kridaz/ui";


const PRI = "var(--primary)";
const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

// Mock data for 15+ players to demonstrate the UI
const MOCK_SQUAD = [
  {
    user: { name: "Rohit Sharma", role: "Captain", profilePicture: null },
    role: "CAPTAIN",
  },
  {
    user: { name: "Virat Kohli", role: "Batsman", profilePicture: null },
    role: "VICE CAPTAIN",
  },
  {
    user: { name: "KL Rahul", role: "Wicket Keeper", profilePicture: null },
    role: "MEMBER",
  },
  {
    user: { name: "Suryakumar Yadav", role: "Batsman", profilePicture: null },
    role: "MEMBER",
  },
  {
    user: { name: "Hardik Pandya", role: "All Rounder", profilePicture: null },
    role: "MEMBER",
  },
  {
    user: {
      name: "Ravindra Jadeja",
      role: "All Rounder",
      profilePicture: null,
    },
    role: "MEMBER",
  },
  {
    user: { name: "Jasprit Bumrah", role: "Bowler", profilePicture: null },
    role: "MEMBER",
  },
  {
    user: { name: "Mohammed Shami", role: "Bowler", profilePicture: null },
    role: "MEMBER",
  },
  {
    user: { name: "Kuldeep Yadav", role: "Bowler", profilePicture: null },
    role: "MEMBER",
  },
  {
    user: { name: "Shubman Gill", role: "Batsman", profilePicture: null },
    role: "MEMBER",
  },
  {
    user: { name: "Shreyas Iyer", role: "Batsman", profilePicture: null },
    role: "MEMBER",
  },
  {
    user: { name: "Ishan Kishan", role: "Wicket Keeper", profilePicture: null },
    role: "MEMBER",
  },
  {
    user: { name: "Axar Patel", role: "All Rounder", profilePicture: null },
    role: "MEMBER",
  },
  {
    user: { name: "Shardul Thakur", role: "All Rounder", profilePicture: null },
    role: "MEMBER",
  },
  {
    user: { name: "Yuzvendra Chahal", role: "Bowler", profilePicture: null },
    role: "MEMBER",
  },
];

const TeamProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // @ts-ignore
  const { user: currentUser, isLoggedIn } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();

  const { data: teamData, isLoading, error } = useGetTeamByIdQuery(id);
  const { data: myTeamsData } = useGetMyTeamsQuery(undefined, {
    skip: !isLoggedIn,
  });
  const { data: scoringGamesData } = useGetMyScoringGamesQuery(undefined, {
    skip: !isLoggedIn,
  });
  const [requestJoin, { isLoading: isJoining }] = useRequestToJoinMutation();
  const [requestOpponent, { isLoading: isChallenging }] =
    useRequestOpponentMutation();

  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showSquadModal, setShowSquadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [selectedMyTeam, setSelectedMyTeam] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
            Assembling...
          </p>
        </div>
      </div>
    );
  }

  if (error || !teamData?.team) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2
          className="text-2xl font-black text-white uppercase tracking-tighter mb-2"
          style={HEADING_STYLE}
        >
          Team Not Found
        </h2>
        <Button
          onClick={() => navigate("/players")}
          className="px-6 py-2.5 bg-primary text-black rounded-[8px] font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all"
        >
          Back to Discovery
        </Button>
      </div>
    );
  }

  const team = teamData.team;

  // Filter active scoring matches for the current team
  const teamMatches = (scoringGamesData?.games || []).filter((game) => {
    const teamNameLower = team?.name?.toLowerCase();
    const teamId = team?.id || team?._id;
    return game.teams?.some(
      (t) =>
        (t.name && t.name.toLowerCase() === teamNameLower) ||
        (t.teamId && t.teamId === teamId)
    );
  });

  // Combine real members with mock data if real members are less than 15
  const displayMembers =
    team.members?.length > 1
      ? team.members
      : [
          ...(team.members || []),
          ...MOCK_SQUAD.slice(0, 15 - (team.members?.length || 0)),
        ];

  const isOwner = currentUser?._id === team.owner?._id;
  const isMember = team.members?.some(
    (m) => m.user?._id === currentUser?._id && m.status === "JOINED"
  );
  const isPendingMember = team.members?.some(
    (m) => m.user?._id === currentUser?._id && m.status === "PENDING"
  );

  const handleJoinRequest = async () => {
    gateInteraction(async () => {
      try {
        await requestJoin(id).unwrap();
        toast.success("Join request sent!");
      } catch (err) {
        toast.error(err.data?.message || "Failed to send request");
      }
    });
  };

  const handleChallenge = async () => {
    if (!selectedMyTeam) {
      toast.error("Select your team first");
      return;
    }
    try {
      await requestOpponent({
        teamId: selectedMyTeam,
        targetTeamId: id,
      }).unwrap();
      toast.success("Challenge sent!");
      setShowChallengeModal(false);
    } catch (err) {
      toast.error(err.data?.message || "Failed to send challenge");
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(team.teamCode);
    toast.success("ID copied!");
  };

  const handleShare = () => {
    navigator
      .share({
        title: `Join ${team.name} on Kridaz`,
        text: `Check out ${team.name} profile!`,
        url: window.location.href,
      })
      .catch(() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied!");
      });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-4 pb-12 px-4 md:px-6">
      <div className="max-w-[1280px] mx-auto space-y-4">
        {/* Hero Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Main Hero Container */}
          <div className="lg:col-span-9 relative">
            <div className="relative bg-background border border-white/5 rounded-[8px] overflow-hidden p-4 md:p-5 min-h-[380px] flex flex-col">
              <div className="absolute top-4 right-4 z-20">
                <div className="flex flex-col items-end gap-1">
                  <Button
                    onClick={copyId}
                    className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-[6px] text-primary font-black text-[10px] hover:bg-white/5 transition-colors"
                  >
                    {team.teamCode} <Copy size={10} className="opacity-50" />
                  </Button>
                </div>
              </div>
              {/* Stadium Background */}
              <div className="absolute inset-0 z-0">
                <img
                  src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2105&auto=format&fit=crop"
                  alt=""
                  className="w-full h-full object-cover opacity-15 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              </div>

              {/* Top Row: Logo & Info */}
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start mb-auto">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-[8px] bg-black border-2 border-primary p-2 flex items-center justify-center shadow-[0_0_30px_rgba(191,243,103,0.1)] relative overflow-hidden group shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-full h-full object-cover rounded-[8px]"
                    />
                  ) : (
                    <Trophy size={40} className="text-primary/20" />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                      {team.sportType || "Cricket"}
                    </span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/30 text-[8px] font-black uppercase tracking-widest rounded-full">
                      Public Team
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1
                        className="text-4xl md:text-5xl font-black uppercase tracking-tighter"
                        style={HEADING_STYLE}
                      >
                        {team.name}
                      </h1>
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(191,243,103,0.3)]">
                        <CheckCircle2 size={12} className="text-black" />
                      </div>
                    </div>
                    <p className="text-gray-500 text-[11px] max-w-lg font-medium leading-relaxed">
                      {team.description ||
                        "Representing the best of their city. This squad is built on passion and strategy."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4 w-full overflow-hidden">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest">
                        Captain
                      </p>
                      <div className="flex items-center gap-1.5 text-white font-black text-[10px] uppercase truncate">
                        <Users size={12} className="text-primary shrink-0" />
                        <span className="truncate">{team.owner?.name || "Prasenjeet Yadav"}</span>
                      </div>
                    </div>
                    <div className="w-px h-6 bg-white/10 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest">
                        Location
                      </p>
                      <div className="flex items-center gap-1.5 text-white font-black text-[10px] uppercase truncate">
                        <MapPin size={12} className="text-primary shrink-0" />
                        <span className="truncate">{team.city || "Hyderabad"}, TS</span>
                      </div>
                    </div>
                    <div className="w-px h-6 bg-white/10 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest">
                        Created
                      </p>
                      <div className="flex items-center gap-1.5 text-white font-black text-[10px] uppercase truncate">
                        <Calendar size={12} className="text-primary shrink-0" />
                        <span className="truncate">{new Date(team.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="relative z-10 mt-6 bg-white/[0.02] border border-white/5 rounded-[8px] p-4">
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-x-2 gap-y-4">
                  {[
                    { label: "Played", value: "128", icon: Trophy },
                    { label: "Won", value: "96", icon: Star },
                    { label: "Win Rate", value: "75%", icon: TrendingUp },
                    { label: "Runs", value: "12.4k", icon: BarChart3 },
                    { label: "Avg Score", value: "145", icon: Target },
                    {
                      label: "Streak",
                      value: "6W",
                      icon: Zap,
                      color: "var(--primary)",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-start gap-1 group relative"
                    >
                      <div className="flex items-center gap-1.5 text-gray-700 group-hover:text-primary transition-colors">
                        <stat.icon size={10} />
                        <span className="text-[6px] font-black uppercase tracking-widest">
                          {stat.label}
                        </span>
                      </div>
                      <p
                        className="text-xl font-black text-white leading-none"
                        style={{ color: stat.color }}
                      >
                        {stat.value}
                      </p>
                      {i < 5 && (
                        <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-px h-6 bg-white/5 hidden lg:block" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-background border border-white/5 rounded-[8px] p-5 space-y-4 h-full flex flex-col">
              <div className="space-y-0.5">
                <h3
                  className="text-md font-black uppercase tracking-tight"
                  style={HEADING_STYLE}
                >
                  Squad Status
                </h3>
                <p className="text-[7px] font-black text-gray-700 uppercase tracking-widest">
                  Live tracker
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 p-3 rounded-[8px] border border-white/5 text-center">
                  <p className="text-xl font-black text-white mb-0.5">
                    {displayMembers.length}
                  </p>
                  <p className="text-[7px] font-black text-gray-700 uppercase tracking-widest">
                    Players
                  </p>
                </div>
                <div className="bg-white/5 p-3 rounded-[8px] border border-white/5 text-center">
                  <p className="text-xl font-black text-blue-500 mb-0.5">0</p>
                  <p className="text-[7px] font-black text-gray-700 uppercase tracking-widest">
                    Wins
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-3 gap-2">
                  {isMember ? (
                    <Button
                      onClick={() => toast.success("Left the team.")}
                      className="py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-[8px] font-black uppercase tracking-widest text-[8px] sm:text-[9px] flex items-center justify-center gap-1 sm:gap-2 hover:bg-red-500/20 transition-all px-1"
                    >
                      <UserPlus size={14} className="rotate-45 shrink-0" />
                      <span className="truncate">Leave</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={handleJoinRequest}
                      disabled={isJoining || isPendingMember || isOwner}
                      className={`py-3 rounded-[8px] font-black uppercase tracking-widest text-[8px] sm:text-[9px] flex items-center justify-center gap-1 sm:gap-2 transition-all px-1 ${isPendingMember || isOwner ? "bg-white/5 text-white/20 border border-white/10" : "bg-primary text-black hover:brightness-110 shadow-[0_5px_15px_rgba(191,243,103,0.2)]"}`}
                    >
                      {isJoining ? (
                        <Loader2 size={12} className="animate-spin shrink-0" />
                      ) : (
                        <>
                          <UserPlus size={14} className="shrink-0" />
                          <span className="truncate">{isPendingMember ? "Pending" : "Join"}</span>
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowChallengeModal(true)}
                    className="py-3 border-2 border-primary text-primary rounded-[8px] font-black uppercase tracking-widest text-[8px] sm:text-[9px] flex items-center justify-center gap-1 sm:gap-2 hover:bg-primary hover:text-black transition-all px-1"
                  >
                    <Swords size={14} className="shrink-0" />
                    <span className="truncate">Challenge</span>
                  </Button>
                  <Button
                    onClick={() => navigate(`/messages?teamId=${id}`)}
                    className="py-3 bg-white/5 border border-white/10 rounded-[8px] text-white font-black uppercase tracking-widest text-[8px] sm:text-[9px] flex items-center justify-center gap-1 sm:gap-2 hover:bg-white/10 px-1"
                  >
                    <MessageCircle size={12} className="shrink-0" />
                    <span className="truncate">Chat</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  {/* Digital Pass QR Card */}
                  <div className="bg-gradient-to-br from-primary/10 to-transparent border border-white/5 rounded-[8px] p-4 flex flex-col items-center gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-xl rounded-full" />

                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Ticket size={12} className="text-primary" />
                        <span className="text-[7px] font-black uppercase tracking-widest">
                          Digital Team Pass
                        </span>
                      </div>
                      <Fingerprint size={12} className="text-white/20" />
                    </div>

                    <div className="relative w-28 h-28 bg-white border border-white/10 rounded-[8px] p-2 flex items-center justify-center group-hover:scale-[1.02] transition-transform overflow-hidden">
                      {team.qrCode ? (
                        <img
                          src={team.qrCode}
                          alt="Team QR Pass"
                          className="w-full h-full object-contain opacity-90 transition-transform"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-black/20">
                          <QrCode size={32} strokeWidth={1.5} />
                          <span className="text-[6px] font-black uppercase tracking-widest">
                            Generating...
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => navigate(`/team-pass/${id}`)}
                      className="w-full py-2 bg-primary/10 hover:bg-primary hover:text-black border border-primary/20 rounded-[8px] text-primary font-black uppercase tracking-widest text-[8px] flex items-center justify-center gap-1.5 transition-all"
                    >
                      View Full Pass
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => setShowScoringModal(true)}
                    className="py-3 bg-gradient-to-r from-primary to-primary text-black font-black uppercase tracking-widest text-[8px] sm:text-[9px] rounded-[8px] flex items-center justify-center gap-1 sm:gap-2 hover:brightness-110 shadow-lg shadow-[var(--primary)]/10 px-1"
                  >
                    <Play size={14} className="fill-black shrink-0" />
                    <span className="truncate">Score</span>
                  </Button>

                  <Button
                    onClick={() => setShowShareModal(true)}
                    className="py-3 bg-white/5 border border-white/10 rounded-[8px] text-white font-black uppercase tracking-widest text-[8px] sm:text-[9px] flex items-center justify-center gap-1 sm:gap-2 hover:bg-white/10 px-1"
                  >
                    <Share2 size={12} className="shrink-0" />
                    <span className="truncate">Share</span>
                  </Button>

                  <Link
                    to="/my-teams"
                    className="flex items-center justify-center gap-1 sm:gap-2 text-primary bg-primary/10 border border-primary/20 rounded-[8px] text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 group px-1 transition-all"
                  >
                    <span className="truncate">Dashboard</span>
                    <ArrowRight
                      size={10}
                      className="group-hover:translate-x-1 transition-transform shrink-0"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            {/* Active Squad */}
            <div className="bg-background border border-white/5 rounded-[8px] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2
                  className="text-lg font-black uppercase tracking-tight flex items-center gap-2"
                  style={HEADING_STYLE}
                >
                  Active Squad{" "}
                  <span className="text-gray-700 text-sm">
                    ({displayMembers.length})
                  </span>
                </h2>
                <Button
                  onClick={() => setShowSquadModal(true)}
                  className="text-[7px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 h-6 rounded-md border border-primary/20"
                >
                  View All
                </Button>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                {displayMembers.slice(0, 5).map((member, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.01] border border-white/5 rounded-[8px] p-3 flex flex-col items-center gap-2 group hover:border-primary/20 transition-all text-center"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full border-2 border-primary p-0.5 overflow-hidden">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                          {member.user?.profilePicture ? (
                            <img
                              src={member.user.profilePicture}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          ) : (
                            <Users size={16} className="text-gray-800" />
                          )}
                        </div>
                      </div>
                      {member.role === "CAPTAIN" && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-black flex items-center justify-center shadow-lg">
                          <Crown size={10} className="text-black" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-[10px] text-white uppercase truncate max-w-[90px]">
                        {member.user?.name || "Athlete"}
                      </h4>
                      <p className="text-[6px] font-black text-gray-600 uppercase tracking-widest">
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Scoring Matches */}
            {teamMatches && teamMatches.length > 0 && (
              <div className="bg-background border border-white/5 rounded-[8px] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2
                      className="text-lg font-black uppercase tracking-tight flex items-center gap-2"
                      style={HEADING_STYLE}
                    >
                      Active Scoring Matches{" "}
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_var(--destructive)] animate-pulse" />
                    </h2>
                    <p className="text-[7px] font-black text-gray-700 uppercase tracking-widest">
                      Real-time live scored matches
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamMatches.map((game) => {
                    const mappedMatch = {
                      _id: game.id,
                      status:
                        game.scoringStatus === "NOT_STARTED"
                          ? "SETUP"
                          : game.scoringStatus,
                      sportType: game.sportType || "Cricket",
                      matchName: game.name || game.title || "Scoring Match",
                      teamA: {
                        name:
                          game.teams?.find((t) => t.teamKey === "teamA")
                            ?.name || "TBD",
                        logo:
                          game.teams?.find((t) => t.teamKey === "teamA")
                            ?.image || null,
                      },
                      teamB: {
                        name:
                          game.teams?.find((t) => t.teamKey === "teamB")
                            ?.name || "TBD",
                        logo:
                          game.teams?.find((t) => t.teamKey === "teamB")
                            ?.image || null,
                      },
                      youtubeStreamUrl: game.youtubeStreamUrl || null,
                    };
                    return (
                      <ScoringMatchCard key={game.id} match={mappedMatch} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Match History */}
            <div className="bg-background border border-white/5 rounded-[8px] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2
                  className="text-lg font-black uppercase tracking-tight"
                  style={HEADING_STYLE}
                >
                  Match History
                </h2>
                <Button className="text-[7px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 h-6 rounded-md border border-primary/20">
                  Full History
                </Button>
              </div>

              <div className="overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-3 text-[8px] font-black text-gray-700 uppercase tracking-widest">
                        Date
                      </th>
                      <th className="pb-3 text-[8px] font-black text-gray-700 uppercase tracking-widest">
                        Opponent
                      </th>
                      <th className="pb-3 text-[8px] font-black text-gray-700 uppercase tracking-widest text-center">
                        Score
                      </th>
                      <th className="pb-3 text-[8px] font-black text-gray-700 uppercase tracking-widest text-center">
                        Res
                      </th>
                      <th className="pb-3 text-[8px] font-black text-gray-700 uppercase tracking-widest">
                        MVP
                      </th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      {
                        date: "05 May",
                        opp: "RG Titans",
                        score: "178-142",
                        res: "W",
                        mvp: "Prasenjeet",
                      },
                      {
                        date: "02 May",
                        opp: "Warriors XI",
                        score: "156-160",
                        res: "L",
                        mvp: "Manish Goud",
                        lost: true,
                      },
                    ].map((m, i) => (
                      <tr key={i} className="group">
                        <td className="py-3 text-[9px] font-bold text-gray-600 uppercase">
                          {m.date}
                        </td>
                        <td className="py-3 text-[10px] font-black text-white uppercase tracking-tight">
                          {m.opp}
                        </td>
                        <td className="py-3 text-center font-black text-white text-[10px]">
                          {m.score}
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`text-[9px] font-black ${m.lost ? "text-red-500" : "text-primary"}`}
                          >
                            {m.res}
                          </span>
                        </td>
                        <td className="py-3 text-[9px] font-black text-white/40 uppercase">
                          {m.mvp}
                        </td>
                        <td className="py-3 text-right">
                          <Play
                            size={8}
                            fill="currentColor"
                            className="text-white/20 group-hover:text-primary"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {/* Squad Modal */}
        {showSquadModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSquadModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-background border border-white/10 rounded-[8px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-background z-10">
                <div>
                  <h2
                    className="text-xl font-black text-white uppercase tracking-tighter"
                    style={HEADING_STYLE}
                  >
                    Full Squad Roster
                  </h2>
                  <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1">
                    {displayMembers.length} Official Members
                  </p>
                </div>
                <Button
                  onClick={() => setShowSquadModal(false)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                  {displayMembers.map((member, i) => (
                    <div
                      key={i}
                      className="bg-white/[0.02] border border-white/5 rounded-[8px] p-2 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 hover:border-primary/20 transition-all text-center"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-primary p-0.5 overflow-hidden">
                          <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                            {member.user?.profilePicture ? (
                              <img
                                src={member.user.profilePicture}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users size={16} className="text-gray-800 sm:w-5 sm:h-5" />
                            )}
                          </div>
                        </div>
                        {member.role === "CAPTAIN" && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full border-2 border-black flex items-center justify-center">
                            <Crown size={8} className="text-black sm:w-2.5 sm:h-2.5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-[8px] sm:text-[11px] text-white uppercase truncate max-w-[70px] sm:max-w-[100px]">
                          {member.user?.name || "Athlete"}
                        </h4>
                        <p className="text-[6px] sm:text-[7px] font-black text-gray-600 uppercase tracking-widest">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Challenge Modal */}
        {showChallengeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChallengeModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-background border border-white/10 rounded-[8px] p-6"
            >
              <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-4">
                Challenge Squad
              </h2>
              <div className="space-y-3">
                {myTeamsData?.teams
                  ?.filter((t) => t.sportType === team.sportType)
                  ?.map((t) => (
                    <Button
                      key={t._id}
                      onClick={() => setSelectedMyTeam(t._id)}
                      className={`w-full p-3 rounded-[8px] border transition-all flex items-center gap-3 text-left ${selectedMyTeam === t._id ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5"}`}
                    >
                      <p className="font-black uppercase text-[10px] text-white">
                        {t.name}
                      </p>
                    </Button>
                  ))}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowChallengeModal(false)}
                    className="flex-1 py-3 bg-white/5 rounded-[8px] text-white font-black uppercase text-[9px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChallenge}
                    className="flex-1 py-3 bg-primary rounded-[8px] text-black font-black uppercase text-[9px]"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm bg-background border border-white/10 rounded-[8px] p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto bg-white/5 border border-white/10 rounded-[8px] flex items-center justify-center mb-4">
                <Share2 size={24} className="text-primary" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
                Share Team
              </h2>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6">
                Invite players to join {team.name}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleShare}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-[8px] text-white font-black uppercase text-[10px] flex items-center justify-center gap-2 border border-white/5 transition-colors"
                >
                  <Share2 size={14} /> Native Share
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard!");
                    setShowShareModal(false);
                  }}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-[8px] text-white font-black uppercase text-[10px] flex items-center justify-center gap-2 border border-white/5 transition-colors"
                >
                  <Copy size={14} /> Copy Link
                </Button>
                <Button
                  onClick={() => {
                    const text = `Hey, join my team ${team.name}!\n\nLink: ${window.location.href}`;
                    navigate(
                      `/community?createPost=true&text=${encodeURIComponent(text)}`
                    );
                  }}
                  className="w-full py-3 bg-primary hover:brightness-110 rounded-[8px] text-black font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(191,243,103,0.2)]"
                >
                  <Users size={14} /> Post to Community
                </Button>
              </div>

              <Button
                onClick={() => setShowShareModal(false)}
                className="mt-6 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <StartScoringModal
        isOpen={showScoringModal}
        onClose={() => setShowScoringModal(false)}
      />
    </div>
  );
};

export default TeamProfile;
