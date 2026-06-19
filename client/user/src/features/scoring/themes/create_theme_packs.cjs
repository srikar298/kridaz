const fs = require("fs");
const path = require("path");

const themes = [
  {
    dir: "NeonClassic",
    name: "NeonClassic",
    style: {
      bg: "rgba(15, 23, 42, 0.9)",
      border: "2px solid #a3e635",
      text: "#a3e635",
      textMuted: "#94a3b8",
      font: "'Orbitron', sans-serif",
    },
  },
  {
    dir: "PremiumGlass",
    name: "PremiumGlass",
    style: {
      bg: "rgba(255,255,255,0.1)",
      border: "1px solid rgba(255,255,255,0.2)",
      backdropFilter: "blur(10px)",
      text: "#ffffff",
      textMuted: "rgba(255,255,255,0.6)",
      font: "'Montserrat', sans-serif",
    },
  },
  {
    dir: "RetroArcade",
    name: "RetroArcade",
    style: {
      bg: "#000000",
      border: "4px solid #ff00ff",
      text: "#ff00ff",
      textMuted: "#00ffff",
      font: "'Press Start 2P', monospace",
    },
  },
  {
    dir: "SportsNetwork",
    name: "SportsNetwork",
    style: {
      bg: "#ffffff",
      border: "4px solid #dc2626",
      text: "#1e3a8a",
      textMuted: "#64748b",
      font: "'Roboto Condensed', sans-serif",
    },
  },
  {
    dir: "CyberPulse",
    name: "CyberPulse",
    style: {
      bg: "#050505",
      border: "2px solid #00f3ff",
      text: "#00f3ff",
      textMuted: "#94a3b8",
      font: "'Rajdhani', sans-serif",
    },
  },
];

const SFX_URLS = {
  six: "https://cdn.pixabay.com/audio/2022/03/15/audio_e0ea43ccaf.mp3", // Big Cheer
  four: "https://cdn.pixabay.com/audio/2022/05/16/audio_f5f6bd55cd.mp3", // Applause
  wicket: "https://cdn.pixabay.com/audio/2022/10/30/audio_55a2ee0920.mp3", // Gasp/Shock
};

themes.forEach((t) => {
  const dirPath = path.join(__dirname, t.dir);

  // Create Cards.jsx
  const cardsContent = `import React from 'react';

const ${t.name}EndOfOverCard = ({ score }) => {
  return (
    <div style={{ padding: '20px', width: '350px' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '${t.style.textMuted}', textTransform: 'uppercase' }}>End of Over {score.overs}</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '32px', fontWeight: 900, color: '${t.style.text}' }}>{score.totalRuns}/{score.totalWickets}</div>
          <div style={{ fontSize: '14px', color: '${t.style.textMuted}' }}>CRR: {score.crr}</div>
        </div>
        {score.bowler && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{score.bowler.name}</div>
            <div style={{ fontSize: '14px', color: '${t.style.textMuted}' }}>{score.bowler.wickets}-{score.bowler.runs}</div>
          </div>
        )}
      </div>
      <div style={{ marginTop: '15px', display: 'flex', gap: '5px' }}>
        {score.last6Balls?.map((b, i) => (
          <div key={i} style={{ 
            width: '28px', height: '28px', borderRadius: '50%', 
            background: b.type === 'wicket' ? '#ef4444' : b.type === 'boundary' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 'bold', color: '#fff'
          }}>
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const ${t.name}MilestoneCard = ({ batter }) => {
  return (
    <div style={{ padding: '20px', width: '300px', textAlign: 'center' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '${t.style.text}', textTransform: 'uppercase', fontWeight: 900 }}>MILESTONE REACHED</h3>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>{batter.name}</div>
      <div style={{ fontSize: '48px', fontWeight: 900, color: '${t.style.text}' }}>{batter.runs}</div>
      <div style={{ fontSize: '14px', color: '${t.style.textMuted}' }}>off {batter.balls} balls (SR: {batter.strikeRate})</div>
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
        <div style={{ color: '#fff' }}>4s: <span style={{ color: '${t.style.text}' }}>{batter.fours}</span></div>
        <div style={{ color: '#fff' }}>6s: <span style={{ color: '${t.style.text}' }}>{batter.sixes}</span></div>
      </div>
    </div>
  );
};

const ${t.name}Cards = ({ activeCard }) => {
  if (!activeCard) return null;
  return (
    <div style={{
      background: '${t.style.bg}',
      border: '${t.style.border}',
      backdropFilter: '${t.style.backdropFilter || "none"}',
      borderRadius: '16px',
      overflow: 'hidden',
      fontFamily: ${t.style.font},
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    }}>
      {activeCard.type === 'eoo' && <${t.name}EndOfOverCard score={activeCard.data} />}
      {activeCard.type === 'milestone' && <${t.name}MilestoneCard batter={activeCard.data} />}
    </div>
  );
};

export default ${t.name}Cards;
`;
  fs.writeFileSync(path.join(dirPath, "Cards.jsx"), cardsContent);

  // Create Animation.jsx
  const animationContent = `import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SFX_URLS = ${JSON.stringify(SFX_URLS)};

const ${t.name}Animation = ({ badge }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (badge && SFX_URLS[badge.type]) {
      audioRef.current = new Audio(SFX_URLS[badge.type]);
      audioRef.current.volume = 0.6;
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [badge]);

  if (!badge || !['six', 'four', 'wicket'].includes(badge.type)) return null;

  let text = '';
  let subText = badge.description || '';
  if (badge.type === 'six') text = 'SIX!';
  if (badge.type === 'four') text = 'FOUR!';
  if (badge.type === 'wicket') text = 'WICKET!';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 2, opacity: 0, rotate: 10 }}
        transition={{ type: 'spring', damping: 12, stiffness: 100 }}
        style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          background: '${t.style.bg}',
          border: '${t.style.border}',
          backdropFilter: '${t.style.backdropFilter || "none"}',
          padding: '40px 80px', borderRadius: '20px', textAlign: 'center', zIndex: 9999,
          fontFamily: ${t.style.font},
          boxShadow: '0 0 50px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <motion.h1
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ fontSize: '120px', margin: 0, lineHeight: 1, color: '${t.style.text}', textTransform: 'uppercase', fontWeight: 900, WebkitTextStroke: '${t.name === "RetroArcade" ? "0px" : "2px #000"}' }}
        >
          {text}
        </motion.h1>
        {subText && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontSize: '32px', color: '#ffffff', marginTop: '20px', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}
          >
            {subText}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ${t.name}Animation;
`;
  fs.writeFileSync(path.join(dirPath, "Animation.jsx"), animationContent);

  // Create index.js
  const indexContent = `export { default as Ticker } from './Ticker';
export { default as Cards } from './Cards';
export { default as Animation } from './Animation';
`;
  fs.writeFileSync(path.join(dirPath, "index.js"), indexContent);

  // Update Ticker imports in Ticker.jsx
  let tickerContent = fs.readFileSync(
    path.join(dirPath, "Ticker.jsx"),
    "utf-8"
  );
  // Just ensure it exports default correctly, which it already does.
});

// Update main index.js
const mainIndexContent = `export * as NeonClassicPack from './NeonClassic';
export * as PremiumGlassPack from './PremiumGlass';
export * as RetroArcadePack from './RetroArcade';
export * as SportsNetworkPack from './SportsNetwork';
export * as CyberPulsePack from './CyberPulse';
`;
fs.writeFileSync(path.join(__dirname, "index.js"), mainIndexContent);

console.log("Theme Packs created successfully.");
