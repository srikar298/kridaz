import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target } from "lucide-react";
import { Button } from "@kridaz/ui";


const POSITIONS = [
  { key: "DEEP_MID_WICKET", label: "Deep Mid Wicket" },
  { key: "LONG_ON", label: "Long On" },
  { key: "LONG_OFF", label: "Long Off" },
  { key: "DEEP_COVER", label: "Deep Cover" },
  { key: "DEEP_POINT", label: "Deep Point" },
  { key: "THIRD_MAN", label: "Third Man" },
  { key: "DEEP_FINE_LEG", label: "Deep Fine Leg" },
  { key: "DEEP_SQUARE_LEG", label: "Deep Square Leg" },
];

const DISTANCES = [
  { key: "SHORT", label: "Short" },
  { key: "MID", label: "Mid" },
  { key: "AFTER_MID", label: "After Mid" },
  { key: "BOUNDARY", label: "Boundary" },
];

const FieldingPositionModal = ({ runs, isBoundary, onConfirm, onClose }) => {
  const [step, setStep] = useState("position"); // 'position' | 'distance'
  const [position, setPosition] = useState(null);

  // If it's a boundary, we can automatically set distance to BOUNDARY, but we still need position.

  const handlePositionSelect = (posKey) => {
    setPosition(posKey);
    if (isBoundary) {
      // Auto confirm for boundaries
      onConfirm({ position: posKey, distance: "BOUNDARY" });
    } else {
      setStep("distance");
    }
  };

  const handleDistanceSelect = (distKey) => {
    onConfirm({ position, distance: distKey });
  };

  const handleSkip = () => {
    onConfirm({ position: null, distance: null });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 22 }}
          className="relative w-full max-w-md bg-card rounded-[8px] border border-blue-500/20 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-blue-500/15 flex items-center justify-center">
                <Target size={16} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-white leading-tight">
                  {step === "position"
                    ? "Where was it hit?"
                    : "How far did it go?"}
                </h2>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                  Wagon Wheel &bull; {runs} Runs
                </p>
              </div>
            </div>
            <Button
              onClick={handleSkip}
              className="p-1 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
             aria-label="Close">
              <X size={16} />
            </Button>
          </div>

          {/* Body */}
          <div className="px-4 py-4 max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
            {step === "position" && (
              <div className="grid grid-cols-2 gap-2">
                {POSITIONS.map((pos) => (
                  <Button
                    key={pos.key}
                    onClick={() => handlePositionSelect(pos.key)}
                    className="p-4 rounded-[8px] border border-white/8 bg-white/4 hover:border-blue-500/50 hover:bg-blue-500/8 transition-all text-left group"
                  >
                    <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">
                      {pos.label}
                    </span>
                  </Button>
                ))}
              </div>
            )}

            {step === "distance" && (
              <div className="grid grid-cols-2 gap-2">
                {DISTANCES.map((dist) => (
                  <Button
                    key={dist.key}
                    onClick={() => handleDistanceSelect(dist.key)}
                    className="p-4 rounded-[8px] border border-white/8 bg-white/4 hover:border-blue-500/50 hover:bg-blue-500/8 transition-all text-left group"
                  >
                    <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">
                      {dist.label}
                    </span>
                  </Button>
                ))}
              </div>
            )}

            {step === "position" && (
              <Button
                onClick={handleSkip}
                className="w-full mt-2 py-3 rounded-[8px] border border-dashed border-white/15 text-neutral-500 text-sm font-bold hover:border-white/30 transition-colors"
              >
                Skip Wagon Wheel
              </Button>
            )}
          </div>

          {step === "distance" && (
            <div className="px-6 pb-5 pt-3 border-t border-white/10">
              <Button
                onClick={() => setStep("position")}
                className="text-xs text-neutral-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
              >
                ← Back
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FieldingPositionModal;
