import React, { useState } from "react";
import { Calendar, MapPin, Clock } from "lucide-react";
import { useGetTournamentMatchesQuery } from "../../../../redux/api/tournamentApi";
import { format, parseISO, isPast, isToday } from "date-fns";
import { Button } from "@kridaz/ui";

const LiveMatchesTab = ({ tournamentId, tournament }) => {
  const { data: matchesData, isLoading } = useGetTournamentMatchesQuery(tournamentId);
  const [subTab, setSubTab] = useState("live"); // live, past

  const matches = matchesData?.matches || [];
  
  const filteredMatches = matches.filter(match => {
    if (!match.scheduledDate) return false; // Unscheduled matches are neither live nor past
    const matchDate = parseISO(match.scheduledDate);
    if (subTab === "live") return match.status === "LIVE" || (isToday(matchDate) && match.status === "SCHEDULED");
    if (subTab === "past") return isPast(matchDate) || match.status === "COMPLETED";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white">Live Matches</h2>
          <p className="text-xs text-white/50 uppercase">View ongoing and past matches</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-4">
        {["live", "past"].map((tab) => (
          <Button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              subTab === tab ? "bg-primary text-black" : "bg-card text-white/50 border border-white/5 hover:border-white/20"
            }`}
          >
            {tab}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-white/50">Loading matches...</div>
      ) : filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((match) => (
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
           <p className="text-sm font-bold text-white/50 uppercase tracking-widest">No {subTab} matches found</p>
        </div>
      )}
    </div>
  );
};

export default LiveMatchesTab;
