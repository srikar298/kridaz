import React, { useState } from "react";
import { Calendar, Wand2, MapPin, Clock, X, Plus, Trash2 } from "lucide-react";
import {
  useGetTournamentMatchesQuery,
  useAutoScheduleGroupStageMutation,
} from "../../../../redux/api/tournamentApi";
import { toast } from "react-hot-toast";
import { format, parseISO } from "date-fns";
import KnockoutSchedulerModal from "./KnockoutSchedulerModal";
import { Button, Input } from "@kridaz/ui";

const MatchesTab = ({ tournamentId, tournament }) => {
  // tournamentId comes directly from the parent via prop — prevents undefined query
  const { data: matchesData, isLoading } = useGetTournamentMatchesQuery(tournamentId);
  const [autoSchedule, { isLoading: isGenerating }] = useAutoScheduleGroupStageMutation();

  const [showAutoModal, setShowAutoModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [startDate, setStartDate] = useState(
    tournament?.startDate ? new Date(tournament.startDate).toISOString().split('T')[0] : ""
  );
  const [slotTimes, setSlotTimes] = useState(["09:00", "14:00"]);

  // Fix: backend returns { data: [...] } not { matches: [...] }
  const matches = matchesData?.data || [];

  const handleGenerate = async () => {
    try {
      if (!startDate) return toast.error("Start date is required");
      if (slotTimes.length === 0) return toast.error("At least one time slot is required");

      // Fix: API shape is { id, data: { startDate, slotTimes } }
      await autoSchedule({
        id: tournamentId,
        data: {
          startDate: new Date(startDate).toISOString(),
          slotTimes,
        },
      }).unwrap();

      toast.success("Schedule generated successfully!");
      setShowAutoModal(false);
    } catch (error) {
      // Bubble collision errors clearly
      const msg = error?.data?.message || "Failed to generate schedule";
      toast.error(msg, { duration: 6000 });
    }
  };

  const addSlot = () => setSlotTimes([...slotTimes, "12:00"]);
  const removeSlot = (idx) => setSlotTimes(slotTimes.filter((_, i) => i !== idx));
  const updateSlot = (idx, val) => {
    const newSlots = [...slotTimes];
    newSlots[idx] = val;
    setSlotTimes(newSlots);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white">Matches</h2>
          <p className="text-xs text-white/50 uppercase">Manage tournament schedule</p>
        </div>
        <div className="flex gap-2">
          {tournament?.format === "KNOCKOUT" ? (
             <Button
               onClick={() => setShowManualModal(true)}
               className="bg-card border border-white/10 hover:border-white/30 text-xs font-bold text-white px-4 py-2 rounded-xl flex items-center gap-2"
             >
               <Calendar size={14} /> Schedule Matches
             </Button>
          ) : (
            <Button
              onClick={() => setShowAutoModal(true)}
              className="bg-primary text-black hover:bg-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Wand2 size={14} /> Auto-Generate
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-white/50">Loading matches...</div>
      ) : matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
             <div key={match.id} className="bg-card border border-white/5 rounded-2xl p-4 space-y-4">
               <div className="flex justify-between items-center border-b border-white/5 pb-3">
                 <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                   {match.stage || 'GROUP'}
                 </span>
                 <span className="text-[10px] font-bold text-white/50 flex items-center gap-1">
                   <Clock size={10} /> {match.scheduledDate ? format(parseISO(match.scheduledDate), "MMM d, h:mm a") : "TBA"}
                 </span>
               </div>
               
               <div className="space-y-3">
                 <div className="flex justify-between items-center">
                   <span className="text-sm font-bold truncate max-w-[120px]">{match.teamA?.name || "TBD"}</span>
                   <span className="text-xs font-black text-white/30">VS</span>
                   <span className="text-sm font-bold truncate max-w-[120px] text-right">{match.teamB?.name || "TBD"}</span>
                 </div>
               </div>

               <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-white/50">
                 <MapPin size={12} /> {match.ground?.name || tournament?.venues?.[0]?.name || "TBA"}
               </div>
             </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-card border border-white/5 rounded-2xl">
           <Calendar size={32} className="mx-auto mb-4 text-white/20" />
           <p className="text-sm font-bold text-white/50 uppercase tracking-widest">No matches scheduled</p>
           <p className="text-xs text-white/30 mt-1">Generate or schedule matches to see them here.</p>
        </div>
      )}

      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-3xl p-6 max-w-md w-full relative">
            <Button
              onClick={() => !isGenerating && setShowAutoModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X size={20} />
            </Button>
            <h3 className="text-lg font-black uppercase tracking-widest mb-4">
              Schedule Preferences
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-card border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2 block">
                  Match Time Slots (Per Day)
                </label>
                <div className="space-y-2">
                  {slotTimes.map((slot, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        type="time"
                        value={slot}
                        onChange={(e) => updateSlot(idx, e.target.value)}
                        className="flex-1 bg-card border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                      />
                      <Button
                        onClick={() => removeSlot(idx)}
                        className="w-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={addSlot}
                    className="w-full py-3 border border-dashed border-white/10 rounded-xl text-xs font-bold text-white/50 hover:text-white hover:border-white/30 flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Add Time Slot
                  </Button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full mt-6 bg-primary text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Confirm & Generate"}
            </Button>
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

export default MatchesTab;
