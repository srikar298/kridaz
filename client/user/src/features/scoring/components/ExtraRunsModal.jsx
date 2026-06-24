import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input } from "@kridaz/ui";


/**
 * ExtraRunsModal ΓÇö P1.4 & P1.5
 *
 * Shown when Wide, No-Ball, Bye, or Leg Bye is pressed.
 * Lets the umpire specify how many runs were scored off the delivery.
 */

const THEME_COLOR = "var(--secondary)";

const EXTRA_META = {
  WIDE: {
    label: "Wide",
    color: THEME_COLOR,
    note: "1 wide penalty already included",
  },
  NO_BALL: {
    label: "No-Ball",
    color: THEME_COLOR,
    note: "1 no-ball penalty already included",
  },
  BYE: {
    label: "Bye",
    color: THEME_COLOR,
    note: "Runs scored ΓÇö not credited to batsman",
  },
  LEG_BYE: {
    label: "Leg Bye",
    color: THEME_COLOR,
    note: "Runs scored ΓÇö not credited to batsman",
  },
};

const QUICK_RUNS = [0, 1, 2, 3, 4];

const ExtraRunsModal = ({ extraType = "WIDE", onConfirm, onClose }) => {
  const [runs, setRuns] = useState(0);
  const meta = EXTRA_META[extraType] || EXTRA_META.WIDE;

  const totalDisplay =
    extraType === "WIDE" || extraType === "NO_BALL"
      ? `${runs + 1} (${runs} runs + 1 penalty)`
      : `${runs} runs`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0 font-inter">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 24 }}
          className="relative w-full max-w-sm bg-background rounded-[12px] border border-white/5 overflow-hidden z-10 shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5 flex items-center justify-between border-b border-white/5">
            <div>
              <h2 className="font-inter text-[28px] font-semibold text-white leading-tight tracking-tight uppercase">
                {meta.label}
              </h2>
            </div>
          </div>

          {/* Quick-select buttons */}
          <div className="px-6 py-6 space-y-6">
            <div className="flex gap-3 justify-between">
              {QUICK_RUNS.map((r) => (
                <Button
                  key={r}
                  onClick={() => setRuns(r)}
                  style={
                    runs === r
                      ? {
                          background: THEME_COLOR,
                          color: "#000",
                          boxShadow: `0 0 20px ${THEME_COLOR}4d`,
                        }
                      : {}
                  }
                  className={`flex-1 h-14 rounded-[8px] text-xl font-black transition-all ${runs === r ? "scale-105" : "bg-white/5 text-neutral-400 border border-white/5 hover:border-white/10"}`}
                >
                  {r}
                </Button>
              ))}
            </div>

            {/* Manual input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                Overthrows / Manual
              </label>
              <div className="flex items-center gap-3 bg-neutral-900/50 border border-white/5 rounded-[8px] px-5 py-4 focus-within:border-success transition-all">
                <span className="text-neutral-500 text-sm font-bold uppercase">
                  Other
                </span>
                <Input
                  type="number"
                  min={0}
                  max={9}
                  value={runs}
                  onChange={(e) =>
                    setRuns(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="flex-1 bg-transparent text-white font-black text-2xl outline-none text-right"
                />
              </div>
            </div>

            {/* Total display */}
            <div className="bg-white/5 rounded-[8px] px-5 py-4 flex justify-between items-center border border-white/5">
              <span className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">
                Total Impact
              </span>
              <span
                className="font-black text-lg"
                style={{ color: THEME_COLOR }}
              >
                {totalDisplay}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={onClose}
                className="flex-1 py-5 rounded-[8px] font-black text-neutral-400 text-[11px] uppercase tracking-[0.2em] transition-all bg-card hover:bg-card active:scale-95"
              >
                Cancel
              </Button>
              <Button
                onClick={() => onConfirm(runs)}
                className="flex-[2] py-5 rounded-[8px] font-black text-black text-[11px] uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl"
                style={{
                  backgroundColor: THEME_COLOR,
                  boxShadow: `0 10px 30px ${THEME_COLOR}33`,
                }}
              >
                Confirm {meta.label}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExtraRunsModal;
