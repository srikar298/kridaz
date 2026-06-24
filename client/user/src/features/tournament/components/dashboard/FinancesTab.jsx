import React from "react";
import { Button } from "@kridaz/ui";

import {
  Wallet,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Building,
} from "lucide-react";

const FinancesTab = ({ tournament }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Wallet Balance */}
      <div className="bg-gradient-to-r from-card to-card border border-white/5 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Wallet size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">
                Total Collections (via Kridaz)
              </p>
              <h2 className="text-3xl font-black text-white">â‚¹0</h2>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-card text-white border border-white/10 px-6 py-3 rounded-full text-xs font-bold hover:bg-white/5 transition-colors">
              <Building size={14} /> Withdraw to Bank
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entry Fees Tracking */}
        <div className="bg-card border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white/90 uppercase tracking-widest mb-6 flex items-center gap-2">
            <IndianRupee size={16} className="text-secondary" />
            Entry Fee Tracking
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-card rounded-xl border border-white/5">
              <div>
                <p className="text-sm font-bold text-white">Expected Total</p>
                <p className="text-[10px] text-white/50">
                  {tournament.maxTeams} Teams x â‚¹{tournament.entryFee}
                </p>
              </div>
              <p className="text-lg font-black text-white">
                â‚¹
                {(tournament.maxTeams * tournament.entryFee).toLocaleString()}
              </p>
            </div>

            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div>
                <p className="text-sm font-bold text-primary">
                  Collected So Far
                </p>
                <p className="text-[10px] text-primary/50">From 0 teams</p>
              </div>
              <p className="text-lg font-black text-primary">â‚¹0</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div>
                <p className="text-sm font-bold text-red-400">Pending Dues</p>
                <p className="text-[10px] text-red-400/50">To be collected</p>
              </div>
              <p className="text-lg font-black text-red-400">
                â‚¹
                {(tournament.maxTeams * tournament.entryFee).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-card border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white/90 uppercase tracking-widest mb-6">
            Recent Transactions
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <ArrowUpRight size={14} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Platform Fee Paid
                  </p>
                  <p className="text-[10px] text-white/50">
                    Kridaz Listing Fee
                  </p>
                </div>
              </div>
              <p className="text-sm font-black text-red-500">-â‚¹999</p>
            </div>

            <div className="text-center p-8">
              <p className="text-xs text-white/40 font-bold">
                No other transactions yet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancesTab;
