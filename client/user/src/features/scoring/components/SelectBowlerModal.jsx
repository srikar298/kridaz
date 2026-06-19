import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronRight } from "lucide-react";

/**
 * SelectBowlerModal
 *
 * Shown when an over is complete and a new bowler needs to be selected.
 *
 * Props:
 *   pool             - array of { userId, name } for bowling side
 *   currentBowlerId  - id of the current bowler (cannot bowl consecutive overs)
 *   onConfirm        - called with { bowlerId }
 */
const SelectBowlerModal = ({ pool = [], currentBowlerId, onConfirm }) => {
  // Filter out the current bowler since they can't bowl two overs in a row
  const availableBowlers = pool.filter((p) => p.userId !== currentBowlerId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 22 }}
          className="relative w-full max-w-md bg-[#111] rounded-[8px] border border-white/10 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10">
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Zap size={20} className="text-[#00C187]" />
              Select Next Bowler
            </h2>
          </div>

          {/* Player list */}
          <div className="px-4 py-4 max-h-72 overflow-y-auto space-y-2 custom-scrollbar">
            {availableBowlers.length === 0 && (
              <p className="text-center text-neutral-500 text-sm py-8">
                No other bowlers available
              </p>
            )}
            {availableBowlers.map((player) => (
              <button
                key={player.userId}
                onClick={() => onConfirm(player.userId)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-[8px] border border-white/8 bg-white/4 hover:border-[#00C187]/50 hover:bg-[#00C187]/8 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-[8px] bg-neutral-800 flex items-center justify-center text-sm font-black text-[#00C187] shrink-0">
                  {player.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <span className="flex-1 font-bold text-white text-sm">
                  {player.name || "Unnamed"}
                </span>
                <ChevronRight
                  size={16}
                  className="text-neutral-600 group-hover:text-[#00C187] transition-colors"
                />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SelectBowlerModal;
