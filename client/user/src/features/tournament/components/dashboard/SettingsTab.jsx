import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Trash2,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Loader2,
} from "lucide-react";
import { Button, Input, Textarea } from "@kridaz/ui";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  useUpdateTournamentMutation,
  useCancelTournamentMutation,
} from "../../../../redux/api/tournamentApi";

const ConfirmCancelModal = ({ tournament, onClose, onConfirm, isLoading }) => {
  const [confirmText, setConfirmText] = useState("");
  const isMatch = confirmText === "CANCEL";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-card border border-red-500/30 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-red-500/20">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
            <Trash2 size={20} className="text-red-500" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">
            Cancel Tournament
          </h2>
          <p className="text-xs text-white/50">
            This will permanently cancel <span className="font-bold text-white">{tournament.name}</span> and refund all team entry fees.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Refund preview */}
          {tournament.teams?.filter(t => t.amountPaid > 0).length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-400 mb-2">💰 Refund Summary</p>
              <p className="text-xs text-white/60">
                <span className="font-bold text-white">{tournament.teams.filter(t => t.amountPaid > 0).length} teams</span> will receive a total refund of{" "}
                <span className="font-bold text-amber-400">
                  ₹{tournament.teams.reduce((sum, t) => sum + Number(t.amountPaid || 0), 0).toLocaleString()}
                </span>{" "}
                to their KRIDAZ wallets.
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-white/50 mb-2">
              Type <span className="font-black text-red-400 font-mono">CANCEL</span> to confirm
            </p>
            <Input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type CANCEL to confirm..."
              className="w-full bg-card border border-red-500/30 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              className="flex-1 py-3 rounded-full border border-white/10 text-white/60 text-xs font-bold hover:bg-white/5 transition-colors"
            >
              Go Back
            </Button>
            <Button
              disabled={!isMatch || isLoading}
              onClick={onConfirm}
              className="flex-1 py-3 rounded-full bg-red-500 text-white text-xs font-black uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Confirm Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SettingsTab = ({ tournament, isOwner }) => {
  const [form, setForm] = useState({
    name: tournament.name || "",
    about: tournament.details?.about || "",
    entryFee: tournament.entryFee || 0,
    prizePool: tournament.prizePool || 0,
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);

  const [updateTournament, { isLoading: isSaving }] = useUpdateTournamentMutation();
  const [cancelTournament, { isLoading: isCancelling }] = useCancelTournamentMutation();

  // Detect if fees are locked (any team has paid)
  const feesLocked = tournament.teams?.some((t) => Number(t.amountPaid || 0) > 0);
  const isCancelled = tournament.status === "CANCELLED";

  const handleSave = async () => {
    try {
      const payload = {
        id: tournament.id,
        name: form.name,
        details: { ...tournament.details, about: form.about },
        prizePool: form.prizePool,
      };
      // Only include fees if not locked
      if (!feesLocked) {
        payload.entryFee = form.entryFee;
      }
      await updateTournament(payload).unwrap();
      toast.success("Tournament settings saved!");
    } catch (err) {
      toast.error(err.data?.message || "Failed to save settings");
    }
  };

  const handleCancel = async () => {
    try {
      const res = await cancelTournament(tournament.id).unwrap();
      setShowCancelModal(false);
      setCancelResult(res.data);
      toast.success("Tournament cancelled. All fees refunded.");
    } catch (err) {
      toast.error(err.data?.message || "Failed to cancel tournament");
    }
  };

  if (isCancelled) {
    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <XCircle size={40} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-black text-red-400 uppercase tracking-wider mb-2">
            Tournament Cancelled
          </h3>
          <p className="text-sm text-white/50">
            This tournament has been cancelled. All entry fees have been refunded to the teams.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in pb-20">
        {/* Warning Banner */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="text-yellow-500 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm font-bold text-yellow-500 mb-1">
              Editing Published Tournaments
            </p>
            <p className="text-xs text-yellow-500/70">
              Changing rules while registration is open may confuse teams. Proceed with caution.
            </p>
          </div>
        </div>

        {/* Refund success card */}
        <AnimatePresence>
          {cancelResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex gap-3"
            >
              <CheckCircle2 className="text-green-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-green-400 mb-1">Refunds Issued</p>
                <p className="text-xs text-white/60">
                  {cancelResult.refunds?.length || 0} teams refunded successfully.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Form */}
        <div className="bg-card border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
              <Settings size={16} className="text-secondary" />
              Tournament Settings
            </h3>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-primary text-black px-6 py-2 rounded-full text-xs font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/50 block mb-2">Tournament Name</label>
              <Input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-secondary transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-white/50 block mb-2">About Tournament</label>
              <Textarea
                value={form.about}
                onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
                className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-secondary transition-colors min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Entry Fee — may be locked */}
              <div>
                <label className="text-xs text-white/50 block mb-2 flex items-center gap-1">
                  Entry Fee (₹)
                  {feesLocked && (
                    <span className="ml-1 text-amber-400 flex items-center gap-0.5 text-[10px]">
                      <Lock size={9} /> Locked
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={form.entryFee}
                    disabled={feesLocked}
                    onChange={(e) => setForm((f) => ({ ...f, entryFee: e.target.value }))}
                    className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {feesLocked && (
                    <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400/60" />
                  )}
                </div>
                {feesLocked && (
                  <p className="text-[10px] text-amber-400/70 mt-1">
                    Locked — teams have already paid
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-2">Prize Pool (₹)</label>
                <Input
                  type="number"
                  value={form.prizePool}
                  onChange={(e) => setForm((f) => ({ ...f, prizePool: e.target.value }))}
                  className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-secondary transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-500/30 rounded-2xl p-6">
          <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-4">
            Danger Zone
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Cancel Tournament</p>
              <p className="text-xs text-white/50 mt-1 max-w-md">
                Canceling a published tournament will refund all collected entry fees to the teams' wallets and notify all captains. This action cannot be undone.
              </p>
            </div>
            <Button
              onClick={() => setShowCancelModal(true)}
              disabled={isCancelling}
              className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-3 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap ml-4"
            >
              <Trash2 size={16} /> Cancel Tournament
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <ConfirmCancelModal
            tournament={tournament}
            onClose={() => setShowCancelModal(false)}
            onConfirm={handleCancel}
            isLoading={isCancelling}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsTab;
