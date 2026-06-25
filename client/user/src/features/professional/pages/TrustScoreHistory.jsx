import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  Award,
} from "lucide-react";
import { useGetTrustScoreHistoryQuery } from "../../../redux/api/professionalApi";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";

const TrustScoreHistory = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetTrustScoreHistoryQuery();

  const trustScore = data?.trustScore ?? 100.0;
  const events = data?.events ?? [];

  // Categorize events or count stats
  const positiveEvents = events.filter((e) => e.delta > 0).length;
  const negativeEvents = events.filter((e) => e.delta < 0).length;

  // Function to format event types to readable labels
  const formatEventType = (type) => {
    switch (type) {
      case "ONBOARDING":
        return "Onboarding Bonus";
      case "ACCEPTED":
        return "Offer Accepted";
      case "REVIEW":
        return "User Review Rating";
      case "SKIPPED":
        return "Offer Skipped";
      case "CANCEL_OVER_72":
        return "Cancellation (>72 hrs)";
      case "CANCEL_UNDER_72":
        return "Cancellation (<72 hrs)";
      case "NO_SHOW":
        return "No Show";
      case "INACTIVITY_DECAY":
        return "Inactivity Decay";
      default:
        return type.replace(/_/g, " ");
    }
  };

  const getEventIcon = (type, delta) => {
    if (type === "NO_SHOW")
      return <ShieldAlert className="text-red-500" size={18} />;
    if (type === "INACTIVITY_DECAY")
      return <AlertTriangle className="text-yellow-500" size={18} />;
    if (delta > 0) return <CheckCircle className="text-primary" size={18} />;
    return <AlertTriangle className="text-red-500" size={18} />;
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-8 font-inter">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header with Back button */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              Trust Score Ledger
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
              Track your professional status and points ledger
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-white/5">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Loading Trust ledger...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-center">
            <ShieldAlert className="mx-auto mb-3" size={32} />
            <h3 className="font-bold uppercase text-sm">
              Failed to load Trust Score Ledger
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {error?.data?.message || "An unexpected error occurred."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Big Score Card & Stats */}
            <div className="space-y-6">
              <div className="p-6 bg-[#141414] border border-border rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-wider border-l border-b border-border">
                  Level status
                </div>

                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-6">
                  Current Trust Score
                </span>

                {/* Score Indicator Ring */}
                <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                  {/* Outer Glow Ring */}
                  <div className="absolute inset-0 rounded-full border border-dashed border-white/10 animate-[spin_20s_linear_infinite]" />
                  <div className="absolute w-28 h-28 rounded-full bg-black flex flex-col items-center justify-center shadow-[inset_0_2px_12px_rgba(204,255,0,0.15)] border border-border">
                    <span className="text-4xl font-black text-white">
                      {Number(trustScore).toFixed(1)}
                    </span>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest mt-1">
                      Points
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground px-2">
                  Your score determines your matchmaking priority and overall
                  reputation. Keep it high!
                </p>
              </div>

              {/* Analytics summary */}
              <div className="p-5 bg-[#141414] border border-border rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Event Summaries
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-border rounded-xl p-3.5">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">
                      Positive Events
                    </span>
                    <span className="text-xl font-black text-green-400 mt-1 block">
                      {positiveEvents}
                    </span>
                  </div>
                  <div className="bg-black/40 border border-border rounded-xl p-3.5">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">
                      Deductions
                    </span>
                    <span className="text-xl font-black text-red-500 mt-1 block">
                      {negativeEvents}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Ledger / Timeline */}
            <div className="md:col-span-2 p-6 bg-[#141414] border border-border rounded-2xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Award size={16} /> Points Transaction History
              </h3>

              {events.length === 0 ? (
                <div className="bg-black/30 border border-border rounded-xl p-12 text-center flex flex-col items-center justify-center">
                  <Shield className="w-12 h-12 text-gray-600 mb-3" />
                  <h4 className="text-sm font-bold text-white uppercase">
                    No Transactions Found
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Your trust score is at its default baseline of 100.0
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {events.map((event) => {
                    const isPositive = event.delta > 0;
                    return (
                      <div
                        key={event.id}
                        className="bg-black/30 border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            {getEventIcon(event.eventType, event.delta)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xs font-black uppercase text-white tracking-wider">
                                {formatEventType(event.eventType)}
                              </h4>
                              <span className="text-[9px] text-gray-500 font-bold uppercase">
                                {new Date(event.createdAt).toLocaleDateString(
                                  "en-GB"
                                )}{" "}
                                {new Date(event.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 font-sans">
                              {event.reason || "Automatic trust score update"}
                            </p>

                            {event.booking && (
                              <div className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded w-max">
                                <Clock size={10} /> Venue:{" "}
                                {event.booking.enue?.name ||
                                  "Custom location"}{" "}
                                | Organizer:{" "}
                                {event.booking.user?.name || "Client"}
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          className={`text-right text-sm font-black shrink-0 ${isPositive ? "text-green-400" : event.delta < 0 ? "text-red-500" : "text-gray-400"}`}
                        >
                          {isPositive
                            ? `+${Number(event.delta).toFixed(1)}`
                            : Number(event.delta).toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrustScoreHistory;
