import React, { useState } from "react";
import { Lock, Loader2, X } from "lucide-react";
import { Button, Input } from "@kridaz/ui";
import API from "../../../shared/services/api";


const ScoringPasswordModal = ({
  matchId,
  actionLabel = "Unlock Scoring App",
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const THEME_COLOR = "var(--success)";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await API.post(`/scoring/auth/${matchId}`, { password });

      const data = response.data;
      if (data.success) {
        // Store verification success in session storage so they don't get prompted repeatedly on refresh
        sessionStorage.setItem(`scoringAuth_${matchId}`, "true");
        onSuccess(data.token);
      } else {
        setError(data.message || "Incorrect password");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-sm bg-background border border-white/10 rounded-[8px] p-10 space-y-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center relative z-10">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <Lock size={24} style={{ color: THEME_COLOR }} /> Auth
          </h3>
          {onClose && (
            <Button
              onClick={onClose}
              className="p-3 bg-white/5 rounded-[8px] border border-white/5 hover:bg-white/10 transition-all text-neutral-400 hover:text-white"
             aria-label="Close">
              <X size={20} />
            </Button>
          )}
        </div>

        <div className="space-y-2 relative z-10">
          <p className="text-xs font-black uppercase text-neutral-500 tracking-[0.2em]">
            {actionLabel}
          </p>
          <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest leading-relaxed">
            This match is protected. Enter the scoring password to proceed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter Password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-[8px] px-6 py-5 text-sm focus:border-success outline-none text-white font-bold tracking-widest transition-all"
            />
            {error && (
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest pl-2 animate-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-[8px] font-black uppercase text-[11px] tracking-[0.2em] transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-2"
            style={{
              backgroundColor: loading ? "var(--success)80" : THEME_COLOR,
              color: "#000",
              boxShadow: `0 10px 30px ${THEME_COLOR}33`,
            }}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Authenticate"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ScoringPasswordModal;
