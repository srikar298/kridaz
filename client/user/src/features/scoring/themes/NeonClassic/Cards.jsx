import React from "react";

// ─── Cards ─────────────────────────────────────────────────────────────────

const NeonClassicEndOfOverCard = ({ score }) => (
  <div
    style={{
      padding: "20px",
      width: "350px",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid var(--primary)",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "#94a3b8",
        textTransform: "uppercase",
      }}
    >
      End of Over {score?.overs}
    </h3>
    <div style={{ fontSize: "32px", fontWeight: 900, color: "var(--primary)" }}>
      {score?.totalRuns}/{score?.totalWickets}
    </div>
    <div style={{ fontSize: "14px", color: "#94a3b8" }}>CRR: {score?.crr}</div>
  </div>
);

const NeonClassicMilestoneCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "300px",
      textAlign: "center",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid var(--primary)",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "18px",
        color: "var(--primary)",
        textTransform: "uppercase",
        fontWeight: 900,
      }}
    >
      MILESTONE
    </h3>
    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{data?.name}</div>
    <div style={{ fontSize: "48px", fontWeight: 900, color: "var(--primary)" }}>
      {data?.runs || data?.wickets}
    </div>
  </div>
);

const NeonClassicFallOfWicketCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "350px",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid var(--destructive)",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "18px",
        color: "var(--destructive)",
        textTransform: "uppercase",
        fontWeight: 900,
      }}
    >
      WICKET
    </h3>
    <div style={{ fontSize: "20px" }}>{data?.batterName}</div>
    <div style={{ fontSize: "14px", color: "#94a3b8" }}>
      b {data?.bowlerName}
    </div>
  </div>
);

const NeonClassicPartnershipCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "350px",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid #3b82f6",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "16px",
        color: "#3b82f6",
        textTransform: "uppercase",
      }}
    >
      Partnership
    </h3>
    <div style={{ fontSize: "28px", fontWeight: 900 }}>{data?.runs} Runs</div>
  </div>
);

const NeonClassicNewBatterCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "300px",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid var(--primary)",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "var(--primary)",
        textTransform: "uppercase",
      }}
    >
      New Batter
    </h3>
    <div style={{ fontSize: "22px", fontWeight: "bold" }}>{data?.name}</div>
  </div>
);

const NeonClassicBowlerChangeCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "300px",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid #f59e0b",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "#f59e0b",
        textTransform: "uppercase",
      }}
    >
      Bowler Change
    </h3>
    <div style={{ fontSize: "22px", fontWeight: "bold" }}>{data?.name}</div>
  </div>
);

const NeonClassicInningsBreakCard = ({ data }) => (
  <div
    style={{
      padding: "30px",
      width: "400px",
      textAlign: "center",
      background: "rgba(15, 23, 42, 0.95)",
      border: "3px solid var(--primary)",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h2
      style={{
        color: "var(--primary)",
        textTransform: "uppercase",
        margin: "0 0 20px 0",
      }}
    >
      Innings Break
    </h2>
    <div style={{ fontSize: "36px", fontWeight: 900 }}>
      {data?.teamName}: {data?.runs}/{data?.wickets}
    </div>
  </div>
);

const NeonClassicMatchResultCard = ({ data }) => (
  <div
    style={{
      padding: "40px",
      width: "500px",
      textAlign: "center",
      background: "rgba(15, 23, 42, 0.95)",
      border: "4px solid var(--primary)",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h1
      style={{
        color: "var(--primary)",
        textTransform: "uppercase",
        margin: "0 0 20px 0",
      }}
    >
      {data?.winner} WON
    </h1>
    <div style={{ fontSize: "24px" }}>by {data?.margin}</div>
  </div>
);

const NeonClassicWeatherCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "300px",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid #3b82f6",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "#3b82f6",
        textTransform: "uppercase",
      }}
    >
      Weather Update
    </h3>
    <div style={{ fontSize: "22px", fontWeight: "bold" }}>
      {data?.status || "Rain Delay"}
    </div>
  </div>
);

const NeonClassicTimeoutCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "300px",
      textAlign: "center",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid #f59e0b",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "18px",
        color: "#f59e0b",
        textTransform: "uppercase",
        fontWeight: 900,
      }}
    >
      Strategic Timeout
    </h3>
    <div style={{ fontSize: "32px", fontWeight: "bold" }}>2:30</div>
  </div>
);

const NeonClassicWormCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "400px",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid var(--primary)",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "var(--primary)",
        textTransform: "uppercase",
      }}
    >
      Worm Graph
    </h3>
    <div
      style={{
        height: "150px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      [Worm Chart Placeholder]
    </div>
  </div>
);

const NeonClassicWinProbCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "350px",
      background: "rgba(15, 23, 42, 0.9)",
      border: "2px solid var(--primary)",
      borderRadius: "16px",
      color: "#fff",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "var(--primary)",
        textTransform: "uppercase",
      }}
    >
      Win Probability
    </h3>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "24px",
        fontWeight: "bold",
      }}
    >
      <span>
        {data?.team1}: {data?.prob1}%
      </span>
      <span>
        {data?.team2}: {data?.prob2}%
      </span>
    </div>
  </div>
);

// ─── Main Map ──────────────────────────────────────────────────────────────

const NeonClassicCards = ({ activeCard }) => {
  if (!activeCard) return null;

  // Render component dynamically based on event type
  switch (activeCard.type) {
    case "eoo":
      return <NeonClassicEndOfOverCard score={activeCard.data} />;
    case "milestone":
      return <NeonClassicMilestoneCard data={activeCard.data} />;
    case "fow":
      return <NeonClassicFallOfWicketCard data={activeCard.data} />;
    case "partnership":
      return <NeonClassicPartnershipCard data={activeCard.data} />;
    case "new_batter":
      return <NeonClassicNewBatterCard data={activeCard.data} />;
    case "bowler_change":
      return <NeonClassicBowlerChangeCard data={activeCard.data} />;
    case "innings_break":
      return <NeonClassicInningsBreakCard data={activeCard.data} />;
    case "match_result":
      return <NeonClassicMatchResultCard data={activeCard.data} />;
    case "weather":
      return <NeonClassicWeatherCard data={activeCard.data} />;
    case "timeout":
      return <NeonClassicTimeoutCard data={activeCard.data} />;
    case "worm":
      return <NeonClassicWormCard data={activeCard.data} />;
    case "win_prob":
      return <NeonClassicWinProbCard data={activeCard.data} />;
    default:
      return null;
  }
};

export default NeonClassicCards;
