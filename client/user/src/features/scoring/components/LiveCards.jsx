import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const THEME_STYLES = {
  neon_classic: {
    bg: "rgba(15, 23, 42, 0.9)",
    border: "2px solid var(--primary)",
    text: "var(--primary)",
    textMuted: "#94a3b8",
    font: "'Orbitron', sans-serif",
  },
  premium_glass: {
    bg: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    text: "var(--foreground)",
    textMuted: "rgba(255,255,255,0.6)",
    backdropFilter: "blur(10px)",
    font: "'Montserrat', sans-serif",
  },
  retro_arcade: {
    bg: "var(--background)",
    border: "4px solid #ff00ff",
    text: "#ff00ff",
    textMuted: "#00ffff",
    font: "'Press Start 2P', monospace",
  },
  sports_network: {
    bg: "var(--foreground)",
    border: "4px solid var(--destructive)",
    text: "#1e3a8a",
    textMuted: "#64748b",
    font: "'Roboto Condensed', sans-serif",
  },
  cyber_pulse: {
    bg: "#050505",
    border: "2px solid var(--secondary)",
    text: "var(--secondary)",
    textMuted: "#94a3b8",
    font: "'Rajdhani', sans-serif",
  },
};

const EndOfOverCard = ({ score, style }) => {
  return (
    <div style={{ padding: "20px", width: "350px" }}>
      <h3
        style={{
          margin: "0 0 10px 0",
          fontSize: "14px",
          color: style.textMuted,
          textTransform: "uppercase",
        }}
      >
        End of Over {score.overs}
      </h3>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "32px", fontWeight: 900, color: style.text }}>
            {score.totalRuns}/{score.totalWickets}
          </div>
          <div style={{ fontSize: "14px", color: style.textMuted }}>
            CRR: {score.crr}
          </div>
        </div>
        {score.bowler && (
          <div style={{ textAlign: "right" }}>
            <div
              style={{ fontSize: "16px", fontWeight: "bold", color: "#fff" }}
            >
              {score.bowler.name}
            </div>
            <div style={{ fontSize: "14px", color: style.textMuted }}>
              {score.bowler.wickets}-{score.bowler.runs}
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: "15px", display: "flex", gap: "5px" }}>
        {score.last6Balls?.map((b, i) => (
          <div
            key={i}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background:
                b.type === "wicket"
                  ? "var(--destructive)"
                  : b.type === "boundary"
                    ? "#3b82f6"
                    : "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "bold",
              color: "#fff",
            }}
          >
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const MilestoneCard = ({ batter, style }) => {
  return (
    <div style={{ padding: "20px", width: "300px", textAlign: "center" }}>
      <h3
        style={{
          margin: "0 0 10px 0",
          fontSize: "18px",
          color: style.text,
          textTransform: "uppercase",
          fontWeight: 900,
        }}
      >
        MILESTONE REACHED
      </h3>
      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fff" }}>
        {batter.name}
      </div>
      <div style={{ fontSize: "48px", fontWeight: 900, color: style.text }}>
        {batter.runs}
      </div>
      <div style={{ fontSize: "14px", color: style.textMuted }}>
        off {batter.balls} balls (SR: {batter.strikeRate})
      </div>
      <div
        style={{
          marginTop: "10px",
          display: "flex",
          justifyContent: "center",
          gap: "15px",
        }}
      >
        <div style={{ color: "#fff" }}>
          4s: <span style={{ color: style.text }}>{batter.fours}</span>
        </div>
        <div style={{ color: "#fff" }}>
          6s: <span style={{ color: style.text }}>{batter.sixes}</span>
        </div>
      </div>
    </div>
  );
};

const LiveCards = ({ score }) => {
  const [activeCard, setActiveCard] = useState(null); // { type, data }

  // Simple heuristic queue to show cards
  useEffect(() => {
    if (!score) return;

    // Check for Milestones
    const milestoneBatter = score.batters?.find(
      (b) => b.runs === 50 || b.runs === 100
    );
    if (milestoneBatter) {
      setActiveCard({ type: "milestone", data: milestoneBatter });
      const timer = setTimeout(() => setActiveCard(null), 8000);
      return () => clearTimeout(timer);
    }

    // Check for End of Over
    if (score.balls === 0 && score.overs > 0) {
      setActiveCard({ type: "eoo", data: score });
      const timer = setTimeout(() => setActiveCard(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [score]);

  const style = THEME_STYLES[score?.tickerTheme] || THEME_STYLES.neon_classic;

  return (
    <AnimatePresence>
      {activeCard && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          style={{
            position: "absolute",
            bottom: "120px", // Right above the ticker
            left: "40px",
            background: style.bg,
            border: style.border,
            backdropFilter: style.backdropFilter || "none",
            borderRadius: "16px",
            overflow: "hidden",
            fontFamily: style.font,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            zIndex: 9000,
          }}
        >
          {activeCard.type === "eoo" && (
            <EndOfOverCard score={activeCard.data} style={style} />
          )}
          {activeCard.type === "milestone" && (
            <MilestoneCard batter={activeCard.data} style={style} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LiveCards;
