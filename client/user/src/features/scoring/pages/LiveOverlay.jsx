/**
 * LiveOverlay.jsx
 * ────────────────────────────────────────────────────────────────────────────
 * Transparent OBS Browser-Source overlay for cricket live streaming.
 *
 * Usage in OBS:
 * Sources → + → Browser → URL: /live-overlay/:matchId?token=<overlayToken>
 * Width: 1920 Height: 1080 ✅ Transparent background
 *
 * Architecture:
 * • On mount → HTTP GET /api/scoring/live-score/:matchId (initial state)
 * • Then → Socket.io "joinMatch" on room matchId
 * • Listens → "scoreUpdated" (score data), "ballEvent" (animation trigger)
 * • On drop → freezes in place; auto-reconnects & re-fetches via HTTP
 * ────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { NeonClassicPack, SportsNetworkPack } from "../themes";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:6001";

const THEME_MAP = {
  neon_classic: NeonClassicPack,
  classic: NeonClassicPack, // legacy alias for old DB records
  sports_network: SportsNetworkPack,
};

// ─── Badge duration config per event type for state timings ──────────────────
const BADGE_CFG = {
  six: { dur: 2800 },
  four: { dur: 2400 },
  wicket: { dur: 3200 },
  wide: { dur: 1600 },
  no_ball: { dur: 1600 },
};

// ─── CSS injected once into the document head ────────────────────────────────
const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, html {
    background: transparent !important;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
  }
  @keyframes tickerIn {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

function injectCSS(css) {
  if (document.getElementById("overlay-css")) return;
  const style = document.createElement("style");
  style.id = "overlay-css";
  style.textContent = css;
  document.head.appendChild(style);
}

// ─── Main overlay ─────────────────────────────────────────────────────────────
const LiveOverlay = () => {
  const { matchId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [score, setScore] = useState(null);
  const [badge, setBadge] = useState(null); // current animated badge
  const [activeCard, setActiveCard] = useState(null); // current card
  const [aiCommentary, setAiCommentary] = useState(null);
  const [connected, setConnected] = useState(false);
  const commentaryTimer = useRef(null);
  const socketRef = useRef(null);
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerificationStatus("failed");
        setVerificationError("Access Denied: Missing overlay token");
        return;
      }
      try {
        const r = await fetch(
          `${API_BASE}/api/scoring/overlay/verify/${matchId}?token=${encodeURIComponent(token)}`
        );
        const d = await r.json();
        if (r.ok && d.success) {
          setVerificationStatus("success");
        } else {
          setVerificationStatus("failed");
          setVerificationError(d.message || "Access Denied: Invalid overlay token");
        }
      } catch (err) {
        setVerificationStatus("failed");
        setVerificationError("Network Error: Failed to verify access token");
      }
    };
    verifyToken();
  }, [matchId, token]);
  // Silent global audio unlocker on first user interaction
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

  // ── Queue Manager ────────────────────────────────────────────────────────────
  const [eventQueue, setEventQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const processedTracker = useRef({ over: -1, milestones: {} });

  const enqueueEvent = useCallback((event) => {
    setEventQueue((prev) => [...prev, event]);
  }, []);

  // Watch for auto-generated events based on score changes
  useEffect(() => {
    if (!score) return;
    const events = [];

    // Check for milestone
    const milestoneBatter =
      score.batters?.find(
        (b) =>
          b.runs >= 50 &&
          b.runs < 100 &&
          !processedTracker.current.milestones[`${b.id}_50`]
      ) ||
      score.batters?.find(
        (b) =>
          b.runs >= 100 && !processedTracker.current.milestones[`${b.id}_100`]
      );

    if (milestoneBatter) {
      const milestoneType = milestoneBatter.runs >= 100 ? 100 : 50;
      processedTracker.current.milestones[
        `${milestoneBatter.id}_${milestoneType}`
      ] = true;
      events.push({
        category: "card",
        type: "milestone",
        data: milestoneBatter,
        dur: 8000,
      });
    }

    // Check for end of over
    if (
      score.balls === 0 &&
      score.overs > 0 &&
      processedTracker.current.over !== score.overs
    ) {
      processedTracker.current.over = score.overs;
      events.push({ category: "card", type: "eoo", data: score, dur: 8000 });
    }

    // Push auto-events to queue if they exist
    if (events.length > 0) {
      setEventQueue((prev) => [...prev, ...events]);
    }
  }, [score]);

  // Process the queue
  useEffect(() => {
    if (isProcessingQueue || eventQueue.length === 0) return;

    const processNextEvent = async () => {
      setIsProcessingQueue(true);
      const nextEvent = eventQueue[0];

      if (nextEvent.category === "animation") {
        setBadge(nextEvent);
        await new Promise((resolve) =>
          setTimeout(resolve, nextEvent.dur || 3000)
        );
        setBadge(null);
      } else if (nextEvent.category === "card") {
        setActiveCard(nextEvent);
        await new Promise((resolve) =>
          setTimeout(resolve, nextEvent.dur || 8000)
        );
        setActiveCard(null);
      }

      // Short delay between events
      await new Promise((resolve) => setTimeout(resolve, 500));

      setEventQueue((prev) => prev.slice(1));
      setIsProcessingQueue(false);
    };

    processNextEvent();
  }, [eventQueue, isProcessingQueue]);

  injectCSS(GLOBAL_CSS);

  // ── HTTP fallback ────────────────────────────────────────────────────────────
  const fetchScore = useCallback(async () => {
    if (verificationStatus !== "success") return;
    try {
      const r = await fetch(`${API_BASE}/api/scoring/live-score/${matchId}`);
      if (!r.ok) return;
      const d = await r.json();
      if (d.success && d.data) setScore(d.data);
    } catch (_) {
      /* silent */
    }
  }, [matchId, verificationStatus]);

  // ── Helper ───────────────────────────────────────────────────────────────────
  function buildDesc(type, data) {
    if (type === "six")
      return `${data?.strikerName || ""} hits a MAXIMUM!`.trim();
    if (type === "four")
      return `${data?.strikerName || ""} finds the boundary!`.trim();
    if (type === "wicket")
      return `OUT! ${data?.wicketType?.replace(/_/g, " ") || ""}`.trim();
    if (type === "wide") return "Wide ball";
    if (type === "no_ball") return "No Ball!";
    return "";
  }

  // ── Socket.io ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (verificationStatus !== "success") return;
    fetchScore();

    const socket = io(API_BASE, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit("joinMatch", matchId);
      if (token) socket.emit("overlayJoin", { matchId, token });
    };

    socket.on("connect", () => {
      setConnected(true);
      joinRoom();
      fetchScore(); // re-sync on reconnect
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("reconnect", () => {
      setConnected(true);
      joinRoom();
      fetchScore();
    });

    // Primary score update ────────────────────────────────────────────────────
    socket.on("scoreUpdated", (data) => {
      setScore(data);
      // Derive badge from lastBallRaw if no explicit ballEvent follows
      const lb = data?.lastBallRaw;
      if (lb && lb.id !== processedTracker.current.lastBallId) {
        processedTracker.current.lastBallId = lb.id;
        let type = null;
        if (lb.isWicket) type = "wicket";
        else if (lb.isBoundary && lb.runs === 6) type = "six";
        else if (lb.isBoundary && lb.runs === 4) type = "four";
        else if (lb.extraType === "WIDE") type = "wide";
        else if (lb.extraType === "NO_BALL") type = "no_ball";
        else if (lb.runs === 0 && !lb.isExtra) type = "dot";

        if (type) {
          const dur = BADGE_CFG[type]?.dur || 3000;
          enqueueEvent({
            category: "animation",
            type,
            description: buildDesc(type, {
              strikerName: data?.batters?.[0]?.name,
              wicketType: lb.wicketType,
            }),
            ...lb,
            dur,
          });
        }
      }
    });

    // Explicit ball event (emitted separately by controller)
    socket.on("ballEvent", (ev) => {
      if (ev.type) {
        const dur = BADGE_CFG[ev.type]?.dur || 3000;
        enqueueEvent({
          category: "animation",
          type: ev.type,
          description: buildDesc(ev.type, ev),
          ...ev,
          dur,
        });
      }
    });

    // Explicit card event
    socket.on("cardEvent", (ev) => {
      if (ev.type) {
        enqueueEvent({
          category: "card",
          type: ev.type,
          data: ev.data,
          dur: ev.dur || 8000,
        });
      }
    });

    socket.on("matchEnded", () => {
      setScore((prev) => (prev ? { ...prev, _ended: true } : prev));
    });

    // Theme-only update (fired when no cached score exists on backend)
    socket.on("themeUpdated", (newTheme) => {
      setScore((prev) => (prev ? { ...prev, tickerTheme: newTheme } : prev));
    });

    // Handle Streaming Text Chunks
    socket.on("COMMENTARY_CHUNK", (data) => {
      clearTimeout(commentaryTimer.current);
      setAiCommentary((prev) => {
        if (!prev) return { text: data.chunk, language: data.language };
        return { ...prev, text: prev.text + data.chunk };
      });

      // Auto-hide after stream finishes if no audio comes (fallback timer)
      if (data.isFinished) {
        commentaryTimer.current = setTimeout(() => {
          setAiCommentary(null);
        }, 15000);
      }
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

    // Handle Audio Readiness (arrives a few seconds after text stream finishes)
    socket.on("COMMENTARY_AUDIO_READY", (data) => {
      clearTimeout(commentaryTimer.current);

      // Auto-hide 15 seconds after audio is ready
      commentaryTimer.current = setTimeout(() => {
        setAiCommentary(null);
      }, 15000);

      if (data.audioUrl) {
        const audio = new Audio(`${API_BASE}${data.audioUrl}`);
        audio.play().catch((e) => {
          console.warn(
            "Overlay audio autoplay blocked or failed, falling back to Browser TTS:",
            e
          );
          speakBrowserTTS(data.text, data.language);
        });
      } else {
        // Fallback to BROWSER_TTS
        speakBrowserTTS(data.text, data.language);
      }
    });

    return () => {
      clearTimeout(commentaryTimer.current);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [matchId, token, fetchScore, enqueueEvent, verificationStatus]);

  // ─── Verification Check ──────────────────────────────────────────────────────
  if (verificationStatus === "verifying") {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        fontFamily: "system-ui, sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "4px solid rgba(255,255,255,0.1)",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px"
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: "16px", fontWeight: "600", letterSpacing: "0.05em" }}>VERIFYING OVERLAY ACCESS...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === "failed") {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "rgba(15, 23, 42, 0.95)",
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif"
      }}>
        <div style={{
          textAlign: "center",
          maxWidth: "480px",
          padding: "32px",
          borderRadius: "16px",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          background: "rgba(30, 41, 59, 0.7)",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5)"
        }}>
          <div style={{
            fontSize: "48px",
            color: "#ef4444",
            marginBottom: "16px"
          }}>⚠️</div>
          <h2 style={{
            fontSize: "20px",
            fontWeight: "700",
            marginBottom: "8px",
            color: "#f1f5f9"
          }}>Access Denied</h2>
          <p style={{
            fontSize: "14px",
            color: "#94a3b8",
            lineHeight: "1.5"
          }}>{verificationError}</p>
        </div>
      </div>
    );
  }

  // ─── Nothing to render until first data ─────────────────────────────────────
  if (!score) return null;

  if (score.status === "NOT_STARTED" || !score.isLive) {
    const venue =
      score.game?.customVenue || score.game?.turf?.name || "Local enue";
    const loc =
      score.game?.city ||
      score.game?.state ||
      score.game?.location ||
      "Location Unspecified";
    const professionals = score.game?.customProfessionals || [];

    return (
      <div
        className="force-open-sans"
        style={{
          width: "100vw",
          height: "100vh",
          background: "transparent",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Open Sans', sans-serif",
        }}
        onClick={() => {
          // Unlock browser autoplay policy
          const unlockAudio = new Audio(
            "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
          );
          unlockAudio.play().catch(() => {});
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background: "rgba(5,5,5,0.95)",
            backdropFilter: "blur(20px)",
            borderTop: "2px solid var(--primary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            animation: "tickerIn 0.6s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ color: "var(--primary)" }}>
              {score.teamA?.name || "TBD"}
            </span>
            <span style={{ opacity: 0.5, margin: "0 16px", fontSize: 20 }}>
              VS
            </span>
            <span style={{ color: "var(--primary)" }}>
              {score.teamB?.name || "TBD"}
            </span>
            <span
              style={{
                marginLeft: 32,
                fontSize: 20,
                color: "#9ca3af",
                backgroundColor: "rgba(255,255,255,0.1)",
                padding: "4px 12px",
                borderRadius: "8px",
              }}
            >
              MATCH STARTS SOON
            </span>
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#cbd5e1",
              display: "flex",
              gap: "24px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            <span>
              📍 {venue}, {loc}
            </span>
            {professionals.length > 0 && <span>⭐ Featuring Pro Players</span>}
          </div>
        </div>
      </div>
    );
  }

  // Fallback to neon_classic theme pack
  const ActivePack = THEME_MAP[score.tickerTheme] || NeonClassicPack;
  const ActiveTicker = ActivePack.Ticker;
  const ActiveCards = ActivePack.Cards;
  const ActiveAnimation = ActivePack.Animation;

  return (
    <div
      className="force-open-sans"
      style={{
        width: "100vw",
        height: "100vh",
        background: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
      onClick={() => {
        // Unlock browser autoplay policy
        const unlockAudio = new Audio(
          "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
        );
        unlockAudio.play().catch(() => {});

        // Unlock SpeechSynthesis
        if (window.speechSynthesis) {
          const silent = new SpeechSynthesisUtterance("");
          window.speechSynthesis.speak(silent);
        }
      }}
    >
      {/* Dynamic Animated Ticker Component */}
      <ActiveTicker score={score} connected={connected} badge={badge} />

      {/* Pop-up Broadcast Cards (End of Over, Milestone) */}
      <div
        style={{
          position: "absolute",
          bottom: "120px",
          left: "40px",
          zIndex: 9000,
        }}
      >
        <ActiveCards activeCard={activeCard} />
      </div>

      {/* Boundary / Event Full-Screen Animations & SFX */}
      <ActiveAnimation badge={badge} />

      {/* Break overlay */}
      {score.timerState === "PAUSED" && (
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            padding: "8px 16px",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "9999px",
            color: "var(--destructive)",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontSize: "14px",
            animation: "pulse 2s infinite",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textShadow: "0 0 10px rgba(239,68,68,0.5)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "var(--destructive)",
            }}
          />
          MATCH ON BREAK
        </div>
      )}

      {/* AI Commentary Overlay Toast */}
      {aiCommentary?.text && (
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "40px",
            maxWidth: "400px",
            background: "rgba(5, 5, 5, 0.9)",
            border: "1px solid rgba(163, 230, 53, 0.3)",
            borderRadius: "16px",
            padding: "20px",
            color: "white",
            fontFamily: "'Open Sans', sans-serif",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            animation: "tickerIn 0.5s cubic-bezier(0.16,1,0.3,1) both",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--primary)",
                animation: "pulse 2s infinite",
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 900,
                color: "var(--primary)",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              AI Commentary
            </span>
          </div>
          <p
            style={{
              fontSize: "15px",
              lineHeight: "1.5",
              fontStyle: "italic",
              color: "#e5e7eb",
              margin: 0,
            }}
          >
            "{aiCommentary.text}"
          </p>
        </div>
      )}

      {/* Match-ended banner overlay */}
      {(score._ended || score.status === "COMPLETED") && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.9)",
              color: "#fff",
              fontSize: 56,
              fontWeight: 900,
              padding: "24px 64px",
              borderRadius: 24,
              letterSpacing: -2,
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
          >
            MATCH COMPLETE
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOverlay;
