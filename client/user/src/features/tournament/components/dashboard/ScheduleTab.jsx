import React, { useState } from "react";
import { Calendar, Wand2, MapPin, Clock, X, Plus, Trash2 } from "lucide-react";
import {
  useGetTournamentMatchesQuery,
  useAutoScheduleGroupStageMutation,
} from "../../../../redux/api/tournamentApi";
import { toast } from "react-hot-toast";
import { format, parseISO } from "date-fns";
import KnockoutSchedulerModal from "./KnockoutSchedulerModal";

const ScheduleTab = ({ tournament }) => {
  const { data: matchesRes, isLoading: isLoadingMatches } =
    useGetTournamentMatchesQuery(tournament.id);
  const matches = matchesRes?.data || [];

  const [autoSchedule] = useAutoScheduleGroupStageMutation();

  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [slotTimes, setSlotTimes] = useState(["09:00", "14:00"]);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (slotTimes.length === 0) {
      return toast.error("Please add at least one time slot.");
    }

    setIsGenerating(true);
    try {
      await autoSchedule({
        id: tournament.id,
        data: { startDate, slotTimes },
      }).unwrap();

      toast.success("Fixtures generated successfully!");
      setShowAutoModal(false);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to generate fixtures");
    } finally {
      setIsGenerating(false);
    }
  };

  const addSlot = () => setSlotTimes([...slotTimes, "12:00"]);
  const removeSlot = (idx) =>
    setSlotTimes(slotTimes.filter((_, i) => i !== idx));
  const updateSlot = (idx, val) => {
    const newSlots = [...slotTimes];
    newSlots[idx] = val;
    setSlotTimes(newSlots);
  };

  if (isLoadingMatches) {
    return (
      <div className="text-center p-8 text-white/50">Loading matches...</div>
    );
  }

  const groupStageMatches = matches.filter(
    (m) => m.tournamentStage === "GROUP"
  );
  const knockoutMatches = matches.filter((m) => m.tournamentStage !== "GROUP");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Auto Generator Banner */}
      <div className="bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 border border-[#BFF367]/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2 mb-1">
              <Wand2 className="text-[#BFF367]" size={20} />
              Auto-Generate Fixtures
            </h3>
            <p className="text-sm text-white/70">
              Let KRIDAZ automatically generate your group stage bracket based
              on {tournament.details?.maxTeams || 0} teams and{" "}
              {tournament.format} format.
            </p>
          </div>
          <button
            onClick={() => setShowAutoModal(true)}
            className="flex-shrink-0 bg-[#BFF367] text-black font-black px-6 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-white transition-colors shadow-[0_0_20px_rgba(191,243,103,0.3)] hover:shadow-[0_0_30px_rgba(191,243,103,0.5)]"
          >
            Generate Bracket
          </button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-[#BFF367]/20 to-transparent blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
      </div>

      {/* Match List */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-white/90 uppercase tracking-widest">
            Scheduled Matches
          </h3>
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2 bg-[#BFF367]/10 text-[#BFF367] border border-[#BFF367]/20 rounded-full text-xs font-bold transition-colors hover:bg-[#BFF367] hover:text-black"
          >
            + Add Manual Knockout Match
          </button>
        </div>

        <div className="space-y-4">
          {matches.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-white/40 font-bold mb-2">
                No matches scheduled yet.
              </p>
              <button
                onClick={() => setShowAutoModal(true)}
                className="text-xs text-[#BFF367] hover:underline font-bold"
              >
                Auto Generate Now
              </button>
            </div>
          ) : (
            matches.map((match, i) => (
              <div
                key={match.id}
                className="border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#55DEE8] bg-[#55DEE8]/10 px-2 py-1 rounded">
                    Match {i + 1} • {match.tournamentStage || "GROUP"}
                  </span>
                  <div className="flex gap-2 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {match.scheduledAt
                        ? format(new Date(match.scheduledAt), "MMM dd, yyyy")
                        : "TBD"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {match.scheduledAt
                        ? format(new Date(match.scheduledAt), "HH:mm")
                        : "TBD"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 w-1/3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                      {match.teams?.[0]?.team?.name
                        ?.substring(0, 2)
                        .toUpperCase() || "TBD"}
                    </div>
                    <span className="font-bold">
                      {match.teams?.[0]?.team?.name || "TBD"}
                    </span>
                  </div>

                  <div className="text-xs font-black text-white/30 uppercase">
                    VS
                  </div>

                  <div className="flex items-center justify-end gap-3 w-1/3 text-right">
                    <span className="font-bold">
                      {match.teams?.[1]?.team?.name || "TBD"}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs">
                      {match.teams?.[1]?.team?.name
                        ?.substring(0, 2)
                        .toUpperCase() || "TBD"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Auto Schedule Modal */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 max-w-md w-full relative">
            <button
              onClick={() => !isGenerating && setShowAutoModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-black uppercase tracking-widest mb-4">
              Schedule Preferences
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BFF367]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">
                  Match Time Slots (Per Day)
                </label>
                <div className="space-y-2">
                  {slotTimes.map((slot, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="time"
                        value={slot}
                        onChange={(e) => updateSlot(idx, e.target.value)}
                        className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BFF367]"
                      />
                      <button
                        onClick={() => removeSlot(idx)}
                        className="w-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addSlot}
                    className="w-full py-3 border border-dashed border-white/10 rounded-xl text-xs font-bold text-white/50 hover:text-white hover:border-white/30 flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add Time Slot
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full mt-6 bg-[#BFF367] text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Confirm & Generate"}
            </button>
          </div>
        </div>
      )}

      {/* Manual Knockout Scheduler Modal */}
      {showManualModal && (
        <KnockoutSchedulerModal
          tournament={tournament}
          onClose={() => setShowManualModal(false)}
        />
      )}
    </div>
  );
};

export default ScheduleTab;
