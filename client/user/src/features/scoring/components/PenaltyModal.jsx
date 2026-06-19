import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function PenaltyModal({ matchData, onClose, onConfirm }) {
  const teamA =
    matchData?.teamA ||
    matchData?.hostedGameId?.teamA ||
    (Array.isArray(matchData?.hostedGameId?.teams)
      ? matchData.hostedGameId.teams.find((t) => t.teamKey === "teamA")
      : null);
  const teamB =
    matchData?.teamB ||
    matchData?.hostedGameId?.teamB ||
    (Array.isArray(matchData?.hostedGameId?.teams)
      ? matchData.hostedGameId.teams.find((t) => t.teamKey === "teamB")
      : null);

  const [selectedTeam, setSelectedTeam] = useState(teamA?.id || teamA?._id);
  const [runs, setRuns] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTeam || !runs || isNaN(runs) || Number(runs) <= 0) return;
    onConfirm(selectedTeam, Number(runs));
  };

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
          className="relative w-full max-w-sm bg-[#000] border border-white/5 rounded-[12px] shadow-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                Award extra runs
              </span>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <h2 className="font-inter text-[24px] font-semibold tracking-tight uppercase text-white leading-tight">
              Add Penalty
            </h2>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">
                  Select Team to Receive Runs
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTeam(teamA?.id || teamA?._id)}
                    className={`flex-1 py-3 px-2 rounded-[8px] text-[11px] font-black uppercase tracking-widest transition-all ${selectedTeam === (teamA?.id || teamA?._id) ? "bg-[#00C187]/20 border border-[#00C187]/50 text-[#00C187]" : "bg-white/5 border border-white/5 text-neutral-400 hover:text-white"}`}
                  >
                    {teamA?.name || "TBD"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeam(teamB?.id || teamB?._id)}
                    className={`flex-1 py-3 px-2 rounded-[8px] text-[11px] font-black uppercase tracking-widest transition-all ${selectedTeam === (teamB?.id || teamB?._id) ? "bg-[#00C187]/20 border border-[#00C187]/50 text-[#00C187]" : "bg-white/5 border border-white/5 text-neutral-400 hover:text-white"}`}
                  >
                    {teamB?.name || "TBD"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">
                  Penalty Runs
                </label>
                <input
                  type="number"
                  min="1"
                  value={runs}
                  onChange={(e) => setRuns(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full bg-white/5 border border-white/10 rounded-[8px] p-4 text-center text-2xl font-black text-white focus:outline-none focus:border-[#00C187]/50 transition-all placeholder:text-neutral-700"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!runs || !selectedTeam}
                className="w-full h-14 bg-red-600 text-white rounded-[8px] flex items-center justify-center text-[12px] font-black uppercase tracking-[0.3em] hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                Apply Penalty
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
