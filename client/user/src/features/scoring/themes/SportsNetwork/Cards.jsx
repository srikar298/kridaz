import React from "react";

// ─── Cards ─────────────────────────────────────────────────────────────────

const SportsNetworkEndOfOverCard = ({ score }) => (
  <div
    style={{
      padding: "20px",
      width: "350px",
      background: "#ffffff",
      border: "4px solid #dc2626",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "#64748b",
        textTransform: "uppercase",
      }}
    >
      End of Over {score?.overs}
    </h3>
    <div style={{ fontSize: "32px", fontWeight: 900, color: "#1e3a8a" }}>
      {score?.totalRuns}/{score?.totalWickets}
    </div>
    <div style={{ fontSize: "14px", color: "#64748b" }}>CRR: {score?.crr}</div>
  </div>
);

const SportsNetworkMilestoneCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "300px",
      textAlign: "center",
      background: "#ffffff",
      border: "4px solid #1e3a8a",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "18px",
        color: "#1e3a8a",
        textTransform: "uppercase",
        fontWeight: 900,
      }}
    >
      MILESTONE
    </h3>
    <div style={{ fontSize: "24px", fontWeight: "bold" }}>{data?.name}</div>
    <div style={{ fontSize: "48px", fontWeight: 900, color: "#dc2626" }}>
      {data?.runs || data?.wickets}
    </div>
  </div>
);

const SportsNetworkFallOfWicketCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "350px",
      background: "#ffffff",
      border: "4px solid #dc2626",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "18px",
        color: "#dc2626",
        textTransform: "uppercase",
        fontWeight: 900,
      }}
    >
      WICKET
    </h3>
    <div style={{ fontSize: "20px", fontWeight: "bold" }}>
      {data?.batterName}
    </div>
    <div style={{ fontSize: "14px", color: "#64748b" }}>
      b {data?.bowlerName}
    </div>
  </div>
);

const SportsNetworkPartnershipCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "350px",
      background: "#ffffff",
      border: "4px solid #1e3a8a",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "16px",
        color: "#1e3a8a",
        textTransform: "uppercase",
      }}
    >
      Partnership
    </h3>
    <div style={{ fontSize: "28px", fontWeight: 900 }}>{data?.runs} Runs</div>
  </div>
);

const SportsNetworkNewBatterCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "300px",
      background: "#ffffff",
      border: "4px solid #1e3a8a",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "#1e3a8a",
        textTransform: "uppercase",
      }}
    >
      New Batter
    </h3>
    <div style={{ fontSize: "22px", fontWeight: "bold" }}>{data?.name}</div>
  </div>
);

const SportsNetworkBowlerChangeCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "300px",
      background: "#ffffff",
      border: "4px solid #dc2626",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "#dc2626",
        textTransform: "uppercase",
      }}
    >
      Bowler Change
    </h3>
    <div style={{ fontSize: "22px", fontWeight: "bold" }}>{data?.name}</div>
  </div>
);

const SportsNetworkInningsBreakCard = ({ data }) => (
  <div
    style={{
      padding: "30px",
      width: "400px",
      textAlign: "center",
      background: "#ffffff",
      border: "6px solid #1e3a8a",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h2
      style={{
        color: "#1e3a8a",
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

const SportsNetworkMatchResultCard = ({ data }) => (
  <div
    style={{
      padding: "40px",
      width: "500px",
      textAlign: "center",
      background: "#ffffff",
      border: "6px solid #1e3a8a",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h1
      style={{
        color: "#dc2626",
        textTransform: "uppercase",
        margin: "0 0 20px 0",
      }}
    >
      {data?.winner} WON
    </h1>
    <div style={{ fontSize: "24px", fontWeight: "bold" }}>
      by {data?.margin}
    </div>
  </div>
);

const SportsNetworkWeatherCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "300px",
      background: "#ffffff",
      border: "4px solid #1e3a8a",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "#1e3a8a",
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

const SportsNetworkTimeoutCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "300px",
      textAlign: "center",
      background: "#ffffff",
      border: "4px solid #dc2626",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "18px",
        color: "#dc2626",
        textTransform: "uppercase",
        fontWeight: 900,
      }}
    >
      Strategic Timeout
    </h3>
    <div style={{ fontSize: "32px", fontWeight: "bold" }}>2:30</div>
  </div>
);

const SportsNetworkWormCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "400px",
      background: "#ffffff",
      border: "4px solid #1e3a8a",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "#1e3a8a",
        textTransform: "uppercase",
      }}
    >
      Worm Graph
    </h3>
    <div
      style={{
        height: "150px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      [Worm Chart Placeholder]
    </div>
  </div>
);

const SportsNetworkWinProbCard = ({ data }) => (
  <div
    style={{
      padding: "20px",
      width: "350px",
      background: "#ffffff",
      border: "4px solid #1e3a8a",
      borderRadius: "8px",
      color: "#000",
      fontFamily: "'Open Sans', sans-serif",
    }}
  >
    <h3
      style={{
        margin: "0 0 10px 0",
        fontSize: "14px",
        color: "#1e3a8a",
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

const SportsNetworkCards = ({ activeCard }) => {
  if (!activeCard) return null;

  // Render component dynamically based on event type
  switch (activeCard.type) {
    case "eoo":
      return <SportsNetworkEndOfOverCard score={activeCard.data} />;
    case "milestone":
      return <SportsNetworkMilestoneCard data={activeCard.data} />;
    case "fow":
      return <SportsNetworkFallOfWicketCard data={activeCard.data} />;
    case "partnership":
      return <SportsNetworkPartnershipCard data={activeCard.data} />;
    case "new_batter":
      return <SportsNetworkNewBatterCard data={activeCard.data} />;
    case "bowler_change":
      return <SportsNetworkBowlerChangeCard data={activeCard.data} />;
    case "innings_break":
      return <SportsNetworkInningsBreakCard data={activeCard.data} />;
    case "match_result":
      return <SportsNetworkMatchResultCard data={activeCard.data} />;
    case "weather":
      return <SportsNetworkWeatherCard data={activeCard.data} />;
    case "timeout":
      return <SportsNetworkTimeoutCard data={activeCard.data} />;
    case "worm":
      return <SportsNetworkWormCard data={activeCard.data} />;
    case "win_prob":
      return <SportsNetworkWinProbCard data={activeCard.data} />;
    default:
      return null;
  }
};

export default SportsNetworkCards;
