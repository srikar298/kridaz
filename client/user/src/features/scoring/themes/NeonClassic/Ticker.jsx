import React, { useState, useEffect } from "react";

const BALL_STYLES = {
  wicket: { bg: "var(--destructive)", color: "#fff" },
  boundary: { bg: "var(--success)", color: "#000" },
  six: { bg: "#a855f7", color: "#fff" },
  four: { bg: "#3b82f6", color: "#fff" },
  wide: { bg: "#eab308", color: "#000" },
  no_ball: { bg: "#f97316", color: "#000" },
  dot: { bg: "#374151", color: "#9ca3af" },
  dead: { bg: "#1e293b", color: "#64748b", textDecoration: "line-through" },
  run: { bg: "#1f2937", color: "#fff" },
};

function getBallStyle(ball) {
  if (!ball) return BALL_STYLES.dot;
  if (ball.type === "dead" || ball.label === "DB") return BALL_STYLES.dead;
  if (ball.isWicket || ball.type === "wicket") return BALL_STYLES.wicket;
  const lbl = ball.label || ball.type || "";
  if (lbl === "6" || ball.type === "six") return BALL_STYLES.six;
  if (lbl === "4" || ball.type === "four") return BALL_STYLES.four;
  if (ball.type === "wide" || lbl === "wd") return BALL_STYLES.wide;
  if (ball.type === "no_ball" || lbl === "nb") return BALL_STYLES.no_ball;
  if (lbl === "0" || ball.type === "dot") return BALL_STYLES.dot;
  return BALL_STYLES.run;
}

function BallPill({ ball, size = 36 }) {
  const st = getBallStyle(ball);
  const lbl =
    ball?.label ?? (ball?.runs !== undefined ? String(ball.runs) : "?");
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: st.bg,
        color: st.color,
        textDecoration: st.textDecoration || "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: typeof size === "string" ? "12px" : size * 0.33,
        fontWeight: 900,
        flexShrink: 0,
        boxShadow: `0 2px 8px rgba(0,0,0,0.5)`,
      }}
    >
      {lbl}
    </div>
  );
}

const BADGE_CFG = {
  six: {
    label: "6",
    bg: "linear-gradient(135deg,#7c3aed,#a855f7)",
    color: "#fff",
    dur: 2800,
    size: 96,
  },
  four: {
    label: "4",
    bg: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
    color: "#fff",
    dur: 2400,
    size: 80,
  },
  wicket: {
    label: "W!",
    bg: "linear-gradient(135deg,#991b1b,var(--destructive))",
    color: "#fff",
    dur: 3200,
    size: 80,
  },
  wide: {
    label: "WD",
    bg: "linear-gradient(135deg,#854d0e,#eab308)",
    color: "#000",
    dur: 1600,
    size: 56,
  },
  no_ball: {
    label: "NB",
    bg: "linear-gradient(135deg,#9a3412,#f97316)",
    color: "#fff",
    dur: 1600,
    size: 56,
  },
};

function EventBadge({ event }) {
  const cfg = BADGE_CFG[event?.type];
  if (!cfg) return null;

  const animName =
    event.type === "six"
      ? "sixFlyIn"
      : event.type === "four"
        ? "fourSlideUp"
        : event.type === "wicket"
          ? "wicketShake"
          : "extraBadge";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 120,
        right: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        pointerEvents: "none",
        zIndex: 99,
      }}
    >
      <div
        style={{
          width: cfg.size * 1.6,
          height: cfg.size * 1.6,
          borderRadius: 24,
          background: cfg.bg,
          color: cfg.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: cfg.size,
          fontWeight: 900,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          animation: `${animName} ${cfg.dur}ms ease-in-out forwards`,
        }}
      >
        {event.label || cfg.label}
      </div>
      {event.description && (
        <div
          style={{
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            padding: "4px 14px",
            borderRadius: 99,
            fontSize: 13,
            fontWeight: 700,
            animation: `extraBadge ${cfg.dur}ms ease-in-out forwards`,
            whiteSpace: "nowrap",
          }}
        >
          {event.description}
        </div>
      )}
    </div>
  );
}

function ScrollingTicker({ score }) {
  const [activeTab, setActiveTab] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [label, setLabel] = useState("Commentary");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!score) return;

    if (score.result) {
      setLabel("RESULT");
      setDisplayText(score.result);
      return;
    }

    switch (activeTab) {
      case 0:
        setLabel("Commentary");
        setDisplayText(score.commentary || "Waiting for next ball...");
        break;
      case 1:
        setLabel("Partnership");
        setDisplayText(
          `${score.partnership?.runs || 0} runs from ${score.partnership?.balls || 0} balls`
        );
        break;
      case 2:
        if (score.target) {
          setLabel("The Chase");
          setDisplayText(
            `Need ${score.runsNeeded} from ${score.ballsRemaining} balls (RRR ${score.rrr})`
          );
        } else {
          setLabel("Match Info");
          setDisplayText(
            `CRR: ${score.crr} • ${score.battingTeamName} is batting`
          );
        }
        break;
      default:
        break;
    }
  }, [activeTab, score]);

  if (!displayText) return null;

  return (
    <div className="ticker-container">
      <div className="ticker-label">{label}</div>
      <div className="ticker-text" key={displayText}>
        {displayText}
      </div>
    </div>
  );
}

export default function NeonClassicTicker({ score, connected, badge }) {
  const striker = score.batters?.[0] || null;
  const nonStriker = score.batters?.[1] || null;
  const bowler = score.bowler || null;
  const strikerSR = striker
    ? `SR ${striker.strikeRate || (striker.balls ? ((striker.runs / striker.balls) * 100).toFixed(0) : 0)}`
    : "";

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>
        {`
        @keyframes sixFlyIn {
          0% { transform: translateX(120px) scale(0.4) rotate(10deg); opacity: 0; }
          25% { transform: translateX(-12px) scale(1.2) rotate(-3deg); opacity: 1; }
          70% { transform: translateX(0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateX(0) scale(0.8); opacity: 0; }
        }
        @keyframes fourSlideUp {
          0% { transform: translateY(60px) scale(0.5); opacity: 0; }
          20% { transform: translateY(-8px) scale(1.1); opacity: 1; }
          70% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(0) scale(0.85); opacity: 0; }
        }
        @keyframes wicketShake {
          0%,100% { transform: translateX(0) scale(1); opacity: 0; }
          5% { transform: scale(1.3); opacity: 1; }
          15%,45% { transform: translateX(-8px) scale(1); opacity: 1; }
          30%,60% { transform: translateX( 8px) scale(1); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          95% { transform: scale(0.9); opacity: 0; }
        }
        @keyframes extraBadge {
          0% { transform: scale(0.3); opacity: 0; }
          15% { transform: scale(1.1); opacity: 1; }
          70% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        @keyframes classicTickerIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes classicPulseRed {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes classicScrollText {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .ticker-container {
          position: absolute;
          bottom: clamp(44px, 8.4vh, 90px);
          left: 0; right: 0;
          height: clamp(22px, 3.2vh, 36px);
          background: rgba(163, 230, 53, 0.95);
          display: flex; alignItems: center; overflow: hidden;
          white-space: nowrap; border-top: 1px solid rgba(0,0,0,0.1);
          box-shadow: 0 -4px 20px rgba(0,0,0,0.3); z-index: 10;
        }
        .ticker-label {
          background: #000; color: var(--primary);
          padding: 0 clamp(6px, 1.2vw, 16px); height: 100%;
          display: flex; alignItems: center;
          font-size: clamp(7px, 0.7vw, 11px); font-weight: 900;
          text-transform: uppercase; letter-spacing: 2px;
          position: relative; z-index: 20;
          box-shadow: 10px 0 20px rgba(0,0,0,0.5);
        }
        .ticker-text {
          display: inline-block; padding-left: 20px;
          font-size: 14px; font-weight: 800; color: #000;
          text-transform: uppercase;
          animation: classicScrollText 15s linear infinite;
        }
        `}
      </style>

      {/* Scrolling Ticker */}
      <ScrollingTicker score={score} />

      {/* Event Badge */}
      {badge && <EventBadge event={badge} />}

      {/* Ticker bar (fixed bottom) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "clamp(52px, 8.4vh, 90px)",
          background: "rgba(5,5,5,0.88)",
          backdropFilter: "blur(20px)",
          borderTop: "2px solid var(--primary)",
          display: "flex",
          alignItems: "stretch",
          animation: "classicTickerIn 0.6s cubic-bezier(0.16,1,0.3,1) both",
          overflow: "hidden",
        }}
      >
        {/* TEAM + SCORE (left) */}
        <div
          style={{
            minWidth: "clamp(100px, 14vw, 260px)",
            background: "rgba(163,230,53,0.08)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            padding: "0 clamp(8px, 1.5vw, 24px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: "clamp(6px, 0.6vw, 9px)",
              fontWeight: 900,
              color: "var(--primary)",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            LIVE
          </div>
          <div
            style={{
              fontSize: "clamp(9px, 1vw, 15px)",
              fontWeight: 900,
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {score.battingTeamName}
          </div>
        </div>

        {/* SCORE / OVERS */}
        <div
          style={{
            padding: "0 clamp(8px, 1.8vw, 28px)",
            display: "flex",
            alignItems: "center",
            gap: "clamp(6px, 1.2vw, 20px)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span
              style={{
                fontSize: "clamp(20px, 3.5vw, 46px)",
                fontWeight: 900,
                lineHeight: 1,
                color: "#fff",
                letterSpacing: -1,
              }}
            >
              {score.totalRuns}
            </span>
            <span
              style={{
                fontSize: "clamp(14px, 2.2vw, 30px)",
                fontWeight: 900,
                color: "var(--primary)",
              }}
            >
              /
            </span>
            <span
              style={{
                fontSize: "clamp(18px, 2.8vw, 38px)",
                fontWeight: 900,
                color: "#fff",
              }}
            >
              {score.totalWickets}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <div
              style={{
                fontSize: "clamp(6px, 0.55vw, 9px)",
                color: "#6b7280",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}
            >
              OVS
            </div>
            <div
              style={{
                fontSize: "clamp(10px, 1.3vw, 20px)",
                fontWeight: 900,
                color: "#e5e7eb",
              }}
            >
              {score.overString}
            </div>
            {score.crr && (
              <div
                style={{
                  fontSize: "clamp(7px, 0.6vw, 11px)",
                  color: "var(--primary)",
                  fontWeight: 700,
                }}
              >
                CRR {score.crr}
              </div>
            )}
          </div>
          {score.target && (
            <div
              style={{
                padding: "clamp(2px, 0.4vh, 6px) clamp(4px, 0.8vw, 14px)",
                background: "rgba(163,230,53,0.12)",
                borderRadius: 6,
                border: "1px solid rgba(163,230,53,0.25)",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(6px, 0.55vw, 9px)",
                  color: "var(--primary)",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                TGT
              </div>
              <div
                style={{
                  fontSize: "clamp(10px, 1.4vw, 22px)",
                  fontWeight: 900,
                  color: "#fff",
                }}
              >
                {score.target}
              </div>
            </div>
          )}
        </div>

        {/* BATSMEN */}
        <div
          style={{
            padding: "0 clamp(6px, 1.4vw, 24px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 2,
            borderRight: "1px solid rgba(255,255,255,0.06)",
            minWidth: "clamp(100px, 16vw, 280px)",
            overflow: "hidden",
          }}
        >
          {striker && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(4px, 0.6vw, 10px)",
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "clamp(8px, 0.85vw, 13px)",
                  fontWeight: 900,
                  color: "#fff",
                  textTransform: "uppercase",
                  flex: 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {striker.name}
              </span>
              <span
                style={{
                  fontSize: "clamp(10px, 1vw, 16px)",
                  fontWeight: 900,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {striker.runs}
              </span>
              <span
                style={{
                  fontSize: "clamp(7px, 0.65vw, 11px)",
                  color: "#6b7280",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ({striker.balls})
              </span>
              <span
                style={{
                  fontSize: "clamp(7px, 0.6vw, 10px)",
                  color: "var(--primary)",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {strikerSR}
              </span>
            </div>
          )}
          {nonStriker && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(4px, 0.6vw, 10px)",
                opacity: 0.6,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "transparent",
                  border: "1px solid #9ca3af",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "clamp(7px, 0.78vw, 12px)",
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  flex: 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {nonStriker.name}
              </span>
              <span
                style={{
                  fontSize: "clamp(9px, 0.9vw, 14px)",
                  fontWeight: 900,
                  color: "#9ca3af",
                  flexShrink: 0,
                }}
              >
                {nonStriker.runs}
              </span>
              <span
                style={{
                  fontSize: "clamp(7px, 0.6vw, 10px)",
                  color: "#4b5563",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ({nonStriker.balls})
              </span>
            </div>
          )}
        </div>

        {/* BOWLER */}
        {bowler && (
          <div
            style={{
              padding: "0 clamp(6px, 1.4vw, 24px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              minWidth: "clamp(80px, 12vw, 200px)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: "clamp(6px, 0.55vw, 9px)",
                color: "#6b7280",
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                marginBottom: 2,
              }}
            >
              BOWLING
            </div>
            <div
              style={{
                fontSize: "clamp(8px, 0.85vw, 13px)",
                fontWeight: 900,
                color: "#fff",
                textTransform: "uppercase",
                marginBottom: 1,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {bowler.name}
            </div>
            <div
              style={{
                fontSize: "clamp(7px, 0.75vw, 12px)",
                color: "#9ca3af",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {bowler.overs}.{bowler.balls} – {bowler.wickets}/{bowler.runs}
              {bowler.economy > 0 && (
                <span style={{ color: "#6b7280", marginLeft: 4 }}>
                  Eco {bowler.economy}
                </span>
              )}
            </div>
          </div>
        )}

        {/* LAST 6 BALLS */}
        <div
          style={{
            padding: "0 clamp(6px, 1.2vw, 20px)",
            display: "flex",
            alignItems: "center",
            gap: "clamp(4px, 0.6vw, 10px)",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: "clamp(6px, 0.55vw, 9px)",
              color: "#4b5563",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginRight: 2,
              whiteSpace: "nowrap",
            }}
          >
            OVER
          </div>
          <div
            style={{
              display: "flex",
              gap: "clamp(3px, 0.5vw, 8px)",
              alignItems: "center",
              flexWrap: "nowrap",
            }}
          >
            {(score.last6Balls || []).slice(-6).map((b, i) => (
              <BallPill key={i} ball={b} size="clamp(22px, 2.8vw, 36px)" />
            ))}
            {Array.from({
              length: Math.max(0, 6 - (score.last6Balls?.length || 0)),
            }).map((_, i) => (
              <div
                key={`ph-${i}`}
                style={{
                  width: "clamp(22px, 2.8vw, 36px)",
                  height: "clamp(22px, 2.8vw, 36px)",
                  borderRadius: "50%",
                  border: "2px dashed rgba(255,255,255,0.08)",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* CONNECTION DOT */}
        <div
          style={{
            padding: "0 clamp(6px, 1vw, 16px)",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: connected ? "var(--success)" : "var(--destructive)",
              animation: connected ? "classicPulseRed 2s infinite" : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
