import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Share2,
  Users,
  Calendar,
  Megaphone,
  ShieldCheck,
  Wallet,
  Settings,
  ArrowLeft,
  QrCode,
  List,
  BarChart,
  Award,
  Image as ImageIcon,
  Info,
  MapPin
} from "lucide-react";
import { useGetTournamentByIdQuery } from "../../../redux/api/tournamentApi";
import { QRCodeSVG } from "qrcode.react";

import MatchesTab from "../components/dashboard/MatchesTab";
import TeamsTab from "../components/dashboard/TeamsTab";
import PointsTab from "../components/dashboard/PointsTab";
import StatsTab from "../components/dashboard/StatsTab";
import HeroesTab from "../components/dashboard/HeroesTab";
import GalleryTab from "../components/dashboard/GalleryTab";
import AboutTab from "../components/dashboard/AboutTab";
import LeaderboardTab from "../components/dashboard/LeaderboardTab";
import SponsorsTab from "../components/dashboard/SponsorsTab";
import LiveMatchesTab from "../components/dashboard/LiveMatchesTab";
import { Button } from "@kridaz/ui";
import { PlayCircle } from "lucide-react";


const TABS = [
  { id: "live-matches", label: "Live Matches", icon: <PlayCircle size={16} /> },
  { id: "matches", label: "Matches", icon: <Calendar size={16} /> },
  { id: "teams", label: "Teams", icon: <Users size={16} /> },
  { id: "points", label: "Points", icon: <List size={16} /> },
  { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={16} /> },
  { id: "stats", label: "Stats", icon: <BarChart size={16} /> },
  { id: "heroes", label: "Heroes", icon: <Award size={16} /> },
  { id: "sponsors", label: "Sponsors", icon: <Megaphone size={16} /> },
  { id: "gallery", label: "Gallery", icon: <ImageIcon size={16} /> },
  { id: "about", label: "About", icon: <Info size={16} /> },
];

const TournamentDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "matches";

  const [showShareModal, setShowShareModal] = useState(false);

  // Fetch Tournament Details
  const { data: res, isLoading } = useGetTournamentByIdQuery(id);
  const tournament = res?.data;

  // Render the correct tab content
  const renderTabContent = () => {
    if (!tournament) return null;

    const props = { tournament };

    switch (currentTab) {
      case "live-matches":
        return <LiveMatchesTab {...props} />;
      case "matches":
        return <MatchesTab {...props} />;
      case "teams":
        return <TeamsTab {...props} />;
      case "points":
        return <PointsTab {...props} />;
      case "leaderboard":
        return <LeaderboardTab {...props} />;
      case "stats":
        return <StatsTab {...props} />;
      case "heroes":
        return <HeroesTab {...props} />;
      case "sponsors":
        return <SponsorsTab {...props} />;
      case "gallery":
        return <GalleryTab {...props} />;
      case "about":
        return <AboutTab {...props} />;
      default:
        return <MatchesTab {...props} />;
    }
  };

  const setTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white animate-pulse">
        <div className="relative pt-6 pb-20">
          <div className="absolute inset-0 z-0 overflow-hidden bg-white/5" />
          <div className="relative z-10 max-w-5xl mx-auto px-4 pt-4">
            <div className="w-10 h-10 rounded-full bg-white/10 mb-6" />
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white/10" />
                <div className="space-y-3">
                  <div className="w-24 h-6 bg-white/10 rounded-full" />
                  <div className="w-64 md:w-80 h-10 bg-white/10 rounded-lg" />
                  <div className="w-48 h-4 bg-white/10 rounded-full" />
                </div>
              </div>
              <div className="w-32 h-12 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
        
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-y border-white/5">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex gap-4 py-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="w-24 h-6 bg-white/10 rounded-md" />)}
            </div>
          </div>
        </div>
        
        <main className="max-w-5xl mx-auto px-4 py-8 pb-32">
          <div className="w-full h-40 bg-white/5 rounded-2xl mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full h-64 bg-white/5 rounded-2xl" />
            <div className="w-full h-64 bg-white/5 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <h2 className="text-xl font-bold mb-4">Tournament Not Found</h2>
        <Button
          onClick={() => navigate(-1)}
          className="text-primary underline"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Dynamic Header */}
      <div className="relative pt-6 pb-20">
        {/* Blurred Poster Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110"
            style={{
              backgroundImage: `url(${tournament.posterUrl || "https://images.unsplash.com/photo-1522778119026-d647f0596c20"})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-[#050505]/80 to-[#050505]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-4">
          <Button
            onClick={() => navigate("/joingame-history?tab=hosted-tournament")}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-black border border-white/10 overflow-hidden flex-shrink-0 shadow-2xl">
                {tournament.posterUrl ? (
                  <img
                    src={tournament.posterUrl}
                    alt="Poster"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-card">
                    <Trophy size={32} className="text-primary" />
                  </div>
                )}
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {tournament.status || "PUBLISHED"}
                </div>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wide leading-tight mb-2">
                  {tournament.name}
                </h1>
                <p className="text-sm text-white/60 font-bold tracking-widest uppercase mb-2">
                  {tournament.sport} • {tournament.type} • {tournament.format}
                </p>
                {tournament.organizerName && (
                  <div className="flex items-center gap-4 text-xs text-white/50 font-medium">
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-primary" />
                      {tournament.organizerName}
                    </span>
                    {tournament.organizerNumber && (
                      <span className="flex items-center gap-1">
                        <Share2 size={12} className="text-primary" />
                        {tournament.organizerNumber}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowShareModal(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-black px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white transition-colors"
              >
                <Share2 size={16} /> Share Link
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto hide-scrollbar">
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-4 whitespace-nowrap transition-colors relative ${
                  currentTab === tab.id
                    ? "text-primary"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {tab.icon}
                <span className="text-xs font-bold uppercase tracking-wider">
                  {tab.label}
                </span>
                {currentTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-3xl p-8 max-w-sm w-full relative text-center">
            <Button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              x
            </Button>
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} className="text-primary" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-widest mb-2">
              Share Registration Link
            </h3>
            <p className="text-xs text-white/50 mb-6">
              Teams can scan this QR or use the link to register for{" "}
              {tournament.name}.
            </p>

            <div className="w-48 h-48 bg-white rounded-xl mx-auto mb-6 p-4 flex items-center justify-center shadow-lg">
              <QRCodeSVG
                value={`https://kridaz.com/t/${tournament.id}`}
                size={160}
                bgColor={"#ffffff"}
                fgColor={"#050505"}
                level={"H"}
                includeMargin={false}
              />
            </div>

            <Button className="w-full bg-[#25D366] text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 mb-3">
              Share on WhatsApp
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(
                  `https://kridaz.com/t/${tournament.id}`
                );
                setShowShareModal(false);
              }}
              className="w-full bg-card text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-white/10"
            >
              Copy Link
            </Button>
          </div>
        </div>
      )}

      {/* Global CSS for hiding scrollbar in tabs */}
      <style>
        {`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        `}
      </style>
    </div>
  );
};

export default TournamentDashboard;
