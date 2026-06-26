import * as Sentry from "@sentry/react";
import React, { useState } from "react";
import { X, Check, Sparkles, Palette, RefreshCw, Circle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@kridaz/ui";
import API from "../../../../shared/services/api";

const THEMES = [
  {
    id: "neon_classic",
    name: "Neon Classic",
    description:
      "High-contrast dark slate theme with glowing cyan highlights, bold neon typography, and modern aesthetics.",
    colors: ["#00F2FE", "#4FACFE"],
    previewBg:
      "bg-slate-950 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]",
    tag: "Classic",
    glow: "rgba(6, 182, 212, 0.4)",
    features: [
      "High-contrast glow",
      "Modern compact layouts",
      "Clean readability",
    ],
  },
  {
    id: "sports_network",
    name: "Sports Network",
    description:
      "Professional high-density television broadcast design. Bold color block layout optimized for maximum data display.",
    colors: ["#E0C3FC", "#8EC5FC"],
    previewBg: "bg-zinc-900 border-l-[6px] border-success shadow-xl",
    tag: "TV Broadcast",
    glow: "rgba(0, 193, 135, 0.4)",
    features: [
      "Television block design",
      "High data readability",
      "Sponsor integrations",
    ],
  },
];

const TickerThemeStoreModal = ({
  activeTheme = "neon_classic",
  matchId,
  onClose,
  onThemeApplied,
}) => {
  const [selectedTheme, setSelectedTheme] = useState(activeTheme);
  const [isApplying, setIsApplying] = useState(false);
  const [hoveredTheme, setHoveredTheme] = useState(null);

  const handleApplyTheme = async () => {
    setIsApplying(true);
    try {
      const scorerToken = localStorage.getItem("scorer_token_" + matchId);
      const config = scorerToken ? { headers: { Authorization: `Bearer ${scorerToken}` } } : {};
      
      const response = await API.post(
        `/hosted-game/update-ticker-theme/${matchId}`,
        { tickerTheme: selectedTheme },
        config
      );

      const data = response.data;

      if (data.success) {
        toast.success(
          `Active theme updated to ${THEMES.find((t) => t.id === selectedTheme)?.name || selectedTheme}!`
        );
        if (onThemeApplied) {
          onThemeApplied(selectedTheme);
        }
        setTimeout(onClose, 800);
      } else {
        toast.error(data.message || "Unable to update ticker theme.");
      }
    } catch (err) {
      Sentry.captureException(err);
      toast.error("Network request failed. Please check connection.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-xl animate-fade-in font-inter">
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[88vh] md:h-[80vh] flex flex-col bg-neutral-950 border border-white/10 rounded-[8px] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:px-8 border-b border-white/5 bg-white/[0.01]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              <h2 className="text-lg md:text-xl font-black uppercase text-white tracking-tight">
                Kridaz Ticker Store
              </h2>
            </div>
            <p className="text-[10px] md:text-xs text-neutral-500 font-bold uppercase tracking-widest">
              Select premium live broadcast overlays
            </p>
          </div>
          <Button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
           aria-label="Close">
            <X size={18} />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {THEMES.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              const isActive = activeTheme === theme.id;

              return (
                <div
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  onMouseEnter={() => setHoveredTheme(theme.id)}
                  onMouseLeave={() => setHoveredTheme(null)}
                  className={`group relative flex flex-col justify-between p-6 rounded-[8px] border cursor-pointer transition-all duration-500 overflow-hidden ${isSelected ? "border-success bg-white/[0.02] shadow-[0_15px_30px_rgba(0,193,135,0.06)]" : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"}`}
                >
                  {/* Dynamic Glowing Accent Background on Hover */}
                  <div
                    className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-20 transition-all duration-700"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`,
                    }}
                  />

                  {/* Header info */}
                  <div className="space-y-4 z-10">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-neutral-900 border border-white/5 text-neutral-400">
                          {theme.tag}
                        </span>
                        <h3 className="text-base font-black text-white uppercase tracking-tight mt-1">
                          {theme.name}
                        </h3>
                      </div>

                      {/* Active Indicator */}
                      {isActive && (
                        <span className="text-[8px] font-black uppercase tracking-wider text-black bg-success px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(0,193,135,0.4)] animate-pulse">
                          Active
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] leading-relaxed text-neutral-500 font-medium">
                      {theme.description}
                    </p>

                    {/* CSS LIVE PREVIEW TICKER */}
                    <div
                      className={`w-full py-4 px-3 rounded-[8px] flex items-center justify-between overflow-hidden shadow-lg ${theme.previewBg}`}
                    >
                      {theme.id === "neon_classic" && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono tracking-tight">
                              KRI 168/4
                            </span>
                          </div>
                          <div className="text-[9px] font-semibold text-neutral-500 uppercase tracking-widest">
                            Ovs 18.2
                          </div>
                        </>
                      )}

                      {theme.id === "premium_glass" && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">
                              KRI 168/4
                            </span>
                          </div>
                          <div className="text-[8px] font-black uppercase text-amber-500/80 tracking-widest bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                            Gold overlay
                          </div>
                        </>
                      )}

                      {theme.id === "retro_arcade" && (
                        <>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-tight">
                              KRI:168-4
                            </span>
                          </div>
                          <div className="text-[9px] font-bold text-stone-500 uppercase tracking-tighter">
                            STAGE 2
                          </div>
                        </>
                      )}

                      {theme.id === "sports_network" && (
                        <div className="w-full flex items-center justify-between border-l-[3px] border-success pl-2 font-sans font-bold">
                          <span className="text-[10px] uppercase text-white tracking-wide">
                            KRI 168/4
                          </span>
                          <span className="text-[9px] text-success uppercase tracking-wider">
                            LIVE
                          </span>
                        </div>
                      )}

                      {theme.id === "cyber_pulse" && (
                        <>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-[10px] font-bold text-pink-500 tracking-tight glow-pink uppercase">
                              CRITICAL
                            </span>
                          </div>
                          <div className="text-[9px] font-black text-violet-400 uppercase tracking-widest">
                            168/4
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bullet points & footer action */}
                  <div className="space-y-4 pt-6 mt-6 border-t border-white/5 z-10">
                    <ul className="space-y-1.5">
                      {theme.features.map((feat, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-tight"
                        >
                          <Check size={12} className="text-success" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full bg-cyan-500/80 border border-black" />
                        <div className="w-4 h-4 rounded-full bg-purple-500/80 border border-black" />
                        <div className="w-4 h-4 rounded-full bg-success/80 border border-black" />
                      </div>

                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${isSelected ? "bg-success/10 border-success text-success" : "bg-white/5 border-white/5 text-neutral-600"}`}
                      >
                        {isSelected ? (
                          <Check size={14} className="stroke-[3]" />
                        ) : (
                          <Circle size={4} className="fill-neutral-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-6 md:px-8 border-t border-white/5 bg-white/[0.01]">
          <div className="hidden md:flex items-center gap-3">
            <Palette size={16} className="text-success" />
            <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
              Select a theme above to instantly re-style all active scoring
              streams
            </span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              onClick={onClose}
              className="flex-1 md:flex-none px-6 py-3.5 rounded-[8px] bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-800 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyTheme}
              disabled={isApplying}
              className="flex-1 md:flex-none px-8 py-3.5 rounded-[8px] bg-success hover:bg-[#00e39e] text-black font-black uppercase text-[10px] tracking-widest transition-all shadow-[0_10px_30px_rgba(0,193,135,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isApplying ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Apply Theme</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TickerThemeStoreModal;
