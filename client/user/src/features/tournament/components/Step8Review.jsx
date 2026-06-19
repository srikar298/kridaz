import React, { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Trophy,
  CheckCircle2,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUpdateTournamentMutation } from "../../../redux/api/tournamentApi";
import { toast } from "react-hot-toast";

const Step8Review = ({ formData, onBack, tournamentId }) => {
  const navigate = useNavigate();
  const [updateTournament, { isLoading }] = useUpdateTournamentMutation();
  const [useWallet, setUseWallet] = useState(true);

  // Mock platform fee calculation (e.g. 5% of prize pool or flat fee)
  const platformFee = 999;
  const walletBalance = 2500; // Mock wallet balance, replace with actual RTK query

  const canAfford = walletBalance >= platformFee;

  const handlePublish = async () => {
    try {
      await updateTournament({
        id: tournamentId,
        status: "PUBLISHED",
        details: { ...formData.details, platformFeePaid: true },
      }).unwrap();

      toast.success("Tournament Published Successfully!");
      navigate(`/tournament/${tournamentId}`); // Assuming there is a dashboard
    } catch (err) {
      toast.error("Failed to publish tournament");
      console.error(err);
    }
  };

  const SummaryItem = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/50">{label}</span>
      <span className="text-sm font-bold text-white text-right">
        {value || "-"}
      </span>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-[#BFF367]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-[#BFF367]" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-white">
          Review & Publish
        </h2>
        <p className="text-xs text-white/50 mt-2">
          Almost there! Review your tournament details before going live.
        </p>
      </div>

      <section className="bg-[#111] rounded-2xl border border-white/5 p-4 space-y-4">
        <h3 className="text-xs font-black text-[#55DEE8] uppercase tracking-widest border-b border-white/10 pb-2">
          Basic Info
        </h3>
        <div>
          <SummaryItem label="Name" value={formData.name} />
          <SummaryItem label="Sport" value={formData.sport} />
          <SummaryItem
            label="Format"
            value={`${formData.type || ""} - ${formData.format || ""}`}
          />
          <SummaryItem
            label="Teams"
            value={`Max ${formData.maxTeams || 0} Teams`}
          />
        </div>

        <h3 className="text-xs font-black text-[#BFF367] uppercase tracking-widest border-b border-white/10 pb-2 mt-6">
          Financials
        </h3>
        <div>
          <SummaryItem label="Entry Fee" value={`₹${formData.entryFee}`} />
          <SummaryItem label="Prize Pool" value={`₹${formData.prizePool}`} />
        </div>
      </section>

      {/* Wallet Payment Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-black text-white/90 uppercase tracking-widest">
          Platform Fee
        </h3>

        <div
          className={`p-4 rounded-xl border transition-all ${useWallet ? "bg-[#111] border-[#BFF367]" : "bg-[#111] border-white/5"}`}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <Wallet size={18} className="text-[#BFF367]" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">
                  Pay from KRIDAZ Wallet
                </p>
                <p className="text-[10px] text-white/50">
                  Balance: â‚¹{walletBalance}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-[#FFD700]">
                â‚¹{platformFee}
              </p>
              <p className="text-[10px] text-white/50">Listing Fee</p>
            </div>
          </div>

          {!canAfford && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              <AlertTriangle size={14} />
              Insufficient balance. Please recharge your wallet.
            </div>
          )}
        </div>
      </section>

      {/* Bottom Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#000] via-[#000]/90 to-transparent pt-12 pb-6 px-4 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white px-4 py-2 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <ArrowLeft size={16} /> Edit
          </button>

          <button
            onClick={handlePublish}
            disabled={!canAfford || isLoading}
            className="flex items-center gap-2 bg-[#BFF367] text-black font-black px-8 py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors uppercase tracking-widest text-xs"
          >
            {isLoading ? "Publishing..." : "Publish Tournament"}
            <CheckCircle2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step8Review;
