import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import {
  Users,
  Trophy,
  MapPin,
  User,
  Calendar,
  Download,
  ShieldCheck,
  Share2,
  Zap,
  UserPlus,
  AlertOctagon,
  QrCode as QrIcon,
  Mail,
  Info,
  Target,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const PRI = "#BFF367";
const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const TeamPass = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data } = await axiosInstance.get(`/api/team/${id}`);
        setTeam(data.team);
      } catch (err) {
        setError("Team invitation not found or has expired.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [id]);

  const handleJoinTeam = async () => {
    if (!isLoggedIn) {
      localStorage.setItem("pendingTeamInvite", id);
      toast.info("Please login to join the squad");
      navigate("/login");
      return;
    }

    setIsJoining(true);
    try {
      const response = await axiosInstance.post(`/api/team/join-request/${id}`);
      if (response.data.success) {
        toast.success("Join request sent successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send join request");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#BFF367]/20 border-t-[#BFF367] rounded-full animate-spin" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
            Scanning Pass...
          </p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-6">
        <AlertOctagon className="w-16 h-16 text-red-500 mb-2" />
        <h2
          className="text-2xl font-black text-white uppercase tracking-tighter"
          style={HEADING_STYLE}
        >
          Invalid Invitation
        </h2>
        <p className="text-white/40 text-[11px] font-medium text-center max-w-xs">
          {error || "This team invitation has expired or been revoked."}
        </p>
        <Link
          to="/"
          className="px-8 py-3 bg-white/5 border border-white/10 rounded-[8px] text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
        >
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 flex flex-col items-center overflow-x-hidden">
      <div className="w-full max-w-[480px] relative">
        {/* Background Glows */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#BFF367]/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#BFF367]/5 blur-[100px] rounded-full pointer-events-none" />

        {/* The Ticket Card */}
        <div className="bg-[#050505] border border-white/5 rounded-[8px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative p-1">
          <div className="bg-[#0A0A0A] rounded-[8px] overflow-hidden border border-white/5">
            {/* Header Section */}
            <div className="relative h-28 overflow-hidden border-b border-white/5">
              <img
                src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2105&auto=format&fit=crop"
                className="w-full h-full object-cover opacity-20 grayscale"
                alt=""
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0A0A0A]/60 to-[#0A0A0A]" />
              <div className="absolute inset-x-8 top-8 flex items-center justify-between z-10">
                <div>
                  <h3
                    className="text-xl font-black tracking-tighter text-[#BFF367]"
                    style={HEADING_STYLE}
                  >
                    KRIDAZ
                  </h3>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40 mt-1">
                    Team Invitation Rs �{" "}
                    {team.teamCode || id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-[8px] backdrop-blur-sm">
                  <Mail size={12} className="text-[#BFF367]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white">
                    Open Invite
                  </span>
                </div>
              </div>
            </div>

            {/* Team Identity Area */}
            <div className="px-8 py-8 flex items-center gap-6">
              <div className="w-28 h-28 rounded-[8px] bg-black border border-white/10 p-1.5 overflow-hidden shrink-0 shadow-2xl">
                <div className="w-full h-full rounded-[8px] bg-[#111] flex items-center justify-center overflow-hidden">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      className="w-full h-full object-cover"
                      alt={team.name}
                    />
                  ) : (
                    <Users size={40} className="text-white/5" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h1
                  className="text-3xl font-black text-white uppercase tracking-tighter mb-1"
                  style={HEADING_STYLE}
                >
                  {team.name}
                </h1>
                <div className="flex items-center gap-2 text-[#BFF367]">
                  <Trophy size={16} />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                    {team.sportType || "Cricket"} Rs �{" "}
                    {team.members?.length || 0} Members
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata Grid (Styled as individual boxes) */}
            <div className="px-8 pb-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Captain",
                    icon: User,
                    value: team.owner?.name || "N/A",
                  },
                  {
                    label: "Location",
                    icon: MapPin,
                    value: team.city || "Various",
                  },
                  {
                    label: "Created",
                    icon: Calendar,
                    value: format(parseISO(team.createdAt), "MMM yyyy"),
                  },
                  {
                    label: "Status",
                    icon: ShieldCheck,
                    value: team.visibility || "PUBLIC",
                  },
                ].map(({ label, icon: Icon, value }) => (
                  <div
                    key={label}
                    className="bg-white/[0.02] border border-white/5 rounded-[8px] p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-[#BFF367]" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                        {label}
                      </span>
                    </div>
                    <p className="text-xs font-black text-white uppercase truncate">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* About Team Section */}
            <div className="px-8 py-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-6 relative overflow-hidden">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-white/30">
                    <Info size={14} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                      About Team
                    </span>
                  </div>
                  <p className="text-[13px] text-white/60 font-medium leading-relaxed">
                    "
                    {team.description ||
                      "Representing the best of their city. This squad is built on passion and strategy."}
                    "
                  </p>
                </div>
                {/* Decorative Ball Overlay */}
                <div className="absolute top-1/2 -right-8 -translate-y-1/2 opacity-[0.05] pointer-events-none">
                  <Target
                    size={140}
                    strokeWidth={1}
                    className="text-[#BFF367]"
                  />
                </div>
              </div>
            </div>

            {/* QR Scan Section (Enhanced Glow) */}
            <div className="px-8 py-6">
              <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-8 flex flex-col md:flex-row items-center gap-10">
                {/* QR Frame with Pulse Glow */}
                <div className="relative p-2">
                  <div className="absolute inset-0 bg-[#BFF367]/20 blur-2xl rounded-full animate-pulse" />
                  {/* Corners */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#BFF367] rounded-tl-2xl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#BFF367] rounded-tr-2xl" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#BFF367] rounded-bl-2xl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#BFF367] rounded-br-2xl" />

                  <div className="bg-white p-4 rounded-[8px] relative z-10 shadow-[0_0_50px_rgba(85,222,232,0.2)]">
                    {team.qrCode ? (
                      <img
                        src={team.qrCode}
                        alt="Team QR"
                        className="w-32 h-32"
                      />
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center bg-black/5">
                        <QrIcon size={48} className="text-black/10" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-2 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-[#BFF367]">
                      <QrIcon size={18} strokeWidth={2.5} />
                      <h4 className="text-[12px] font-black uppercase tracking-widest">
                        Scan to Join Team
                      </h4>
                    </div>
                    <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                      Scan this pass to view team details and join the squad
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Users, l: "View Details" },
                      { icon: ShieldCheck, l: "Join Squad" },
                      { icon: Zap, l: "Play & Win" },
                    ].map((feat, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center md:items-start gap-3"
                      >
                        <div className="w-10 h-10 rounded-[8px] bg-white/5 border border-white/10 flex items-center justify-center text-[#BFF367] shadow-lg">
                          <feat.icon size={14} />
                        </div>
                        <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.15em] leading-tight text-center md:text-left">
                          {feat.l}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Action Area */}
            <div className="px-8 pb-10 space-y-4">
              <button
                onClick={handleJoinTeam}
                disabled={isJoining}
                className="w-full flex items-center justify-center gap-4 py-6 rounded-[8px] bg-[#BFF367] text-black font-black uppercase text-[14px] tracking-[0.2em] transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_15px_40px_rgba(85,222,232,0.4)] relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
                {isJoining ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={22} strokeWidth={3} />
                    Join This Team
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-3 py-4 rounded-[8px] bg-white/[0.03] border border-white/5 text-white/40 font-black uppercase text-[10px] tracking-widest hover:bg-white/5 hover:text-white transition-all"
                >
                  <Download size={16} /> Save Pass
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Invite link copied!");
                  }}
                  className="flex items-center justify-center gap-3 py-4 rounded-[8px] bg-white/[0.03] border border-white/5 text-white/40 font-black uppercase text-[10px] tracking-widest hover:bg-white/5 hover:text-white transition-all"
                >
                  <Share2 size={16} /> Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Label */}
        <div className="flex flex-col items-center gap-4 py-10 opacity-30">
          <div className="flex items-center gap-3">
            <ShieldCheck size={16} />
            <span className="text-[11px] font-black uppercase tracking-[0.5em]">
              Official Kridaz Team Invitation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPass;
