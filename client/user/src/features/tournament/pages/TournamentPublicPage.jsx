import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetPublicTournamentQuery } from "../../../redux/api/tournamentApi";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Share2,
  Info,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RegistrationModal from "../components/RegistrationModal";import { Button } from "@kridaz/ui";


const TournamentPublicPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: res, isLoading, error } = useGetPublicTournamentQuery(id);
  const [activeTab, setActiveTab] = useState("about");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const tournament = res?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <h2 className="text-xl font-bold mb-4">Tournament Not Found</h2>
        <p className="text-sm text-white/50 mb-6">
          This tournament may have been canceled or the link is invalid.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="px-6 py-2 bg-primary text-black rounded-full font-bold"
        >
          Go Home
        </Button>
      </div>
    );
  }

  const spotsLeft = Math.max(
    0,
    (tournament.maxTeams || 0) - (tournament.teams?.length || 0)
  );
  const isFull = spotsLeft === 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24">
      {/* Hero Section */}
      <div className="relative pt-0 pb-12">
        <div className="absolute inset-0 z-0 h-[60vh] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40 blur-lg scale-110"
            style={{
              backgroundImage: `url(${tournament.posterUrl || "https://images.unsplash.com/photo-1522778119026-d647f0596c20"}) saturate(150%)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#050505]/80 to-[#050505]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8">
          <Button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              // toast.success("Link copied!");
            }}
            className="absolute top-8 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <Share2 size={18} />
          </Button>

          <div className="flex flex-col items-center text-center mt-8">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-3xl bg-black border border-white/10 overflow-hidden flex-shrink-0 shadow-2xl mb-6">
              {tournament.posterUrl ? (
                <img
                  src={tournament.posterUrl}
                  alt="Poster"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-card">
                  <Trophy size={48} className="text-primary" />
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider mb-4">
              Registration Open
            </div>

            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wide leading-tight mb-4">
              {tournament.name}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm text-white/80 font-bold tracking-widest uppercase mb-8">
              <span className="flex items-center gap-1">
                <Trophy size={14} className="text-secondary" />{" "}
                {tournament.sport} • {tournament.type}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="flex items-center gap-1">
                <Users size={14} className="text-secondary" />{" "}
                {tournament.format}
              </span>
              {tournament.venues?.length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-secondary" />{" "}
                    {tournament.venues[0].turf?.name || "Multiple Venues"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4">
        {/* Quick Stats Banner */}
        <div className="bg-card border border-white/5 rounded-2xl p-4 md:p-6 mb-8 flex flex-wrap gap-6 md:gap-0 justify-between items-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />

          <div className="flex items-center gap-4 w-1/2 md:w-auto">
            <div className="w-10 h-10 rounded-full bg-[#FFD700]/10 flex items-center justify-center">
              <IndianRupee className="text-[#FFD700]" size={20} />
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase font-bold">
                Prize Pool
              </p>
              <p className="text-lg font-black text-white">
                â‚¹{tournament.prizePool?.toLocaleString() || "TBA"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-1/2 md:w-auto border-l border-white/5 pl-6 md:pl-8">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Calendar className="text-secondary" size={20} />
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase font-bold">
                Starts On
              </p>
              <p className="text-lg font-black text-white">
                {tournament.startDate
                  ? new Date(tournament.startDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })
                  : "TBA"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="text-primary" size={20} />
            </div>
            <div>
              <p className="text-[10px] text-white/50 uppercase font-bold">
                Spots Left
              </p>
              <p className="text-lg font-black text-white">
                {spotsLeft}{" "}
                <span className="text-sm font-normal text-white/50">
                  / {tournament.maxTeams}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Info Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-white/5 mb-6">
          {[
            { id: "about", label: "About", icon: <Info size={14} /> },
            {
              id: "rules",
              label: "Rules & Prizes",
              icon: <Trophy size={14} />,
            },
            {
              id: "teams",
              label: "Registered Teams",
              icon: <Users size={14} />,
            },
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-6 whitespace-nowrap transition-colors relative ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {tab.icon}
              <span className="text-xs font-bold uppercase tracking-wider">
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="pubTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </Button>
          ))}
        </div>

        <div className="min-h-[300px]">
          {activeTab === "about" && (
            <div className="space-y-6 animate-fade-in text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
              <h3 className="text-lg font-black text-white uppercase">
                About Tournament
              </h3>
              <p>{tournament.details?.about || "No details provided."}</p>

              {tournament.details?.facilities && (
                <div className="mt-6">
                  <h3 className="text-lg font-black text-white uppercase mb-2">
                    Facilities Available
                  </h3>
                  <p>{tournament.details.facilities}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "rules" && (
            <div className="space-y-6 animate-fade-in text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
              <h3 className="text-lg font-black text-white uppercase">
                Prizes
              </h3>
              <p>
                {tournament.details?.awards ||
                  "Trophy and cash prize for winners."}
              </p>

              <h3 className="text-lg font-black text-white uppercase mt-6">
                Rules
              </h3>
              <p>
                Standard {tournament.format} {tournament.sport} rules apply.
              </p>
            </div>
          )}

          {activeTab === "teams" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-black text-white uppercase mb-4">
                Teams in the mix ({tournament.teams?.length || 0})
              </h3>

              {tournament.teams?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tournament.teams.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 bg-card p-4 rounded-xl border border-white/5"
                    >
                      <div className="w-12 h-12 rounded-full bg-card flex flex-shrink-0 items-center justify-center overflow-hidden border border-white/10">
                        {t.team?.logo ? (
                          <img
                            src={t.team.logo}
                            alt="team"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="text-white/30" size={20} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">
                          {t.team?.name}
                        </p>
                        <p className="text-[10px] text-white/50">
                          {t.team?.city || "Unknown City"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-card rounded-2xl border border-white/5">
                  <p className="text-sm font-bold text-white/50 mb-2">
                    No teams registered yet.
                  </p>
                  <p className="text-xs text-primary">
                    Be the first to join!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-40">
        <div className="max-w-4xl mx-auto flex gap-4">
          <Button
            disabled={isFull}
            onClick={() => setShowRegistrationModal(true)}
            className="flex-1 bg-primary text-black font-black px-6 py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors uppercase tracking-widest text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(191,243,103,0.2)]"
          >
            {isFull
              ? "Tournament Full"
              : `Register Team • â‚¹${tournament.entryFee}`}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showRegistrationModal && (
          <RegistrationModal
            tournament={tournament}
            onClose={() => setShowRegistrationModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TournamentPublicPage;
