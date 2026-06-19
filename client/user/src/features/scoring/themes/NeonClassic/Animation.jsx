import * as Sentry from "@sentry/react";
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SFX_URLS = {}; // Disabled due to 403 Forbidden hotlinking block from Pixabay

const NeonClassicAnimation = ({ badge }) => {
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

  if (!badge) return null;

  let text = "";
  let subText = badge.description || "";
  let color = "#a3e635";

  switch (badge.type) {
    case "six":
      text = "SIX!";
      break;
    case "four":
      text = "FOUR!";
      break;
    case "wicket":
      text = "WICKET!";
      color = "#ef4444";
      break;
    case "free_hit":
      text = "FREE HIT!";
      color = "#f59e0b";
      break;
    case "no_ball":
      text = "NO BALL";
      color = "#f59e0b";
      break;
    case "wide":
      text = "WIDE";
      break;
    case "hat_trick":
      text = "HAT-TRICK!";
      color = "#eab308";
      break;
    case "dot":
      text = "DOT BALL";
      break;
    default:
      return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key={badge.id || badge.type}
        initial={{ scale: 0, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 2, opacity: 0, rotate: 10 }}
        transition={{ type: "spring", damping: 12, stiffness: 100 }}
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(15, 23, 42, 0.9)",
          border: `2px solid ${color}`,
          backdropFilter: "none",
          padding: "40px 80px",
          borderRadius: "20px",
          textAlign: "center",
          zIndex: 9999,
          fontFamily: "'Open Sans', sans-serif",
          boxShadow: "0 0 50px rgba(0,0,0,0.5)",
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
            color: color,
            textTransform: "uppercase",
            fontWeight: 900,
            WebkitTextStroke: "2px #000",
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

export default NeonClassicAnimation;
