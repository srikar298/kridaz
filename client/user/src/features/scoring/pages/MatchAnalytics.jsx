import * as Sentry from "@sentry/react";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  Target,
  TrendingUp,
  ArrowLeft,
  Activity,
  Award,
  Share2,
  Calendar,
  MapPin,
  Clock,
  Radio,
  Zap,
  Wifi,
  User,
  Swords,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { io } from "socket.io-client";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";
import useCricketScoring from "../hooks/useCricketScoring";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import BallByBallHistory from "../components/BallByBallHistory";
import GlobalBackButton from "@/shared/components/GlobalBackButton";
import { formatOutStatus } from "../utils/dismissalFormatter.js";
import { Button, Select } from "@kridaz/ui";


// ─── Team badge rendering component ────────────────────────────────────────────
const TeamBadge = ({ team, fallbackName, size = "md" }) => {
  const [error, setError] = useState(false);
  const name = team?.name || fallbackName || "Team";
  const imgUrl = team?.image;
  const initial = name.charAt(0).toUpperCase();

  const sizeClasses = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-6 h-6 text-[10px]",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
  };

  const cls = `rounded-full flex items-center justify-center shrink-0 font-black tracking-tight select-none border border-white/10 ${sizeClasses[size] || sizeClasses.md}`;

  if (imgUrl && !error) {
    return (
      <img
        src={imgUrl}
        alt={name}
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover shrink-0 border border-white/10`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className={`${cls} bg-gradient-to-br from-success/20 to-blue-500/10 text-success`}
    >
      {initial}
    </div>
  );
};

// ─── Player avatar rendering component ──────────────────────────────────────────
const PlayerAvatar = ({ src, name, active, size = "sm", isBowler = false }) => {
  const [error, setError] = useState(false);
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
  };

  const bgCls = isBowler
    ? "bg-blue-500/10"
    : active
      ? "bg-success/10"
      : "bg-white/5";
  const iconCls = isBowler
    ? "text-blue-400"
    : active
      ? "text-success"
      : "text-gray-500";

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden shrink-0 ${bgCls}`}
    >
      {src && !error ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <User size={12} className={iconCls} />
      )}
    </div>
  );
};

const getStatusLabel = (status) => {
  if (!status) return "BREAK";
  const mapping = {
    DRINKS: "DRINKS BREAK",
    TIMED_OUT: "TIMED OUT",
    LUNCH: "LUNCH BREAK",
    STUMPS: "STUMPS",
    RAIN: "RAIN DELAY",
    OTHER: "DELAYED (OTHER)",
    SCORING_MISTAKE: "SCORING CORRECTION",
    CHANGE_SCORER: "CHANGING SCORER",
    FACING_PROBLEM: "TECHNICAL ISSUE",
    TESTING: "TESTING",
    PAUSED: "PAUSED",
    RAIN_DELAY: "RAIN DELAY",
    BAD_LIGHT: "BAD LIGHT",
  };
  return mapping[status.toUpperCase()] || status.toUpperCase();
};

const MatchAnalytics = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { fetchAnalytics } = useCricketScoring(matchId);
  const [analytics, setAnalytics] = useState(null);
  const [liveScore, setLiveScore] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, live-score, scorecard, wagon-wheel, worm-chart, timeline
  const [selectedBatsman, setSelectedBatsman] = useState("all");
  const [runFilter, setRunFilter] = useState("all"); // all, boundaries, wickets
  const [hoveredShot, setHoveredShot] = useState(null);
  const captureRef = React.useRef(null);

  useEffect(() => {
    const unlock = () => {
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance("");
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
      const a = new Audio();
      a.volume = 0;
      a.play().catch(() => {});

      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("click", unlock);
    window.addEventListener("touchstart", unlock);
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:6001";

  const getBallCls = (ball) => {
    if (!ball) return "bg-gray-800 text-gray-500";
    if (ball.type === "dead" || ball.label === "DB") return "bg-neutral-800 text-neutral-500 line-through opacity-50";
    if (ball.isWicket || ball.type === "wicket") return "bg-red-600 text-white";
    const lbl = ball.label || "";
    if (lbl === "6" || ball.type === "six") return "bg-purple-600 text-white";
    if (lbl === "4" || ball.type === "four") return "bg-blue-600 text-white";
    if (lbl === "wd" || ball.type === "wide") return "bg-yellow-500 text-black";
    if (lbl === "nb" || ball.type === "no_ball")
      return "bg-orange-500 text-white";
    if (lbl === "0" || ball.type === "dot") return "bg-gray-700 text-gray-400";
    return "bg-white/10 text-white";
  };

  const getBallLabel = (ball) => {
    return ball?.label ?? (ball?.runs !== undefined ? String(ball.runs) : "?");
  };

  const getFieldingCoords = (position) => {
    const normalized = (position || "").trim().toLowerCase();

    let angle = 180; // default straight down (bowler's end / long off / long on)
    let rFrac = 0.8; // default deep boundary

    if (normalized.includes("long off")) {
      angle = 165;
      rFrac = 0.85;
    } else if (normalized.includes("long on")) {
      angle = 195;
      rFrac = 0.85;
    } else if (normalized.includes("extra cover")) {
      angle = 135;
      rFrac = 0.85;
    } else if (
      normalized.includes("deep cover") ||
      normalized.includes("deep extra cover")
    ) {
      angle = 120;
      rFrac = 0.85;
    } else if (normalized.includes("cover")) {
      angle = 130;
      rFrac = 0.55;
    } else if (normalized.includes("point") && normalized.includes("deep")) {
      angle = 90;
      rFrac = 0.85;
    } else if (normalized.includes("point")) {
      angle = 90;
      rFrac = 0.5;
    } else if (
      normalized.includes("third man") ||
      normalized.includes("deep third man")
    ) {
      angle = 45;
      rFrac = 0.85;
    } else if (normalized.includes("gully")) {
      angle = 60;
      rFrac = 0.35;
    } else if (normalized.includes("slip")) {
      angle = 30;
      rFrac = 0.25;
    } else if (
      normalized.includes("wicket keeper") ||
      normalized.includes("keeper")
    ) {
      angle = 0;
      rFrac = 0.2;
    } else if (normalized.includes("fine leg") && normalized.includes("deep")) {
      angle = 315;
      rFrac = 0.85;
    } else if (normalized.includes("fine leg")) {
      angle = 315;
      rFrac = 0.45;
    } else if (
      normalized.includes("square leg") &&
      normalized.includes("deep")
    ) {
      angle = 270;
      rFrac = 0.85;
    } else if (normalized.includes("square leg")) {
      angle = 270;
      rFrac = 0.5;
    } else if (
      normalized.includes("midwicket") &&
      normalized.includes("deep")
    ) {
      angle = 225;
      rFrac = 0.85;
    } else if (
      normalized.includes("midwicket") ||
      normalized.includes("mid-wicket")
    ) {
      angle = 225;
      rFrac = 0.5;
    } else if (normalized.includes("mid off")) {
      angle = 145;
      rFrac = 0.45;
    } else if (normalized.includes("mid on")) {
      angle = 215;
      rFrac = 0.45;
    } else if (normalized.includes("bowler")) {
      angle = 180;
      rFrac = 0.35;
    }

    const cx = 150;
    const cy = 150;
    const maxR = 120;
    const r = maxR * rFrac;

    const rad = (angle * Math.PI) / 180;
    const x = cx + r * Math.sin(rad);
    const y = cy - r * Math.cos(rad);

    return { x, y };
  };

  const handleShare = async () => {
    setIsCapturing(true);
    toast.loading("Generating your scorecard...", { id: "share" });

    try {
      const { scoring, analytics: stats } = analytics || {};
      const innings0 = scoring?.innings?.[0] || {};
      const legalBalls = innings0.legalBalls ?? 0;
      const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
      const runRate =
        legalBalls > 0
          ? ((innings0.totalRuns / legalBalls) * 6).toFixed(2)
          : "0.00";
      const batters = (scoring?.playerStats || [])
        .filter((s) => s.battingBalls > 0 || s.battingRuns > 0)
        .slice(0, 6)
        .map((s) => ({
          ...s,
          runs: s.battingRuns ?? 0,
          balls: s.battingBalls ?? 0,
          fours: s.battingFours ?? 0,
          sixes: s.battingSixes ?? 0,
        }));

      // Canvas dimensions
      const W = 900;
      const rowH = 44;
      const headerH = 220;
      const statsH = 160;
      const titleH = 60;
      const battingH = batters.length > 0 ? 48 + batters.length * rowH : 0;
      const footerH = 60;
      const H = titleH + headerH + statsH + battingH + footerH + 80;

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, W, H);

      // Top accent bar
      ctx.fillStyle = "var(--success)";
      ctx.fillRect(0, 0, W, 5);

      let y = 30;

      // Brand title
      ctx.fillStyle = "var(--success)";
      ctx.font = "bold 38px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("KRIDAZ", W / 2, y + 38);
      ctx.fillStyle = "#555";
      ctx.font = "700 11px Arial, sans-serif";
      ctx.fillText("OFFICIAL MATCH SCORECARD", W / 2, y + 60);

      y += 90;

      // Stat tiles
      const tiles = [
        [
          "TOTAL RUNS",
          `${innings0.totalRuns ?? 0}/${innings0.totalWickets ?? 0}`,
        ],
        ["RUN RATE", runRate],
        ["OVERS", overs],
        ["EXTRAS", `${innings0.extras ?? 0}`],
      ];
      const tileW = (W - 80) / 4;
      const tileH = 100;
      const tileGap = 16;
      const tileStartX = 40;

      tiles.forEach(([label, value], i) => {
        const tx = tileStartX + i * (tileW + tileGap);
        // Tile background
        ctx.fillStyle = "var(--card)";
        roundRect(ctx, tx, y, tileW, tileH, 14);
        ctx.fill();
        // Tile border
        ctx.strokeStyle = "var(--card)";
        ctx.lineWidth = 1;
        roundRect(ctx, tx, y, tileW, tileH, 14);
        ctx.stroke();
        // Label
        ctx.fillStyle = "#666666";
        ctx.font = "700 9px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, tx + tileW / 2, y + 26);
        // Value
        ctx.fillStyle = "var(--success)";
        ctx.font = "bold 26px Arial, sans-serif";
        ctx.fillText(value, tx + tileW / 2, y + 72);
      });

      y += tileH + 32;

      // Batting section
      if (batters.length > 0) {
        // Section header
        ctx.fillStyle = "var(--card)";
        roundRect(ctx, 40, y, W - 80, battingH, 16);
        ctx.fill();
        ctx.strokeStyle = "var(--card)";
        ctx.lineWidth = 1;
        roundRect(ctx, 40, y, W - 80, battingH, 16);
        ctx.stroke();

        ctx.fillStyle = "#888888";
        ctx.font = "700 10px Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("BATTING SCORECARD", 64, y + 28);

        // Column headers
        const cols = {
          name: 64,
          runs: W - 260,
          balls: W - 200,
          fours: W - 140,
          sixes: W - 80,
        };
        ctx.fillStyle = "#444";
        ctx.font = "700 9px Arial, sans-serif";
        ctx.fillText("BATTER", cols.name, y + 44);
        ctx.textAlign = "center";
        ctx.fillText("R", cols.runs, y + 44);
        ctx.fillText("B", cols.balls, y + 44);
        ctx.fillText("4s", cols.fours, y + 44);
        ctx.fillText("6s", cols.sixes, y + 44);

        y += 48;

        batters.forEach((s, i) => {
          const ry = y + i * rowH;
          // Alternate row tint
          if (i % 2 === 0) {
            ctx.fillStyle = "rgba(255,255,255,0.02)";
            ctx.fillRect(40, ry, W - 80, rowH);
          }
          // Batter name
          ctx.fillStyle = "var(--foreground)";
          ctx.font = "bold 13px Arial, sans-serif";
          ctx.textAlign = "left";
          ctx.fillText(
            (s.user?.name || "\u2014").toUpperCase(),
            cols.name,
            ry + 26
          );
          // Stats
          ctx.fillStyle = "var(--success)";
          ctx.font = "bold 16px Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(s.runs ?? 0, cols.runs, ry + 26);
          ctx.fillStyle = "#888";
          ctx.font = "13px Arial, sans-serif";
          ctx.fillText(s.balls ?? 0, cols.balls, ry + 26);
          ctx.fillText(s.fours ?? 0, cols.fours, ry + 26);
          ctx.fillText(s.sixes ?? 0, cols.sixes, ry + 26);
          // Divider
          ctx.strokeStyle = "var(--card)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(64, ry + rowH);
          ctx.lineTo(W - 64, ry + rowH);
          ctx.stroke();
        });

        y += batters.length * rowH + 24;
      } else {
        y += 16;
      }

      // Footer
      ctx.fillStyle = "#333333";
      ctx.font = "700 10px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        `kridaz.com  \u2022  ${new Date().toLocaleDateString()}`,
        W / 2,
        y + 24
      );

      // Bottom accent
      ctx.fillStyle = "var(--success)";
      ctx.fillRect(0, H - 4, W, 4);

      // Export
      const image = canvas.toDataURL("image/png");

      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(image)).blob();
          const file = new File([blob], `kridaz-scorecard-${matchId}.png`, {
            type: "image/png",
          });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: "Kridaz Cricket Scorecard",
              text: "Check out my match on Kridaz!",
              files: [file],
            });
            toast.success("Ready to share!", { id: "share" });
            return;
          }
        } catch (_) {
          /* fall through to download */
        }
      }

      const link = document.createElement("a");
      link.href = image;
      link.download = `kridaz-scorecard-${matchId}.png`;
      link.click();
      toast.success("Scorecard downloaded!", { id: "share" });
    } catch (err) {
      Sentry.captureException(err);
      toast.error("Could not generate scorecard. Please try again.", {
        id: "share",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  // Helper: draw rounded rectangle path
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const loadAnalytics = async () => {
    const data = await fetchAnalytics();
    if (data.success) {
      setAnalytics(data);
    }
  };

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/scoring/live-score/${matchId}`);
        if (!r.ok) return;
        const d = await r.json();
        if (d.success && d.data) setLiveScore(d.data);
      } catch (_) {
        /* ignore */
      }
    };

    fetchScore();
    loadAnalytics();
    setLoading(false);

    const scorerToken = localStorage.getItem(`scorer_token_${matchId}`);
    const socket = io(API_BASE, {
      reconnection: true,
      withCredentials: true,
      ...(scorerToken ? { auth: { token: scorerToken } } : {}),
    });

    socket.on("connect", () => {
      setConnected(true);
      socket.emit(SOCKET.JOIN_MATCH, matchId);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on(SOCKET.SCORE_UPDATED, (data) => {
      setLiveScore(data);
      loadAnalytics(); // Auto-refresh details
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
            "MatchAnalytics audio play failed, falling back to Browser TTS",
            e
          );
          speakBrowserTTS(data.text, data.language);
        });
      } else {
        speakBrowserTTS(data.text, data.language);
      }
    });

    return () => {
      socket.off(SOCKET.SCORE_UPDATED);
      socket.off("COMMENTARY_AUDIO_READY");
      socket.disconnect();
    };
  }, [matchId]);

  if (loading || (!analytics && !liveScore)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center force-open-sans">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-success border-t-transparent animate-spin mb-4" />
          <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">
            Analyzing Match Data...
          </p>
        </div>
      </div>
    );
  }

  if (!analytics && liveScore?.status === "NOT_STARTED") {
    const teamAObj =
      liveScore.teamA ||
      liveScore.teams?.find((t) => t.teamKey === "teamA") ||
      liveScore.teams?.[0] ||
      {};
    const teamBObj =
      liveScore.teamB ||
      liveScore.teams?.find((t) => t.teamKey === "teamB") ||
      liveScore.teams?.[1] ||
      {};

    const teamA = teamAObj?.name || "TBD";
    const teamB = teamBObj?.name || "TBD";
    const loc =
      liveScore.city ||
      liveScore.state ||
      liveScore.location ||
      "Location Unspecified";
    const enue =
      liveScore.customVenue ||
      liveScore.turf?.name ||
      liveScore.enue?.name ||
      liveScore.enue ||
      "Local enue";
    const professionals =
      liveScore.professionals || liveScore.customProfessionals || [];

    let formattedDateTime = null;
    const startDateTime = liveScore.scheduledStartAt || liveScore.date;
    if (startDateTime) {
      formattedDateTime = new Date(startDateTime).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }

    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <GlobalBackButton />

        <div className="w-full max-w-2xl bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-10 text-center space-y-8 relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-success/10 via-black to-black opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-success/20">
              <Calendar size={32} className="text-success" />
            </div>

            <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-success">
              Match Not Started Yet
            </h2>
            <p className="text-sm text-gray-400 font-bold tracking-widest uppercase mb-4">
              {liveScore.matchName || "Official Match"}
            </p>

            {formattedDateTime && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-success bg-success/10 px-4 py-2 rounded-[6px] border border-success/20 w-fit mx-auto mb-8 shadow-[0_0_15px_rgba(0,193,135,0.1)]">
                <Clock size={14} />
                <span>STARTS: {formattedDateTime.toUpperCase()}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border-2 border-white/10 overflow-hidden">
                  {teamAObj?.image || teamAObj?.logo ? (
                    <img
                      src={teamAObj.image || teamAObj.logo}
                      alt={teamA}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-black text-xl">
                      {teamA.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="mt-3 font-black text-sm">{teamA}</span>
                {teamAObj?.captain && (
                  <Button
                    onClick={() => navigate(`/profile/${teamAObj.captain.id}`)}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 transition-colors rounded-[6px] text-xs font-bold text-gray-400 border border-white/10"
                  >
                    {teamAObj.captain.profilePicture ? (
                      <img
                        src={teamAObj.captain.profilePicture}
                        alt="(C)"
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center text-[8px] text-success">
                        C
                      </div>
                    )}
                    <span className="text-white/80">
                      {teamAObj.captain.name}{" "}
                      <span className="text-success">(C)</span>
                    </span>
                  </Button>
                )}
              </div>
              <div className="text-xl font-black text-gray-600 px-4">VS</div>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border-2 border-white/10 overflow-hidden">
                  {teamBObj?.image || teamBObj?.logo ? (
                    <img
                      src={teamBObj.image || teamBObj.logo}
                      alt={teamB}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-black text-xl">
                      {teamB.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="mt-3 font-black text-sm">{teamB}</span>
                {teamBObj?.captain && (
                  <Button
                    onClick={() => navigate(`/profile/${teamBObj.captain.id}`)}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 transition-colors rounded-[6px] text-xs font-bold text-gray-400 border border-white/10"
                  >
                    {teamBObj.captain.profilePicture ? (
                      <img
                        src={teamBObj.captain.profilePicture}
                        alt="(C)"
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center text-[8px] text-success">
                        C
                      </div>
                    )}
                    <span className="text-white/80">
                      {teamBObj.captain.name}{" "}
                      <span className="text-success">(C)</span>
                    </span>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left mb-4">
              <div className="bg-white/5 p-4 rounded-[8px] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Activity size={16} className="text-orange-500" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider">
                    Ball Type
                  </div>
                  <div className="text-sm font-bold text-white/90 truncate">
                    {liveScore.ballType || "Tennis"}
                  </div>
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-[8px] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Swords size={16} className="text-purple-500" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider">
                    Format
                  </div>
                  {/* Format label: honor what the host actually picked (incl. CUSTOM),
                      and only fall back to a derived label from oversPerInnings if
                      format is genuinely missing. Was hard-coded to 'T20' which made
                      every custom / non-T20 match look like a T20 here. */}
                  <div className="text-sm font-bold text-white/90 truncate">
                    {(() => {
                      const fmt = String(liveScore.format || "").toUpperCase();
                      if (fmt === "CUSTOM") return "Custom";
                      if (fmt === "THE_HUNDRED") return "The Hundred";
                      if (fmt) return fmt;
                      const ov = liveScore.oversPerInnings;
                      if (ov === 20) return "T20";
                      if (ov === 50) return "ODI";
                      if (ov === 10) return "T10";
                      if (ov === 100) return "The Hundred";
                      return "Match";
                    })()}{" "}
                    {liveScore.oversPerInnings
                      ? `(${liveScore.oversPerInnings} Ov)`
                      : ""}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-white/5 p-4 rounded-[8px] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-secondary" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider">
                    Location
                  </div>
                  <div className="text-sm font-bold text-white/90 truncate">
                    {loc}
                  </div>
                </div>
              </div>
              <Button
                onClick={() =>
                  navigate(`/venue/${liveScore?.venueId || "not-found"}`)
                }
                className="bg-white/5 p-4 rounded-[8px] flex items-center gap-3 text-left cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Trophy size={16} className="text-primary" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider">
                    enue
                  </div>
                  <div className="text-sm font-bold text-white/90 truncate">
                    {enue}
                  </div>
                </div>
              </Button>
            </div>

            {professionals.length > 0 && (
              <div className="mt-6 bg-white/5 p-4 rounded-[8px] text-left">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                  <User size={14} className="text-success" /> Officials
                </div>
                <div className="flex flex-wrap gap-2">
                  {professionals.map((p, i) => {
                    const isObj = typeof p === "object" && p !== null;
                    const name = isObj ? p.name : p;
                    const role = isObj ? p.role : "";
                    const id = isObj ? p.id : null;
                    const pic = isObj ? p.profilePicture : null;

                    if (id) {
                      return (
                        <Button
                          key={i}
                          onClick={() => navigate(`/profile/${id}`)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 transition-colors rounded-[8px] text-xs font-bold text-white/90 border border-white/10"
                        >
                          {pic ? (
                            <img
                              src={pic}
                              alt={name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[8px] text-success">
                              {name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="flex items-center gap-1">
                            {role && (
                              <span className="text-white/50">{role}:</span>
                            )}{" "}
                            {name}
                          </span>
                        </Button>
                      );
                    }
                    return (
                      <span
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-[8px] text-xs font-bold text-white/90 border border-white/10"
                      >
                        {role && <span className="text-white/50">{role}:</span>}{" "}
                        {name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { scoring, analytics: stats } = analytics || {};
  const mvp = stats?.mvp;

  const rawYoutubeVideoId =
    scoring?.game?.youtubeVideoId ||
    scoring?.game?.streamConfig?.youtubeVideoId ||
    liveScore?.youtubeVideoId;
  const extractYoutubeId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url;
  };
  const youtubeVideoId = extractYoutubeId(rawYoutubeVideoId);

  // Extract unique team names
  const teamAName = scoring?.game?.teamA?.name || "TBD";
  const teamBName = scoring?.game?.teamB?.name || "TBD";

  // Compute Worm Chart Over-by-Over progression
  let wormData = [];
  let innings1Balls = [];
  if (scoring && scoring.timeline) {
    const maxOvers = Math.max(...scoring.timeline.map((b) => b.over), 0) + 1;

    // Initialize over slots
    for (let o = 0; o <= maxOvers; o++) {
      wormData.push({ over: o });
    }

    const innings0Balls = scoring.timeline
      .filter((b) => b.inningsIndex === 0)
      .sort((a, b) =>
        a.over !== b.over ? a.over - b.over : a.ballInOver - b.ballInOver
      );

    innings1Balls = scoring.timeline
      .filter((b) => b.inningsIndex === 1)
      .sort((a, b) =>
        a.over !== b.over ? a.over - b.over : a.ballInOver - b.ballInOver
      );

    let runs0 = 0;
    const overRuns0 = { 0: 0 };
    innings0Balls.forEach((ball) => {
      runs0 += ball.runs + ball.extraRuns;
      overRuns0[ball.over + 1] = runs0;
    });

    let runs1 = 0;
    const overRuns1 = { 0: 0 };
    innings1Balls.forEach((ball) => {
      runs1 += ball.runs + ball.extraRuns;
      overRuns1[ball.over + 1] = runs1;
    });

    for (let o = 0; o <= maxOvers; o++) {
      if (overRuns0[o] !== undefined) {
        wormData[o][teamAName] = overRuns0[o];
      } else {
        const hasMore = innings0Balls.some((b) => b.over >= o);
        if (hasMore) {
          wormData[o][teamAName] = runs0;
        }
      }

      if (overRuns1[o] !== undefined) {
        wormData[o][teamBName] = overRuns1[o];
      } else {
        const hasMore = innings1Balls.some((b) => b.over >= o);
        if (hasMore) {
          wormData[o][teamBName] = runs1;
        }
      }
    }
  }

  // Filter Wagon Wheel batsman list
  const batsmenInTimeline = scoring
    ? Array.from(new Set(scoring.timeline.map((b) => b.batterId))).map((id) => {
        const ball = scoring.timeline.find((b) => b.batterId === id);
        return { id, name: ball?.batter?.name || "Unknown" };
      })
    : [];

  const filteredBalls = scoring
    ? scoring.timeline.filter((ball) => {
        if (selectedBatsman !== "all" && ball.batterId !== selectedBatsman)
          return false;
        if (!ball.fieldingPosition) return false;
        if (runFilter === "boundaries")
          return ball.isBoundary || ball.isFour || ball.isSix;
        if (runFilter === "wickets") return ball.isWicket;
        return true;
      })
    : [];

  return (
    <div className="min-h-screen bg-black text-white pb-20 force-open-sans relative">
      {/* Pause Reason Watermark Overlay */}
      {liveScore?.timerState === "PAUSED" && liveScore?.pauseReason && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
          style={{ perspective: "600px" }}
        >
          <div className="text-center" style={{ transform: "rotate(-18deg)" }}>
            <div
              className="text-[clamp(2.5rem,10vw,6rem)] font-black uppercase tracking-[0.15em] text-red-500/15 leading-none whitespace-nowrap select-none"
              style={{
                fontFamily: "'Open Sans', sans-serif",
                textShadow: "0 0 40px rgba(239,68,68,0.08)",
              }}
            >
              {getStatusLabel(liveScore.pauseReason)}
            </div>
            <div className="mt-2 text-[clamp(0.6rem,2vw,1rem)] font-black uppercase tracking-[0.4em] text-red-500/10 select-none">
              Match Paused
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-4">
          <GlobalBackButton />
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tighter text-white truncate">
              Match Performance
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black truncate">
                Post-Match Analytics
              </p>
              {liveScore?.timerState === "PAUSED" && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-[4px] text-[7px] font-black uppercase tracking-widest animate-pulse shrink-0">
                  <div className="w-1 h-1 rounded-full bg-red-500" />
                  {getStatusLabel(liveScore?.pauseReason || liveScore?.status)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {connected && (
              <div className="flex items-center gap-1 px-2 py-1.5 bg-success/10 text-success border border-success/20 rounded-[6px] text-[8px] font-black uppercase tracking-widest">
                <Wifi size={10} className="animate-pulse" />
                <span className="hidden sm:inline">Live Sync</span>
                <span className="sm:hidden">Sync</span>
              </div>
            )}
            <Button
              onClick={handleShare}
              disabled={isCapturing}
              className="p-2 sm:p-3 bg-success/10 text-success border border-success/20 rounded-[8px] hover:bg-success hover:text-black transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Share2 size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">
                Share Card
              </span>
            </Button>
          </div>
        </div>
      </div>

      {youtubeVideoId && (
        <div className="w-full bg-black border-b border-white/5 flex justify-center">
          <div className="w-full max-w-4xl aspect-video relative">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1`}
              title="Match Live Stream"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="bg-[#050505] border-b border-white/5 sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto flex overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: "Overview", icon: Trophy },
            { id: "live-score", label: "Live Score", icon: Radio },
            { id: "scorecard", label: "Scorecard", icon: Award },
            { id: "wagon-wheel", label: "Wagon Wheel", icon: Target },
            { id: "worm-chart", label: "Run Progression", icon: TrendingUp },
            { id: "timeline", label: "Timeline", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${active ? "border-success text-success bg-white/[0.02]" : "border-transparent text-gray-500 hover:text-white"}`}
              >
                <Icon size={14} />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6" ref={captureRef}>
        {/* Branding for Capture */}
        {isCapturing && (
          <div className="text-center py-8 border-b border-white/5 mb-8">
            <h2 className="text-4xl font-black text-success tracking-tighter uppercase mb-2">
              Kridaz Performance
            </h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">
              Official Match Scorecard
            </p>
          </div>
        )}

        {/* Dynamic Panels */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* MVP Card - Compact View */}
            {mvp && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-4 sm:p-5 shadow-2xl"
              >
                {/* Background Radial Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/15 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />

                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3">
                      <div className="absolute inset-0 bg-success rounded-full blur-md opacity-40"></div>
                      <div className="relative w-full h-full rounded-full border-2 border-success bg-zinc-900 shadow-xl overflow-hidden flex items-center justify-center">
                        {mvp.profilePicture ? (
                          <img
                            src={mvp.profilePicture}
                            alt={mvp.name}
                            className="w-full h-full object-cover scale-110 transition-transform duration-500 group-hover:scale-100"
                          />
                        ) : (
                          <span className="text-lg font-black text-white opacity-50">
                            {mvp.name?.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-success to-yellow-500 w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-900 shadow-lg transform -rotate-12">
                        <Trophy className="w-2.5 h-2.5 text-black fill-black" />
                      </div>
                    </div>

                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-success mb-0.5 truncate">
                        Player of the Match
                      </span>
                      <h2 className="text-base sm:text-lg font-black uppercase tracking-tighter text-white truncate">
                        {mvp.name}
                      </h2>
                      <p className="text-neutral-500 font-black uppercase tracking-widest text-[8px] truncate">
                        {mvp.points} Performance Points
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center px-3 py-2 bg-white/[0.02] border border-white/10 rounded-[6px] shrink-0">
                    <span className="block text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-0.5">
                      PTS
                    </span>
                    <span className="text-lg sm:text-xl font-black text-success">
                      {mvp.points}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[8px] flex flex-col group hover:border-success/30 transition-colors">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">
                  Total Runs
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">
                    {liveScore?.totalRuns ??
                      scoring?.innings?.[0]?.totalRuns ??
                      0}
                  </span>
                  <span className="text-sm font-black text-neutral-600">
                    /{" "}
                    {liveScore?.totalWickets ??
                      scoring?.innings?.[0]?.totalWickets ??
                      0}
                  </span>
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[8px] flex flex-col group hover:border-success/30 transition-colors">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">
                  Run Rate
                </span>
                <span className="text-4xl font-black text-secondary">
                  {liveScore?.crr ?? stats?.runRate ?? "0.00"}
                </span>
              </div>
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[8px] flex flex-col group hover:border-success/30 transition-colors">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">
                  Total Fours
                </span>
                <span className="text-4xl font-black text-white">
                  {stats?.totalFours || 0}
                </span>
              </div>
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[8px] flex flex-col group hover:border-success/30 transition-colors">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">
                  Total Sixes
                </span>
                <span className="text-4xl font-black text-white">
                  {stats?.totalSixes || 0}
                </span>
              </div>
            </div>

            {/* Match Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Match Meta Card */}
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 border-b border-white/5 pb-4">
                  Match Details
                </h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <span className="block text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                      Venue
                    </span>
                    <span className="text-sm font-bold text-white truncate block">
                      {scoring?.game?.customVenue ||
                        scoring?.game?.turf?.name ||
                        "Local enue"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                      Location
                    </span>
                    <span className="text-sm font-bold text-white block">
                      {scoring?.game?.city ||
                        scoring?.game?.state ||
                        scoring?.game?.location ||
                        "Location Unspecified"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                      Ball Type
                    </span>
                    <span className="text-sm font-bold text-white uppercase">
                      {scoring?.game?.ballType || "Tennis"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                      Format / Overs
                    </span>
                    <span className="text-sm font-bold text-white">
                      {scoring?.oversPerInnings || 20} Overs
                    </span>
                  </div>
                </div>
              </div>

              {/* Toss & Play Card */}
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 border-b border-white/5 pb-4">
                  Toss & Officials
                </h3>
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <span className="block text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                      Toss Winner
                    </span>
                    <span className="text-sm font-bold text-success uppercase">
                      {scoring?.game?.tossWinner === scoring?.game?.teamA?.id ||
                      scoring?.game?.tossWinner === "teamA"
                        ? teamAName
                        : scoring?.game?.tossWinner ===
                              scoring?.game?.teamB?.id ||
                            scoring?.game?.tossWinner === "teamB"
                          ? teamBName
                          : "No Toss Record"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                      Decision
                    </span>
                    <span className="text-sm font-bold text-white uppercase">
                      {scoring?.game?.tossDecision
                        ? `${scoring.game.tossDecision} First`
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                      Duration
                    </span>
                    <span className="text-sm font-bold text-white block">
                      {scoring?.totalDurationSeconds
                        ? `${Math.floor(scoring.totalDurationSeconds / 3600)}h ${Math.floor((scoring.totalDurationSeconds % 3600) / 60)}m`
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-1">
                      Umpire
                    </span>
                    <span className="text-sm font-bold text-white truncate block">
                      {scoring?.matchOfficials?.umpire ||
                        scoring?.game?.customUmpire?.name ||
                        "Official Umpire"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performers List */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Award className="text-success" />
                  Impact Leaders
                </h3>
              </div>
              <div className="grid gap-4">
                {stats?.topPerformers?.map((player, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-white/[0.01] border border-white/10 rounded-[8px] group hover:bg-white/[0.02] transition-all"
                  >
                    <div className="text-xl font-black text-white/20 w-8">
                      {idx + 1}
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                      {player.profilePicture ? (
                        <img
                          src={player.profilePicture}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-black text-white/50">
                          {player.name?.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black uppercase text-sm">
                        {player.name}
                      </h4>
                      <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width:
                              mvp?.points > 0
                                ? `${(player.points / mvp.points) * 100}%`
                                : "0%",
                          }}
                          className="h-full bg-success"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                        Points
                      </span>
                      <span className="text-lg font-black text-success">
                        {player.points}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "live-score" && (
          <div className="max-w-xl mx-auto space-y-4">
            {liveScore ? (
              <>
                {/* 1. Score Hero */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] rounded-[8px] p-8 text-center"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-success/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

                  {liveScore.isSuperOver && (
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(250,204,21,0.15)] animate-pulse">
                        ⚡ Super Over
                      </span>
                    </div>
                  )}
                  {liveScore.isFollowOn && (
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1.5 bg-blue-400/10 border border-blue-400/30 text-blue-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                        🔄 Follow-On
                      </span>
                    </div>
                  )}

                  {liveScore.result && (
                    <div className="mb-6 py-2 px-4 bg-success/20 border border-success/30 rounded-[8px]">
                      <p className="text-success text-[10px] font-black uppercase tracking-[0.3em] mb-1">
                        Final Result
                      </p>
                      <h2 className="text-lg font-black italic uppercase tracking-tighter text-white">
                        {liveScore.result}
                      </h2>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 mb-3">
                    <TeamBadge
                      team={{
                        image: liveScore.battingTeamImage,
                        name: liveScore.battingTeamName,
                      }}
                      fallbackName={liveScore.battingTeamName}
                      size="xs"
                    />
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">
                      {liveScore.battingTeamName} —{" "}
                      {liveScore.result ? "Final Score" : "Current Score"}
                    </p>
                  </div>

                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-7xl font-black tracking-tighter italic leading-none">
                      {liveScore.totalRuns}
                    </span>
                    <span className="text-4xl font-black text-success italic">
                      /
                    </span>
                    <span className="text-5xl font-black tracking-tighter italic leading-none text-white/90">
                      {liveScore.totalWickets}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-3 flex-wrap mt-3 text-[11px] font-bold text-gray-400">
                    <span className="bg-white/[0.04] px-3 py-1 rounded-full">
                      {liveScore.overString} OVERS
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/15" />
                    <span className="bg-success/10 text-success px-3 py-1 rounded-[6px] flex items-center gap-1">
                      <TrendingUp size={10} /> CRR {liveScore.crr}
                    </span>
                  </div>

                  {liveScore.target && (
                    <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[9px] font-black text-success uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                          <Target size={9} /> Target
                        </p>
                        <p className="text-2xl font-black">
                          {liveScore.target}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                          Need
                        </p>
                        <p className="text-2xl font-black text-yellow-400">
                          {liveScore.runsNeeded ??
                            liveScore.target - liveScore.totalRuns}
                        </p>
                        <p className="text-[8px] text-gray-600 font-bold">
                          from{" "}
                          {liveScore.ballsRemaining ??
                            (liveScore.maxOvers || 20) * 6 -
                              (liveScore.overs * 6 + liveScore.balls)}{" "}
                          balls
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                          RRR
                        </p>
                        <p className="text-2xl font-black text-green-400">
                          {liveScore.runsNeeded && liveScore.ballsRemaining
                            ? (
                                (liveScore.runsNeeded /
                                  liveScore.ballsRemaining) *
                                6
                              ).toFixed(2)
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {liveScore.freeHitActive && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-4 bg-yellow-400/10 border border-yellow-400/50 rounded-[8px] p-3 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.1)]"
                  >
                    <span className="text-sm">⚡</span>
                    <p className="text-yellow-400 font-black text-xs tracking-[0.2em] uppercase">
                      FREE HIT ACTIVE
                    </p>
                  </motion.div>
                )}

                {/* 2. Batsmen */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-[8px] overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-white/[0.05]">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                      Batting
                    </h3>
                    <Zap size={12} className="text-success" />
                  </div>
                  <div className="px-5 py-3 space-y-1">
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 text-[8px] font-black text-gray-600 uppercase tracking-widest pb-1">
                      <span>Player</span>
                      <span className="text-right w-6">R</span>
                      <span className="text-right w-6">B</span>
                      <span className="text-right w-6">4s</span>
                      <span className="text-right w-6">6s</span>
                      <span className="text-right w-10">SR</span>
                    </div>
                    {[liveScore.batters?.[0], liveScore.batters?.[1]]
                      .filter(Boolean)
                      .map((p, i) => (
                        <div
                          key={i}
                          className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center py-2 rounded-[8px] px-1 ${i === 0 ? "bg-success/5" : ""}`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {i === 0 && (
                              <div className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                            )}
                            <PlayerAvatar
                              src={p.profilePicture}
                              name={p.name}
                              active={i === 0}
                            />
                            <span
                              className={`text-[11px] font-black uppercase truncate ${i === 0 ? "text-white" : "text-gray-500"}`}
                            >
                              {p.name}
                            </span>
                            {i === 0 && (
                              <span className="text-[8px] text-success font-black shrink-0">
                                *
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-right text-sm font-black w-6 ${i === 0 ? "text-white" : "text-gray-500"}`}
                          >
                            {p.runs}
                          </span>
                          <span className="text-right text-[10px] font-bold text-gray-600 w-6">
                            {p.balls}
                          </span>
                          <span className="text-right text-[10px] font-bold text-blue-400 w-6">
                            {p.fours ?? 0}
                          </span>
                          <span className="text-right text-[10px] font-bold text-purple-400 w-6">
                            {p.sixes ?? 0}
                          </span>
                          <span
                            className={`text-right text-[10px] font-black w-10 ${i === 0 ? "text-success" : "text-gray-600"}`}
                          >
                            {p.strikeRate ??
                              (p.balls > 0
                                ? ((p.runs / p.balls) * 100).toFixed(0)
                                : "0.0")}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 3. Bowler */}
                {liveScore.bowler && (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-[8px] overflow-hidden">
                    <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-white/[0.05]">
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                        Bowling
                      </h3>
                      <Radio size={12} className="text-blue-400" />
                    </div>
                    <div className="px-5 py-3">
                      <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 text-[8px] font-black text-gray-600 uppercase tracking-widest pb-2">
                        <span>Bowler</span>
                        <span className="text-right w-6">O</span>
                        <span className="text-right w-6">M</span>
                        <span className="text-right w-6">R</span>
                        <span className="text-right w-6">W</span>
                        <span className="text-right w-10">Econ</span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center py-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <PlayerAvatar
                            src={liveScore.bowler.profilePicture}
                            name={liveScore.bowler.name}
                            isBowler={true}
                          />
                          <span className="text-[11px] font-black uppercase truncate text-white">
                            {liveScore.bowler.name}
                          </span>
                        </div>
                        <span className="text-right text-sm font-black text-white w-6">
                          {liveScore.bowler.overs}.{liveScore.bowler.balls}
                        </span>
                        <span className="text-right text-[10px] font-bold text-gray-600 w-6">
                          {liveScore.bowler.maidens ?? 0}
                        </span>
                        <span className="text-right text-[10px] font-bold text-white w-6">
                          {liveScore.bowler.runs}
                        </span>
                        <span className="text-right text-sm font-black text-red-400 w-6">
                          {liveScore.bowler.wickets}
                        </span>
                        <span className="text-right text-[10px] font-black text-success w-10">
                          {liveScore.bowler.economy}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. This Over */}
                {liveScore.last6Balls?.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-[8px] overflow-hidden">
                    <div className="px-5 pt-4 pb-3">
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">
                        This Over
                      </h3>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {liveScore.last6Balls.slice(-6).map((b, i) => (
                          <div
                            key={i}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-lg ${getBallCls(b)}`}
                          >
                            {getBallLabel(b)}
                          </div>
                        ))}
                        {Array.from({
                          length: Math.max(
                            0,
                            6 - (liveScore.last6Balls?.length || 0)
                          ),
                        }).map((_, i) => (
                          <div
                            key={`ph-${i}`}
                            className="w-10 h-10 rounded-full border-2 border-dashed border-white/[0.08] shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-8 text-center">
                <p className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-2">
                  Live Scoreboard Offline
                </p>
                <p className="text-sm text-gray-400">
                  The match has not started or is currently offline.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "scorecard" && (
          <div className="space-y-12">
            {scoring?.innings?.map((inn, innIdx) => {
              const inningsBattingStats = scoring.playerStats?.filter(
                (s) => s.inningsIndex === inn.inningsIndex && (s.battingBalls > 0 || s.battingRuns > 0)
              ) || [];
              
              const inningsBowlingStats = scoring.playerStats?.filter(
                (s) => s.inningsIndex === inn.inningsIndex && s.bowlingBalls > 0
              ) || [];

              if (inningsBattingStats.length === 0 && inningsBowlingStats.length === 0) return null;

              const teamName = inn.battingTeam === "teamA" ? teamAName : teamBName;
              
              const formatInningsLabel = () => {
                let label = `${teamName} Innings`;
                if (inn.isSuperOver) return `${teamName} — Super Over ⚡`;
                if (inn.isFollowOn) return `${teamName} — Follow-On 🔄`;
                return label;
              };

              const ballsPerOver = scoring?.houseRules?.ballsPerOver || 6;
              const overString = `${Math.floor(inn.totalBalls / ballsPerOver)}.${inn.totalBalls % ballsPerOver}`;

              return (
                <div key={inn.id || innIdx} className="space-y-8">
                  {/* Innings Title Banner */}
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-[8px] px-8 py-5 flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase tracking-widest text-success">
                      {formatInningsLabel()}
                    </h4>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {inn.totalRuns} / {inn.totalWickets} ({overString} Ov)
                    </span>
                  </div>

                  {/* Batting Scorecard */}
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-lg font-black uppercase tracking-tighter">
                        Batting Scorecard
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/5 text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                            <th className="px-8 py-4">Batter</th>
                            <th className="px-4 py-4">Status</th>
                            <th className="px-4 py-4 text-right">R</th>
                            <th className="px-4 py-4 text-right">B</th>
                            <th className="px-4 py-4 text-right">4s</th>
                            <th className="px-4 py-4 text-right">6s</th>
                            <th className="px-8 py-4 text-right">SR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {inningsBattingStats.map((s, i) => {
                            const sr =
                              s.battingBalls > 0
                                ? ((s.battingRuns / s.battingBalls) * 100).toFixed(2)
                                : "0.00";
                            return (
                              <tr
                                key={i}
                                className="group hover:bg-white/[0.01] transition-colors"
                              >
                                <td className="px-8 py-4 font-bold text-sm uppercase text-white">
                                  {s.user?.name}
                                </td>
                                <td className="px-4 py-4 text-[10px] text-gray-500 font-black uppercase">
                                  {formatOutStatus(s)}
                                </td>
                                <td className="px-4 py-4 text-right font-black text-success">
                                  {s.battingRuns || 0}
                                </td>
                                <td className="px-4 py-4 text-right text-gray-400 text-sm">
                                  {s.battingBalls || 0}
                                </td>
                                <td className="px-4 py-4 text-right text-gray-400 text-sm">
                                  {s.battingFours || 0}
                                </td>
                                <td className="px-4 py-4 text-right text-gray-400 text-sm">
                                  {s.battingSixes || 0}
                                </td>
                                <td className="px-8 py-4 text-right font-bold text-sm text-secondary">
                                  {sr}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bowling Scorecard */}
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-lg font-black uppercase tracking-tighter">
                        Bowling Scorecard
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/5 text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                            <th className="px-8 py-4">Bowler</th>
                            <th className="px-4 py-4 text-right">O</th>
                            <th className="px-4 py-4 text-right">M</th>
                            <th className="px-4 py-4 text-right">R</th>
                            <th className="px-4 py-4 text-right">W</th>
                            <th className="px-4 py-4 text-right">Econ</th>
                            <th className="px-4 py-4 text-right">WD</th>
                            <th className="px-8 py-4 text-right">NB</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {inningsBowlingStats.map((s, i) => {
                            const overs = `${Math.floor(s.bowlingBalls / ballsPerOver)}.${s.bowlingBalls % ballsPerOver}`;
                            const econ =
                              s.bowlingBalls > 0
                                ? ((s.bowlingRuns / s.bowlingBalls) * ballsPerOver).toFixed(2)
                                : "0.00";
                            return (
                              <tr
                                key={i}
                                className="group hover:bg-white/[0.01] transition-colors"
                              >
                                <td className="px-8 py-4 font-bold text-sm uppercase text-white">
                                  {s.user?.name}
                                </td>
                                <td className="px-4 py-4 text-right font-bold text-sm text-gray-300">
                                  {overs}
                                </td>
                                <td className="px-4 py-4 text-right text-gray-400 text-sm">
                                  {s.bowlingMaidens || 0}
                                </td>
                                <td className="px-4 py-4 text-right text-gray-400 text-sm">
                                  {s.bowlingRuns || 0}
                                </td>
                                <td className="px-4 py-4 text-right font-black text-success">
                                  {s.bowlingWickets || 0}
                                </td>
                                <td className="px-4 py-4 text-right text-secondary font-bold text-sm">
                                  {econ}
                                </td>
                                <td className="px-4 py-4 text-right text-gray-400 text-sm">
                                  {s.bowlingWides || 0}
                                </td>
                                <td className="px-8 py-4 text-right text-gray-400 text-sm">
                                  {s.bowlingNoBalls || 0}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}

            {(!scoring?.innings || scoring.innings.length === 0) && (
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-12 text-center text-xs text-gray-500 uppercase tracking-widest font-bold">
                No Scorecard Records Yet
              </div>
            )}
          </div>
        )}

        {activeTab === "wagon-wheel" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Filters panel */}
            <div className="lg:col-span-1 space-y-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                  <Target className="text-success" />
                  Wagon Wheel Filters
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                      Select Batsman
                    </label>
                    <Select
                      value={selectedBatsman}
                      onChange={(e) => setSelectedBatsman(e.target.value)}
                      className="w-full bg-card border border-white/10 rounded-[8px] px-4 py-3 text-sm text-white focus:outline-none focus:border-success uppercase font-bold"
                    >
                      <option value="all">All Batsmen</option>
                      {batsmenInTimeline.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-neutral-600 uppercase tracking-widest">
                      Display Filter
                    </label>
                    <div className="flex flex-col gap-2">
                      {[
                        { id: "all", label: "All Shots" },
                        {
                          id: "boundaries",
                          label: "Boundaries Only (4s & 6s)",
                        },
                        { id: "wickets", label: "Wickets Only" },
                      ].map((filter) => (
                        <Button
                          key={filter.id}
                          onClick={() => setRunFilter(filter.id)}
                          className={`w-full text-left px-4 py-3 rounded-[8px] text-xs font-black uppercase tracking-widest transition-all ${runFilter === filter.id ? "bg-success text-black" : "bg-card border border-white/10 text-gray-400 hover:text-white"}`}
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6 mt-6 space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-3.5 h-3.5 bg-success rounded-full inline-block" />
                  <span className="text-gray-400 uppercase tracking-wider font-bold text-[10px]">
                    Sixes (6 Runs)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-3.5 h-3.5 bg-secondary rounded-full inline-block" />
                  <span className="text-gray-400 uppercase tracking-wider font-bold text-[10px]">
                    Fours (4 Runs)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-3.5 h-3.5 bg-white/30 rounded-full inline-block" />
                  <span className="text-gray-400 uppercase tracking-wider font-bold text-[10px]">
                    Singles / Doubles
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-3.5 h-3.5 bg-destructive rounded-full inline-block" />
                  <span className="text-gray-400 uppercase tracking-wider font-bold text-[10px]">
                    Wickets
                  </span>
                </div>
              </div>
            </div>

            {/* Wagon Wheel Graphic */}
            <div className="lg:col-span-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-8 flex flex-col items-center justify-center relative min-h-[440px]">
              {/* Telemetry Tooltip */}
              {hoveredShot && (
                <div className="absolute top-4 left-4 bg-black/95 border border-white/10 p-4 rounded-[8px] shadow-2xl z-20 max-w-xs animate-fade-in backdrop-blur-xl">
                  <div className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-1">
                    Shot Telemetry
                  </div>
                  <div className="text-sm font-black text-success">
                    {hoveredShot.batter?.name}
                  </div>
                  <div className="text-xs text-white/90 mt-1">
                    {hoveredShot.isWicket ? (
                      <span className="text-destructive font-bold">
                        WICKET ({hoveredShot.wicketType})
                      </span>
                    ) : (
                      <span>
                        Scored{" "}
                        <strong className="text-white">
                          {hoveredShot.runs}
                        </strong>{" "}
                        run(s) off {hoveredShot.bowler?.name}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-3 font-black uppercase tracking-wider bg-white/5 px-2.5 py-1.5 rounded-[8px] inline-block">
                    Over {hoveredShot.over}.{hoveredShot.ballInOver} &bull;{" "}
                    {hoveredShot.fieldingPosition}{" "}
                    {hoveredShot.distance ? `(${hoveredShot.distance})` : ""}
                  </div>
                </div>
              )}

              <svg
                viewBox="0 0 300 300"
                className="w-full max-w-[340px] aspect-square drop-shadow-[0_0_20px_rgba(0,193,135,0.05)]"
              >
                {/* Outfield Grass */}
                <circle
                  cx="150"
                  cy="150"
                  r="135"
                  fill="#071912"
                  fillOpacity="0.25"
                  stroke="var(--success)"
                  strokeOpacity="0.3"
                  strokeWidth="2"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="133"
                  fill="none"
                  stroke="var(--success)"
                  strokeOpacity="0.1"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />

                {/* 30-Yard Circle */}
                <circle
                  cx="150"
                  cy="150"
                  r="75"
                  fill="none"
                  stroke="#222"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />

                {/* Pitch Area */}
                <rect
                  x="146"
                  y="125"
                  width="8"
                  height="50"
                  fill="#dfc092"
                  opacity="0.8"
                  rx="1"
                />

                {/* Stumps */}
                <line
                  x1="146"
                  y1="128"
                  x2="154"
                  y2="128"
                  stroke="#111"
                  strokeWidth="1.5"
                />
                <line
                  x1="146"
                  y1="172"
                  x2="154"
                  y2="172"
                  stroke="#111"
                  strokeWidth="1.5"
                />

                {/* Creases */}
                <line
                  x1="140"
                  y1="133"
                  x2="160"
                  y2="133"
                  stroke="#999"
                  strokeWidth="0.5"
                />
                <line
                  x1="140"
                  y1="167"
                  x2="160"
                  y2="167"
                  stroke="#999"
                  strokeWidth="0.5"
                />

                {/* Trajectory Lines */}
                {filteredBalls.map((ball, index) => {
                  const coords = getFieldingCoords(ball.fieldingPosition);

                  let strokeColor = "rgba(255,255,255,0.25)";
                  let strokeWidth = 1.5;
                  let strokeDash = undefined;

                  if (ball.isSix) {
                    strokeColor = "var(--success)";
                    strokeWidth = 3;
                  } else if (ball.isFour) {
                    strokeColor = "var(--secondary)";
                    strokeWidth = 2.5;
                  } else if (ball.isWicket) {
                    strokeColor = "var(--destructive)";
                    strokeWidth = 2;
                    strokeDash = "3,3";
                  }

                  return (
                    <g key={ball.id || index} className="group cursor-pointer">
                      <line
                        x1="150"
                        y1="150"
                        x2={coords.x}
                        y2={coords.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDash}
                        className="transition-all duration-300 hover:stroke-white hover:stroke-[4px]"
                        onMouseEnter={() => setHoveredShot(ball)}
                        onMouseLeave={() => setHoveredShot(null)}
                      />
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={ball.isSix ? 4.5 : ball.isFour ? 3.5 : 2.5}
                        fill={strokeColor}
                        className="transition-all duration-300 group-hover:scale-150"
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="text-[10px] text-gray-500 text-center mt-6 uppercase tracking-wider font-bold">
                Hover lines to review shot coordinates and batters.
              </div>
            </div>
          </div>
        )}

        {activeTab === "worm-chart" && (
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                <TrendingUp className="text-success" />
                Run Progression (Worm Chart)
              </h3>
            </div>

            <div className="w-full h-[400px] select-none">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={wormData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid stroke="#111" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="over"
                    stroke="#444"
                    tick={{ fill: "#888", fontSize: 11 }}
                    label={{
                      value: "OVERS BOWLED",
                      position: "bottom",
                      offset: 0,
                      fill: "#444",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  />
                  <YAxis
                    stroke="#444"
                    tick={{ fill: "#888", fontSize: 11 }}
                    label={{
                      value: "CUMULATIVE RUNS",
                      angle: -90,
                      position: "left",
                      offset: 0,
                      fill: "#444",
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      borderColor: "#222",
                      borderRadius: "16px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ fontWeight: "bold", color: "#888" }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={teamAName}
                    stroke="var(--success)"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1, fill: "#000" }}
                    activeDot={{ r: 6 }}
                  />
                  {innings1Balls.length > 0 && (
                    <Line
                      type="monotone"
                      dataKey={teamBName}
                      stroke="var(--secondary)"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 1, fill: "#000" }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-8">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-2">
              <Activity className="text-success" />
              Ball-by-Ball Timeline
            </h3>
            <BallByBallHistory matchData={scoring} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchAnalytics;
