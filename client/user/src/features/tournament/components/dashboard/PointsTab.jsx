import React from "react";
import { useGetStandingsQuery } from "@redux/api/tournamentApi";

const PointsTab = ({ tournament }) => {
  const { data: standings, isLoading, error } = useGetStandingsQuery(tournament.id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !standings || standings.length === 0) {
    return (
      <div className="p-8 text-center text-white/50 border border-dashed border-white/10 rounded-2xl">
        No standings data available yet. Matches need to be completed to calculate standings.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {standings.map((poolData, poolIdx) => {
        // Qualification threshold: top 2 or top 4
        const qualifyCount = poolData.teams.length > 5 ? 4 : 2;

        return (
          <div key={poolData.poolId || poolIdx} className="bg-card border border-white/5 rounded-2xl p-6 animate-fade-in">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              {poolData.poolName || `Pool ${poolIdx + 1}`}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-white/40 uppercase tracking-widest">
                    <th className="py-3 pl-2">Pos</th>
                    <th className="py-3">Team</th>
                    <th className="py-3 text-center">P</th>
                    <th className="py-3 text-center">W</th>
                    <th className="py-3 text-center">L</th>
                    <th className="py-3 text-center">T</th>
                    <th className="py-3 text-center">Pts</th>
                    <th className="py-3 text-right pr-2">NRR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {poolData.teams.map((team, idx) => {
                    const isQualifying = idx < qualifyCount;
                    const isLastQualifyingSpot = idx === qualifyCount - 1;

                    return (
                      <React.Fragment key={team.teamId}>
                        <tr className="hover:bg-white/5 transition-colors text-xs font-medium text-white/95">
                          <td className="py-4 pl-2 font-bold text-white/40">
                            {idx + 1}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-white line-clamp-1">{team.teamName}</span>
                              {isQualifying ? (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider scale-90 origin-left">
                                  Q
                                </span>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/10 font-bold uppercase tracking-wider scale-90 origin-left">
                                  E
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-center font-bold">{team.played}</td>
                          <td className="py-4 text-center text-emerald-400">{team.won}</td>
                          <td className="py-4 text-center text-red-400">{team.lost}</td>
                          <td className="py-4 text-center text-white/50">{team.tied}</td>
                          <td className="py-4 text-center font-black text-primary">{team.points}</td>
                          <td className={`py-4 text-right pr-2 font-bold ${Number(team.nrr) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {Number(team.nrr) > 0 ? `+${team.nrr}` : team.nrr}
                          </td>
                        </tr>
                        {/* Qualification Separator Line */}
                        {isLastQualifyingSpot && idx < poolData.teams.length - 1 && (
                          <tr className="pointer-events-none">
                            <td colSpan={8} className="py-1 px-0">
                              <div className="flex items-center gap-2 w-full">
                                <div className="h-[1.5px] bg-emerald-500/20 flex-1" />
                                <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest whitespace-nowrap">
                                  Playoff Qualification Line
                                </span>
                                <div className="h-[1.5px] bg-emerald-500/20 flex-1" />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PointsTab;
