import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, X, ChevronRight } from "lucide-react";
import { Button } from "@kridaz/ui";


/**
 * InningsSetupModal
 *
 * Shown before scoring begins (or after a new innings starts).
 * Forces the umpire to pick:
 *   1. Opening striker
 *   2. Opening non-striker
 *   3. Opening bowler
 *
 * Props:
 *   battingTeamSlots  – array of { userId, name } for batting side
 *   bowlingTeamSlots  – array of { userId, name } for bowling side
 *   inningsLabel      – "1st Innings" | "2nd Innings"
 *   onConfirm(players) – called with { strikerId, nonStrikerId, bowlerId }
 *   onClose           – called to dismiss (without confirming)
 */
const InningsSetupModal = ({
  battingTeamSlots = [],
  bowlingTeamSlots = [],
  battingTeamInfo,
  bowlingTeamInfo,
  inningsLabel = "1st Innings",
  onConfirm,
  onClose,
}) => {
  const [step, setStep] = useState(1); // 1=striker 2=nonStriker 3=bowler 4=wicketKeeper
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);
  const [wicketKeeper, setWicketKeeper] = useState(null);

  const STEPS = [
    {
      id: 1,
      label: "Choose Opener (Striker)",
      icon: <Zap size={16} />,
      pool: battingTeamSlots,
      teamInfo: battingTeamInfo,
      excludeId: null,
    },
    {
      id: 2,
      label: "Choose Opener (Non-Striker)",
      icon: <Users size={16} />,
      pool: battingTeamSlots,
      teamInfo: battingTeamInfo,
      excludeId: striker?.userId,
    },
    {
      id: 3,
      label: "Choose Opening Bowler",
      icon: <Zap size={16} />,
      pool: bowlingTeamSlots,
      teamInfo: bowlingTeamInfo,
      excludeId: null,
    },
    {
      id: 4,
      label: "Choose Wicket Keeper",
      icon: <Users size={16} />,
      pool: bowlingTeamSlots.filter((p) => p.role?.includes("WICKET_KEEPER"))
        .length
        ? bowlingTeamSlots.filter((p) => p.role?.includes("WICKET_KEEPER"))
        : bowlingTeamSlots,
      teamInfo: bowlingTeamInfo,
      excludeId: bowler?.userId,
    },
  ];

  const currentStep = STEPS[step - 1];

  const handleSelect = (player) => {
    if (step === 1) {
      setStriker(player);
      setStep(2);
    } else if (step === 2) {
      setNonStriker(player);
      setStep(3);
    } else if (step === 3) {
      setBowler(player);
      setStep(4);
    } else {
      setWicketKeeper(player);
      // Auto-confirm once all four are chosen
      onConfirm({
        strikerId: striker.userId,
        nonStrikerId: nonStriker.userId,
        bowlerId: bowler.userId,
        wicketKeeperId: player.userId,
      });
    }
  };

  const pool = (currentStep.pool || []).filter(
    (p) => p.userId !== currentStep.excludeId
  );

  const stepColors = ["#EAB308", "#22D3EE", "#A78BFA", "var(--success)"];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0 font-inter">
        {/* Backdrop */}
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
          className="relative w-full max-w-md bg-background rounded-[12px] border border-white/5 overflow-hidden z-10 shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                {inningsLabel}
              </span>
              {onClose && (
                <Button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </Button>
              )}
            </div>
            <h2 className="font-inter text-[24px] font-semibold tracking-tight uppercase text-white leading-tight">
              {currentStep.label}
            </h2>

            {/* Step dots */}
            <div className="flex gap-2 mt-4">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: step >= s.id ? stepColors[s.id - 1] : "#333",
                  }}
                  className="h-1.5 flex-1 rounded-full transition-all duration-500"
                />
              ))}
            </div>
          </div>

          {/* Player list */}
          <div className="px-4 py-4 max-h-72 overflow-y-auto space-y-2 custom-scrollbar">
            {currentStep.teamInfo && (
              <div className="flex items-center gap-3 px-2 mb-3">
                {currentStep.teamInfo.logo ? (
                  <img
                    src={currentStep.teamInfo.logo}
                    alt={currentStep.teamInfo.name}
                    className="w-8 h-8 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <Users size={14} className="text-white/60" />
                  </div>
                )}
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  {currentStep.teamInfo.name}
                </span>
              </div>
            )}

            {pool.length === 0 && (
              <p className="text-center text-neutral-500 text-sm py-8">
                No players available
              </p>
            )}
            {pool.map((player) => (
              <Button
                key={player.userId}
                onClick={() => handleSelect(player)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-[8px] bg-white/5 hover:bg-yellow-500/10 transition-all group text-left"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-[8px] bg-neutral-800 flex items-center justify-center text-sm font-black text-yellow-500 shrink-0">
                  {player.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <span className="flex-1 font-bold text-white text-sm">
                  {player.name || "Unnamed"}
                </span>
                <ChevronRight
                  size={16}
                  className="text-neutral-600 group-hover:text-yellow-500 transition-colors"
                />
              </Button>
            ))}
          </div>

          {/* Footer: show selections so far */}
          {(striker || nonStriker) && (
            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              {striker && (
                <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-[8px] px-3 py-2 text-center">
                  <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-0.5">
                    Striker
                  </p>
                  <p className="text-xs font-black text-white truncate">
                    {striker.name}
                  </p>
                </div>
              )}
              {nonStriker && (
                <div className="flex-1 bg-cyan-500/10 border border-cyan-500/20 rounded-[8px] px-3 py-2 text-center">
                  <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-0.5">
                    Non-Striker
                  </p>
                  <p className="text-xs font-black text-white truncate">
                    {nonStriker.name}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InningsSetupModal;
