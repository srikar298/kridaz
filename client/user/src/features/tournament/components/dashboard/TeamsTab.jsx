import React, { useState } from "react";
import { Button, Input } from "@kridaz/ui";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  UserX,
  AlertTriangle,
  Loader2,
  Trophy,
  MinusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useWithdrawTeamMutation } from "../../../../redux/api/tournamentApi";

// ─── Withdraw Confirmation Drawer ────────────────────────────────────────────
const WithdrawDrawer = ({ team, tournament, onClose }) => {
  const maxRefund = Number(team.amountPaid || 0);
  const [refundAmount, setRefundAmount] = useState(maxRefund);
  const [withdrawTeam, { isLoading }] = useWithdrawTeamMutation();

  const handleWithdraw = async () => {
    try {
      const res = await withdrawTeam({
        tournamentId: tournament.id,
        teamId: team.teamId,
        refundAmount,
      }).unwrap();
      toast.success(
        `${team.team?.name} withdrawn. ${res.data.walkoversIssued} walkover(s) issued.`
      );
      onClose();
    } catch (err) {
      toast.error(err.data?.message || "Failed to withdraw team");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="relative w-full max-w-md bg-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <UserX size={18} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">Withdraw Team</h2>
            <p className="text-xs text-white/40">{team.team?.name}</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Info card */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2">
            <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80 leading-relaxed">
              All their upcoming scheduled matches will be marked as{" "}
              <span className="font-bold text-amber-300">WALKOVER</span> — opponents
              automatically receive 2 points.
            </p>
          </div>

          {/* Refund slider */}
          {maxRefund > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/50 font-bold uppercase tracking-wider">
                  Refund Amount
                </label>
                <span className="text-sm font-black text-primary">
                  ₹{Number(refundAmount).toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={maxRefund}
                step={1}
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-white/30 mt-1">
                <span>₹0 (No Refund)</span>
                <span>₹{maxRefund.toLocaleString()} (Full)</span>
              </div>
              <p className="text-[10px] text-white/40 mt-2">
                Originally paid: ₹{maxRefund.toLocaleString()} — will be credited to captain's wallet
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              className="flex-1 py-3 rounded-full border border-white/10 text-white/60 text-xs font-bold hover:bg-white/5 transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={isLoading}
              className="flex-1 py-3 rounded-full bg-red-500 text-white text-xs font-black uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <UserX size={14} />
              )}
              Withdraw Team
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Payment Status Badge ─────────────────────────────────────────────────────
const PaymentBadge = ({ t }) => {
  if (t.status === "WITHDRAWN") {
    return (
      <span className="text-white/30 flex items-center gap-1 line-through">
        <MinusCircle size={10} /> Withdrawn
      </span>
    );
  }
  if (t.paymentStatus === "FULL") {
    return (
      <span className="text-primary flex items-center gap-1">
        <CheckCircle2 size={10} /> Paid Entry Fee
      </span>
    );
  }
  return (
    <span className="text-amber-400 flex items-center gap-1">
      <XCircle size={10} /> Partial: ₹{Number(t.amountPaid || 0).toLocaleString()}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TeamsTab = ({ tournament, isOwner }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [withdrawTarget, setWithdrawTarget] = useState(null);

  const registeredTeams = tournament.teams || [];
  const isCancelled = tournament.status === "CANCELLED";

  const copyInviteLink = (teamId) => {
    const inviteLink = `${window.location.origin}/t/${tournament.id}?joinTeam=${teamId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedId(teamId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTeams = registeredTeams.filter((t) => {
    const teamName = t.team?.name || "";
    return teamName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const activeCount = registeredTeams.filter((t) => t.status !== "WITHDRAWN").length;
  const withdrawnCount = registeredTeams.filter((t) => t.status === "WITHDRAWN").length;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Registered", value: registeredTeams.length, color: "text-white" },
            { label: "Active", value: activeCount, color: "text-primary" },
            { label: "Withdrawn", value: withdrawnCount, color: "text-red-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-white/5 rounded-xl p-3 text-center"
            >
              <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams..."
              className="w-full bg-card border border-white/5 rounded-full pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Teams List */}
        <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-card text-xs font-bold text-white/50 uppercase tracking-widest hidden md:grid">
            <div className="col-span-5">Team Name</div>
            <div className="col-span-3 text-center">Players</div>
            <div className="col-span-4 pl-4 text-right pr-4">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {filteredTeams.map((t) => {
              const team = t.team;
              if (!team) return null;
              const playerCount = team.members?.length || 0;
              const isWithdrawn = t.status === "WITHDRAWN";

              return (
                <motion.div
                  key={t.id}
                  layout
                  className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center transition-colors ${
                    isWithdrawn
                      ? "opacity-50 bg-white/2"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                      isWithdrawn
                        ? "bg-white/5 border-white/5"
                        : "bg-gradient-to-br from-primary/20 to-secondary/20 border-white/10"
                    }`}>
                      <span className={`font-black ${isWithdrawn ? "text-white/20" : "text-white/70"}`}>
                        {team.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${isWithdrawn ? "text-white/30 line-through" : "text-white"}`}>
                        {team.name}
                      </p>
                      <p className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                        <PaymentBadge t={t} />
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 text-center hidden md:block">
                    <span className="text-xs font-bold text-white/70 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                      {playerCount} Players
                    </span>
                  </div>

                  <div className="col-span-4 flex items-center justify-end gap-2 pr-2">
                    {!isWithdrawn && !isCancelled && (
                      <Button
                        onClick={() => copyInviteLink(t.teamId)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black rounded-full text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        {copiedId === t.teamId ? (
                          <><Check size={11} /> Copied!</>
                        ) : (
                          <><Copy size={11} /> Invite</>
                        )}
                      </Button>
                    )}

                    {/* Withdraw button — owner only, active teams, not cancelled tournament */}
                    {isOwner && !isWithdrawn && !isCancelled && (
                      <Button
                        onClick={() => setWithdrawTarget(t)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        <UserX size={11} /> Withdraw
                      </Button>
                    )}

                    {isWithdrawn && (
                      <span className="text-[10px] font-bold text-white/30 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                        Withdrawn
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {filteredTeams.length === 0 && (
              <div className="text-center p-8 text-white/40">
                No registered teams found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdraw Drawer */}
      <AnimatePresence>
        {withdrawTarget && (
          <WithdrawDrawer
            team={withdrawTarget}
            tournament={tournament}
            onClose={() => setWithdrawTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default TeamsTab;
