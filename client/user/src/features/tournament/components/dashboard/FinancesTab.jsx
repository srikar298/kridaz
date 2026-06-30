import React from "react";
import { Button } from "@kridaz/ui";
import {
  Wallet,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  AlertTriangle,
} from "lucide-react";

const FinancesTab = ({ tournament }) => {
  const registeredTeams = tournament.teams || [];
  const entryFee = Number(tournament.entryFee) || 0;
  const maxTeams = tournament.maxTeams || 0;

  // Active collections vs refunds
  const totalCollected = registeredTeams.reduce(
    (sum, t) => sum + Number(t.amountPaid || 0),
    0
  );
  const totalRefunded = registeredTeams.reduce(
    (sum, t) => sum + Number(t.refundAmount || 0),
    0
  );
  const netCollections = Math.max(0, totalCollected - totalRefunded);

  const expectedTotal = maxTeams * entryFee;
  const pendingDues = Math.max(0, expectedTotal - netCollections);

  const isCancelled = tournament.status === "CANCELLED";

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {isCancelled && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-bold text-red-500 mb-1">
              Tournament Cancelled
            </p>
            <p className="text-xs text-red-500/70">
              This tournament is cancelled. Net collection balance is ₹0 after full refunds were dispatched to team wallets.
            </p>
          </div>
        </div>
      )}

      {/* Wallet Balance */}
      <div className="bg-gradient-to-r from-card to-card border border-white/5 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Wallet size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">
                Net Collections (via Kridaz)
              </p>
              <h2 className="text-3xl font-black text-white">
                ₹{netCollections.toLocaleString()}
              </h2>
              {totalRefunded > 0 && (
                <p className="text-[10px] text-red-400 mt-1 font-bold">
                  ₹{totalRefunded.toLocaleString()} Refunded to withdrawn/cancelled teams
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Button
              disabled={netCollections === 0 || isCancelled}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-card text-white border border-white/10 px-6 py-3 rounded-full text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
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
                  {maxTeams} Teams x ₹{entryFee.toLocaleString()}
                </p>
              </div>
              <p className="text-lg font-black text-white">
                ₹{expectedTotal.toLocaleString()}
              </p>
            </div>

            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div>
                <p className="text-sm font-bold text-primary">
                  Net Collected So Far
                </p>
                <p className="text-[10px] text-primary/50">
                  From {registeredTeams.filter((t) => t.status !== "WITHDRAWN").length} active teams
                </p>
              </div>
              <p className="text-lg font-black text-primary">
                ₹{netCollections.toLocaleString()}
              </p>
            </div>

            <div className="flex justify-between items-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div>
                <p className="text-sm font-bold text-red-400">Pending Dues</p>
                <p className="text-[10px] text-red-400/50">Remaining to target</p>
              </div>
              <p className="text-lg font-black text-red-400">
                ₹{pendingDues.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Transactions Ledger */}
        <div className="bg-card border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white/90 uppercase tracking-widest mb-6">
            Team Payments Ledger
          </h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {registeredTeams.map((t) => {
              const isWithdrawn = t.status === "WITHDRAWN";
              const refundedAmount = Number(t.refundAmount || 0);

              return (
                <div
                  key={t.id}
                  className={`p-3 rounded-xl border border-white/5 transition-colors ${
                    isWithdrawn ? "bg-red-500/2 opacity-70" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isWithdrawn
                            ? "bg-red-500/10 text-red-400"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {isWithdrawn ? (
                          <ArrowUpRight size={14} />
                        ) : (
                          <ArrowDownRight size={14} />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold text-white line-clamp-1 ${
                            isWithdrawn ? "line-through text-white/40" : ""
                          }`}
                        >
                          {t.team?.name || "Registered Team"}
                        </p>
                        <p className="text-[10px] text-white/50">
                          Payment:{" "}
                          <span
                            className={`font-bold ${
                              isWithdrawn ? "text-red-400" : "text-primary"
                            }`}
                          >
                            {isWithdrawn ? "WITHDRAWN" : t.paymentStatus}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {isWithdrawn ? (
                        <>
                          <p className="text-xs text-white/40 font-medium">
                            Paid: ₹{Number(t.amountPaid || 0).toLocaleString()}
                          </p>
                          <p className="text-sm font-black text-red-400 mt-0.5">
                            Refunded: -₹{refundedAmount.toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-black text-emerald-500">
                          +₹{Number(t.amountPaid || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {registeredTeams.length === 0 && (
              <div className="text-center p-8">
                <p className="text-xs text-white/40 font-bold">
                  No registrations recorded yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancesTab;
