import React from "react";
import { motion } from "framer-motion";
import { Trophy, Clock, Tv, Activity, Play, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ScoringMatchCard = ({ match }) => {
  const navigate = useNavigate();

  const isLive = match.status === "LIVE";
  const isPaused = match.status === "PAUSED";
  const isUpcoming = match.status === "SCHEDULED" || match.status === "SETUP";
  const isCompleted = match.status === "COMPLETED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-[8px] p-[1px] ${isLive ? "bg-gradient-to-r from-red-500 via-[#55DEE8] to-[#BFF367]" : isPaused ? "bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-400" : "bg-white/10"}`}
    >
      <div className="relative bg-[#0F0F0F] rounded-[8px] p-5 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#55DEE8]">
              {match.sportType || "Cricket"}
            </span>
            <span className="text-white text-sm font-bold truncate max-w-[200px]">
              {match.matchName || "Match"}
            </span>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${isLive ? "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse" : isPaused ? "bg-orange-500/10 text-orange-400 border-orange-500/30" : isCompleted ? "bg-white/5 text-white/40 border-white/10" : "bg-[#55DEE8]/10 text-[#55DEE8] border-[#55DEE8]/30"}`}
          >
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <Activity size={10} /> Live
              </span>
            ) : isPaused ? (
              <span className="flex items-center gap-1.5">
                <Clock size={10} /> Paused
              </span>
            ) : (
              match.status
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between mb-5 bg-white/[0.02] p-4 rounded-[8px] border border-white/5 flex-1">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-12 h-12 rounded-[8px] bg-white/5 border border-white/10 flex items-center justify-center p-1">
              {match.teamA?.logo ? (
                <img
                  src={match.teamA.logo}
                  alt={match.teamA.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-white/40 font-black text-lg">
                  {match.teamA?.name?.substring(0, 2)?.toUpperCase() || "TA"}
                </span>
              )}
            </div>
            <span className="text-white text-xs font-bold text-center">
              {match.teamA?.name || "TBD"}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center px-4">
            <span className="text-[#BFF367] font-black text-sm uppercase italic">
              VS
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-12 h-12 rounded-[8px] bg-white/5 border border-white/10 flex items-center justify-center p-1">
              {match.teamB?.logo ? (
                <img
                  src={match.teamB.logo}
                  alt={match.teamB.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-white/40 font-black text-lg">
                  {match.teamB?.name?.substring(0, 2)?.toUpperCase() || "TB"}
                </span>
              )}
            </div>
            <span className="text-white text-xs font-bold text-center">
              {match.teamB?.name || "TBD"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          {(isLive || isPaused) && match.youtubeStreamUrl ? (
            <button
              onClick={() => window.open(match.youtubeStreamUrl, "_blank")}
              className="py-2.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-500 rounded-[8px] font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 transition-all"
            >
              <Tv size={12} /> Watch Live
            </button>
          ) : (
            <button
              onClick={() => navigate(`/match/${match.id || match._id}`)}
              className="py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-[8px] font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 transition-all"
            >
              <Eye size={12} /> View Details
            </button>
          )}

          <button
            onClick={() =>
              window.open(`/scoring/${match.id || match._id}`, "_blank")
            }
            className={`py-2.5 rounded-[8px] font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-1.5 transition-all ${isLive || isPaused || isUpcoming ? "bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg shadow-[#55DEE8]/20 hover:brightness-110" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}
          >
            {isLive || isPaused || isUpcoming ? (
              <Play size={12} className="fill-black" />
            ) : (
              <Trophy size={12} />
            )}
            {isLive || isPaused || isUpcoming ? "Launch App" : "Scorecard"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ScoringMatchCard;
