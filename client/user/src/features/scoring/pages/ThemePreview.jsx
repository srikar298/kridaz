import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { NeonClassicPack, SportsNetworkPack } from "../themes";

const THEME_MAP = {
  neon_classic: NeonClassicPack,
  classic: NeonClassicPack,
  sports_network: SportsNetworkPack,
};

const DUMMY_SCORE = {
  status: "LIVE",
  isLive: true,
  tickerTheme: "neon_classic",
  totalRuns: 185,
  totalWickets: 3,
  overs: 18,
  balls: 0,
  crr: 10.27,
  teamA: { name: "Super Kings" },
  teamB: { name: "Royal Strikers" },
  battingTeam: "teamA",
  batters: [
    {
      name: "M. Dhoni",
      runs: 55,
      balls: 28,
      fours: 4,
      sixes: 4,
      strikeRate: 196.4,
    },
    {
      name: "R. Jadeja",
      runs: 22,
      balls: 10,
      fours: 2,
      sixes: 1,
      strikeRate: 220.0,
    },
  ],
  bowler: { name: "J. Archer", overs: 3, runs: 28, wickets: 2 },
  last6Balls: [
    { type: "run", label: "1" },
    { type: "boundary", label: "4" },
    { type: "run", label: "2" },
    { type: "boundary", label: "6" },
    { type: "dot", label: "0" },
    { type: "wicket", label: "W" },
  ],
};

const ThemePreview = () => {
  const [searchParams] = useSearchParams();
  const themeParam = searchParams.get("theme") || "neon_classic";

  const ActivePack = THEME_MAP[themeParam] || NeonClassicPack;
  const ActiveTicker = ActivePack.Ticker;
  const ActiveCards = ActivePack.Cards;
  const ActiveAnimation = ActivePack.Animation;

  const [activeCard, setActiveCard] = useState(null);
  const [badge, setBadge] = useState(null);

  // Cycle through previews
  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      if (step === 0) {
        setBadge(null);
        setActiveCard(null);
      } else if (step === 1) {
        // Show EOO Card
        setActiveCard({ type: "eoo", data: DUMMY_SCORE });
      } else if (step === 2) {
        // Show Milestone Card
        setActiveCard({ type: "milestone", data: DUMMY_SCORE.batters[0] });
      } else if (step === 3) {
        setActiveCard(null);
        setBadge({ type: "six", description: "M. Dhoni hits a MAXIMUM!" });
      } else if (step === 4) {
        setBadge({ type: "wicket", description: "OUT! Caught" });
      }

      step = (step + 1) % 5;
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background:
          "url(https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=3405&auto=format&fit=crop) center/cover no-repeat",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Dark overlay to simulate a broadcast stream background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
        }}
      />

      {/* Dynamic Animated Ticker Component */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9000,
        }}
      >
        <ActiveTicker score={DUMMY_SCORE} connected={true} badge={badge} />
      </div>

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

      {/* UI Controls overlay */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "rgba(0,0,0,0.8)",
          padding: "15px",
          borderRadius: "10px",
          color: "#fff",
          fontFamily: "sans-serif",
          zIndex: 9999,
        }}
      >
        <h3>Previewing Theme: {themeParam}</h3>
        <p style={{ fontSize: "12px", color: "#ccc" }}>
          Simulating real-time graphics cycle.
        </p>
        <button
          onClick={() => window.close()}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Close Preview
        </button>
      </div>
    </div>
  );
};

export default ThemePreview;
