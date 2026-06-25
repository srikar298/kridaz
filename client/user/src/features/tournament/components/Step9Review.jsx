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
import { Button } from "@kridaz/ui";


const Step9Review = ({ formData, onBack, tournamentId }) => {
  const navigate = useNavigate();
  const [updateTournament, { isLoading }] = useUpdateTournamentMutation();
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
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy size={32} className="text-primary" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-widest text-white">
          Review & Publish
        </h2>
        <p className="text-xs text-white/50 mt-2">
          Almost there! Review your tournament details before going live.
        </p>
      </div>

      <section className="bg-card rounded-2xl border border-white/5 p-4 space-y-4">
        <h3 className="text-xs font-black text-secondary uppercase tracking-widest border-b border-white/10 pb-2">
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

        <h3 className="text-xs font-black text-primary uppercase tracking-widest border-b border-white/10 pb-2 mt-6">
          Financials
        </h3>
        <div>
          <SummaryItem label="Entry Fee" value={`₹${formData.entryFee}`} />
          <SummaryItem label="Prize Pool" value={`₹${formData.prizePool}`} />
        </div>
      </section>



      {/* Bottom Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-12 pb-6 px-4 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white px-4 py-2 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <ArrowLeft size={16} /> Edit
          </Button>

          <Button
            onClick={handlePublish}
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary text-black font-black px-8 py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors uppercase tracking-widest text-xs"
          >
            {isLoading ? "Publishing..." : "Publish Tournament"}
            <CheckCircle2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step9Review;
