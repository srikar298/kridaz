import React, { useState, useEffect } from "react";

const BALL_STYLES = {
  wicket: { bg: "#e11d48", color: "#fff" },
  boundary: { bg: "#10b981", color: "#fff" },
  six: { bg: "#8b5cf6", color: "#fff" },
  four: { bg: "#3b82f6", color: "#fff" },
  wide: { bg: "#f59e0b", color: "#000" },
  no_ball: { bg: "#f97316", color: "#fff" },
  dot: { bg: "#475569", color: "#cbd5e1" },
  run: { bg: "#1e293b", color: "#fff" },
};

function getBallStyle(ball) {
  if (!ball) return BALL_STYLES.dot;
  if (ball.isWicket || ball.type === "wicket") return BALL_STYLES.wicket;
  const lbl = ball.label || ball.type || "";
  if (lbl === "6" || ball.type === "six") return BALL_STYLES.six;
  if (lbl === "4" || ball.type === "four") return BALL_STYLES.four;
  if (ball.type === "wide" || lbl === "wd") return BALL_STYLES.wide;
  if (ball.type === "no_ball" || lbl === "nb") return BALL_STYLES.no_ball;
  if (lbl === "0" || ball.type === "dot") return BALL_STYLES.dot;
  return BALL_STYLES.run;
}

function BallPill({ ball, size = 32 }) {
  const st = getBallStyle(ball);
  const lbl =
    ball?.label ?? (ball?.runs !== undefined ? String(ball.runs) : "?");
  return (
    <div
      style={{
        width: size,
        height: size,
        background: st.bg,
        color: st.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: typeof size === "string" ? "12px" : size * 0.38,
        fontWeight: "bold",
        flexShrink: 0,
        clipPath: "polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)", // Slanted ball pills!
        boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
      }}
    >
      <span style={{ transform: "skewX(10deg)", display: "inline-block" }}>
        {lbl}
      </span>
    </div>
  );
}

const BADGE_CFG = {
  six: {
    label: "SIX",
    bg: "linear-gradient(135deg, #fbbf24, #d97706)",
    color: "#000",
    dur: 2800,
    size: 70,
  },
  four: {
    label: "FOUR",
    bg: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "#fff",
    dur: 2400,
    size: 60,
  },
  wicket: {
    label: "OUT",
    bg: "linear-gradient(135deg, #e11d48, #9f1239)",
    color: "#fff",
    dur: 3200,
    size: 55,
  },
  wide: { label: "WIDE", bg: "#f59e0b", color: "#000", dur: 1600, size: 45 },
  no_ball: {
    label: "NO BALL",
    bg: "#f97316",
    color: "#fff",
    dur: 1600,
    size: 45,
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
          width: cfg.size * 2.2,
          height: cfg.size * 1.4,
          background: cfg.bg,
          color: cfg.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: cfg.size * 0.6,
          fontWeight: 900,
          transform: "skewX(-12deg)",
          borderLeft: "4px solid #fff",
          boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
          animation: `${animName} ${cfg.dur}ms ease-in-out forwards`,
        }}
      >
        <span style={{ transform: "skewX(12deg)", display: "inline-block" }}>
          {event.label || cfg.label}
        </span>
      </div>
      {event.description && (
        <div
          style={{
            background: "#e11d48",
            color: "#fff",
            padding: "6px 16px",
            fontSize: 12,
            fontWeight: 700,
            transform: "skewX(-12deg)",
            animation: `extraBadge ${cfg.dur}ms ease-in-out forwards`,
            whiteSpace: "nowrap",
            borderRight: "4px solid #fbbf24",
            boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          }}
        >
          <span style={{ transform: "skewX(12deg)", display: "inline-block" }}>
            {event.description.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

function ScrollingTicker({ score }) {
  const [activeTab, setActiveTab] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [label, setLabel] = useState("NEWS");

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 8500);
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
        setLabel("SCORING");
        setDisplayText(score.commentary || "Live coverage from the stadium...");
        break;
      case 1:
        setLabel("PARTNERSHIP");
        setDisplayText(
          `${score.partnership?.runs || 0} runs from ${score.partnership?.balls || 0} balls`
        );
        break;
      case 2:
        if (score.target) {
          setLabel("TARGET");
          setDisplayText(
            `Chase details: Need ${score.runsNeeded} off ${score.ballsRemaining} balls (RRR ${score.rrr})`
          );
        } else {
          setLabel("MATCH INFO");
          setDisplayText(
            `Current Run Rate: ${score.crr} * Batting team: ${score.battingTeamName}`
          );
        }
        break;
      default:
        break;
    }
  }, [activeTab, score]);

  if (!displayText) return null;

  return (
    <div className="sports-ticker-container">
      <div className="sports-ticker-label">
        <span style={{ transform: "skewX(12deg)", display: "inline-block" }}>
          {label}
        </span>
      </div>
      <div className="sports-ticker-text" key={displayText}>
        {displayText}
      </div>
    </div>
  );
}

export default function SportsNetworkTicker({ score, connected, badge }) {
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
      {/* Dynamic Keyframes for Sports Network */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');
        
        @keyframes sixFlyIn {
          0% { transform: translateX(120px) scale(0.4) skewX(-12deg); opacity: 0; }
          25% { transform: translateX(-12px) scale(1.1) skewX(-12deg); opacity: 1; }
          70% { transform: translateX(0) scale(1) skewX(-12deg); opacity: 1; }
          100% { transform: translateX(0) scale(0.8) skewX(-12deg); opacity: 0; }
        }
        @keyframes fourSlideUp {
          0% { transform: translateY(60px) scale(0.5) skewX(-12deg); opacity: 0; }
          20% { transform: translateY(-8px) scale(1.05) skewX(-12deg); opacity: 1; }
          70% { transform: translateY(0) scale(1) skewX(-12deg); opacity: 1; }
          100% { transform: translateY(0) scale(0.85) skewX(-12deg); opacity: 0; }
        }
        @keyframes wicketShake {
          0%,100% { transform: translateX(0) scale(1) skewX(-12deg); opacity: 0; }
          5% { transform: scale(1.2) skewX(-12deg); opacity: 1; }
          15%,45% { transform: translateX(-8px) scale(1) skewX(-12deg); opacity: 1; }
          30%,60% { transform: translateX( 8px) scale(1) skewX(-12deg); opacity: 1; }
          80% { transform: scale(1) skewX(-12deg); opacity: 1; }
          95% { transform: scale(0.9) skewX(-12deg); opacity: 0; }
        }
        @keyframes extraBadge {
          0% { transform: scale(0.3) skewX(-12deg); opacity: 0; }
          15% { transform: scale(1.05) skewX(-12deg); opacity: 1; }
          70% { transform: scale(1) skewX(-12deg); opacity: 1; }
          100% { transform: scale(0.8) skewX(-12deg); opacity: 0; }
        }
        .sports-theme-wrapper {
          font-family: 'Oswald', sans-serif !important;
        }

        @keyframes sportsTickerIn {
          from { transform: translateY(80px); }
          to { transform: translateY(0); }
        }
        @keyframes sportsScrollText {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        .sports-ticker-container {
          position: absolute;
          bottom: clamp(52px, 8.4vh, 90px);
          left: 0; right: 0;
          height: clamp(24px, 3.4vh, 38px);
          background: #fbbf24;
          display: flex; alignItems: center; overflow: hidden;
          white-space: nowrap; 
          border-top: 2px solid #fff;
          box-shadow: 0 -4px 15px rgba(0,0,0,0.25); z-index: 10;
        }
        .sports-ticker-label {
          background: #e11d48; color: #fff;
          padding: 0 clamp(12px, 1.8vw, 24px); height: 100%;
          display: flex; alignItems: center;
          font-size: clamp(9px, 0.8vw, 13px); font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px;
          position: relative; z-index: 20;
          transform: skewX(-12deg);
          margin-left: -8px;
          box-shadow: 5px 0 15px rgba(0,0,0,0.3);
        }
        .sports-ticker-text {
          display: inline-block; padding-left: 24px;
          font-size: 14px; font-weight: 600; color: #000;
          text-transform: uppercase;
          animation: sportsScrollText 16s linear infinite;
        }
      `,
        }}
      />

      {/* Theme Wrapper to enforce font */}
      <div className="sports-theme-wrapper">
        {/* Scrolling Ticker */}
        <ScrollingTicker score={score} />

        {/* Ticker bar (fixed bottom) */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "clamp(52px, 8.4vh, 90px)",
            background: "#0f172a",
            borderTop: "4px solid #1e3a8a",
            display: "flex",
            alignItems: "stretch",
            animation:
              "sportsTickerIn 0.5s cubic-bezier(0.1, 0.9, 0.2, 1) both",
            overflow: "hidden",
          }}
        >
          {/* LIVE Badging & TEAM (left) */}
          <div
            style={{
              minWidth: "clamp(110px, 15vw, 250px)",
              background: "linear-gradient(90deg, #1e3a8a, #0f172a)",
              padding: "0 clamp(10px, 1.5vw, 24px)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: "relative",
            }}
          >
            {/* Skewed background decoration */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: -15,
                background: "linear-gradient(90deg, #1e3a8a, #172554)",
                transform: "skewX(-12deg)",
                zIndex: 1,
                borderRight: "4px solid #fbbf24",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "#fbbf24",
                  letterSpacing: "2px",
                }}
              >
                LIVE MATCH
              </span>
              <span
                style={{
                  fontSize: "clamp(11px, 1.2vw, 18px)",
                  fontWeight: 700,
                  color: "#fff",
                  textTransform: "uppercase",
                }}
              >
                {score.battingTeamName}
              </span>
            </div>
          </div>

          {/* SCORE / OVERS */}
          <div
            style={{
              padding: "0 clamp(12px, 2vw, 32px)",
              display: "flex",
              alignItems: "center",
              gap: "clamp(8px, 1.4vw, 24px)",
              flexShrink: 0,
              position: "relative",
              zIndex: 5,
              borderRight: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span
                style={{
                  fontSize: "clamp(24px, 3.8vw, 48px)",
                  fontWeight: 700,
                  lineHeight: 1,
                  color: "#fff",
                }}
              >
                {score.totalRuns}
              </span>
              <span
                style={{
                  fontSize: "clamp(16px, 2.2vw, 28px)",
                  fontWeight: 600,
                  color: "#fbbf24",
                }}
              >
                -
              </span>
              <span
                style={{
                  fontSize: "clamp(20px, 3vw, 38px)",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {score.totalWickets}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <div
                style={{ fontSize: "7px", color: "#94a3b8", fontWeight: 600 }}
              >
                OVERS
              </div>
              <div
                style={{
                  fontSize: "clamp(12px, 1.4vw, 20px)",
                  fontWeight: 700,
                  color: "#fbbf24",
                }}
              >
                {score.overString}
              </div>
            </div>
            {score.target && (
              <div
                style={{
                  padding: "3px 8px",
                  background: "#e11d48",
                  borderRadius: 2,
                  transform: "skewX(-10deg)",
                }}
              >
                <div style={{ transform: "skewX(10deg)", textAlign: "center" }}>
                  <div
                    style={{ fontSize: "6px", color: "#fff", fontWeight: 700 }}
                  >
                    TARGET
                  </div>
                  <div
                    style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}
                  >
                    {score.target}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BATSMEN */}
          <div
            style={{
              padding: "0 clamp(12px, 1.8vw, 28px)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 2,
              borderRight: "1px solid rgba(255,255,255,0.08)",
              minWidth: "clamp(120px, 18vw, 290px)",
              overflow: "hidden",
              position: "relative",
              zIndex: 5,
            }}
          >
            {striker && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 4,
                    height: 12,
                    background: "#fbbf24",
                    transform: "skewX(-10deg)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "clamp(9px, 0.9vw, 14px)",
                    fontWeight: 600,
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
                    fontSize: "clamp(12px, 1.1vw, 17px)",
                    fontWeight: 700,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {striker.runs}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    color: "#94a3b8",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  ({striker.balls})
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    color: "#fbbf24",
                    fontWeight: 600,
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
                  gap: 10,
                  opacity: 0.6,
                }}
              >
                <div
                  style={{
                    width: 4,
                    height: 12,
                    background: "transparent",
                    borderLeft: "2px solid #94a3b8",
                    transform: "skewX(-10deg)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "clamp(9px, 0.85vw, 13px)",
                    fontWeight: 400,
                    color: "#cbd5e1",
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
                    fontSize: "clamp(11px, 1vw, 15px)",
                    fontWeight: 600,
                    color: "#cbd5e1",
                    flexShrink: 0,
                  }}
                >
                  {nonStriker.runs}
                </span>
                <span
                  style={{
                    fontSize: "8px",
                    color: "#64748b",
                    fontWeight: 600,
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
                padding: "0 clamp(10px, 1.5vw, 24px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                minWidth: "clamp(90px, 14vw, 210px)",
                overflow: "hidden",
                position: "relative",
                zIndex: 5,
              }}
            >
              <div
                style={{
                  fontSize: "7px",
                  color: "#94a3b8",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  marginBottom: 1,
                }}
              >
                BOWLER
              </div>
              <div
                style={{
                  fontSize: "clamp(9px, 0.9vw, 14px)",
                  fontWeight: 600,
                  color: "#fff",
                  textTransform: "uppercase",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {bowler.name}
              </div>
              <div
                style={{
                  fontSize: "9px",
                  color: "#fbbf24",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Overs: {bowler.overs}.{bowler.balls} * {bowler.wickets} Wkts /{" "}
                {bowler.runs} Runs
              </div>
            </div>
          )}

          {/* LAST 6 BALLS */}
          <div
            style={{
              padding: "0 clamp(10px, 1.2vw, 24px)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flex: 1,
              overflow: "hidden",
              position: "relative",
              zIndex: 5,
            }}
          >
            <div
              style={{
                fontSize: "7px",
                color: "#64748b",
                fontWeight: 600,
                textTransform: "uppercase",
                marginRight: 4,
                whiteSpace: "nowrap",
              }}
            >
              THIS OVER
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                flexWrap: "nowrap",
              }}
            >
              {(score.last6Balls || []).slice(-6).map((b, i) => (
                <BallPill key={i} ball={b} size={28} />
              ))}
              {Array.from({
                length: Math.max(0, 6 - (score.last6Balls?.length || 0)),
              }).map((_, i) => (
                <div
                  key={`ph-${i}`}
                  style={{
                    width: 28,
                    height: 28,
                    border: "1px dashed rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.02)",
                    clipPath: "polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* CONNECTION STATUS */}
          <div
            style={{
              padding: "0 clamp(10px, 1.2vw, 20px)",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              position: "relative",
              zIndex: 5,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                background: connected ? "#10b981" : "#e11d48",
                clipPath: "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
