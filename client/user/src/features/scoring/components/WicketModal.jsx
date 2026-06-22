import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Users } from "lucide-react";import { Button } from "@kridaz/ui";


/**
 * WicketModal — P1.1
 *
 * Shown when the umpire presses WICKET.
 * Collects: wicketType, fielderId (if applicable), nextBatterId, extraRuns (run out).
 *
 * Props:
 *   fieldingTeamSlots  – [{ userId, name }]
 *   battingTeamSlots   – [{ userId, name }] (remaining batters, excluding current striker)
 *   onConfirm({ wicketType, fielderId, nextBatterId, runs }) – called after confirmation
 *   onClose()
 */

const WICKET_TYPES = [
  { key: "BOWLED", label: "Bowled", needsFielder: false },
  { key: "CAUGHT", label: "Caught", needsFielder: true },
  { key: "LBW", label: "LBW", needsFielder: false },
  {
    key: "RUN_OUT",
    label: "Run Out",
    needsFielder: true,
    needsWhoOut: true,
    needsRuns: true,
  },
  { key: "STUMPED", label: "Stumped", needsFielder: true },
  { key: "HIT_WICKET", label: "Hit Wicket", needsFielder: false },
  {
    key: "OBSTRUCTING",
    label: "Obstructing Field",
    needsFielder: false,
    needsWhoOut: true,
  },
  {
    key: "RETIRED_HURT",
    label: "Retired Hurt",
    needsFielder: false,
    needsWhoOut: true,
  },
  {
    key: "RETIRED_OUT",
    label: "Retired Out",
    needsFielder: false,
    needsWhoOut: true,
  },
  { key: "TIMED_OUT", label: "Timed Out", needsFielder: false },
];

const WicketModal = ({
  fieldingTeamSlots = [],
  battingTeamSlots = [],
  activeBatters = [],
  onConfirm,
  onClose,
}) => {
  const [step, setStep] = useState("type"); // 'type' | 'whoOut' | 'runs' | 'fielder' | 'nextBatter'
  const [wicketType, setWicketType] = useState(null);
  const [fielderId, setFielderId] = useState(null);
  const [playerOutId, setPlayerOutId] = useState(null);
  const [runsCompleted, setRunsCompleted] = useState(0);

  const selectedMeta = WICKET_TYPES.find((w) => w.key === wicketType);

  const goToNextFromType = (wt) => {
    if (wt.needsWhoOut && activeBatters.length > 0) {
      setStep("whoOut");
    } else {
      goToNextFromWhoOut(wt);
    }
  };

  const goToNextFromWhoOut = (wt) => {
    if (wt.needsRuns) {
      setStep("runs");
    } else {
      goToNextFromRuns(wt);
    }
  };

  const goToNextFromRuns = (wt) => {
    if (wt.needsFielder && fieldingTeamSlots.length > 0) {
      setStep("fielder");
    } else {
      setStep("nextBatter");
    }
  };

  const handleTypeSelect = (wt) => {
    setWicketType(wt.key);
    goToNextFromType(wt);
  };

  const handleWhoOutSelect = (playerId) => {
    setPlayerOutId(playerId);
    goToNextFromWhoOut(selectedMeta);
  };

  const handleRunsSelect = (runs) => {
    setRunsCompleted(runs);
    goToNextFromRuns(selectedMeta);
  };

  const handleFielderSelect = (playerId) => {
    setFielderId(playerId);
    setStep("nextBatter");
  };

  const handleNextBatterSelect = (nextId) => {
    onConfirm({
      wicketType,
      fielderId,
      nextBatterId: nextId,
      runs: runsCompleted,
      playerOutId,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center px-0 pb-0 sm:px-4 sm:pb-0 font-inter">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 24 }}
          className="relative w-full max-w-md bg-background rounded-t-[20px] sm:rounded-[12px] overflow-hidden z-10 shadow-2xl pb-4 sm:pb-0"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-inter text-[24px] font-semibold tracking-tight uppercase text-white leading-tight">
                  {step === "type" && "How was the wicket?"}
                  {step === "whoOut" && "Who got out?"}
                  {step === "runs" && "Runs completed before run out?"}
                  {step === "fielder" &&
                    `Who ${selectedMeta?.key === "STUMPED" ? "stumped" : selectedMeta?.key === "RUN_OUT" ? "ran them out" : "caught it"}?`}
                  {step === "nextBatter" && "Who bats next?"}
                </h2>
                {wicketType && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
                    {selectedMeta?.label}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Body */}
          <div className="px-4 py-4 max-h-[60vh] overflow-y-auto space-y-2 custom-scrollbar">
            {/* Step 1: Wicket type */}
            {step === "type" && (
              <div className="grid grid-cols-2 gap-2">
                {WICKET_TYPES.map((wt) => (
                  <Button
                    key={wt.key}
                    onClick={() => handleTypeSelect(wt)}
                    className="p-4 rounded-[8px] bg-card hover:border-red-500/50 hover:bg-red-500/8 transition-all text-left group"
                  >
                    <span className="text-sm font-black text-white group-hover:text-red-400 transition-colors">
                      {wt.label}
                    </span>
                  </Button>
                ))}
              </div>
            )}

            {/* Step 1.5: Who got out? */}
            {step === "whoOut" && (
              <>
                {activeBatters.map((player) => (
                  <Button
                    key={player.userId}
                    onClick={() => handleWhoOutSelect(player.userId)}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-[8px] bg-card hover:border-red-500/40 hover:bg-red-500/8 transition-all group mb-2"
                  >
                    <div className="w-9 h-9 rounded-[8px] bg-neutral-800 flex items-center justify-center text-sm font-black text-red-400 shrink-0">
                      {player.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="block font-bold text-white text-sm">
                        {player.name}
                      </span>
                      <span className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                        {player.role}
                      </span>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-neutral-600 group-hover:text-red-400 transition-colors"
                    />
                  </Button>
                ))}
              </>
            )}

            {/* Step 1.75: Runs completed */}
            {step === "runs" && (
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                  <Button
                    key={run}
                    onClick={() => handleRunsSelect(run)}
                    className="p-4 rounded-[8px] bg-card hover:border-red-500/50 hover:bg-red-500/8 transition-all text-center group"
                  >
                    <span className="text-xl font-black text-white group-hover:text-red-400 transition-colors">
                      {run}
                    </span>
                  </Button>
                ))}
              </div>
            )}

            {/* Step 2: Fielder selection */}
            {step === "fielder" && (
              <>
                {fieldingTeamSlots.map((player) => (
                  <Button
                    key={player.userId}
                    onClick={() => handleFielderSelect(player.userId)}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-[8px] bg-card hover:border-red-500/40 hover:bg-red-500/8 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-[8px] bg-neutral-800 flex items-center justify-center text-sm font-black text-red-400 shrink-0">
                      {player.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="flex-1 font-bold text-white text-sm">
                      {player.name}
                    </span>
                    <ChevronRight
                      size={14}
                      className="text-neutral-600 group-hover:text-red-400 transition-colors"
                    />
                  </Button>
                ))}
              </>
            )}

            {/* Step 3: Next batsman */}
            {step === "nextBatter" && (
              <>
                {battingTeamSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <Users
                      className="text-neutral-600 mx-auto mb-3"
                      size={32}
                    />
                    <p className="text-neutral-500 text-sm font-medium">
                      All wickets fallen — innings over!
                    </p>
                    <Button
                      onClick={() =>
                        onConfirm({
                          wicketType,
                          fielderId,
                          nextBatterId: null,
                          runs: runsCompleted,
                          playerOutId,
                        })
                      }
                      className="mt-4 px-6 py-3 bg-red-500 text-white font-black rounded-[8px] text-sm uppercase tracking-widest hover:bg-red-600 transition-colors"
                    >
                      End Innings
                    </Button>
                  </div>
                ) : (
                  battingTeamSlots.map((player) => (
                    <Button
                      key={player.userId}
                      onClick={() => handleNextBatterSelect(player.userId)}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-[8px] bg-card hover:border-yellow-500/40 hover:bg-yellow-500/8 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-[8px] bg-neutral-800 flex items-center justify-center text-sm font-black text-yellow-400 shrink-0">
                        {player.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="flex-1 font-bold text-white text-sm">
                        {player.name}
                      </span>
                      <ChevronRight
                        size={14}
                        className="text-neutral-600 group-hover:text-yellow-400 transition-colors"
                      />
                    </Button>
                  ))
                )}
              </>
            )}
          </div>

          {/* Bottom Actions */}
          {step !== "type" && (
            <div className="px-6 pb-6 pt-4 border-t border-white/10 flex gap-4">
              <Button
                onClick={() => {
                  if (step === "nextBatter") {
                    if (selectedMeta?.needsFielder) setStep("fielder");
                    else if (selectedMeta?.needsRuns) setStep("runs");
                    else if (selectedMeta?.needsWhoOut) setStep("whoOut");
                    else setStep("type");
                  } else if (step === "fielder") {
                    if (selectedMeta?.needsRuns) setStep("runs");
                    else if (selectedMeta?.needsWhoOut) setStep("whoOut");
                    else setStep("type");
                  } else if (step === "runs") {
                    if (selectedMeta?.needsWhoOut) setStep("whoOut");
                    else setStep("type");
                  } else if (step === "whoOut") {
                    setStep("type");
                  }
                }}
                className="flex-1 py-4 rounded-[8px] bg-card hover:bg-card text-[11px] text-neutral-400 hover:text-white font-black uppercase tracking-[0.2em] transition-all active:scale-95"
              >
                BACK
              </Button>

              {step === "fielder" && (
                <Button
                  onClick={() => setStep("nextBatter")}
                  className="flex-[2] py-4 rounded-[8px] bg-card hover:bg-[#333] text-[11px] text-white font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl"
                >
                  Skip Fielder
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WicketModal;
