import React from "react";
import { Trophy } from "lucide-react";

const LeaderboardTab = ({ tournament }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col items-center justify-center py-20 bg-card border border-white/5 rounded-2xl">
        <Trophy size={48} className="text-white/20 mb-4" />
        <h3 className="text-lg font-black uppercase tracking-widest text-white/50 mb-2">
          Leaderboard
        </h3>
        <p className="text-xs text-white/30 text-center max-w-sm">
          No leaderboard data is available right now. This section will be updated as the tournament progresses.
        </p>
      </div>
    </div>
  );
};

export default LeaderboardTab;
