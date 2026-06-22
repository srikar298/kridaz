import React from "react";
import { ShieldCheck, Search, PlusCircle, CheckCircle2 } from "lucide-react";import { Button } from "@kridaz/ui";


const OfficialsTab = ({ tournament }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-white/5">
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">
            Required Umpires
          </p>
          <p className="text-2xl font-black text-white">0 / 4</p>
          <p className="text-[10px] text-white/40 mt-1">For upcoming matches</p>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-white/5">
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">
            Required Scorers
          </p>
          <p className="text-2xl font-black text-white">0 / 2</p>
          <p className="text-[10px] text-white/40 mt-1">For upcoming matches</p>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-white/5">
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">
            Total Official Fees
          </p>
          <p className="text-2xl font-black text-white">â‚¹0</p>
          <p className="text-[10px] text-white/40 mt-1">
            Paid by: {tournament.details?.officialsPayment || "Organizer"}
          </p>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-white/90 uppercase tracking-widest">
            Assigned Officials
          </h3>
          <Button className="flex items-center gap-2 bg-card text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-white/10 transition-colors">
            <Search size={14} /> Find Officials
          </Button>
        </div>

        <div className="text-center p-8 border border-dashed border-white/10 rounded-xl">
          <ShieldCheck size={32} className="mx-auto mb-3 text-white/20" />
          <p className="text-sm text-white/40 font-bold mb-2">
            No officials assigned yet.
          </p>
          <p className="text-xs text-white/30 mb-4 max-w-sm mx-auto">
            You requested KRIDAZ certified officials. You can search and assign
            them to specific matches once your schedule is generated.
          </p>
          <Button
            className="text-xs text-primary hover:underline font-bold disabled:opacity-50 disabled:no-underline"
            disabled
          >
            Assign Officials (Generate Schedule First)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OfficialsTab;
