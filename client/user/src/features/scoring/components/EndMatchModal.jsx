import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, Loader2 } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { Button, Input } from "@kridaz/ui";


const THEME_COLOR = "var(--success)";

export default function EndMatchModal({
  matchId,
  hasPassword,
  onConfirm,
  onClose,
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEndMatch = async () => {
    if (hasPassword) {
      if (!password.trim()) {
        setError("Password is required");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const authRes = await axiosInstance.post(
          `/api/scoring/auth/${matchId}`,
          { password }
        );
        if (authRes.data.success) {
          onConfirm(authRes.data.token);
        } else {
          setError(authRes.data.message || "Incorrect password");
          setLoading(false);
        }
      } catch (err) {
        setError("Network error. Please try again.");
        setLoading(false);
      }
    } else {
      setLoading(true);
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 pb-0 sm:px-4 sm:pb-0 font-inter">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 24 }}
        className="relative w-full max-w-sm bg-background rounded-t-[20px] sm:rounded-[12px] border-t border-x sm:border border-white/5 overflow-hidden z-10 shadow-2xl pb-4 sm:pb-0"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 flex items-center justify-between border-b border-white/5">
          <div>
            <h2 className="font-inter text-[24px] font-semibold text-white leading-tight tracking-tight uppercase flex items-center gap-3">
              {hasPassword ? (
                <Lock size={20} className="text-success" />
              ) : (
                <CheckCircle2 size={20} className="text-success" />
              )}
              End Match
            </h2>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest leading-relaxed">
            {hasPassword
              ? "This match is protected. Enter the scoring password to end the match."
              : "Are you sure you want to end this match? This action cannot be undone."}
          </p>

          {hasPassword && (
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
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <Button
              onClick={onClose}
              className="flex-1 py-4 rounded-[8px] font-black text-neutral-400 text-[11px] uppercase tracking-[0.2em] transition-all bg-card hover:bg-card active:scale-95"
            >
              BACK
            </Button>
            <Button
              onClick={handleEndMatch}
              disabled={loading}
              className="flex-[2] py-4 rounded-[8px] font-black text-black text-[11px] uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-2"
              style={{
                backgroundColor: THEME_COLOR,
                boxShadow: `0 10px 30px ${THEME_COLOR}33`,
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin text-black" />
              ) : (
                "END MATCH"
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
