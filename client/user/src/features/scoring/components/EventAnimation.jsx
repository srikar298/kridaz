import * as Sentry from "@sentry/react";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SFX_URLS = {}; // Disabled due to 403 Forbidden hotlinking block from Pixabay

const THEME_STYLES = {
  neon_classic: {
    bg: "linear-gradient(135deg, #0f172a, #000000)",
    border: "4px solid #a3e635",
    shadow: "0 0 50px rgba(163, 230, 53, 0.5)",
    text: "#a3e635",
    font: "'Orbitron', sans-serif",
  },
  premium_glass: {
    bg: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    shadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
    backdropFilter: "blur(10px)",
    text: "#ffffff",
    font: "'Montserrat', sans-serif",
  },
  retro_arcade: {
    bg: "#000000",
    border: "4px solid #ff00ff",
    shadow: "4px 4px 0px #00ffff",
    text: "#ff00ff",
    font: "'Press Start 2P', monospace",
  },
  sports_network: {
    bg: "#ffffff",
    border: "4px solid #dc2626",
    shadow: "0 10px 25px rgba(220, 38, 38, 0.4)",
    text: "#1e3a8a",
    font: "'Roboto Condensed', sans-serif",
  },
  cyber_pulse: {
    bg: "#050505",
    border: "2px solid #00f3ff",
    shadow: "0 0 20px #00f3ff",
    text: "#00f3ff",
    font: "'Rajdhani', sans-serif",
  },
};

const EventAnimation = ({ badge, theme = "neon_classic" }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (badge && SFX_URLS[badge.type]) {
      audioRef.current = new Audio(SFX_URLS[badge.type]);
      audioRef.current.volume = 0.6;
      audioRef.current.play().catch((e) => Sentry.captureException(e));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [badge]);

  if (!badge || !["six", "four", "wicket"].includes(badge.type)) return null;

  const style = THEME_STYLES[theme] || THEME_STYLES.neon_classic;

  let text = "";
  let subText = "";
  if (badge.type === "six") {
    text = "SIX!";
    subText = badge.description;
  } else if (badge.type === "four") {
    text = "FOUR!";
    subText = badge.description;
  } else if (badge.type === "wicket") {
    text = "WICKET!";
    subText = badge.description;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 2, opacity: 0, rotate: 10 }}
        transition={{ type: "spring", damping: 12, stiffness: 100 }}
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: style.bg,
          border: style.border,
          boxShadow: style.shadow,
          backdropFilter: style.backdropFilter || "none",
          padding: "40px 80px",
          borderRadius: "20px",
          textAlign: "center",
          zIndex: 9999,
          fontFamily: style.font,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: "120px",
            margin: 0,
            lineHeight: 1,
            color: style.text,
            textTransform: "uppercase",
            fontWeight: 900,
            WebkitTextStroke: theme === "retro_arcade" ? "0px" : "2px #000",
          }}
        >
          {text}
        </motion.h1>

        {subText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              fontSize: "32px",
              color: "#ffffff",
              marginTop: "20px",
              background: "rgba(0,0,0,0.5)",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: "bold",
            }}
          >
            {subText}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default EventAnimation;
