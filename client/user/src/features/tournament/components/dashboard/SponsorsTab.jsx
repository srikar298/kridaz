import React from "react";
import { Megaphone } from "lucide-react";

const SponsorsTab = ({ tournament }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col items-center justify-center py-20 bg-card border border-white/5 rounded-2xl">
        <Megaphone size={48} className="text-white/20 mb-4" />
        <h3 className="text-lg font-black uppercase tracking-widest text-white/50 mb-2">
          Sponsors
        </h3>
        <p className="text-xs text-white/30 text-center max-w-sm">
          No sponsors have been added to this tournament yet.
        </p>
      </div>
    </div>
  );
};

export default SponsorsTab;
