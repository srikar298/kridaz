import { useState } from "react";
import {
  ArrowRight,
  Users,
  Target,
  Video,
  CheckCircle,
  Trophy,
  X,
  Landmark,
  User,
  QrCode,
  FileCheck,
  Loader2,
  Clock,
  Sparkles,
  ClipboardList,
  Apple,
  Activity,
  ChevronLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance.js";
import ScrollToTop from "@components/common/ScrollToTop";
import toast from "react-hot-toast";
import { Button, Input } from "@kridaz/ui";


const GRADIENT = "linear-gradient(90deg, var(--primary) 0%, var(--primary) 100%)";
const GRADIENT_START = "var(--primary)";

const benefits = [
  {
    icon: Users,
    title: "Manage Roster",
    desc: "Easily track student progress, manage subscriptions, and organize batches.",
  },
  {
    icon: Target,
    title: "Attract Athletes",
    desc: "Get discovered by players looking to improve their skills in your area.",
  },
  {
    icon: Video,
    title: "Host Masterclasses",
    desc: "Set up exclusive training sessions, bootcamps, and video analysis.",
  },
];

const availableRoles = [
  { id: "coach", label: "Coach", icon: Trophy },
  { id: "umpire", label: "Umpire", icon: Target },
  { id: "streamer", label: "Streamer", icon: Video },
  { id: "commentator", label: "Commentator", icon: Users },
  { id: "cheerleader", label: "Cheerleader", icon: Sparkles },
  { id: "scorer", label: "Scorer", icon: ClipboardList },
  { id: "nutritionist", label: "Nutritionist", icon: Apple },
  { id: "physiotherapist", label: "Physio", icon: Activity },
];

const BG =
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1800&q=80&auto=format&fit=crop";

export default function ProfessionalLanding() {
  const [modalStep, setModalStep] = useState(0); // 0: closed, 1: role selection, 2: document upload
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [aadharFront, setAadharFront] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [panFront, setPanFront] = useState(null);
  const [panBack, setPanBack] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user, isLoggedIn } = useSelector((state) => state.auth);

  // Compute user registration status
  const professionalRoles = [
    "coach",
    "umpire",
    "streamer",
    "commentator",
    "venue_owner",
    "venu_owners",
    "cheerleader",
    "scorer",
    "nutritionist",
    "physiotherapist",
  ];
  const hasExistingRole =
    isLoggedIn &&
    (user?.ownerProfile ||
      professionalRoles.includes(user?.role?.toLowerCase()));
  const hasPendingApplication =
    isLoggedIn && user?.applicationStatus === "pending";

  const getDashboardPath = () => {
    const role = user?.role?.toLowerCase();
    if (role === "venue_owner" || role === "venu_owners" || user?.ownerProfile)
      return "/venue-owner";
    if (["coach", "umpire", "streamer", "commentator", "scorer", "cheerleader", "nutritionist", "physiotherapist"].includes(role))
      return `/professional/${role}`;
    return "/";
  };

  const toggleRole = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles([roleId]);
    }
  };

  const handleRoleContinue = () => {
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }
    if (!isLoggedIn) {
      toast.error("Please login to apply as a professional.");
      return;
    }
    if (
      user?.ownerProfile ||
      ["coach", "umpire", "streamer", "commentator", "venue_owner", "scorer", "cheerleader", "nutritionist", "physiotherapist"].includes(
        user?.role?.toLowerCase()
      )
    ) {
      toast.error(`You already have a professional role (${user?.role}).`);
      return;
    }
    setModalStep(2);
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!aadharFront || !aadharBack || !panFront) {
      toast.error(
        "Please upload front and back of Aadhaar, and PAN card."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      data.append("name", user?.name || "");
      data.append("email", user?.email || "");
      data.append("phone", user?.phone || "");
      data.append("role", selectedRoles[0]);

      data.append("documents", aadharFront, `aadhar_front_${aadharFront.name}`);
      data.append("documents", aadharBack, `aadhar_back_${aadharBack.name}`);
      data.append("documents", panFront, `pan_front_${panFront.name}`);
      if (panBack) {
        data.append("documents", panBack, `pan_back_${panBack.name}`);
      }

      const response = await axiosInstance.post(
        "/api/user/auth/upgrade-request",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        toast.success("Application submitted successfully!");
        setModalStep(0);
        setSelectedRoles([]);
        setAadharFront(null);
        setAadharBack(null);
        setPanFront(null);
        setPanBack(null);
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to submit application"
      );
      if (
        err.response?.data?.message?.includes(
          "already have a pending application"
        ) ||
        err.response?.data?.message?.includes("already has a professional role")
      ) {
        setModalStep(0);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAadharFrontUpload = (e) => {
    const file = e.target.files[0];
    if (file) setAadharFront(file);
    e.target.value = null;
  };

  const handleAadharBackUpload = (e) => {
    const file = e.target.files[0];
    if (file) setAadharBack(file);
    e.target.value = null;
  };

  const handlePanFrontUpload = (e) => {
    const file = e.target.files[0];
    if (file) setPanFront(file);
    e.target.value = null;
  };

  return (
    <div
      className="relative min-h-screen text-white pt-4 pb-20 overflow-hidden"
      style={{ backgroundColor: "#000" }}
    >
      <ScrollToTop />

      {/* ── Gradient Definition for Icons ── */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <linearGradient
            id="primaryGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BG})` }}
      />
      {/* ── Dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.70) 40%, rgba(0,0,0,0.90) 100%)",
        }}
      />
      {/* ── Accent dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${GRADIENT_START} 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />
      {/* ── Glow blob */}
      <div
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(85,222,232,0.12) 0%, transparent 70%)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* ── Hero Section ── */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center min-h-[70vh] md:min-h-[80vh] py-10 md:py-0">
          <div className="text-center md:text-left">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] border text-[10px] md:text-xs font-semibold mb-4 md:mb-6 uppercase tracking-widest"
              style={{
                background: "rgba(85,222,232,0.08)",
                borderColor: "rgba(85,222,232,0.25)",
              }}
            >
              <span
                style={{
                  background: GRADIENT,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Inter'",
                }}
              >
                Unified Professionals
              </span>
            </div>
            <h1
              className="text-[48px] md:text-[72px] leading-[1.1] uppercase mb-6 font-bold text-white"
              style={{ fontFamily: "'Open Sans'" }}
            >
              Build Your <br />
              <span
                style={{
                  background: GRADIENT,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Legacy.
              </span>
            </h1>
            <p
              className="text-gray-400 mb-6 max-w-lg mx-auto md:mx-0 leading-relaxed text-sm md:text-base"
              style={{
                fontFamily: "'Inter 28pt Light', sans-serif",
                fontWeight: 300,
              }}
            >
              Take your professional career to the next level. Kridaz provides
              the digital infrastructure to manage your clients, schedule
              sessions, and grow your brand as a Coach, Umpire, Scorer, or
              Streamer.
            </p>
            {hasExistingRole ? (
              <div className="w-full max-w-md">
                <div className="w-full bg-white/5 border border-primary/20 backdrop-blur-sm rounded-[10px] p-5 md:p-6 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="text-white font-black uppercase tracking-wider text-sm md:text-base">
                      Already a Professional
                    </span>
                  </div>
                  <p className="text-white/60 text-xs mb-3 leading-relaxed">
                    You already have an active role as{" "}
                    <span className="text-primary font-bold">
                      {user?.role}
                    </span>
                    .
                  </p>
                  <Button
                    onClick={() => navigate(getDashboardPath())}
                    className="bg-primary text-black font-black uppercase tracking-widest rounded-[8px] hover:brightness-110 transition-all flex items-center justify-center gap-2 mx-auto md:mx-0 px-6 py-2.5 text-xs md:text-sm"
                  >
                    Go to Dashboard <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            ) : hasPendingApplication ? (
              <div className="w-full max-w-md">
                <div className="w-full bg-white/5 border border-amber-500/20 backdrop-blur-sm rounded-[10px] p-5 md:p-6 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span className="text-white font-black uppercase tracking-wider text-sm md:text-base">
                      Application Pending
                    </span>
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed">
                    You have applied for{" "}
                    <span className="text-amber-400 font-bold">
                      {user?.applicationRole || "a professional role"}
                    </span>
                    . We are verifying your application. You will be notified
                    once approved.
                  </p>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setModalStep(1)}
                className="inline-flex items-center gap-3 font-bold text-black rounded-[6px] px-8 py-4 hover:brightness-110 transition-all uppercase tracking-widest text-sm md:text-base"
                style={{ background: GRADIENT }}
              >
                Join as a Professional <ArrowRight size={20} />
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 md:p-6 rounded-[8px] md:rounded-[8px] border border-white/10 backdrop-blur-sm"
                style={{ background: "rgba(10,10,10,0.75)" }}
              >
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-[8px] flex items-center justify-center shrink-0 border relative"
                  style={{
                    borderColor: "rgba(85,222,232,0.2)",
                    backgroundColor: "rgba(85,222,232,0.08)",
                  }}
                >
                  <b.icon
                    size={20}
                    className="md:w-6 md:h-6"
                    stroke="url(#primaryGradient)"
                  />
                </div>
                <div>
                  <h3
                    className="text-xl md:text-2xl uppercase mb-1 md:mb-2 font-bold text-white"
                    style={{ fontFamily: "'Open Sans'" }}
                  >
                    {b.title}
                  </h3>
                  <p
                    className="text-gray-400 leading-relaxed text-sm md:text-base"
                    style={{ fontFamily: "'Inter'" }}
                  >
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── How It Works ── */}
        <div className="mt-20 md:mt-32 text-center">
          <h2
            className="text-3xl md:text-5xl font-black text-white mb-10 md:mb-12 uppercase tracking-tight"
            style={{ fontFamily: "'Open Sans'" }}
          >
            How to Scale Your Profession
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Users,
                title: "Setup Profile",
                desc: "List your sports, define your skills, and set your fee structure.",
              },
              {
                icon: Target,
                title: "Manage Bookings",
                desc: "Digital calendar, match reports, and client communication tools.",
              },
              {
                icon: CheckCircle,
                title: "Automate Billing",
                desc: "Automatic invoices and payment reminders so you can focus on the game.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="p-6 md:p-8 bg-white/5 backdrop-blur-sm rounded-[8px] md:rounded-[8px] border border-white/10 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 md:mb-6 rounded-[8px] md:rounded-[8px] bg-white/10 group-hover:bg-primary/20 transition-colors">
                  <step.icon
                    className="w-6 h-6 md:w-7 md:h-7 text-white transition-colors"
                    stroke="currentColor"
                  />
                </div>
                <h3
                  className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 uppercase tracking-wider"
                  style={{ fontFamily: "'Open Sans'" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-gray-400 text-sm md:text-base leading-relaxed"
                  style={{ fontFamily: "'Inter'" }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Testimonials ── */}
        <div className="mt-20 md:mt-32 max-w-4xl mx-auto">
          <h2
            className="text-3xl md:text-5xl font-black text-white text-center mb-10 md:mb-16 uppercase tracking-tight"
            style={{ fontFamily: "'Open Sans'" }}
          >
            Professional Spotlight
          </h2>
          <div className="grid gap-6 md:gap-8">
            {[
              {
                text: "“Managing 100+ clients across multiple sports was a nightmare. Kridaz simplified my administrative work by 80%.”",
                name: "Coach Arjun",
                role: "National Cricket Academy",
                icon: Trophy,
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-6 md:p-10 bg-white/5 backdrop-blur-md rounded-[8px] md:rounded-[8px] border border-white/10 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <t.icon size={60} className="md:w-20 md:h-20" />
                </div>
                <p
                  className="text-gray-200 font-medium relative z-10 leading-relaxed mb-6 md:mb-8 text-sm md:text-base"
                  style={{ fontFamily: "'Inter'" }}
                >
                  {t.text}
                </p>
                <div className="flex items-center gap-4 relative z-10">
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full border"
                    style={{
                      backgroundColor: "rgba(85,222,232,0.2)",
                      borderColor: "rgba(85,222,232,0.4)",
                    }}
                  />
                  <div>
                    <div
                      className="text-white font-bold uppercase tracking-wider"
                      style={{ fontFamily: "'Open Sans'" }}
                    >
                      {t.name}
                    </div>
                    <div
                      className="font-semibold text-sm md:text-base"
                      style={{
                        background: GRADIENT,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontFamily: "'Inter'",
                      }}
                    >
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modalStep === 1 && (
        <div className="fixed inset-0 z-[100] bg-card flex flex-col p-6 animate-fadeInUp overflow-y-auto no-scrollbar">
          <div className="w-full max-w-lg mx-auto relative flex-1 flex flex-col pt-4 pb-8 justify-center">
            {user?.ownerProfile ||
            [
              "coach",
              "umpire",
              "streamer",
              "commentator",
              "venue_owner",
              "scorer",
              "cheerleader",
              "nutritionist",
              "physiotherapist",
            ].includes(user?.role?.toLowerCase()) ? (
              <div className="text-center py-6 mt-4">
                <div
                  className="w-14 h-14 rounded-full border flex items-center justify-center mx-auto mb-4"
                  style={{
                    borderColor: "rgba(191,243,103,0.3)",
                    backgroundColor: "rgba(191,243,103,0.1)",
                  }}
                >
                  <CheckCircle size={28} className="text-primary" />
                </div>
                <h2
                  className="text-lg font-bold mb-3 tracking-wider text-white normal-case"
                  style={{ fontFamily: "'Open Sans'" }}
                >
                  Already a Professional
                </h2>
                <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                  You already have an active professional role ({user?.role}).
                  You can manage your professional profile from your dashboard.
                </p>
                <Button
                  onClick={() => {
                    setModalStep(0);
                    navigate(getDashboardPath());
                  }}
                  className="w-full py-3 rounded-[10px] font-bold text-black uppercase tracking-widest hover:brightness-110 transition-all text-sm"
                  style={{ background: GRADIENT, fontFamily: "'Inter'" }}
                >
                  Go to Dashboard{" "}
                  <ArrowRight size={18} className="inline ml-2" />
                </Button>
              </div>
            ) : user?.applicationStatus === "pending" ? (
              <div className="text-center py-6 mt-4">
                <div
                  className="w-14 h-14 rounded-full border flex items-center justify-center mx-auto mb-4"
                  style={{
                    borderColor: "rgba(85,222,232,0.3)",
                    backgroundColor: "rgba(85,222,232,0.1)",
                  }}
                >
                  <Loader2 size={28} className="text-primary animate-spin" />
                </div>
                <h2
                  className="text-lg font-bold mb-3 tracking-wider text-white normal-case"
                  style={{ fontFamily: "'Open Sans'" }}
                >
                  Application Pending
                </h2>
                <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                  You have applied for{" "}
                  <span className="text-primary font-bold">
                    {user?.applicationRole || "a professional role"}
                  </span>
                  . Please wait for our team to review it. We will notify you
                  once a decision is made.
                </p>
                <Button
                  onClick={() => setModalStep(0)}
                  className="w-full py-3 rounded-[10px] font-bold text-black uppercase tracking-widest hover:brightness-110 transition-all text-sm"
                  style={{ background: GRADIENT, fontFamily: "'Inter'" }}
                >
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-start mb-6 -ml-2 gap-1.5">
                  <Button
                    onClick={() => setModalStep(0)}
                    className="text-gray-400 hover:text-white transition-colors p-1 mt-0.5"
                  >
                    <ChevronLeft size={28} />
                  </Button>
                  <div className="flex flex-col text-left">
                    <h2
                      className="text-xl font-bold text-white tracking-normal normal-case mb-1"
                      style={{ fontFamily: "'Open Sans'" }}
                    >
                      Select your role
                    </h2>
                    <p className="text-gray-400 text-xs">
                      Please select your primary profession.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  {availableRoles.map((role) => {
                    const isSelected = selectedRoles.includes(role.id);
                    return (
                      <Button
                        key={role.id}
                        onClick={() => toggleRole(role.id)}
                        className={`flex flex-col items-center justify-center p-3.5 border rounded-[10px] transition-all ${isSelected ? "border-primary bg-primary/10 text-white shadow-[0_0_15px_rgba(191,243,103,0.15)]" : "border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:bg-white/10"}`}
                      >
                        <role.icon
                          size={24}
                          className={`mb-2 ${isSelected ? "text-primary" : ""}`}
                        />
                        <span className="font-bold uppercase tracking-wider text-[10px]">
                          {role.label}
                        </span>
                      </Button>
                    );
                  })}
                </div>

                <Button
                  onClick={handleRoleContinue}
                  className="w-full py-3.5 rounded-[10px] font-bold text-black uppercase tracking-widest hover:brightness-110 transition-all text-sm"
                  style={{ background: GRADIENT, fontFamily: "'Inter'" }}
                >
                  Continue <ArrowRight size={18} className="inline ml-2" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {modalStep === 2 && (
        <div className="fixed inset-0 z-[100] bg-card flex flex-col p-6 animate-fadeInUp overflow-y-auto no-scrollbar">
          <div className="w-full max-w-lg mx-auto relative flex-1 flex flex-col pt-12 pb-8 justify-center">
            <Button
              onClick={() => setModalStep(1)}
              className="absolute top-2 left-0 text-gray-400 hover:text-white transition-colors flex items-center"
            >
              <ChevronLeft size={32} />
            </Button>
            <h2
              className="text-3xl font-bold mb-8 text-white text-center"
              style={{ fontFamily: "'Open Sans'" }}
            >
              Document Verification
            </h2>

            <form className="space-y-6 mt-4" onSubmit={handleDocumentSubmit}>
              <div className="grid grid-cols-2 gap-4 md:gap-6 mt-4">
                {/* Aadhaar Front Box */}
                <label
                  className={`flex flex-col items-center gap-3 md:gap-4 cursor-pointer group ${aadharFront ? "opacity-80" : ""}`}
                >
                  <span
                    className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base leading-tight"
                    style={{ fontFamily: "'Inter'" }}
                  >
                    AADHAAR CARD <br /> FRONT
                  </span>
                  <div
                    className={`relative w-full h-[110px] md:h-[130px] bg-[#E8E8E8] rounded-[10px] overflow-hidden shadow-inner flex flex-col justify-between transition-all ${aadharFront ? "ring-2 ring-primary" : "group-hover:ring-2 group-hover:ring-primary"}`}
                  >
                    {aadharFront ? (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                        <FileCheck className="text-primary mb-2" size={32} />
                        <span
                          className="text-white font-bold tracking-wider uppercase text-center text-xs"
                          style={{ fontFamily: "'Inter'" }}
                        >
                          Uploaded
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <span
                          className="text-white font-bold tracking-wider uppercase text-center text-[10px] md:text-xs"
                          style={{ fontFamily: "'Inter'" }}
                        >
                          Upload Front
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-start opacity-60">
                      <Landmark className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                      <div className="space-y-1 md:space-y-1.5 flex flex-col items-end mt-0.5">
                        <div className="w-12 md:w-20 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                        <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex gap-2 md:gap-3 mt-1 opacity-60">
                      <div className="w-10 h-12 md:w-12 md:h-14 bg-gray-400/30 rounded-[8px] overflow-hidden flex items-end justify-center border border-gray-400/20">
                        <User className="w-8 h-8 md:w-10 md:h-10 text-gray-600 -mb-1.5" fill="currentColor" />
                      </div>
                      <div className="flex-1 space-y-2 md:space-y-2.5 mt-0.5 md:mt-1">
                        <div className="w-full h-2 md:h-2.5 bg-gray-500 rounded-full"></div>
                        <div className="w-5/6 h-2 md:h-2.5 bg-gray-500 rounded-full"></div>
                        <div className="w-4/6 h-2 md:h-2.5 bg-gray-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAadharFrontUpload}
                  />
                </label>

                {/* Aadhaar Back Box */}
                <label
                  className={`flex flex-col items-center gap-3 md:gap-4 cursor-pointer group ${aadharBack ? "opacity-80" : ""}`}
                >
                  <span
                    className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base leading-tight"
                    style={{ fontFamily: "'Inter'" }}
                  >
                    AADHAAR CARD <br /> BACK
                  </span>
                  <div
                    className={`relative w-full h-[110px] md:h-[130px] bg-[#E8E8E8] rounded-[10px] overflow-hidden shadow-inner flex flex-col justify-between transition-all ${aadharBack ? "ring-2 ring-primary" : "group-hover:ring-2 group-hover:ring-primary"}`}
                  >
                    {aadharBack ? (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                        <FileCheck className="text-primary mb-2" size={32} />
                        <span
                          className="text-white font-bold tracking-wider uppercase text-center text-xs"
                          style={{ fontFamily: "'Inter'" }}
                        >
                          Uploaded
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <span
                          className="text-white font-bold tracking-wider uppercase text-center text-[10px] md:text-xs"
                          style={{ fontFamily: "'Inter'" }}
                        >
                          Upload Back
                        </span>
                      </div>
                    )}
                    {/* Abstract Back ID UI */}
                    <div className="w-full h-4 bg-gray-400 mt-2"></div>
                    <div className="p-2 space-y-1.5 opacity-60">
                      <div className="w-full h-1.5 bg-gray-500 rounded-full"></div>
                      <div className="w-4/5 h-1.5 bg-gray-500 rounded-full"></div>
                      <div className="w-3/4 h-1.5 bg-gray-500 rounded-full"></div>
                    </div>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAadharBackUpload}
                  />
                </label>

                {/* PAN Upload Box */}
                <label
                  className={`col-span-2 w-full max-w-xs mx-auto flex flex-col items-center gap-3 md:gap-4 cursor-pointer group ${panFront ? "opacity-80" : ""}`}
                >
                  <span
                    className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base"
                    style={{ fontFamily: "'Inter'" }}
                  >
                    PAN CARD
                  </span>
                  <div
                    className={`relative w-full h-[110px] md:h-[130px] bg-[#D9D9D9] rounded-[10px] overflow-hidden shadow-inner flex flex-col justify-between transition-all ${panFront ? "ring-2 ring-primary" : "group-hover:ring-2 group-hover:ring-primary"}`}
                  >
                    {panFront ? (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                        <FileCheck className="text-primary mb-2" size={32} />
                        <span
                          className="text-white font-bold tracking-wider uppercase text-center text-xs"
                          style={{ fontFamily: "'Inter'" }}
                        >
                          Uploaded
                        </span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <span
                          className="text-white font-bold tracking-wider uppercase text-center text-[10px] md:text-xs"
                          style={{ fontFamily: "'Inter'" }}
                        >
                          Upload Photo
                        </span>
                      </div>
                    )}
                    <div className="w-full h-5 md:h-6 bg-gray-400/60 flex justify-between items-center px-2 md:px-3 opacity-60 shrink-0">
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-600 rounded-sm"></div>
                      <div className="w-12 md:w-20 h-1.5 md:h-2 bg-gray-600 rounded-full"></div>
                    </div>
                    <div className="p-2 md:p-3 flex-1 flex flex-col justify-between opacity-60">
                      <div className="flex gap-1.5 md:gap-2">
                        <div className="flex-1 space-y-1.5 md:space-y-2 mt-0.5">
                          <div className="flex gap-1">
                            <div className="w-6 md:w-10 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                            <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-10 md:w-16 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                            <div className="w-4 md:w-8 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                          </div>
                          <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                        </div>
                        <div className="w-10 md:w-14 space-y-1 md:space-y-1.5 mt-0.5">
                          <div className="w-full h-1 md:h-1.5 bg-gray-500 rounded-full"></div>
                          <div className="w-3/4 h-1 md:h-1.5 bg-gray-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-gray-600 font-bold tracking-widest font-mono text-[8px] md:text-[10px]">
                          ABCDE1234F
                        </span>
                        <QrCode className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
                      </div>
                    </div>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePanFrontUpload}
                  />
                </label>
              </div>

              <div className="flex justify-center mt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full max-w-[240px] py-3 rounded-[10px] font-bold text-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  style={{ background: GRADIENT, fontFamily: "'Inter'" }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" /> Submitting
                    </>
                  ) : (
                    "Submit & Register"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
