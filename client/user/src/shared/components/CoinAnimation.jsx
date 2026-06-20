import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CoinAnimation = ({ show, amount, onComplete }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete && onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
        >
          {/* 3D Coin Container */}
          <div className="relative">
            <motion.div
              initial={{ scale: 0, rotateY: 0, y: 100 }}
              animate={{
                scale: [1, 1.2, 1],
                rotateY: [0, 720, 1440],
                y: [100, -50, -200],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="w-32 h-32 relative preserve-3d"
            >
              {/* Gold Coin Front */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary rounded-full border-4 border-primary flex items-center justify-center shadow-[0_0_30px_rgba(85,222,232,0.6)]">
                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary">
                  C
                </span>
              </div>

              {/* Gold Coin Back */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary to-primary rounded-full border-4 border-primary flex items-center justify-center backface-hidden"
                style={{ transform: "rotateY(180deg)" }}
              >
                <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary">
                  C
                </span>
              </div>
            </motion.div>

            {/* Deduction Text */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 1, scale: 1, y: -100 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
            >
              <h2 className="text-4xl font-black text-red-500 drop-shadow-lg">
                -{amount} Coins
              </h2>
              <p className="text-white font-bold text-lg mt-2">
                Deducted Successfully
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CoinAnimation;
