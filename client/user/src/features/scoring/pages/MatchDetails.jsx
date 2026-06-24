import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Shield,
  ArrowLeft,
  Zap,
  Activity,
  Share2,
  User,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import GlobalBackButton from "@/shared/components/GlobalBackButton";import { Button } from "@kridaz/ui";


const MatchDetails = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  // @ts-ignore
  const { user } = useSelector((state) => state.auth);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const res = await axiosInstance.get(`/api/hosted-game/${matchId}`);
        setGame(res.data.game);
      } catch (err) {
        toast.error("Failed to load match details");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchGameDetails();
  }, [matchId, navigate]);

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );

  if (!game) return null;

  const isCompleted = game.status === "COMPLETED";
  const isCancelled = game.status === "CANCELLED";
  const isUmpire =
    user &&
    game.umpire &&
    (user._id === game.umpire._id || user.id === game.umpire._id);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32">
      {/* Dynamic Header */}
      <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GlobalBackButton />
            <div>
              <h1 className="text-sm font-black uppercase tracking-tighter">
                MATCH DETAILS
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                ID: {game.shortId || "KRZ-XXXX"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const shareUrl = window.location.href;
                if (navigator.share) {
                  navigator
                    .share({ title: "Join Match", url: shareUrl })
                    .catch(() => {
                      navigator.clipboard.writeText(shareUrl);
                      toast.success("Link copied!");
                    });
                } else {
                  navigator.clipboard.writeText(shareUrl);
                  toast.success("Link copied!");
                }
              }}
              className="p-3 bg-white/5 rounded-[8px] hover:bg-primary/10 hover:text-primary transition-all group"
            >
              <Share2 size={18} className="text-gray-400" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[8px] p-8 md:p-12"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                  {game.gameType} CRICKET
                </span>
                <span
                  className={`px-3 py-1 ${isCompleted ? "bg-blue-500" : isCancelled ? "bg-red-500" : "bg-orange-500"} text-white text-[10px] font-black uppercase tracking-widest rounded-full`}
                >
                  {game.status}
                </span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                {game.teams?.teamA?.name}{" "}
                <span className="text-primary">vs</span>{" "}
                {game.teams?.teamB?.name}
              </h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                  <Calendar size={16} className="text-primary" />{" "}
                  {new Date(game.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                  <Clock size={16} className="text-primary" /> {game.time}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                  <MapPin size={16} className="text-primary" />{" "}
                  {game.enue?.name || game.customVenue || "Self-Arranged"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full md:w-auto">
              {isCompleted ? (
                <Button
                  onClick={() =>
                    navigate(
                      `/analytics/${game.shortId || game.id || game._id}`
                    )
                  }
                  className="h-16 px-10 bg-primary text-black font-black uppercase text-sm tracking-widest rounded-[8px] shadow-[0_20px_50px_rgba(132,204,22,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  View Full Analytics <Activity size={20} />
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  {isUmpire && (
                    <Button
                      onClick={() =>
                        window.open(
                          `/scoring/${game.id || game._id}`,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="h-16 px-10 bg-primary text-black font-black uppercase text-sm tracking-widest rounded-[8px] shadow-[0_20px_50px_rgba(132,204,22,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                    >
                      Launch Scoring Console{" "}
                      <Zap size={20} fill="currentColor" />
                    </Button>
                  )}
                  <Button className="h-16 px-10 bg-white/5 border border-white/10 text-white font-black uppercase text-sm tracking-widest rounded-[8px] cursor-default flex items-center justify-center gap-3">
                    Match In Progress{" "}
                    <Clock size={20} className="animate-spin-slow" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mb-32" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Rosters */}
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Users className="text-primary" /> Team Rosters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["teamA", "teamB"].map((teamKey) => (
                <div
                  key={teamKey}
                  className="bg-white/[0.02] border border-white/5 rounded-[8px] p-6 space-y-4"
                >
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <h4 className="text-lg font-black uppercase tracking-tight">
                      {game.teams[teamKey].name}
                    </h4>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      TEAM {teamKey.slice(-1)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {game.teams[teamKey].slots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white/[0.02] rounded-[8px] border border-transparent hover:border-white/5 transition-all"
                      >
                        <div
                          className={`flex items-center gap-3 ${slot.user ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                          onClick={() =>
                            slot.user && navigate(`/profile/${slot.user._id}`)
                          }
                        >
                          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 overflow-hidden flex items-center justify-center">
                            {slot.user?.profilePicture ? (
                              <img
                                src={slot.user.profilePicture}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={20} className="text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight">
                              {slot.user?.name || "Empty Slot"}
                            </p>
                            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                              {slot.role}
                            </p>
                          </div>
                        </div>
                        {slot.status === "OCCUPIED" && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: Venue & Official */}
          <div className="space-y-8">
            {/* Umpire Card */}
            <div className="bg-white/[0.02] border border-white/10 rounded-[8px] p-6 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Shield size={16} className="text-primary" /> Official Umpire
              </h3>

              {game.umpire ? (
                <div
                  className="flex items-center gap-4 p-4 bg-primary/5 rounded-[8px] border border-primary/20 cursor-pointer hover:border-primary/50 transition-all group/u"
                  onClick={() =>
                    navigate(`/profile/${game.umpire.id || game.umpire._id}`)
                  }
                >
                  <div className="w-14 h-14 rounded-full border-2 border-primary/20 overflow-hidden group-hover/u:border-primary/50 transition-colors">
                    {game.umpire.profilePicture ? (
                      <img
                        src={game.umpire.profilePicture}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <User size={24} className="m-auto text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight group-hover/u:text-primary transition-colors">
                      {game.umpire.name}
                    </p>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      Verified Official
                    </p>
                  </div>
                </div>
              ) : game.invites?.filter(
                  (inv) => inv.isProfessional && inv.role === "UMPIRE"
                ).length > 0 ? (
                game.invites
                  .filter((inv) => inv.isProfessional && inv.role === "UMPIRE")
                  .map((umpire) => (
                    <div
                      key={umpire.id}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-[8px] border border-white/10 transition-all group/u"
                    >
                      <div className="w-14 h-14 rounded-full border-2 border-white/10 overflow-hidden flex items-center justify-center bg-neutral-800">
                        <User size={24} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight text-white">
                          {umpire.name}
                        </p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Custom Umpire
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-8 text-center bg-white/5 rounded-[8px] border border-dashed border-white/10">
                  <Shield size={32} className="mx-auto mb-3 text-gray-700" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    No Official Hired Yet
                  </p>
                </div>
              )}
            </div>

            {/* Host Card */}
            {game.host && (
              <div className="bg-white/[0.02] border border-white/10 rounded-[8px] p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <User size={16} className="text-primary" /> Match Host
                </h3>
                <div
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-[8px] border border-white/10 cursor-pointer hover:border-primary/50 transition-all group/h"
                  onClick={() => navigate(`/profile/${game.host._id}`)}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-white/10 overflow-hidden group-hover/h:border-primary/30 transition-colors flex items-center justify-center bg-primary/5">
                    {game.host.profilePicture ? (
                      <img
                        src={game.host.profilePicture}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <User size={20} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight group-hover/h:text-primary transition-colors">
                      {game.host.name}
                    </p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      Game Host
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Venue Card */}
            <div className="bg-white/[0.02] border border-white/10 rounded-[8px] p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> Venue Details
              </h3>

              {game.enue ? (
                <div className="space-y-4">
                  <div className="w-full h-40 bg-neutral-800 rounded-[8px] overflow-hidden border border-white/5">
                    <img
                      src={
                        game.ground.images?.[0] ||
                        "https://images.unsplash.com/photo-1591333139265-2967724a9131?q=80&w=1000"
                      }
                      className="w-full h-full object-cover opacity-60"
                    />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-tight">
                      {game.enue.name}
                    </p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">
                      {game.enue.location}
                    </p>
                  </div>
                  <Button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all">
                    View on Google Maps
                  </Button>
                </div>
              ) : game.customVenue ? (
                <div className="space-y-4">
                  <div className="w-full h-40 bg-neutral-800 rounded-[8px] overflow-hidden border border-white/5">
                    <img
                      src="https://images.unsplash.com/photo-1591333139265-2967724a9131?q=80&w=1000"
                      className="w-full h-full object-cover opacity-60"
                    />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-tight">
                      {game.customVenue}
                    </p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">
                      Custom Venue
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white/5 rounded-[8px] text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase">
                    Self-Arranged Venue
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
