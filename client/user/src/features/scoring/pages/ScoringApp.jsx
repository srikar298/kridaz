import * as Sentry from "@sentry/react";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Settings,
  History,
  Users,
  Zap,
  CheckCircle2,
  AlertCircle,
  Shield,
  User,
  Trophy,
  Play,
  Sparkles,
  X,
  Pause,
  FileText,
  TrendingUp,
  MapPin,
  Timer,
  Hash,
  Crosshair,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import useCricketScoring from "../hooks/useCricketScoring";
import BallByBallHistory from "../components/BallByBallHistory";
import InningsSetupModal from "../components/InningsSetupModal";
import WicketModal from "../components/WicketModal";
import ExtraRunsModal from "../components/ExtraRunsModal";
import SelectBowlerModal from "../components/SelectBowlerModal";
import TossModal from "../components/TossModal";
import { io } from "socket.io-client";
import axiosInstance from "@hooks/useAxiosInstance";
import ScoringPasswordModal from "../components/ScoringPasswordModal";
import CustomRunsModal from "../components/CustomRunsModal";
import TickerThemeStoreModal from "../components/TickerThemeStoreModal";
import VisualWagonWheelModal from "../components/VisualWagonWheelModal";
import PenaltyModal from "../components/PenaltyModal";
import EndMatchModal from "../components/EndMatchModal";
import MatchReportModal from "../components/MatchReportModal";
import MatchExitModal from "../components/MatchExitModal";
import cricketLoadingGif from "../../../assets/cricket-loading.gif";
import GlobalBackButton from "@/shared/components/GlobalBackButton";
import { Button, Input, Select } from "@kridaz/ui";


const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:6001";
/**
 * ScoringApp — The primary match scoring console.
 * Fully rebranded for the Scorer Portal with Teal Green (var(--success)) and Inter font.
 */

const THEME_COLOR = "var(--success)";

/* ─── Helpers ─── */
const ballColor = (ball) => {
  if (ball.isWicket)
    return "bg-red-500/20 text-red-500 border border-red-500/30";
  if (ball.isExtra)
    return "bg-success/20 text-success border border-success/30";
  if (ball.runs === 6)
    return "bg-success text-black shadow-[0_0_15px_rgba(0,193,135,0.4)]";
  if (ball.runs === 4) return "bg-success/80 text-black";
  if (ball.runs === 0)
    return "bg-white/5 text-neutral-600 border border-white/5";
  return "bg-white/10 text-white border border-white/10";
};

const ballLabel = (ball) => {
  if (ball.isWicket) return "W";
  if (ball.extraType === "WIDE") return "Wd";
  if (ball.extraType === "NO_BALL") return "Nb";
  return String(ball.runs ?? "-");
};

/* ─── Members Tab ─── */
function MembersTab({ matchData }) {
  const [teamTab, setTeamTab] = useState("teamA");
  const game = matchData?.hostedGameId;
  const teamA =
    game?.teamA ||
    matchData?.teamA ||
    (Array.isArray(game?.teams)
      ? game.teams.find((t) => t.teamKey === "teamA")
      : game?.teams?.teamA);
  const teamB =
    game?.teamB ||
    matchData?.teamB ||
    (Array.isArray(game?.teams)
      ? game.teams.find((t) => t.teamKey === "teamB")
      : game?.teams?.teamB);
  const activeTeam = teamTab === "teamA" ? teamA : teamB;

  const getBattingStats = (userId) => {
    const s = matchData?.playerStats?.find(
      (p) => p.userId === userId || p.userId?.toString() === userId?.toString()
    );
    if (
      !s ||
      (s.battingBalls === 0 &&
        s.battingRuns === 0 &&
        matchData?.strikerId !== userId &&
        matchData?.nonStrikerId !== userId)
    )
      return null;
    return {
      ...s,
      runs: s.battingRuns ?? 0,
      balls: s.battingBalls ?? 0,
    };
  };

  const getBowlingStats = (userId) => {
    const s = matchData?.playerStats?.find(
      (p) => p.userId === userId || p.userId?.toString() === userId?.toString()
    );
    if (!s || (s.bowlingBalls === 0 && matchData?.bowlerId !== userId))
      return null;
    return {
      ...s,
      runs: s.bowlingRuns ?? 0,
      wickets: s.bowlingWickets ?? 0,
    };
  };

  return (
    <div className="space-y-4 pb-4 font-inter">
      <div className="flex gap-2 bg-white/5 rounded-[8px] p-1.5 border border-white/5">
        {[
          ["teamA", teamA?.name || "TBD", teamA?.logo || teamA?.image],
          ["teamB", teamB?.name || "TBD", teamB?.logo || teamB?.image],
        ].map(([key, label, logo]) => (
          <Button
            key={key}
            onClick={() => setTeamTab(key)}
            className={`flex-1 py-2.5 rounded-[8px] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${teamTab === key ? "bg-success text-black shadow-lg" : "text-neutral-500 hover:text-white"}`}
          >
            {logo ? (
              <img
                src={logo}
                className="w-4 h-4 rounded-full object-cover"
                alt={label}
              />
            ) : null}
            {label}
          </Button>
        ))}
      </div>

      {activeTeam?.slots?.length > 0 ? (
        <div className="space-y-2.5">
          {activeTeam.slots.map((slot, i) => {
            const uid =
              slot.user?._id || slot.user?.id || slot.userId || slot.user;
            const bat = getBattingStats(uid);
            const bowl = getBowlingStats(uid);
            return (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-[8px] border border-white/5 hover:bg-white/[0.04] transition-all"
              >
                <div className="w-11 h-11 rounded-[8px] bg-success/10 border border-success/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {slot.user?.profilePicture ? (
                    <img
                      src={slot.user.profilePicture}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <User size={18} style={{ color: THEME_COLOR }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black uppercase tracking-tight text-white">
                    {slot.user?.name ||
                      slot.customPlayer?.name ||
                      `Player ${i + 1}`}
                  </p>
                  <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mt-0.5">
                    {slot.role || "Player"}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  {bat && (
                    <p
                      className="text-[11px] font-black"
                      style={{ color: THEME_COLOR }}
                    >
                      {bat.runs}({bat.balls}){" "}
                      <span className="text-[8px] text-neutral-600">BAT</span>
                    </p>
                  )}
                  {bowl && (
                    <p className="text-[11px] text-blue-400 font-black">
                      {bowl.wickets}/{bowl.runs}{" "}
                      <span className="text-[8px] text-neutral-600">BWL</span>
                    </p>
                  )}
                  {!bat && !bowl && (
                    <p className="text-[9px] text-neutral-700 font-black uppercase tracking-widest">
                      Inactive
                    </p>
                  )}
                </div>
                {slot.status === "JOINED" && (
                  <CheckCircle2
                    size={16}
                    style={{ color: THEME_COLOR }}
                    className="shrink-0"
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-white/[0.02] rounded-[8px] border border-dashed border-white/10">
          <Users size={40} className="mx-auto mb-4 text-neutral-800" />
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em]">
            Grid is empty
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── History Tab Wrapper ─── */
function HistoryTab({ matchData }) {
  return <BallByBallHistory matchData={matchData} />;
}

const ScoringApp = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  // @ts-ignore
  const { role } = useSelector((/** @type {any} */ state) => state.auth);

  const {
    matchData,
    loading,
    error,
    isMutating,
    recordBall,
    setPlayers,
    setToss,
    undoBall,
    completeMatch,
    updateMatchStatus,
    reviseTargetAndOvers,
    setMatchOfficials,
    substitutePlayer,
    useReview,
    setPowerplayOvers,
    toggleTimer,
    addPenalty,
    advanceToNextInnings,
    fetchMatchReport,
    refresh,
  } = useCricketScoring(matchId);

  const [activeTab, setActiveTab] = useState("scoring");
  const [showSettings, setShowSettings] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(false);

  // Timers
  const [localTimerSecs, setLocalTimerSecs] = useState(0);

  useEffect(() => {
    if (matchData?.timerState === "RUNNING") {
      const start = new Date(matchData.timerLastStartedAt).getTime();
      const initialDuration = matchData.totalDurationSeconds || 0;

      setLocalTimerSecs(
        initialDuration + Math.floor((Date.now() - start) / 1000)
      );

      const interval = setInterval(() => {
        setLocalTimerSecs(
          initialDuration + Math.floor((Date.now() - start) / 1000)
        );
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setLocalTimerSecs(matchData?.totalDurationSeconds || 0);
    }
  }, [
    matchData?.timerState,
    matchData?.timerLastStartedAt,
    matchData?.totalDurationSeconds,
  ]);

  const formatTimer = (secs) => {
    if (!secs || isNaN(secs)) return "00:00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const [liveUrls, setLiveUrls] = useState(null);
  const [passwordVerified, setPasswordVerified] = useState(
    sessionStorage.getItem(`scoringAuth_${matchId}`) === "true"
  );
  const [authAction, setAuthAction] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showCustomRunsModal, setShowCustomRunsModal] = useState(false);
  const [showMatchReport, setShowMatchReport] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [wagonWheelData, setWagonWheelData] = useState(null);
  const [showMatchActions, setShowMatchActions] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  const [isAiCommentaryEnabled, setIsAiCommentaryEnabled] = useState(false);
  const [commentaryVoice, setCommentaryVoice] = useState("alloy");
  const [commentaryLanguage, setCommentaryLanguage] = useState("en");
  const [commentaryStyle, setCommentaryStyle] = useState("professional");

  React.useEffect(() => {
    if (matchData?.hostedGameId) {
      setIsAiCommentaryEnabled(
        matchData.hostedGameId.isAiCommentaryEnabled || false
      );
      setCommentaryVoice(matchData.hostedGameId.commentaryVoice || "alloy");
      setCommentaryLanguage(matchData.hostedGameId.commentaryLanguage || "en");
      setCommentaryStyle(
        matchData.hostedGameId.commentaryStyle || "professional"
      );
    }
  }, [matchData?.hostedGameId]);

  const [scoringLock, setScoringLock] = useState("PENDING"); // 'PENDING' | 'GRANTED' | 'DENIED'

  React.useEffect(() => {
    if (!passwordVerified) return; // Wait until password verified

    const scorerToken = localStorage.getItem(`scorer_token_${matchId}`);

    // Connect to socket
    const socket = io(API_BASE, {
      auth: { token: scorerToken },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      socket.emit("scoring:acquire_lock", { matchId });
    });

    socket.on("scoring:lock_granted", () => {
      setScoringLock("GRANTED");
    });

    socket.on("scoring:lock_denied", () => {
      setScoringLock("DENIED");
    });

    socket.on("scoring:lock_released", () => {
      // Someone released it, try to acquire it again
      socket.emit("scoring:acquire_lock", { matchId });
    });

    const speakBrowserTTS = (text, lang) => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const langMap = {
          hi: "hi-IN",
          en: "en-US",
          pa: "pa-IN",
          bn: "bn-IN",
          mr: "mr-IN",
          ta: "ta-IN",
          te: "te-IN",
          gu: "gu-IN",
        };
        utterance.lang = langMap[lang] || "en-US";
        window.speechSynthesis.speak(utterance);
      }
    };

    socket.on("COMMENTARY_AUDIO_READY", (data) => {
      if (data.audioUrl) {
        const audio = new Audio(`${API_BASE}${data.audioUrl}`);
        audio.play().catch((e) => {
          console.warn(
            "ScoringApp audio play failed, falling back to Browser TTS",
            e
          );
          speakBrowserTTS(data.text, data.language);
        });
      } else {
        speakBrowserTTS(data.text, data.language);
      }
    });

    return () => {
      socket.off("COMMENTARY_AUDIO_READY");
      socket.emit("scoring:release_lock", { matchId });
      socket.disconnect();
    };
  }, [matchId, passwordVerified]);

  React.useEffect(() => {
    if (!passwordVerified || !matchId) return;
    const hostedGame = matchData?.hostedGameId;
    if (!hostedGame) return;
    if (hostedGame.isLive) {
      if (!liveEnabled) {
        setLiveEnabled(true);
        const appBase =
          import.meta["env"]?.VITE_APP_URL || window.location.origin;
        setLiveUrls({
          obsOverlay: `${appBase}/live-overlay/${matchId}?token=${hostedGame.overlayToken || ""}`,
          publicScoreboard: `${appBase}/analytics/${hostedGame.shortId || matchId}`,
        });
      }
    } else {
      if (liveEnabled || window.autoGoLiveAttempted) return;
      window.autoGoLiveAttempted = true;
      const autoGoLive = async () => {
        try {
          const apiBase =
            import.meta.env.VITE_API_URL || "http://localhost:6001";
          const response = await axiosInstance.post(
            `/api/scoring/${matchId}/go-live`,
            {},
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(`scorer_token_${matchId}`) || ""}`,
              },
            }
          );
          const data = response.data;
          if (data.success) {
            setLiveEnabled(true);
            const appBase =
              import.meta["env"]?.VITE_APP_URL || window.location.origin;
            setLiveUrls({
              obsOverlay: `${appBase}/live-overlay/${matchId}?token=${data.overlayToken || data.urls?.overlayToken || ""}`,
              publicScoreboard: `${appBase}/analytics/${hostedGame?.shortId || matchId}`,
            });
            refresh();
          }
        } catch (err) {
          Sentry.captureException(err);
        }
      };
      autoGoLive();
    }
  }, [
    matchData?.hostedGameId?.isLive,
    liveEnabled,
    matchId,
    passwordVerified,
    refresh,
  ]);

  React.useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "STREAM_KEYS_READY" && e.data?.matchId === matchId) {
        toast.success("Stream is ready! Start broadcasting now.");
        refresh();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [matchId, refresh]);

  const [showInningsSetup, setShowInningsSetup] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showTossModal, setShowTossModal] = useState(false);
  const [matchStarting, setMatchStarting] = useState(false);
  const [showThemeStore, setShowThemeStore] = useState(false);
  const [extraModal, setExtraModal] = useState(null);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [isWagonWheelEnabled, setIsWagonWheelEnabled] = useState(true);

  const processRuns = (runData) => {
    if (isWagonWheelEnabled) {
      setWagonWheelData(runData);
    } else {
      handleScore({ ...runData, extraType: "NONE" });
    }
  };
  const score = (() => {
    const innings = matchData?.innings || [];
    const current =
      innings[matchData?.currentInningsIndex ?? innings.length - 1];
    if (!current)
      return { totalRuns: 0, totalWickets: 0, overs: 0, balls: 0, crr: "0.00" };
    const totalRuns = current.totalRuns ?? 0;
    const totalWickets = current.totalWickets ?? 0;
    const totalBalls = current.totalBalls ?? 0;
    const overs = Math.floor(totalBalls / 6);
    const balls = totalBalls % 6;
    const crr =
      totalBalls > 0 ? ((totalRuns / totalBalls) * 6).toFixed(2) : "0.00";
    return { totalRuns, totalWickets, overs, balls, crr };
  })();

  const getTeamSlots = (teamKey) => {
    const game = matchData?.hostedGameId;
    const team =
      game?.[teamKey] ||
      matchData?.[teamKey] ||
      (Array.isArray(game?.teams)
        ? game.teams.find((t) => t.teamKey === teamKey)
        : game?.teams?.[teamKey]);
    Sentry.addBreadcrumb({
      message: JSON.stringify([
        `[getTeamSlots] teamKey=${teamKey}`,
        { game, team, slots: team?.slots },
      ]),
    });
    return (team?.slots || [])
      .map((s) => ({
        userId:
          s.user?._id ||
          s.user?.id ||
          s.userId ||
          s.user ||
          s.customPlayerId ||
          s.id,
        name: s.user?.name || s.customPlayer?.name || "Player",
        role: s.role,
      }))
      .filter((p) => p.userId);
  };

  const getTeamInfo = (teamKey) => {
    const game = matchData?.hostedGameId || matchData;
    const team =
      game?.[teamKey] ||
      (Array.isArray(game?.teams)
        ? game.teams.find((t) => t.teamKey === teamKey)
        : game?.teams?.[teamKey]);
    return {
      name: team?.name || (teamKey === "teamA" ? "Team A" : "Team B"),
      logo: team?.image || team?.logo || null,
    };
  };

  const currentInnings =
    matchData?.innings?.[matchData?.currentInningsIndex ?? 0];
  const battingTeamKey = currentInnings?.battingTeam || "teamA";
  const bowlingTeamKey = battingTeamKey === "teamA" ? "teamB" : "teamA";
  const battingSlots = getTeamSlots(battingTeamKey);
  const bowlingSlots = getTeamSlots(bowlingTeamKey);
  const battingTeamInfo = getTeamInfo(battingTeamKey);
  const bowlingTeamInfo = getTeamInfo(bowlingTeamKey);

  const strikerStats = (() => {
    const s = matchData?.playerStats?.find(
      (p) =>
        p.userId === matchData?.strikerId ||
        p.userId?.toString() === matchData?.strikerId?.toString()
    );
    if (!s) return { runs: 0, balls: 0 };
    return {
      ...s,
      runs: s.battingRuns ?? 0,
      balls: s.battingBalls ?? 0,
    };
  })();
  const nonStrikerStats = (() => {
    const s = matchData?.playerStats?.find(
      (p) =>
        p.userId === matchData?.nonStrikerId ||
        p.userId?.toString() === matchData?.nonStrikerId?.toString()
    );
    if (!s) return { runs: 0, balls: 0 };
    return {
      ...s,
      runs: s.battingRuns ?? 0,
      balls: s.battingBalls ?? 0,
    };
  })();
  const bowlerStats = (() => {
    const s = matchData?.playerStats?.find(
      (p) =>
        p.userId === matchData?.bowlerId ||
        p.userId?.toString() === matchData?.bowlerId?.toString()
    );
    if (!s) return { wickets: 0, runs: 0, overs: 0, balls: 0 };
    return {
      ...s,
      runs: s.bowlingRuns ?? 0,
      wickets: s.bowlingWickets ?? 0,
      overs: Math.floor((s.bowlingBalls || 0) / 6),
      balls: (s.bowlingBalls || 0) % 6,
    };
  })();
  const strikerSlot = battingSlots.find(
    (p) =>
      p.userId === matchData?.strikerId?.toString?.() ||
      p.userId === matchData?.strikerId
  );
  const nonStrikerSlot = battingSlots.find(
    (p) =>
      p.userId === matchData?.nonStrikerId?.toString?.() ||
      p.userId === matchData?.nonStrikerId
  );
  const bowlerSlot = bowlingSlots.find(
    (p) =>
      p.userId === matchData?.bowlerId?.toString?.() ||
      p.userId === matchData?.bowlerId
  );

  const outBatterIds = new Set(
    (matchData?.playerStats || [])
      .filter((b) => b.outStatus && b.outStatus !== "NOT_OUT")
      .map((b) => b.userId?.toString?.() || b.userId)
  );
  const remainingBatters = battingSlots.filter(
    (p) =>
      p.userId !== matchData?.strikerId?.toString?.() &&
      p.userId !== matchData?.nonStrikerId?.toString?.() &&
      !outBatterIds.has(p.userId)
  );

  const needsInningsSetup =
    (matchData?.id || matchData?._id) &&
    matchData?.innings?.length > 0 &&
    !matchData?.strikerId;
  const needsMatchStart = !matchData?.id && !matchData?._id;

  const isFirstInnings = matchData?.currentInningsIndex === 0;
  const isSecondInnings = matchData?.currentInningsIndex === 1;
  const oversPerInnings =
    matchData?.oversPerInnings ||
    matchData?.hostedGameId?.oversPerInnings ||
    20;
  const maxBalls = oversPerInnings * 6;

  const isInningsComplete =
    currentInnings &&
    (currentInnings.isCompleted ||
      currentInnings.totalWickets >= 10 ||
      currentInnings.totalBalls >= maxBalls ||
      (isSecondInnings &&
        currentInnings.totalRuns >
          (matchData?.innings?.[0]?.totalRuns || 9999)));

  const isFirstInningsComplete = isFirstInnings && isInningsComplete;

  const [showInningsCompleteModal, setShowInningsCompleteModal] =
    useState(false);
  const [isSuperOver, setIsSuperOver] = useState(false);
  const [isFollowOn, setIsFollowOn] = useState(false);
  const [hasAutoPausedTimer, setHasAutoPausedTimer] = useState(false);

  useEffect(() => {
    if (isInningsComplete && isFirstInnings && !needsInningsSetup) {
      if (!showInningsCompleteModal) {
        setShowInningsCompleteModal(true);
        toast("Innings Complete! Timer automatically paused.", { icon: "⏸️" });
      }
    }
  }, [
    isInningsComplete,
    isFirstInnings,
    needsInningsSetup,
    showInningsCompleteModal,
  ]);
  const hasPassword = !!(
    matchData?.hostedGameId?.scoringPassword || matchData?.scoringPassword
  );
  const isLocked = hasPassword && !passwordVerified && !needsMatchStart;

  // isLocked is now handled as an overlay in the return statement below

  const checkTimerActive = () => {
    if (matchData?.timerState === "PAUSED") {
      toast.error("Match is paused. Resume the timer to continue scoring.");
      return false;
    }
    return true;
  };

  const handleScore = async (payload) => {
    if (isMutating) return { success: false, message: "Action in progress" };
    if (!checkTimerActive())
      return { success: false, message: "Match is paused" };
    if (!matchData?.strikerId || !matchData?.bowlerId) {
      toast.error("Please select the batsmen and bowler first.");
      return { success: false, message: "Missing players" };
    }
    const fullPayload = {
      ...payload,
      batsmanId: matchData.strikerId,
      bowlerId: matchData.bowlerId,
    };
    const result = await recordBall(fullPayload);
    if (!result.success) {
      toast.error("Something went wrong. Please try again.");
    }
    if (result.success && result.overComplete) {
      setShowBowlerModal(true);
    }
    return result;
  };

  const handleScoringClick = (callback) => {
    if (isMutating) {
      toast.error("Please wait, processing your last action.");
      return;
    }
    if (!checkTimerActive()) return;
    callback();
  };

  if (scoringLock === "PENDING" && passwordVerified)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-inter">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-success/20 border-t-[var(--success)] rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-[13px] font-black uppercase tracking-widest text-success">
            Acquiring Scoring Lock
          </h2>
        </div>
      </div>
    );

  if (scoringLock === "DENIED")
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center font-inter z-50">
        <Shield
          style={{ color: THEME_COLOR }}
          className="mb-6 opacity-80"
          size={56}
        />
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">
          Scoring Locked
        </h2>
        <p className="text-[13px] text-neutral-400 font-medium mb-8 max-w-sm">
          Someone else is currently scoring this game. Please wait until they
          leave to gain access.
        </p>
        <div className="flex items-center gap-3 bg-success/10 border border-success/20 px-6 py-4 rounded-[8px]">
          <div className="w-4 h-4 border-2 border-success/30 border-t-[var(--success)] rounded-full animate-spin" />
          <span className="text-[11px] font-black uppercase tracking-widest text-success">
            Waiting in queue...
          </span>
        </div>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center font-inter">
        <img
          src={cricketLoadingGif}
          alt="Loading match..."
          className="w-32 h-32 object-contain"
        />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center font-inter">
        <AlertCircle
          style={{ color: THEME_COLOR }}
          className="mb-6"
          size={56}
        />
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">
          Sync Interrupted
        </h2>
        <GlobalBackButton />
      </div>
    );

  const renderContent = () => {
    switch (activeTab) {
      case "members":
        return <MembersTab matchData={matchData} />;
      case "history":
        return <HistoryTab matchData={matchData} />;
      default:
        return (
          <div className="font-inter flex-1 flex flex-col mt-0">
            {matchData?.timerState === "PAUSED" && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-[8px] flex items-center gap-3.5 shadow-lg animate-pulse">
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
                    Match is Paused
                  </p>
                  <p className="text-xs text-neutral-400 font-medium mt-0.5">
                    Resume the timer in the header to record deliveries and
                    runs.
                  </p>
                </div>
              </div>
            )}

            {matchData?.slowOverRateConfig?.enabled &&
              score.overs === oversPerInnings - 1 && (
                <div className="p-4 mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-[8px] flex items-center gap-3.5 shadow-lg">
                  <AlertCircle className="text-yellow-500 shrink-0" size={20} />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500">
                      Slow Over-Rate Penalty Check
                    </p>
                    <p className="text-xs text-neutral-400 font-medium mt-0.5">
                      If the bowling team is behind schedule, 1 extra fielder
                      must be brought inside the 30-yard circle for this final
                      over.
                    </p>
                  </div>
                </div>
              )}

            {needsInningsSetup &&
              !needsMatchStart &&
              !isFirstInningsComplete && (
                <Button
                  onClick={() => setShowInningsSetup(true)}
                  className="w-full py-5 bg-success/10 border border-success/30 rounded-[8px] text-center text-success text-[11px] font-black uppercase tracking-[0.2em] animate-pulse shadow-xl"
                >
                  ⚡ Setup Next Pair & Bowler
                </Button>
              )}

            {isFirstInningsComplete && (
              <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[8px] space-y-6 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 blur-3xl pointer-events-none" />
                <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-[8px] flex items-center justify-center mx-auto shadow-lg">
                  <Trophy size={28} style={{ color: THEME_COLOR }} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">
                    Innings Break
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-black uppercase tracking-widest mt-2">
                    Target:{" "}
                    <span style={{ color: THEME_COLOR }}>
                      {(currentInnings?.totalRuns || 0) + 1}
                    </span>{" "}
                    runs
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const response = await axiosInstance.post(
                        `/api/scoring/next-innings`,
                        {
                          scoringId: matchData._id,
                          battingTeamId:
                            matchData.innings[0].battingTeam === "teamA"
                              ? "teamB"
                              : "teamA",
                        },
                        {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem(`scorer_token_${matchId}`) || ""}`,
                          },
                        }
                      );
                      const data = response.data;
                      if (data.success) {
                        toast.success("2nd innings is starting!");
                        refresh();
                        setShowInningsSetup(true);
                      } else {
                        toast.error(
                          "Could not start the next innings. Try again."
                        );
                      }
                    } catch (err) {
                      toast.error(
                        "Connection issue. Please check your network."
                      );
                    }
                  }}
                  className="w-full py-5 rounded-[8px] font-black uppercase text-[11px] tracking-[0.2em] transition-all transform active:scale-95 shadow-xl"
                  style={{
                    backgroundColor: THEME_COLOR,
                    color: "#000",
                    boxShadow: `0 10px 30px ${THEME_COLOR}33`,
                  }}
                >
                  Start 2nd Innings
                </Button>
              </div>
            )}

            {!needsMatchStart &&
              !needsInningsSetup &&
              !isFirstInningsComplete && (
                <div
                  className={`-mx-4 flex-1 flex flex-col ${matchData?.timerState === "PAUSED" ? "opacity-50" : ""} mt-0`}
                >
                  <div className="flex justify-between flex-1 min-h-[171px] gap-0">
                    {/* Col 1 */}
                    <div className="flex flex-col gap-0 w-[25%]">
                      {[0, 3].map((run) => (
                        <Button
                          key={run}
                          onClick={() =>
                            handleScoringClick(() => {
                              run === 0
                                ? handleScore({ runs: run, extraType: "NONE" })
                                : processRuns({
                                    runs: run,
                                    isBoundary: false,
                                    isFour: false,
                                    isSix: false,
                                  });
                            })
                          }
                          style={{ backdropFilter: "blur(6px)" }}
                          className="flex-1 bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center text-white hover:bg-white/10 transition-all transform active:scale-95"
                        >
                          <span
                            style={{
                              fontFamily: '"Anton", sans-serif',
                              fontSize: "32px",
                              letterSpacing: "1.6px",
                            }}
                          >
                            {run}
                          </span>
                        </Button>
                      ))}
                    </div>

                    {/* Col 2 */}
                    <div className="flex flex-col gap-0 w-[25%]">
                      <Button
                        onClick={() =>
                          handleScoringClick(() => {
                            processRuns({
                              runs: 1,
                              isBoundary: false,
                              isFour: false,
                              isSix: false,
                            });
                          })
                        }
                        style={{ backdropFilter: "blur(6px)" }}
                        className="flex-1 bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center text-white hover:bg-white/10 transition-all transform active:scale-95"
                      >
                        <span
                          style={{
                            fontFamily: '"Anton", sans-serif',
                            fontSize: "32px",
                            letterSpacing: "1.6px",
                          }}
                        >
                          1
                        </span>
                      </Button>
                      <Button
                        onClick={() =>
                          handleScoringClick(() => {
                            processRuns({
                              runs: 4,
                              isBoundary: true,
                              isFour: true,
                              isSix: false,
                            });
                          })
                        }
                        style={{ backdropFilter: "blur(6px)" }}
                        className="flex-1 bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center text-white hover:bg-white/10 transition-all transform active:scale-95"
                      >
                        <span
                          style={{
                            fontFamily: '"Anton", sans-serif',
                            fontSize: "32px",
                            letterSpacing: "1.6px",
                          }}
                        >
                          4
                        </span>
                      </Button>
                    </div>

                    {/* Col 3 */}
                    <div className="flex flex-col gap-0 w-[25%]">
                      <Button
                        onClick={() =>
                          handleScoringClick(() => {
                            processRuns({
                              runs: 2,
                              isBoundary: false,
                              isFour: false,
                              isSix: false,
                            });
                          })
                        }
                        style={{ backdropFilter: "blur(6px)" }}
                        className="flex-1 bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center text-white hover:bg-white/10 transition-all transform active:scale-95"
                      >
                        <span
                          style={{
                            fontFamily: '"Anton", sans-serif',
                            fontSize: "32px",
                            letterSpacing: "1.6px",
                          }}
                        >
                          2
                        </span>
                      </Button>
                      <Button
                        onClick={() =>
                          handleScoringClick(() => {
                            processRuns({
                              runs: 6,
                              isBoundary: true,
                              isFour: false,
                              isSix: true,
                            });
                          })
                        }
                        style={{ backdropFilter: "blur(6px)" }}
                        className="flex-1 bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center text-white hover:bg-white/10 transition-all transform active:scale-95"
                      >
                        <span
                          style={{
                            fontFamily: '"Anton", sans-serif',
                            fontSize: "32px",
                            letterSpacing: "1.6px",
                          }}
                        >
                          6
                        </span>
                      </Button>
                    </div>

                    {/* Col 4 */}
                    <div className="flex flex-col gap-0 w-[25%]">
                      <Button
                        disabled={isMutating}
                        onClick={() =>
                          handleScoringClick(async () => {
                            setIsUndoing(true);
                            const result = await undoBall();
                            setIsUndoing(false);
                            if (result.success)
                              toast.success("Last ball undone!");
                            else
                              toast.error("Unable to undo. Please try again.");
                          })
                        }
                        className="flex-[3] bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center hover:bg-white/10 transition-all transform active:scale-95 disabled:opacity-50"
                      >
                        {isUndoing ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-[var(--success)] rounded-full animate-spin" />
                        ) : (
                          <span className="text-white font-inter font-semibold uppercase tracking-widest text-[16px]">
                            UNDO
                          </span>
                        )}
                      </Button>
                      <Button
                        onClick={() =>
                          handleScoringClick(() => setShowWicketModal(true))
                        }
                        className="flex-[2] bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center hover:bg-white/10 transition-all transform active:scale-95"
                      >
                        <span className="text-[#F40000] font-inter font-semibold uppercase tracking-widest text-[18px]">
                          OUT
                        </span>
                      </Button>
                      <Button
                        onClick={() =>
                          handleScoringClick(() => setShowCustomRunsModal(true))
                        }
                        className="flex-[2] bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center hover:bg-white/10 transition-all transform active:scale-95"
                      >
                        <span className="text-white font-inter font-semibold uppercase tracking-wider text-[13px]">
                          CUSTOM
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Bottom Row Extras */}
                  <div className="flex h-[46px] gap-0 mt-0">
                    <Button
                      onClick={() =>
                        handleScoringClick(() => setExtraModal("WIDE"))
                      }
                      className="flex-1 bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center hover:bg-white/10 transition-all transform active:scale-95"
                    >
                      <span className="text-success font-inter font-semibold uppercase tracking-widest text-[15px]">
                        WIDE
                      </span>
                    </Button>
                    <Button
                      onClick={() =>
                        handleScoringClick(() => setExtraModal("NO_BALL"))
                      }
                      className="flex-1 bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center hover:bg-white/10 transition-all transform active:scale-95"
                    >
                      <span className="text-success font-inter font-semibold uppercase tracking-widest text-[16px]">
                        NB
                      </span>
                    </Button>
                    <Button
                      onClick={() =>
                        handleScoringClick(() => setExtraModal("BYE"))
                      }
                      className="flex-1 bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center hover:bg-white/10 transition-all transform active:scale-95"
                    >
                      <span className="text-white font-inter font-semibold uppercase tracking-widest text-[16px]">
                        BYE
                      </span>
                    </Button>
                    <Button
                      onClick={() =>
                        handleScoringClick(() => setExtraModal("LEG_BYE"))
                      }
                      className="flex-1 bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center hover:bg-white/10 transition-all transform active:scale-95"
                    >
                      <span className="text-white font-inter font-semibold uppercase tracking-wider text-[13px]">
                        LEG BYE
                      </span>
                    </Button>
                    <Button
                      onClick={() =>
                        handleScoringClick(async () => {
                          const result = await handleScore({ runs: 0, isDeadBall: true, extraType: "NONE" });
                          if (result.success) {
                            toast.success("Dead Ball recorded!");
                          }
                        })
                      }
                      className="flex-1 bg-white/[0.05] border border-white/10 rounded-none flex items-center justify-center hover:bg-white/10 transition-all transform active:scale-95"
                    >
                      <span className="text-yellow-400 font-inter font-semibold uppercase tracking-widest text-[13px]">
                        DEAD
                      </span>
                    </Button>
                  </div>
                </div>
              )}
          </div>
        );
    }
  };

  return (
    <div
      className="min-h-[100dvh] bg-card flex justify-center text-white selection:bg-success selection:text-black overflow-hidden"
      style={{ fontFamily: "'Open Sans', sans-serif" }}
    >
      {isLocked && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <ScoringPasswordModal
            matchId={matchId}
            onSuccess={(token) => {
              localStorage.setItem(`scorer_token_${matchId}`, token);
              setPasswordVerified(true);
            }}
            actionLabel="Unlock Scoring Console"
          />
        </div>
      )}
      <div
        className={`w-full max-w-[450px] bg-black h-[100dvh] relative flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-white/5 overflow-hidden ${isLocked ? "blur-sm pointer-events-none" : ""}`}
      >
        {/* Match Starting Loading Overlay — lives in PARENT so it persists across TossModal unmount */}
        {matchStarting && (
          <div className="absolute inset-0 z-[200] bg-card flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 rounded-full border-4 border-[#7bf090]/20 border-t-[#7bf090] animate-spin" />
            <div className="text-center">
              <h2
                className="text-[22px] font-black text-white uppercase tracking-wider mb-2"
                style={{ fontFamily: "Anton, sans-serif" }}
              >
                STARTING MATCH
              </h2>
              <p className="text-[12px] text-[#bdcaba] tracking-widest uppercase">
                Preparing the scoring console...
              </p>
            </div>
          </div>
        )}

        {needsMatchStart ? (
          (() => {
            const game = matchData?.hostedGameId || matchData;
            const tA =
              game?.teamA ||
              (Array.isArray(game?.teams)
                ? game?.teams?.find((t) => t.teamKey === "teamA")
                : game?.teams?.teamA);
            const tB =
              game?.teamB ||
              (Array.isArray(game?.teams)
                ? game?.teams?.find((t) => t.teamKey === "teamB")
                : game?.teams?.teamB);
            const tAName = tA?.name || "TEAM A";
            const tBName = tB?.name || "TEAM B";
            const locationName =
              game?.venue?.name ||
              game?.customVenue ||
              game?.location ||
              "Location Not Provided";

            return (
              <div className="flex-1 flex flex-col p-4 bg-card relative overflow-y-auto no-scrollbar">
                <div className="mt-4 border-t border-white/5 pt-4 flex-1 flex flex-col">
                  <TossModal
                    teamA={
                      matchData?.teamA ||
                      matchData?.hostedGameId?.teamA ||
                      (Array.isArray(matchData?.hostedGameId?.teams)
                        ? matchData.hostedGameId.teams.find(
                            (t) => t.teamKey === "teamA"
                          )
                        : null)
                    }
                    teamB={
                      matchData?.teamB ||
                      matchData?.hostedGameId?.teamB ||
                      (Array.isArray(matchData?.hostedGameId?.teams)
                        ? matchData.hostedGameId.teams.find(
                            (t) => t.teamKey === "teamB"
                          )
                        : null)
                    }
                    hasPassword={hasPassword && !passwordVerified}
                    onCancel={() => window.history.back()}
                    onConfirm={async ({ winnerTeam, decision, password }) => {
                      // If a password was provided, verify it first or store it
                      if (password) {
                        try {
                          const authRes = await axiosInstance.post(
                            `/api/scoring/auth/${matchId}`,
                            { password }
                          );
                          if (authRes.data.success) {
                            localStorage.setItem(
                              `scorer_token_${matchId}`,
                              authRes.data.token
                            );
                            setPasswordVerified(true);
                          } else {
                            return toast.error(
                              "Wrong password. Please try again."
                            );
                          }
                        } catch (e) {
                          return toast.error(
                            "Could not verify password. Try again."
                          );
                        }
                      }

                      // Show loading overlay BEFORE any API call
                      setMatchStarting(true);

                      try {
                        // Determine batting team
                        const isTeamAWinner =
                          winnerTeam ===
                          (matchData?.teamA?.id ||
                            matchData?.hostedGameId?.teamA?.id);
                        let battingTeam = "teamA";
                        if (
                          (isTeamAWinner && decision === "BAT") ||
                          (!isTeamAWinner && decision === "BOWL")
                        ) {
                          battingTeam = "teamA";
                        } else {
                          battingTeam = "teamB";
                        }

                        const response = await axiosInstance.post(
                          `/api/scoring/start`,
                          {
                            matchId:
                              matchData._id ||
                              matchData.id ||
                              matchData.hostedGameId?.id,
                            battingTeam,
                            tossWinner: winnerTeam,
                            tossDecision: decision,
                          },
                          {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem(`scorer_token_${matchId}`) || ""}`,
                            },
                          }
                        );
                        const data = response.data;
                        if (data.success) {
                          toast.success("Match is live! Let's go 🏏");
                          await refresh();
                          // matchStarting will auto-clear when needsMatchStart becomes false
                          setMatchStarting(false);
                        } else {
                          toast.error(
                            "Could not start match. Please try again."
                          );
                          setMatchStarting(false);
                        }
                      } catch (e) {
                        toast.error("Connection issue. Please try again.");
                        setMatchStarting(false);
                      }
                    }}
                  />
                </div>
              </div>
            );
          })()
        ) : (
          <>
            <div className="flex-1 relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ y: "20%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-10%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-0 overflow-y-auto p-4 pb-0 flex flex-col no-scrollbar"
                >
                  {activeTab === "scoring" && (
                    <>
                      {/* Score Display */}
                      <div
                        className="relative -mx-4 -mt-4 h-[439px] flex flex-col justify-end pb-8 bg-cover bg-center rounded-none overflow-hidden shadow-2xl"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(18,18,18,0.2) 0%, rgba(18,18,18,1) 100%), url('/3d_stadium.webp')`,
                        }}
                      >
                        <div className="absolute top-4 left-4 z-50">
                          <Button
                            onClick={() => setShowExitModal(true)}
                            className="p-2 transition-all opacity-80 hover:opacity-100 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center w-10 h-10"
                          >
                            <ChevronLeft size={24} className="text-white" />
                          </Button>
                        </div>
                        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                          {/* Timer Display */}
                          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full border border-white/10 px-2.5 py-1.5 h-10 shadow-lg text-xs font-mono font-bold text-white shrink-0">
                            <span>{formatTimer(localTimerSecs)}</span>
                            <Button
                              onClick={async () => {
                                await toggleTimer();
                              }}
                              className="w-6 h-6 rounded-full flex items-center justify-center transition-all bg-white/10 hover:bg-white/20 active:scale-95"
                            >
                              {matchData?.timerState === "RUNNING" ? (
                                <Pause
                                  size={10}
                                  fill="currentColor"
                                  className="text-success"
                                />
                              ) : (
                                <Play
                                  size={10}
                                  fill="currentColor"
                                  className="text-yellow-500 ml-0.5"
                                />
                              )}
                            </Button>
                          </div>

                          <Button
                            onClick={() => {
                              const shareUrl = `${window.location.origin}/analytics/${matchData?.hostedGameId?.shortId || matchId}`;
                              if (navigator.share) {
                                navigator
                                  .share({
                                    title: "Live Match Scoring",
                                    text: `Follow the live score of the match: ${matchData?.hostedGameId?.name || "Match"}`,
                                    url: shareUrl,
                                  })
                                  .catch((err) => Sentry.captureException(err));
                              } else {
                                navigator.clipboard.writeText(shareUrl);
                                toast.success("Live score link copied!");
                              }
                            }}
                            className="p-2 transition-all opacity-80 hover:opacity-100 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center w-10 h-10"
                          >
                            <Share2 size={20} className="text-white" />
                          </Button>
                          <Button
                            onClick={() => setShowSettings(true)}
                            className="p-2 transition-all opacity-80 hover:opacity-100 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center w-10 h-10"
                          >
                            <Settings size={20} className="text-white" />
                          </Button>
                        </div>
                        <div className="px-6 flex justify-between items-end">
                          {/* Score */}
                          <div className="flex items-baseline">
                            <span
                              className="text-[120px] leading-[0.8] text-white"
                              style={{
                                fontFamily: '"Bebas Neue", Anton, sans-serif',
                              }}
                            >
                              {score.totalRuns}
                            </span>
                            <span
                              className="text-[85px] leading-[0.8] text-neutral-400"
                              style={{
                                fontFamily: '"Bebas Neue", Anton, sans-serif',
                              }}
                            >
                              /{score.totalWickets}
                            </span>
                          </div>

                          {/* CRR and Overs */}
                          <div className="flex flex-col gap-2 pb-2 text-right">
                            <div className="flex items-end justify-end gap-3">
                              <span
                                className="text-[13px] opacity-70 tracking-wider text-white"
                                style={{ fontFamily: '"Poppins", sans-serif' }}
                              >
                                CRR
                              </span>
                              <span
                                className="text-[21px] leading-none text-white"
                                style={{
                                  fontFamily: '"Bebas Neue", Anton, sans-serif',
                                }}
                              >
                                {score.crr}
                              </span>
                            </div>
                            <div className="flex items-end justify-end gap-3">
                              <span
                                className="text-[13px] opacity-70 tracking-wider text-white"
                                style={{ fontFamily: '"Poppins", sans-serif' }}
                              >
                                OVERS
                              </span>
                              <span
                                className="text-[21px] leading-none text-white"
                                style={{
                                  fontFamily: '"Bebas Neue", Anton, sans-serif',
                                }}
                              >
                                {score.overs}.{score.balls}/
                                {matchData?.overs || 20}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 mt-8 space-y-6">
                          {/* Bowler Row */}
                          <div className="w-full bg-[#4C4C4C]/50 rounded-[8px] p-3.5 flex items-center justify-between backdrop-blur-md">
                            <div>
                              <p
                                className="text-[9px] tracking-[3px] opacity-60 text-white"
                                style={{ fontFamily: '"Poppins", sans-serif' }}
                              >
                                BALLING
                              </p>
                              <p
                                className="text-[13px] font-medium opacity-90 text-white mt-1 uppercase truncate max-w-[150px]"
                                style={{ fontFamily: '"Poppins", sans-serif' }}
                              >
                                {bowlerSlot?.name?.split(" ")[0] || "NAME"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-[5px] -ml-[5px] overflow-x-auto no-scrollbar max-w-[220px] sm:max-w-[260px]">
                              {(
                                matchData?.timeline?.filter(
                                  (b) => b.over === score.overs
                                ) || []
                              ).map((ball, i) => (
                                <div
                                  key={i}
                                  className="w-7 h-7 shrink-0 rounded-full bg-[#FFC403] text-black flex items-center justify-center text-[13px]"
                                  style={{
                                    fontFamily:
                                      '"Bebas Neue", Anton, sans-serif',
                                  }}
                                >
                                  {ballLabel(ball)}
                                </div>
                              ))}
                              {Array.from({
                                length: Math.max(
                                  0,
                                  6 -
                                    (matchData?.timeline?.filter(
                                      (b) => b.over === score.overs
                                    )?.length || 0)
                                ),
                              }).map((_, i) => (
                                <div
                                  key={`empty-${i}`}
                                  className="w-7 h-7 shrink-0 rounded-full border border-white/30"
                                />
                              ))}
                            </div>
                          </div>

                          {/* Striker / Non Striker */}
                          <div className="flex justify-between w-full px-1">
                            <div>
                              <p
                                className="text-[9px] tracking-[3px] opacity-60 text-white"
                                style={{ fontFamily: '"Poppins", sans-serif' }}
                              >
                                STRIKER
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <p
                                  className="font-medium text-[14px] text-[#A1FF00] uppercase truncate max-w-[120px]"
                                  style={{
                                    fontFamily: '"Poppins", sans-serif',
                                  }}
                                >
                                  {strikerSlot?.name?.split(" ")[0] || "Name"}
                                </p>
                                <p
                                  className="text-[11px] tracking-[3px] text-white"
                                  style={{
                                    fontFamily: '"Poppins", sans-serif',
                                  }}
                                >
                                  {strikerStats?.runs ?? 0} -{" "}
                                  {strikerStats?.balls ?? 0}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className="text-[9px] tracking-[3px] opacity-60 text-white"
                                style={{ fontFamily: '"Poppins", sans-serif' }}
                              >
                                NON STRIKER
                              </p>
                              <div className="flex items-center justify-end gap-3 mt-1.5">
                                <p
                                  className="text-[11px] tracking-[3px] text-white"
                                  style={{
                                    fontFamily: '"Poppins", sans-serif',
                                  }}
                                >
                                  {nonStrikerStats?.runs ?? 0} -{" "}
                                  {nonStrikerStats?.balls ?? 0}
                                </p>
                                <p
                                  className="font-medium text-[14px] text-white uppercase truncate max-w-[120px]"
                                  style={{
                                    fontFamily: '"Poppins", sans-serif',
                                  }}
                                >
                                  {nonStrikerSlot?.name?.split(" ")[0] ||
                                    "Name"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Match Controls Dropdown */}
                      <div className="bg-card border-y border-white/5 rounded-none overflow-hidden shadow-xl -mx-4 !mt-0 mb-0 z-10 relative">
                        <Button
                          onClick={() => setShowMatchActions(!showMatchActions)}
                          className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <Settings
                              size={14}
                              style={{ color: THEME_COLOR }}
                            />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                              MATCH CONTROLS
                            </span>
                          </div>
                          <ChevronLeft
                            size={16}
                            className={`text-white/50 transition-transform duration-300 ${showMatchActions ? "-rotate-90" : "rotate-180"}`}
                          />
                        </Button>

                        <div
                          className={`transition-all duration-300 ease-in-out ${showMatchActions ? "max-h-40 opacity-100 p-4 pt-2" : "max-h-0 opacity-0 px-4 pointer-events-none"}`}
                        >
                          <div className="grid grid-cols-4 gap-3">
                            <Button
                              onClick={() => setShowInningsSetup(true)}
                              className="h-16 bg-white/5 border border-white/10 rounded-[8px] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1.5 text-white transform active:scale-95 shadow-xl"
                            >
                              <Users size={16} />{" "}
                              <span className="mt-0.5">Players</span>
                            </Button>
                            <Button
                              disabled={isMutating}
                              onClick={() => {
                                if (!isMutating && checkTimerActive())
                                  setShowPenaltyModal(true);
                              }}
                              className={`h-16 bg-white/5 border border-white/10 rounded-[8px] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1.5 text-white transform active:scale-95 shadow-xl ${isMutating ? "opacity-40 cursor-not-allowed" : ""}`}
                            >
                              <Zap size={16} />{" "}
                              <span className="mt-0.5">Penalty</span>
                            </Button>
                            <Button
                              onClick={() =>
                                setIsWagonWheelEnabled(!isWagonWheelEnabled)
                              }
                              className={`h-16 border rounded-[8px] text-[9px] font-black uppercase tracking-[0.2em] transition-all flex flex-col items-center justify-center gap-1.5 transform active:scale-95 shadow-xl ${isWagonWheelEnabled ? "bg-success/10 border-success/30 text-success" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"}`}
                            >
                              <Crosshair size={16} />{" "}
                              <span className="mt-0.5">Wagon</span>
                            </Button>
                            <Button
                              onClick={() => setShowEndMatchModal(true)}
                              className="h-16 bg-white/[0.03] border border-white/10 rounded-[8px] text-[9px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl flex flex-col items-center justify-center gap-1.5"
                              style={{
                                color: THEME_COLOR,
                                borderColor: `${THEME_COLOR}33`,
                              }}
                            >
                              <CheckCircle2 size={16} />{" "}
                              <span className="mt-0.5">End Match</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Tabs */}
            <div className="w-full z-[60] mt-auto bg-black shadow-inner backdrop-blur-md">
              <div className="flex items-center gap-1 bg-[#1C1C1C] p-2 border-t border-white/5">
                {[
                  { id: "scoring", icon: Zap, label: "Score" },
                  { id: "members", icon: Users, label: "Teams" },
                  { id: "history", icon: History, label: "Ledger" },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[8px] transition-all border ${activeTab === tab.id ? "bg-white/10 text-success border-success/20 shadow-lg" : "text-neutral-500 hover:text-white border-transparent"}`}
                  >
                    <tab.icon size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {tab.label}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex justify-center animate-in fade-in duration-500">
          <div className="w-full h-[100dvh] max-w-[450px] overflow-y-auto bg-background px-4 py-8 space-y-10 shadow-2xl relative pb-24">
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 blur-3xl pointer-events-none" />
            <div className="flex justify-between items-center">
              <h3 className="text-[28px] font-semibold font-inter text-white tracking-tight">
                Interface Config
              </h3>
              <Button
                onClick={() => setShowSettings(false)}
                className="p-3 bg-white/5 rounded-[8px] border border-white/5 hover:text-white transition-all"
              >
                <X size={20} className="text-neutral-500" />
              </Button>
            </div>

            <div className="space-y-6">
              {matchData?.hostedGameId && !liveEnabled && (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-success border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">
                    Establishing Sync...
                  </p>
                </div>
              )}

              {matchData?.hostedGameId && liveEnabled && (
                <div className="space-y-6 animate-in slide-in-from-top duration-500">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                    Broadcast Credentials
                  </p>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="YouTube ID..."
                      defaultValue={matchData?.hostedGameId?.youtubeVideoId}
                      id="ytVideoId"
                      className="w-full bg-card border border-white/10 rounded-[8px] px-6 py-[14.5px] text-[10px] focus:border-success outline-none text-white font-bold"
                    />
                    <Button
                      onClick={async () => {
                        const rawVid =
                          document.getElementById("ytVideoId")?.["value"] || "";
                        const extractYoutubeId = (url) => {
                          if (!url) return "";
                          const regExp =
                            /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                          const match = url.match(regExp);
                          return match && match[2].length === 11
                            ? match[2]
                            : url;
                        };
                        const vidId = extractYoutubeId(rawVid);

                        try {
                          const response = await axiosInstance.post(
                            `/api/scoring/${matchId}/stream-config`,
                            {
                              youtubeVideoId: vidId,
                            },
                            {
                              ...(localStorage.getItem(`scorer_token_${matchId}`)
                                ? { headers: { Authorization: `Bearer ${localStorage.getItem(`scorer_token_${matchId}`)}` } }
                                : {}),
                            }
                          );
                          const data = response.data;
                          if (data.success) {
                            toast.success("Live broadcast connected!");
                            refresh();
                          } else {
                            toast.error(
                              "Could not connect broadcast. Try again."
                            );
                          }
                        } catch (err) {
                          toast.error(
                            "Network issue. Please check your connection."
                          );
                        }
                      }}
                      className="w-full py-[14.5px] bg-card border border-white/10 text-success text-[10px] font-black uppercase tracking-widest rounded-[8px] hover:bg-success hover:text-black transition-all"
                    >
                      Authorize Stream
                    </Button>
                  </div>

                  {liveUrls && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="space-y-1.5">
                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                          OBS Overlay (Copy this)
                        </p>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={liveUrls.obsOverlay}
                            className="flex-1 bg-card border border-white/10 rounded-[8px] px-4 py-[14.5px] text-[10px] text-neutral-400 font-bold truncate outline-none"
                          />
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                liveUrls.obsOverlay
                              );
                              toast.success("Copied!");
                            }}
                            className="px-4 py-[14.5px] bg-card text-success text-[10px] font-black uppercase rounded-[8px] border border-white/10 hover:bg-success hover:text-black transition-all"
                          >
                            Copy
                          </Button>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setShowThemeStore(true)}
                          className="w-full mt-2 py-[14.5px] bg-card text-success text-[10px] font-black uppercase tracking-widest rounded-[8px] border border-white/10 hover:bg-success hover:text-black hover:shadow-[0_0_15px_rgba(0,193,135,0.15)] transition-all flex items-center justify-center gap-2"
                        >
                          <Sparkles size={12} />
                          Change Ticker Theme
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                          Public Match Analytics
                        </p>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={liveUrls.publicScoreboard}
                            className="flex-1 bg-card border border-white/10 rounded-[8px] px-4 py-[14.5px] text-[10px] text-neutral-400 font-bold truncate outline-none"
                          />
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                liveUrls.publicScoreboard
                              );
                              toast.success("Copied!");
                            }}
                            className="px-4 py-[14.5px] bg-card text-success text-[10px] font-black uppercase rounded-[8px] border border-white/10 hover:bg-success hover:text-black transition-all"
                          >
                            Copy
                          </Button>
                        </div>
                        <div className="flex gap-2 w-full mt-2">
                          <a
                            href={`/live-overlay/${matchId}/preview?theme=${matchData?.hostedGameId?.tickerTheme || "neon_classic"}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-[14.5px] bg-card text-success border border-white/10 rounded-[8px] px-4 text-[10px] font-black uppercase tracking-widest text-center hover:bg-success/30 transition-colors"
                          >
                            Preview Theme
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                    Match State
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={async () => {
                        const res = await updateMatchStatus("LIVE");
                        if (res.success) toast.success("Match resumed!");
                        else toast.error("Could not resume match. Try again.");
                      }}
                      className={`py-[14.5px] rounded-[8px] text-[10px] font-black uppercase transition-all ${matchData?.status === "LIVE" ? "bg-card text-success border border-white/10" : "bg-white/5 text-neutral-400 hover:bg-white/10"}`}
                    >
                      Live
                    </Button>
                    <Button
                      onClick={async () => {
                        const res = await updateMatchStatus("RAIN_DELAY");
                        if (res.success)
                          toast.success("Match paused — Rain delay");
                        else toast.error("Could not pause match. Try again.");
                      }}
                      className={`py-[14.5px] rounded-[8px] text-[10px] font-black uppercase transition-all ${matchData?.status === "RAIN_DELAY" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/5 text-neutral-400 hover:bg-white/10"}`}
                    >
                      Rain Delay
                    </Button>
                    <Button
                      onClick={async () => {
                        const res = await updateMatchStatus("BAD_LIGHT");
                        if (res.success)
                          toast.success("Match paused — Bad light");
                        else toast.error("Could not pause match. Try again.");
                      }}
                      className={`py-[14.5px] rounded-[8px] text-[10px] font-black uppercase transition-all ${matchData?.status === "BAD_LIGHT" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-white/5 text-neutral-400 hover:bg-white/10"}`}
                    >
                      Bad Light
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest flex items-center justify-between">
                    <span>AI Commentator (OpenAI TTS)</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] ${isAiCommentaryEnabled ? "bg-card text-success" : "bg-white/5 text-neutral-500"}`}
                    >
                      {isAiCommentaryEnabled ? "ACTIVE" : "OFF"}
                    </span>
                  </p>

                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        setIsAiCommentaryEnabled(!isAiCommentaryEnabled)
                      }
                      className={`flex-1 py-[14.5px] rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all ${isAiCommentaryEnabled ? "bg-card text-success border border-white/10 shadow-[0_0_15px_rgba(0,193,135,0.15)]" : "bg-white/5 border border-white/10 text-white"}`}
                    >
                      {isAiCommentaryEnabled ? "Disable" : "Enable Commentary"}
                    </Button>
                  </div>

                  {isAiCommentaryEnabled && (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                      <div className="flex gap-2">
                        <Select
                          value={commentaryLanguage}
                          onChange={(e) =>
                            setCommentaryLanguage(e.target.value)
                          }
                          className="flex-1 bg-card border border-white/10 rounded-[8px] px-4 py-[14.5px] text-[10px] text-white font-bold outline-none focus:border-success"
                        >
                          <option value="en">English (Default)</option>
                          <option value="hi">Hindi</option>
                          <option value="pa">Punjabi</option>
                          <option value="bn">Bengali</option>
                          <option value="mr">Marathi</option>
                          <option value="ta">Tamil</option>
                          <option value="te">Telugu</option>
                          <option value="gu">Gujarati</option>
                        </Select>

                        <Select
                          value={commentaryVoice}
                          onChange={(e) => setCommentaryVoice(e.target.value)}
                          className="flex-1 bg-card border border-white/10 rounded-[8px] px-4 py-[14.5px] text-[10px] text-white font-bold outline-none focus:border-success"
                        >
                          <option value="alloy">Alloy (Neutral)</option>
                          <option value="echo">Echo (Male, Warm)</option>
                          <option value="fable">Fable (Male, British)</option>
                          <option value="onyx">Onyx (Male, Deep)</option>
                          <option value="nova">
                            Nova (Female, Professional)
                          </option>
                          <option value="shimmer">
                            Shimmer (Female, Bright)
                          </option>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={commentaryStyle}
                          onChange={(e) => setCommentaryStyle(e.target.value)}
                          className="w-full bg-card border border-white/10 rounded-[8px] px-4 py-[14.5px] text-[10px] text-white font-bold outline-none focus:border-success"
                        >
                          <option value="professional">
                            Professional Broadcast
                          </option>
                          <option value="natural">
                            Natural Human (Casual)
                          </option>
                          <option value="funny">Funny & Witty</option>
                          <option value="dramatic">
                            High Energy / Dramatic
                          </option>
                        </Select>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            const response = await axiosInstance.post(
                              `/api/scoring/${matchId}/commentary-settings`,
                              {
                                isAiCommentaryEnabled,
                                commentaryVoice,
                                commentaryLanguage,
                                commentaryStyle,
                              },
                              {
                                headers: {
                                  Authorization: `Bearer ${localStorage.getItem(`scorer_token_${matchId}`) || ""}`,
                                },
                              }
                            );
                            const data = response.data;
                            if (data.success) {
                              toast.success("Commentary settings updated!");
                            } else {
                              toast.error(
                                "Could not save settings. Try again."
                              );
                            }
                          } catch (err) {
                            toast.error("Connection issue. Please try again.");
                          }
                        }}
                        className="w-full py-[14.5px] bg-card text-success text-[10px] font-black uppercase tracking-widest rounded-[8px] border border-white/10 hover:bg-success hover:text-black transition-all"
                      >
                        Save Commentary Profile
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                    DLS / Target Revision
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      id="revisedTarget"
                      placeholder="Revised Target"
                      defaultValue={matchData?.revisedTarget || ""}
                      className="flex-1 bg-card border border-white/10 rounded-[8px] px-4 py-[14.5px] text-[10px] text-white font-bold outline-none focus:border-success"
                    />
                    <Input
                      type="number"
                      step="0.1"
                      id="revisedOvers"
                      placeholder="Revised Overs"
                      defaultValue={matchData?.revisedOvers || ""}
                      className="flex-1 bg-card border border-white/10 rounded-[8px] px-4 py-[14.5px] text-[10px] text-white font-bold outline-none focus:border-success"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      const tgt = parseInt(
                        document.getElementById("revisedTarget").value
                      );
                      const ovr = parseFloat(
                        document.getElementById("revisedOvers").value
                      );
                      if (isNaN(tgt) || isNaN(ovr))
                        return toast.error(
                          "Please enter a valid target and overs"
                        );
                      const res = await reviseTargetAndOvers(tgt, ovr);
                      if (res.success)
                        toast.success("Target revised successfully!");
                      else toast.error("Could not revise target. Try again.");
                    }}
                    className="w-full py-[14.5px] bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-[8px] border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-all"
                  >
                    Apply DLS Revision
                  </Button>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                    Match Officials
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      id="umpire1"
                      placeholder="Umpire 1"
                      defaultValue={matchData?.matchOfficials?.umpire1 || ""}
                      className="flex-1 bg-card border border-white/10 rounded-[8px] px-4 py-[14.5px] text-[10px] text-white font-bold outline-none focus:border-success"
                    />
                    <Input
                      type="text"
                      id="umpire2"
                      placeholder="Umpire 2"
                      defaultValue={matchData?.matchOfficials?.umpire2 || ""}
                      className="flex-1 bg-card border border-white/10 rounded-[8px] px-4 py-[14.5px] text-[10px] text-white font-bold outline-none focus:border-success"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      id="matchReferee"
                      placeholder="Match Referee"
                      defaultValue={
                        matchData?.matchOfficials?.matchReferee || ""
                      }
                      className="w-full bg-card border border-white/10 rounded-[8px] px-4 py-[14.5px] text-[10px] text-white font-bold outline-none focus:border-success"
                    />
                    <Button
                      onClick={async () => {
                        const umpire1 =
                          document.getElementById("umpire1").value;
                        const umpire2 =
                          document.getElementById("umpire2").value;
                        const matchReferee =
                          document.getElementById("matchReferee").value;
                        const res = await setMatchOfficials({
                          umpire1,
                          umpire2,
                          matchReferee,
                        });
                        if (res.success)
                          toast.success("Match officials updated!");
                        else
                          toast.error("Could not update officials. Try again.");
                      }}
                      className="w-full py-[14.5px] bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-[8px] border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"
                    >
                      Save
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                    Match Rules (Phase 5)
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      id="powerplayOvers"
                      placeholder="Powerplay Overs"
                      defaultValue={matchData?.powerplayOvers || 0}
                      className="w-full bg-card border border-white/10 rounded-[8px] px-4 py-[14.5px] text-[10px] text-white font-bold outline-none focus:border-success"
                    />
                    <Button
                      onClick={async () => {
                        const overs = parseInt(
                          document.getElementById("powerplayOvers").value
                        );
                        if (isNaN(overs))
                          return toast.error("Please enter valid overs");
                        const res = await setPowerplayOvers(overs);
                        if (res.success)
                          toast.success("Powerplay overs updated!");
                        else
                          toast.error("Could not update powerplay. Try again.");
                      }}
                      className="w-full py-[14.5px] bg-card text-success text-[10px] font-black uppercase tracking-widest rounded-[8px] border border-white/10 hover:bg-success hover:text-black transition-all"
                    >
                      Set Powerplay
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={async () => {
                        const isSuccess = window.confirm(
                          "Was the Batting Team's review successful? (Click OK for Yes, Cancel for No)"
                        );
                        const res = await useReview("batting", isSuccess);
                        if (res.success)
                          toast.success(
                            isSuccess
                              ? "Review successful!"
                              : "Review unsuccessful"
                          );
                        else
                          toast.error("Could not process review. Try again.");
                      }}
                      className="w-full py-[14.5px] bg-yellow-500/10 text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded-[8px] border border-yellow-500/20 hover:bg-yellow-500 hover:text-white transition-all"
                    >
                      Use Batting Review ({matchData?.reviews?.batting ?? 2})
                    </Button>

                    <Button
                      onClick={async () => {
                        const isSuccess = window.confirm(
                          "Was the Fielding Team's review successful? (Click OK for Yes, Cancel for No)"
                        );
                        const res = await useReview("fielding", isSuccess);
                        if (res.success)
                          toast.success(
                            isSuccess
                              ? "Review successful!"
                              : "Review unsuccessful"
                          );
                        else
                          toast.error("Could not process review. Try again.");
                      }}
                      className="w-full py-[14.5px] bg-yellow-500/10 text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded-[8px] border border-yellow-500/20 hover:bg-yellow-500 hover:text-white transition-all"
                    >
                      Use Fielding Review ({matchData?.reviews?.fielding ?? 2})
                    </Button>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                    Match Analysis
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        setShowSettings(false);
                        setShowMatchReport(true);
                      }}
                      className="w-full py-[14.5px] bg-card text-success text-[10px] font-black uppercase tracking-widest rounded-[8px] border border-white/10 hover:bg-success hover:text-black hover:shadow-[0_0_15px_rgba(0,193,135,0.15)] transition-all flex items-center justify-center gap-2"
                    >
                      <FileText size={14} />
                      Match Report
                    </Button>

                    <Button
                      onClick={() => {
                        window.open(
                          `/analytics/${matchData?.hostedGameId?.shortId || matchId}`,
                          "_blank"
                        );
                      }}
                      className="w-full py-[14.5px] bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest rounded-[8px] border border-secondary/20 hover:bg-secondary hover:text-black hover:shadow-[0_0_15px_rgba(85,222,232,0.15)] transition-all flex items-center justify-center gap-2"
                    >
                      <TrendingUp size={14} />
                      Live Analytics
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowSettings(false)}
                className="w-full py-5 rounded-[8px] font-black uppercase text-[11px] tracking-[0.2em] transition-all transform active:scale-95 shadow-xl"
                style={{
                  backgroundColor: THEME_COLOR,
                  color: "#000",
                  boxShadow: `0 10px 30px ${THEME_COLOR}33`,
                }}
              >
                Save Parameters
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ── Phase 1 Modals ── */}
      {(showInningsSetup || needsInningsSetup) && (
        <InningsSetupModal
          battingTeamSlots={battingSlots}
          bowlingTeamSlots={bowlingSlots}
          battingTeamInfo={battingTeamInfo}
          bowlingTeamInfo={bowlingTeamInfo}
          inningsLabel={
            matchData?.currentInningsIndex === 0 ? "1st Innings" : "2nd Innings"
          }
          onConfirm={async (players) => {
            const result = await setPlayers(players);
            if (result.success) {
              toast.success("You're all set! Start scoring 🏏");
              if (matchData?.timerState === "PAUSED") {
                toggleTimer();
              }
            } else {
              toast.error("Could not set players. Please try again.");
            }
            setShowInningsSetup(false);
          }}
          onClose={() => setShowInningsSetup(false)}
        />
      )}
      {showWicketModal && (
        <WicketModal
          fieldingTeamSlots={bowlingSlots}
          battingTeamSlots={remainingBatters}
          activeBatters={[
            strikerSlot ? { ...strikerSlot, role: "Striker" } : null,
            nonStrikerSlot ? { ...nonStrikerSlot, role: "Non-Striker" } : null,
          ].filter(Boolean)}
          onConfirm={async ({
            wicketType,
            fielderId,
            nextBatterId,
            runs,
            playerOutId,
            didCross,
            obstructionMode,
          }) => {
            const result = await handleScore({
              runs: runs || 0,
              isWicket: true,
              wicketType,
              fielderId,
              nextBatterId,
              playerOutId,
              didCross,
              obstructionMode,
              extraType: "NONE",
            });
            if (result.success) {
              toast.success(`Wicket Confirmed`);
            } else {
              toast.error("Something went wrong. Please try again.");
            }
            setShowWicketModal(false);
          }}
          onClose={() => setShowWicketModal(false)}
        />
      )}
      {showThemeStore && (
        <TickerThemeStoreModal
          activeTheme={matchData?.hostedGameId?.tickerTheme || "neon_classic"}
          matchId={matchId}
          onClose={() => setShowThemeStore(false)}
          onThemeApplied={(newTheme) => {
            if (matchData?.hostedGameId) {
              matchData.hostedGameId.tickerTheme = newTheme;
            }
            refresh();
          }}
        />
      )}
      {showPenaltyModal && (
        <PenaltyModal
          matchData={matchData}
          onClose={() => setShowPenaltyModal(false)}
          onConfirm={async (teamId, runs) => {
            const res = await addPenalty(teamId, runs);
            if (res.success) toast.success(`Added ${runs} penalty runs`);
            else toast.error("Could not add penalty. Try again.");
            setShowPenaltyModal(false);
          }}
        />
      )}
      {showExitModal && (
        <MatchExitModal
          isOpen={showExitModal}
          onClose={() => setShowExitModal(false)}
          onConfirm={async (data) => {
            setShowExitModal(false);
            const reason = data?.status || data?.help;
            if (reason) {
              try {
                await updateMatchStatus(reason.toUpperCase());
              } catch (e) {
                Sentry.captureException(e);
              }
            }
            window.history.back();
          }}
        />
      )}
      {/* Innings Complete Modal */}
      {showInningsCompleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm bg-card rounded-[8px] border border-white/10 p-6 text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔄</span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
              Innings Over
            </h3>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              The {isFirstInnings ? "first" : "current"} innings has ended. The
              match timer has been paused. Set up the next innings to resume the
              match.
            </p>

            {/* Super Over & Follow-On Toggles */}
            <div className="flex flex-col gap-3 mb-6 text-left border border-white/5 bg-white/[0.02] p-4 rounded-[8px]">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSuperOver}
                  onChange={(e) => {
                    setIsSuperOver(e.target.checked);
                    if (e.target.checked) setIsFollowOn(false); // Can't be both
                  }}
                  className="w-4 h-4 rounded accent-success cursor-pointer"
                />
                <div>
                  <span className="block text-sm font-bold text-white">Super Over</span>
                  <span className="block text-[11px] text-neutral-500">Play a tie-breaker over (1 over, 2 wickets max)</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFollowOn}
                  onChange={(e) => {
                    setIsFollowOn(e.target.checked);
                    if (e.target.checked) setIsSuperOver(false); // Can't be both
                  }}
                  className="w-4 h-4 rounded accent-success cursor-pointer"
                />
                <div>
                  <span className="block text-sm font-bold text-white">Enforce Follow-On</span>
                  <span className="block text-[11px] text-neutral-500">Force the same team to bat sequentially again</span>
                </div>
              </label>
            </div>

            <Button
              onClick={async () => {
                setShowInningsCompleteModal(false);
                const targetBattingTeam = isFollowOn ? battingTeamKey : bowlingTeamKey;
                const res = await advanceToNextInnings(targetBattingTeam, {
                  isFollowOn,
                  isSuperOver,
                });
                if (res.success) {
                  toast.success(
                    isSuperOver 
                      ? "Super Over is ready! Select the openers." 
                      : isFollowOn 
                        ? "Follow-On innings is ready! Select the openers." 
                        : "Next innings is ready! Select the openers."
                  );
                  // Force the UI to show the InningsSetupModal for the next innings
                  setShowInningsSetup(true);
                } else {
                  toast.error(
                    "Could not start next innings. Please try again."
                  );
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-secondary to-primary text-black font-black text-sm uppercase tracking-wider rounded-[8px] hover:opacity-90 transition-opacity"
            >
              Start Next Innings
            </Button>
          </motion.div>
        </div>
      )}
      {/* ── Phase 1 Modals ── */}
      {(showInningsSetup || needsInningsSetup) && (
        <InningsSetupModal
          battingTeamSlots={battingSlots}
          bowlingTeamSlots={bowlingSlots}
          battingTeamInfo={battingTeamInfo}
          bowlingTeamInfo={bowlingTeamInfo}
          inningsLabel={
            matchData?.currentInningsIndex === 0 ? "1st Innings" : "2nd Innings"
          }
          onConfirm={async (players) => {
            const result = await setPlayers(players);
            if (result.success) {
              toast.success("You're all set! Start scoring 🏏");
              if (matchData?.timerState === "PAUSED" || hasAutoPausedTimer) {
                toggleTimer();
                setHasAutoPausedTimer(false);
                toast("Match Resumed", { icon: "▶️" });
              }
            } else {
              toast.error("Could not set players. Please try again.");
            }
            setShowInningsSetup(false);
          }}
          onClose={() => setShowInningsSetup(false)}
        />
      )}
      {showWicketModal && (
        <WicketModal
          fieldingTeamSlots={bowlingSlots}
          battingTeamSlots={remainingBatters}
          activeBatters={[
            strikerSlot ? { ...strikerSlot, role: "Striker" } : null,
            nonStrikerSlot ? { ...nonStrikerSlot, role: "Non-Striker" } : null,
          ].filter(Boolean)}
          onConfirm={async ({
            wicketType,
            fielderId,
            nextBatterId,
            runs,
            playerOutId,
            didCross,
            obstructionMode,
          }) => {
            const result = await handleScore({
              runs: runs || 0,
              isWicket: true,
              wicketType,
              fielderId,
              nextBatterId,
              playerOutId,
              didCross,
              obstructionMode,
              extraType: "NONE",
            });
            if (result.success) {
              toast.success(`Wicket Confirmed`);
            } else {
              toast.error("Something went wrong. Please try again.");
            }
            setShowWicketModal(false);
          }}
          onClose={() => setShowWicketModal(false)}
        />
      )}
      {wagonWheelData && (
        <VisualWagonWheelModal
          runs={wagonWheelData.runs}
          isBoundary={wagonWheelData.isBoundary}
          onConfirm={(data) => {
            handleScore({
              runs: wagonWheelData.runs,
              isBoundary: wagonWheelData.isBoundary,
              isFour: wagonWheelData.isFour,
              isSix: wagonWheelData.isSix,
              extraType: "NONE",
              fieldingPosition: data.position,
              distance: data.distance,
            });
            setWagonWheelData(null);
          }}
          onClose={() => setWagonWheelData(null)}
        />
      )}
      {extraModal && (
        <ExtraRunsModal
          extraType={extraModal}
          onConfirm={async (runs) => {
            const isWide = extraModal === "WIDE";
            const isNoBall = extraModal === "NO_BALL";
            const totalRuns = isWide || isNoBall ? runs + 1 : runs;
            const result = await handleScore({
              runs: totalRuns,
              isExtra: true,
              extraType: extraModal,
              isBoundary: false,
            });
            if (result.success) toast.success("Extra recorded!");
            else toast.error("Something went wrong. Please try again.");
            setExtraModal(null);
          }}
          onClose={() => setExtraModal(null)}
        />
      )}
      {showBowlerModal && (
        <SelectBowlerModal
          pool={bowlingSlots}
          currentBowlerId={matchData.bowlerId}
          onConfirm={async (bowlerId) => {
            const res = await setPlayers({ bowlerId });
            if (res.success) {
              toast.success("Next bowler selected");
              setShowBowlerModal(false);
            } else {
              toast.error("Could not select bowler. Please try again.");
            }
          }}
        />
      )}

      {showAuthModal && (
        <ScoringPasswordModal
          matchId={matchId}
          actionLabel={
            authAction === "end"
              ? "Confirm End Match"
              : "Unlock Scoring Console"
          }
          onClose={() => setShowAuthModal(false)}
          onSuccess={(token) => {
            localStorage.setItem(`scorer_token_${matchId}`, token);
            setPasswordVerified(true);
            setShowAuthModal(false);
            if (authAction === "start") {
              setShowTossModal(true);
            } else if (authAction === "end") {
              completeMatch();
              navigate("/");
            }
          }}
        />
      )}
      {showThemeStore && (
        <TickerThemeStoreModal
          activeTheme={matchData?.hostedGameId?.tickerTheme || "neon_classic"}
          matchId={matchId}
          onClose={() => setShowThemeStore(false)}
          onThemeApplied={(newTheme) => {
            if (matchData?.hostedGameId) {
              matchData.hostedGameId.tickerTheme = newTheme;
            }
            refresh();
          }}
        />
      )}
      {showPenaltyModal && (
        <PenaltyModal
          matchData={matchData}
          onClose={() => setShowPenaltyModal(false)}
          onConfirm={async (teamId, runs) => {
            const res = await addPenalty(teamId, runs);
            if (res.success) toast.success(`Added ${runs} penalty runs`);
            else toast.error("Could not add penalty. Try again.");
            setShowPenaltyModal(false);
          }}
        />
      )}
      {showMatchReport && (
        <MatchReportModal
          matchId={matchId}
          fetchMatchReport={fetchMatchReport}
          onClose={() => setShowMatchReport(false)}
        />
      )}
      {showCustomRunsModal && (
        <CustomRunsModal
          onClose={() => setShowCustomRunsModal(false)}
          onConfirm={(runs) => {
            setShowCustomRunsModal(false);
            processRuns({
              runs: Number(runs),
              isBoundary: Number(runs) >= 4,
              isFour: Number(runs) === 4,
              isSix: Number(runs) === 6,
            });
          }}
        />
      )}
      {showEndMatchModal && (
        <EndMatchModal
          matchId={matchId}
          hasPassword={hasPassword}
          onConfirm={async (token) => {
            if (token) {
              localStorage.setItem(`scorer_token_${matchId}`, token);
            }
            await completeMatch();
            setShowEndMatchModal(false);
            navigate("/");
          }}
          onClose={() => setShowEndMatchModal(false)}
        />
      )}
    </div>
  );
};

export default ScoringApp;
