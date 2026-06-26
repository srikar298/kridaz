import React, { useEffect, useState } from "react";
import { X, FileText, Clock, User, ShieldAlert, Zap } from "lucide-react";
import { Button } from "@kridaz/ui";

const THEME_COLOR = "var(--success)";
export default function MatchReportModal({
  matchId,
  fetchMatchReport,
  onClose,
}) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      const res = await fetchMatchReport(matchId);
      if (res.success) {
        setReport(res.report || res.data);
      }
      setLoading(false);
    };
    loadReport();
  }, [matchId, fetchMatchReport]);

  const formatTimer = (secs) => {
    if (!secs || isNaN(secs)) return "00:00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-background border border-white/10 rounded-[8px] p-6 shadow-2xl flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[8px] bg-white/5 flex items-center justify-center border border-white/10">
              <FileText size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-widest text-white">
                Match Report
              </h3>
              <p className="text-[11px] text-success uppercase tracking-[0.2em] font-black">
                Detailed Metrics & Timers
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="p-3 bg-white/5 rounded-[8px] text-neutral-400 hover:text-white transition-all border border-white/5 hover:border-white/20"
           aria-label="Close">
            <X size={20} />
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-success border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            {/* Venue & Officials */}
            {report?.game && (
              <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-4 mb-4">
                <h4 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] mb-3">
                  Match Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {report.game.customVenue && (
                    <div>
                      <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">
                        Venue
                      </p>
                      <p className="text-sm font-black text-white">
                        {report.game.customVenue}
                      </p>
                    </div>
                  )}
                  {report.game.customProfessionals &&
                    report.game.customProfessionals.length > 0 && (
                      <div>
                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">
                          Match Officials
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {report.game.customProfessionals.map((prof, idx) => (
                            <div
                              key={idx}
                              className="bg-white/5 border border-white/10 rounded-[6px] px-2 py-1 flex items-center gap-2"
                            >
                              <span className="text-[10px] font-black text-success uppercase">
                                {prof.role}:
                              </span>
                              <span className="text-xs font-bold text-white">
                                {prof.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Top Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-4 flex flex-col justify-center items-center text-center">
                <Clock size={20} className="text-neutral-500 mb-2" />
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">
                  Total Time
                </p>
                <p className="text-xl font-black text-white font-mono">
                  {formatTimer(report?.match?.totalDurationSeconds)}
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-4 flex flex-col justify-center items-center text-center">
                <ShieldAlert size={20} className="text-neutral-500 mb-2" />
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">
                  Match Status
                </p>
                <p className="text-sm font-black text-success">
                  {report?.match?.status}
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-4 flex flex-col justify-center items-center text-center">
                <Zap size={20} className="text-red-500 mb-2" />
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">
                  Team A Penalties
                </p>
                <p className="text-xl font-black text-red-500">
                  {report?.match?.penaltyRuns?.teamA || 0}
                </p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-4 flex flex-col justify-center items-center text-center">
                <Zap size={20} className="text-red-500 mb-2" />
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">
                  Team B Penalties
                </p>
                <p className="text-xl font-black text-red-500">
                  {report?.match?.penaltyRuns?.teamB || 0}
                </p>
              </div>
            </div>

            {/* Players List */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] mb-2 px-1">
                Player Statistics
              </h4>
              {report?.players?.map((player, idx) => (
                <div
                  key={idx}
                  className="bg-white/[0.03] border border-white/5 rounded-[8px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 w-1/3">
                    <div className="w-10 h-10 rounded-[8px] bg-white/10 flex items-center justify-center shrink-0">
                      <User size={18} className="text-white/50" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white truncate max-w-[150px]">
                        {player.name || "Unknown"}
                      </p>
                      <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                        {player.role || "PLAYER"}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-0.5">
                        Time Active
                      </p>
                      <p className="text-sm font-black text-white font-mono">
                        {formatTimer(player.timeSpentSeconds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-0.5">
                        Batting
                      </p>
                      <p className="text-sm font-black text-white">
                        {player.batting?.runs || 0}
                        <span className="text-neutral-600 font-normal mx-1">
                          ({player.batting?.balls || 0})
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-0.5">
                        Bowling
                      </p>
                      <p className="text-sm font-black text-white">
                        {player.bowling?.wickets || 0}
                        <span className="text-success mx-1">-</span>
                        {player.bowling?.runs || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-0.5">
                        Status
                      </p>
                      <p
                        className={`text-xs font-black truncate max-w-[80px] ${player.batting?.status === "OUT" ? "text-red-500" : "text-neutral-400"}`}
                      >
                        {player.batting?.status === "OUT"
                          ? player.batting?.outType
                          : player.batting?.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {(!report?.players || report.players.length === 0) && (
                <div className="text-center py-10 text-neutral-500 text-xs font-black uppercase tracking-widest">
                  No player statistics available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
