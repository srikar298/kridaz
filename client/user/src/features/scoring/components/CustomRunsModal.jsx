import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input } from "@kridaz/ui";


const THEME_COLOR = "var(--success)";

const QUICK_RUNS = [5, 7, 8, 9];

export default function CustomRunsModal({ onConfirm, onClose }) {
  const [runs, setRuns] = useState(0);

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
                Custom Runs
              </h2>
            </div>
          </div>

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
                Manual Input
              </label>
              <div className="flex items-center gap-3 bg-neutral-900/50 border border-white/5 rounded-[8px] px-5 py-4 focus-within:border-success transition-all">
                <span className="text-neutral-500 text-sm font-bold uppercase">
                  Runs
                </span>
                <Input
                  type="number"
                  min={0}
                  value={runs}
                  onChange={(e) =>
                    setRuns(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="flex-1 bg-transparent text-white font-black text-2xl outline-none text-right"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={onClose}
                className="flex-1 py-5 rounded-[8px] font-black text-neutral-400 text-[11px] uppercase tracking-[0.2em] transition-all bg-card hover:bg-card active:scale-95"
              >
                BACK
              </Button>
              <Button
                onClick={() => onConfirm(runs)}
                className="flex-[2] py-5 rounded-[8px] font-black text-black text-[11px] uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl"
                style={{
                  backgroundColor: THEME_COLOR,
                  boxShadow: `0 10px 30px ${THEME_COLOR}33`,
                }}
              >
                Confirm Score
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
