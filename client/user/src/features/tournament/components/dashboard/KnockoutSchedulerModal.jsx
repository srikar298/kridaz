import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { useGetStandingsQuery, useManualScheduleMutation } from '../../../../redux/api/tournamentApi';
import { toast } from 'react-hot-toast';

const KnockoutSchedulerModal = ({ tournament, onClose }) => {
  const { data: standingsRes, isLoading: isLoadingStandings } = useGetStandingsQuery(tournament.id);
  const standings = standingsRes?.data || [];

  const [manualSchedule, { isLoading: isScheduling }] = useManualScheduleMutation();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('18:00');
  const [stage, setStage] = useState('SEMI_FINAL');
  
  const [team1, setTeam1] = useState(null);
  const [team2, setTeam2] = useState(null);

  const handleDragStart = (e, team) => {
    e.dataTransfer.setData('team', JSON.stringify(team));
  };

  const handleDrop = (e, slotNum) => {
    e.preventDefault();
    const teamData = e.dataTransfer.getData('team');
    if (!teamData) return;
    
    const team = JSON.parse(teamData);
    
    if (slotNum === 1) {
      if (team2?.teamId === team.teamId) setTeam2(null);
      setTeam1(team);
    } else {
      if (team1?.teamId === team.teamId) setTeam1(null);
      setTeam2(team);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSaveMatch = async () => {
    if (!team1 || !team2) {
      return toast.error("Please drag and drop two teams to schedule the match.");
    }

    try {
      await manualSchedule({
        id: tournament.id,
        data: {
          stage,
          poolId: null, // Knockouts usually don't belong to a specific pool
          scheduledAt: `${date}T${time}:00`,
          team1Id: team1.teamId,
          team2Id: team2.teamId
        }
      }).unwrap();
      
      toast.success("Knockout match scheduled successfully!");
      setTeam1(null);
      setTeam2(null);
    } catch (err) {
      toast.error("Failed to schedule match");
    }
  };

  if (isLoadingStandings) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="text-white">Loading Standings...</div>
      </div>
    );
  }

  // Flatten top teams from all pools for the drag bank
  const qualifiedTeams = [];
  standings.forEach(pool => {
    // For simplicity, take top 4 from each pool. In real-world, might be based on config.
    const topTeams = pool.teams.slice(0, 4);
    qualifiedTeams.push(...topTeams);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest text-[#BFF367]">Manual Knockout Scheduler</h3>
            <p className="text-xs text-white/50">Drag teams from the standings into the match slots to pair them manually.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Panel: Teams Bank (Standings) */}
          <div className="w-full md:w-1/3 border-r border-white/10 bg-[#0a0a0a] overflow-y-auto p-4">
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Qualified Teams</h4>
            <div className="space-y-2">
              {qualifiedTeams.map((team, idx) => (
                <div 
                  key={idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, team)}
                  className="bg-[#111] border border-white/10 p-3 rounded-xl cursor-grab active:cursor-grabbing hover:border-[#55DEE8]/50 hover:bg-[#55DEE8]/5 transition-colors group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-white group-hover:text-[#55DEE8] transition-colors">{team.teamName}</span>
                    <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded text-white/70">
                      Pts: {team.points} | NRR: {team.nrr > 0 ? `+${team.nrr}` : team.nrr}
                    </span>
                  </div>
                </div>
              ))}
              {qualifiedTeams.length === 0 && (
                <div className="text-center p-4 text-white/30 text-xs">
                  No standings available. Play group stage matches first.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Match Canvas */}
          <div className="w-full md:w-2/3 p-6 bg-[#050505] overflow-y-auto flex flex-col">
            
            {/* Match Configuration */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-2">Stage</label>
                <select 
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#BFF367]"
                >
                  <option value="QUARTER_FINAL">Quarter Final</option>
                  <option value="SEMI_FINAL">Semi Final</option>
                  <option value="FINAL">Final</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-2">Date</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#BFF367]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest block mb-2">Time</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#BFF367]"
                  />
                </div>
              </div>
            </div>

            {/* Drag & Drop Canvas */}
            <div className="flex-1 flex items-center justify-center pb-12">
              <div className="w-full max-w-lg">
                <div className="flex items-center justify-between gap-4">
                  
                  {/* Slot 1 */}
                  <div 
                    onDrop={(e) => handleDrop(e, 1)}
                    onDragOver={handleDragOver}
                    className={`flex-1 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all ${
                      team1 
                        ? 'border-[#BFF367] bg-[#BFF367]/5' 
                        : 'border-white/20 bg-[#111] hover:border-[#BFF367]/50'
                    }`}
                  >
                    {team1 ? (
                      <div className="text-center w-full relative group">
                        <button 
                          onClick={() => setTeam1(null)}
                          className="absolute -top-6 -right-2 text-white/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        <div className="w-12 h-12 rounded-full bg-[#BFF367]/20 text-[#BFF367] flex items-center justify-center font-black mx-auto mb-2 text-lg">
                          {team1.teamName.substring(0, 2).toUpperCase()}
                        </div>
                        <h4 className="font-bold text-sm truncate">{team1.teamName}</h4>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-white/30 uppercase tracking-widest text-center">Drag Team A Here</span>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-xl font-black text-white/20 italic px-2">VS</div>

                  {/* Slot 2 */}
                  <div 
                    onDrop={(e) => handleDrop(e, 2)}
                    onDragOver={handleDragOver}
                    className={`flex-1 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all ${
                      team2 
                        ? 'border-[#55DEE8] bg-[#55DEE8]/5' 
                        : 'border-white/20 bg-[#111] hover:border-[#55DEE8]/50'
                    }`}
                  >
                    {team2 ? (
                      <div className="text-center w-full relative group">
                        <button 
                          onClick={() => setTeam2(null)}
                          className="absolute -top-6 -right-2 text-white/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        <div className="w-12 h-12 rounded-full bg-[#55DEE8]/20 text-[#55DEE8] flex items-center justify-center font-black mx-auto mb-2 text-lg">
                          {team2.teamName.substring(0, 2).toUpperCase()}
                        </div>
                        <h4 className="font-bold text-sm truncate">{team2.teamName}</h4>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-white/30 uppercase tracking-widest text-center">Drag Team B Here</span>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-auto border-t border-white/5 pt-6 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-3 rounded-full text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMatch}
                disabled={isScheduling || !team1 || !team2}
                className="bg-[#BFF367] text-black font-black px-8 py-3 rounded-full text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
              >
                {isScheduling ? 'Saving...' : 'Save Match'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default KnockoutSchedulerModal;
