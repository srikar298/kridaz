import React from "react";
import { Users, AlertTriangle, Calendar, IndianRupee } from "lucide-react";
import { Button } from "@kridaz/ui";


const OverviewTab = ({ tournament }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <Users className="text-secondary mb-3" size={20} />
          <p className="text-2xl font-black text-white">
            0 / {tournament.maxTeams || 8}
          </p>
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
            Registered
          </p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFD700]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <IndianRupee className="text-[#FFD700] mb-3" size={20} />
          <p className="text-2xl font-black text-white">â‚¹0</p>
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
            Collected
          </p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <Calendar className="text-primary mb-3" size={20} />
          <p className="text-2xl font-black text-white">0</p>
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
            Matches Done
          </p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-primary/20 relative overflow-hidden flex flex-col justify-center items-center text-center cursor-pointer hover:bg-primary/10 transition-colors">
          <p className="text-sm font-black text-primary uppercase tracking-widest mb-1">
            View Public Page
          </p>
          <p className="text-[10px] text-white/50">See what players see</p>
        </div>
      </div>

      {/* Action Alerts */}
      <div className="bg-[#1a1300] border border-[#FFD700]/30 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="text-[#FFD700]" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white mb-1">
            Action Required: Upload Sponsor Logos
          </h3>
          <p className="text-xs text-white/70 mb-3">
            Your live overlays will look empty until you add your sponsor logos
            in the Marketing tab.
          </p>
          <Button className="text-xs font-bold text-black bg-[#FFD700] px-4 py-2 rounded-full hover:bg-white transition-colors">
            Go to Marketing
          </Button>
        </div>
      </div>

      {/* Recent Activity Mock */}
      <section className="pt-4">
        <h3 className="text-sm font-black text-white/90 uppercase tracking-widest mb-4">
          Recent Activity
        </h3>
        <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-8 text-center text-white/40 text-sm">
            No activity yet. Share your tournament to get teams to register!
          </div>
        </div>
      </section>
    </div>
  );
};

export default OverviewTab;
