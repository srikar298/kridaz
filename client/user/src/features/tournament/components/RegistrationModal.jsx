import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Users, IndianRupee, AlertCircle } from 'lucide-react';
import { useGetMyTeamsQuery } from '../../../redux/api/teamApi';
import { useRegisterForTournamentMutation } from '../../../redux/api/tournamentApi';
import { toast } from 'react-hot-toast';

const RegistrationModal = ({ tournament, onClose }) => {
  const { data: teamsRes, isLoading: isLoadingTeams } = useGetMyTeamsQuery();
  const [register, { isLoading: isRegistering }] = useRegisterForTournamentMutation();

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [paymentType, setPaymentType] = useState('FULL');

  const myTeams = teamsRes?.data || [];
  const entryFee = tournament.entryFee || 0;
  const advanceFee = tournament.advanceFee || 0;
  const isAdvanceAllowed = advanceFee > 0 && advanceFee < entryFee;

  const handleRegister = async () => {
    if (!selectedTeam) {
      toast.error("Please select a team");
      return;
    }

    try {
      await register({
        id: tournament.id,
        data: {
          teamId: selectedTeam.id,
          paymentType
        }
      }).unwrap();

      toast.success("Successfully registered for tournament!");
      onClose();
    } catch (error) {
      toast.error(error.data?.message || "Failed to register team");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Register Team</h2>
            <p className="text-xs text-white/50">{tournament.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {/* Team Selection */}
          <div>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">1. Select Your Team</h3>
            
            {isLoadingTeams ? (
              <div className="h-24 flex items-center justify-center border border-white/5 bg-white/5 rounded-xl">
                <div className="w-5 h-5 border-2 border-[#BFF367] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myTeams.length === 0 ? (
              <div className="p-4 text-center border border-white/5 bg-white/5 rounded-xl">
                <p className="text-sm text-white/50 mb-2">You don't have any teams yet.</p>
                <a href="/teams" className="text-xs text-[#BFF367] hover:underline font-bold">Create a Team First</a>
              </div>
            ) : (
              <div className="space-y-2">
                {myTeams.map(team => {
                  const isWrongSport = tournament.sport && team.sportType && team.sportType !== tournament.sport;
                  const isAlreadyRegistered = tournament.teams?.some(t => t.teamId === team.id);
                  const isDisabled = isWrongSport || isAlreadyRegistered;

                  return (
                    <button
                      key={team.id}
                      disabled={isDisabled}
                      onClick={() => setSelectedTeam(team)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                        selectedTeam?.id === team.id 
                          ? 'border-[#BFF367] bg-[#BFF367]/10' 
                          : isDisabled
                            ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                            : 'border-white/10 bg-[#1a1a1a] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center overflow-hidden">
                          {team.logo ? (
                            <img src={team.logo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users size={16} className="text-white/50" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{team.name}</p>
                          <p className="text-[10px] text-white/50 flex items-center gap-1">
                            {team.sportType || 'Any Sport'} • {team.members?.length || 1} Members
                          </p>
                        </div>
                      </div>
                      
                      {selectedTeam?.id === team.id && (
                        <div className="w-5 h-5 rounded-full bg-[#BFF367] flex items-center justify-center">
                          <Check size={12} className="text-black" />
                        </div>
                      )}
                      
                      {isDisabled && !selectedTeam && (
                        <span className="text-[10px] text-red-400">
                          {isAlreadyRegistered ? 'Registered' : 'Wrong Sport'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Selection */}
          {selectedTeam && entryFee > 0 && (
            <div className="animate-fade-in">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">2. Payment Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentType('FULL')}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    paymentType === 'FULL' 
                      ? 'border-[#BFF367] bg-[#BFF367]/10' 
                      : 'border-white/10 bg-[#1a1a1a] hover:bg-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Pay Full</span>
                    {paymentType === 'FULL' && <Check size={14} className="text-[#BFF367]" />}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <IndianRupee size={14} className="text-white/50" />
                    <span className="text-xl font-black text-white">{entryFee}</span>
                  </div>
                </button>

                {isAdvanceAllowed && (
                  <button
                    onClick={() => setPaymentType('ADVANCE')}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      paymentType === 'ADVANCE' 
                        ? 'border-[#BFF367] bg-[#BFF367]/10' 
                        : 'border-white/10 bg-[#1a1a1a] hover:bg-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Pay Advance</span>
                      {paymentType === 'ADVANCE' && <Check size={14} className="text-[#BFF367]" />}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <IndianRupee size={14} className="text-white/50" />
                      <span className="text-xl font-black text-white">{advanceFee}</span>
                    </div>
                    <p className="text-[10px] text-white/50 mt-1">Pay â‚¹{entryFee - advanceFee} later</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Wallet Warning */}
          {selectedTeam && entryFee > 0 && (
            <div className="bg-[#BFF367]/10 border border-[#BFF367]/20 p-3 rounded-lg flex gap-3 items-start">
              <AlertCircle size={16} className="text-[#BFF367] mt-0.5 shrink-0" />
              <p className="text-xs text-[#BFF367]/80 leading-relaxed">
                The amount will be deducted from your KRIDAZ wallet. Ensure you have sufficient balance before proceeding.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-white/10 bg-black/50">
          <button
            disabled={!selectedTeam || isRegistering}
            onClick={handleRegister}
            className="w-full bg-[#BFF367] text-black font-black py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors uppercase tracking-widest text-sm flex items-center justify-center gap-2"
          >
            {isRegistering ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : entryFee === 0 ? (
              "Register for Free"
            ) : (
              `Pay ₹${paymentType === 'ADVANCE' ? advanceFee : entryFee} & Register`
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RegistrationModal;
