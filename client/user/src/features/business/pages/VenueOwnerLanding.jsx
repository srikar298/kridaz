import { useState, useEffect } from "react";
import {
  CheckCircle,
  BarChart3,
  CalendarDays,
  Zap,
  Play,
  X,
  FileCheck,
  Landmark,
  User,
  QrCode,
  Loader2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../../../redux/slices/authSlice";
import axiosInstance from "@hooks/useAxiosInstance.js";
import toast from "react-hot-toast";
import ScrollToTop from "@components/common/ScrollToTop";
import streamlinedDesktop from "../../../assets/streamlined-desktop.png";
import streamlinedMobile from "../../../assets/streamlined-mobile.png";
import insightsDesktop from "../../../assets/insights-desktop.png";
import insightsMobile from "../../../assets/insights-mobile.png";
import financesDesktop from "../../../assets/finances-desktop.png";
import financesMobile from "../../../assets/finances-mobile.png";
import reachDesktop from "../../../assets/reach-desktop.png";
import reachMobile from "../../../assets/reach-mobile.png";import { Button, Input } from "@kridaz/ui";


const GRADIENT = "linear-gradient(90deg, var(--primary) 0%, var(--primary) 100%)";

const benefits = [
  {
    icon: CalendarDays,
    title: "Automated Bookings",
    desc: "No more phone calls. Let players book your turf 24/7.",
  },
  {
    icon: BarChart3,
    title: "Revenue Tracking",
    desc: "Real-time insights into your earnings, peak hours, and customer retention metrics.",
  },
  {
    icon: CheckCircle,
    title: "Seamless Management",
    desc: "Block maintenance hours, set dynamic pricing, and manage your team with ease.",
  },
];

export default function VenueOwnerLanding() {
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [activeTab, setActiveTab] = useState("aadhaar"); // aadhaar | pan
  const [aadharFront, setAadharFront] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [panFront, setPanFront] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptimisticallyPending, setIsOptimisticallyPending] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isLoggedIn } = useSelector((state) => state.auth);

  // Auto switch tab to PAN once both Aadhaar parts are uploaded
  useEffect(() => {
    if (aadharFront && aadharBack) {
      setActiveTab("pan");
    }
  }, [aadharFront, aadharBack]);

  const handleRegisterClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to register your venue.");
      navigate("/login?redirect=/business/venue");
      return;
    }
    setActiveTab("aadhaar");
    setShowDocumentModal(true);
  };

  // Compute user registration status
  const professionalRoles = [
    "coach",
    "umpire",
    "streamer",
    "commentator",
    "venue_owner",
    "venu_owners",
  ];
  const hasExistingRole =
    isLoggedIn &&
    (user?.ownerProfile ||
      professionalRoles.includes(user?.role?.toLowerCase()));
  const hasPendingApplication =
    isLoggedIn &&
    (user?.applicationStatus === "pending" || isOptimisticallyPending);

  const getDashboardPath = () => {
    const role = user?.role?.toLowerCase();
    if (role === "venue_owner" || role === "venu_owners" || user?.ownerProfile)
      return "/venue-owner";
    if (["coach", "umpire", "streamer", "commentator", "scorer"].includes(role))
      return `/professional/${role}`;
    return "/";
  };

  // Renders the appropriate CTA based on user status
  const renderActionButton = (size = "normal") => {
    const isHero = size === "hero";

    if (hasExistingRole) {
      return (
        <div
          className={`flex flex-col items-center gap-3 ${isHero ? "w-full max-w-md" : "w-full max-w-sm"}`}
        >
          <div
            className={`w-full bg-white/5 border border-primary/20 backdrop-blur-sm rounded-[10px] ${isHero ? "p-4 md:p-5" : "p-3 md:p-4"} text-center`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span
                className={`text-white font-black uppercase tracking-wider ${isHero ? "text-sm md:text-base" : "text-xs md:text-sm"}`}
              >
                Already a Professional
              </span>
            </div>
            <p className="text-white/60 text-[10px] md:text-xs mb-3 leading-relaxed">
              You already have an active role as{" "}
              <span className="text-primary font-bold">{user?.role}</span>.
            </p>
            <Button
              onClick={() => navigate(getDashboardPath())}
              className={`bg-primary text-black font-black uppercase tracking-widest rounded-[8px] hover:brightness-110 transition-all flex items-center justify-center gap-2 mx-auto ${isHero ? "px-6 py-2.5 text-xs md:text-sm" : "px-5 py-2 text-[10px] md:text-xs"}`}
            >
              Go to Dashboard <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      );
    }

    if (hasPendingApplication) {
      return (
        <div
          className={`flex flex-col items-center gap-3 ${isHero ? "w-full max-w-md" : "w-full max-w-sm"}`}
        >
          <div
            className={`w-full bg-white/5 border border-amber-500/20 backdrop-blur-sm rounded-[10px] ${isHero ? "p-4 md:p-5" : "p-3 md:p-4"} text-center`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <span
                className={`text-white font-black uppercase tracking-wider ${isHero ? "text-sm md:text-base" : "text-xs md:text-sm"}`}
              >
                Application Pending
              </span>
            </div>
            <p className="text-white/60 text-[10px] md:text-xs leading-relaxed">
              You have applied for{" "}
              <span className="text-amber-400 font-bold">
                {user?.applicationRole || "Venue Owner"}
              </span>
              . We are verifying your application. You will be notified once
              approved.
            </p>
          </div>
        </div>
      );
    }

    return (
      <Button
        onClick={handleRegisterClick}
        className={`text-center bg-primary text-black font-black rounded-[8px] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(191,243,103,0.25)] whitespace-nowrap ${isHero ? "px-6 py-3 md:px-8 md:py-3.5 text-[11px] sm:text-sm md:text-base" : "px-6 py-3 md:px-8 md:py-3.5 text-[11px] md:text-sm"}`}
      >
        Register Your Venue
      </Button>
    );
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!aadharFront || !aadharBack || !panFront) {
      toast.error(
        "Please upload front and back of Aadhaar and front of PAN card."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Optimistically show pending message instantly
      setIsOptimisticallyPending(true);
      setShowDocumentModal(false);

      const data = new FormData();
      data.append("name", user?.name || "");
      data.append("email", user?.email || "");
      data.append("phone", user?.phone || "");
      data.append("role", "venu_owners");

      data.append("documents", aadharFront);
      data.append("documents", aadharBack);
      data.append("documents", panFront);

      const response = await axiosInstance.post(
        "/api/user/auth/upgrade-request",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        toast.success("Application submitted successfully!");
        dispatch(
          updateUser({
            applicationStatus: "pending",
            applicationRole: "venu_owners",
          })
        );

        setAadharFront(null);
        setAadharBack(null);
        setPanFront(null);
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to submit application"
      );

      // Revert optimistic update on failure
      setIsOptimisticallyPending(false);
      setShowDocumentModal(true);

      if (
        err.response?.data?.message?.includes(
          "already have a pending application"
        ) ||
        err.response?.data?.message?.includes("already has a professional role")
      ) {
        setShowDocumentModal(false);
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
    <div className="relative min-h-screen text-white bg-[#121414] font-sans overflow-x-clip pb-20 lg:pb-0">
      <ScrollToTop />

      {/* ── Hero Section ── */}
      <section className="relative w-full min-h-[100vh] flex flex-col justify-start md:justify-center pt-0 md:pt-8 pb-16 md:pb-24 overflow-hidden bg-background">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/venue-hero-desktop.png"
            alt="Hero Background Desktop"
            className="hidden md:block w-full h-full object-cover object-center opacity-100"
          />
          <img
            src="/venue-hero-mobile.png"
            alt="Hero Background Mobile"
            className="block md:hidden w-full h-full object-cover object-top opacity-100"
          />
        </div>

        <div className="w-full px-4 md:px-8 lg:px-12 relative z-10 mt-0">
          <div className="flex flex-col md:flex-row items-center w-full">
            <div className="w-full md:w-[55%] lg:w-[50%] xl:w-[45%] text-center md:text-left flex flex-col justify-center items-center md:items-start">
              <h1 className="text-[32px] md:text-[60px] lg:text-[80px] font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case text-white mb-6 md:mb-8 drop-shadow-2xl">
                Digitize Your Sports Club <br className="hidden lg:block" />
                at <span className="text-primary">0% Commission</span>
              </h1>
              <div className="flex justify-center md:justify-start w-full mt-2">
                {renderActionButton("hero")}
              </div>
            </div>
            {/* Empty space for the background mockup to show through on the right */}
            <div className="w-full md:w-[45%] lg:w-[50%] xl:w-[55%] hidden md:block"></div>
          </div>
        </div>
      </section>

      {/* ── Stacking Features Section (Full Bleed) ── */}
      <section className="relative w-full">
        {/* Feature 1 */}
        <div className="sticky top-0 w-full min-h-[100vh] bg-[#050505] flex items-center overflow-hidden z-[1] border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] rounded-t-[35px] relative">
          {/* Background Image */}
          <img
            src={streamlinedDesktop}
            alt="Streamlined Operations Desktop"
            className="hidden lg:block absolute inset-0 w-full h-full object-cover z-0"
          />
          <img
            src={streamlinedMobile}
            alt="Streamlined Operations Mobile"
            className="block lg:hidden absolute inset-0 w-full h-full object-cover z-0"
          />

          {/* Text Content */}
          <div className="relative z-10 w-full p-6 md:p-16 lg:p-24 flex flex-col justify-start lg:justify-center items-center lg:items-start text-center lg:text-left space-y-4 md:space-y-6 mt-[-40vh] lg:mt-0">
            <h2 className="text-[28px] md:text-4xl font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case text-white">
              Streamlined Operations
            </h2>
            <p className="text-white/60 text-[13px] md:text-lg lg:text-xl leading-relaxed max-w-xl">
              Take complete control with intuitive slot bookings and centralized
              staff management.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="sticky top-0 w-full min-h-[100vh] bg-[#080808] flex items-center overflow-hidden z-[2] border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] rounded-t-[35px] relative">
          <img
            src={insightsDesktop}
            alt="Actionable Insights Desktop"
            className="hidden lg:block absolute inset-0 w-full h-full object-cover z-0"
          />
          <img
            src={insightsMobile}
            alt="Actionable Insights Mobile"
            className="block lg:hidden absolute inset-0 w-full h-full object-cover z-0"
          />

          <div className="relative z-10 w-full p-6 md:p-16 lg:p-24 flex flex-col justify-start lg:justify-center items-center lg:items-end text-center lg:text-right space-y-4 md:space-y-6 mt-[-40vh] lg:mt-0">
            <h2 className="text-[28px] md:text-4xl font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case text-white">
              Actionable Insights
            </h2>
            <p className="text-white/60 text-[13px] md:text-lg lg:text-xl leading-relaxed max-w-xl">
              Leverage real-time data to track booking patterns, analyze
              engagement, and visualize revenue.
            </p>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="sticky top-0 w-full min-h-[100vh] bg-background flex items-center overflow-hidden z-[3] border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] rounded-t-[35px] relative">
          <img
            src={financesDesktop}
            alt="Automated Finances Desktop"
            className="hidden lg:block absolute inset-0 w-full h-full object-cover z-0"
          />
          <img
            src={financesMobile}
            alt="Automated Finances Mobile"
            className="block lg:hidden absolute inset-0 w-full h-full object-cover z-0"
          />

          <div className="relative z-10 w-full p-6 md:p-16 lg:p-24 flex flex-col justify-start lg:justify-center items-center lg:items-start text-center lg:text-left space-y-4 md:space-y-6 mt-[-40vh] lg:mt-0">
            <h2 className="text-[28px] md:text-4xl font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case text-white">
              Automated Finances
            </h2>
            <p className="text-white/60 text-[13px] md:text-lg lg:text-xl leading-relaxed max-w-xl">
              Automate invoicing, track payments, and instantly export
              comprehensive financial reports.
            </p>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="sticky top-0 w-full min-h-[100vh] bg-background flex items-center overflow-hidden z-[4] border-t border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] rounded-t-[35px] relative">
          <img
            src={reachDesktop}
            alt="Expand Your Reach Desktop"
            className="hidden lg:block absolute inset-0 w-full h-full object-cover z-0"
          />
          <img
            src={reachMobile}
            alt="Expand Your Reach Mobile"
            className="block lg:hidden absolute inset-0 w-full h-full object-cover z-0"
          />

          <div className="relative z-10 w-full p-6 md:p-16 lg:p-24 flex flex-col justify-start lg:justify-center items-center lg:items-end text-center lg:text-right space-y-4 md:space-y-6 mt-[-40vh] lg:mt-0">
            <h2 className="text-[28px] md:text-4xl font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case text-white">
              Expand Your Reach
            </h2>
            <p className="text-white/60 text-[13px] md:text-lg lg:text-xl leading-relaxed max-w-xl">
              Instantly showcase your courts to a hyper-engaged local community
              actively searching for games.
            </p>
          </div>
        </div>
      </section>

      {/* ── Empower Your Business Grid ── */}
      <section className="py-16 md:py-24 bg-background border-t border-white/5">
        <div className="w-full px-2 md:px-4 lg:px-8">
          <h2 className="text-[20px] md:text-4xl font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case text-white text-center mb-16 md:mb-20">
            Empower Your Business
            <span className="text-primary block mt-2 md:mt-4">
              with Kridaz
            </span>
          </h2>

          {/* Horizontal Slider Container */}
          <div className="flex overflow-x-auto gap-6 pb-12 snap-x scrollbar-hide -mx-4 px-4 md:-mx-8 md:px-8">
            {/* Card 1 */}
            <div className="flex-none w-[280px] md:w-[350px] h-[450px] rounded-[24px] overflow-hidden flex flex-col group snap-center cursor-pointer border border-white/10 hover:border-primary/30 transition-colors">
              <div className="flex-1 bg-card p-8 flex flex-col justify-between relative">
                <div>
                  <span className="text-primary text-[10px] font-bold tracking-widest uppercase mb-4 block">
                    FINANCE
                  </span>
                  <h3 className="text-white text-2xl md:text-3xl font-poppins font-medium leading-[1.2]">
                    Zero-Commission Bookings
                  </h3>
                  <p className="text-white/50 text-sm mt-4 font-sans leading-relaxed">
                    Keep 100% of your earnings. We never take a cut from your
                    facility bookings.
                  </p>
                </div>
              </div>
              <div className="h-[80px] w-full bg-[#050505] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=500&q=80"
                  alt="Finance"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70"
                />
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex-none w-[280px] md:w-[350px] h-[450px] rounded-[24px] overflow-hidden flex flex-col group snap-center cursor-pointer border border-white/10 hover:border-primary/30 transition-colors">
              <div className="flex-1 bg-card p-8 flex flex-col justify-between relative">
                <div>
                  <span className="text-primary text-[10px] font-bold tracking-widest uppercase mb-4 block">
                    OPERATIONS
                  </span>
                  <h3 className="text-white text-2xl md:text-3xl font-poppins font-medium leading-[1.2]">
                    Dynamic Pricing
                  </h3>
                  <p className="text-white/50 text-sm mt-4 font-sans leading-relaxed">
                    Automatically adjust rates for peak hours, weekends, or
                    special local events.
                  </p>
                </div>
              </div>
              <div className="h-[80px] w-full bg-[#050505] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=500&q=80"
                  alt="Pricing"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70"
                />
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex-none w-[280px] md:w-[350px] h-[450px] rounded-[24px] overflow-hidden flex flex-col group snap-center cursor-pointer border border-white/10 hover:border-primary/30 transition-colors">
              <div className="flex-1 bg-card p-8 flex flex-col justify-between relative">
                <div>
                  <span className="text-primary text-[10px] font-bold tracking-widest uppercase mb-4 block">
                    MANAGEMENT
                  </span>
                  <h3 className="text-white text-2xl md:text-3xl font-poppins font-medium leading-[1.2]">
                    Staff Roles & Access
                  </h3>
                  <p className="text-white/50 text-sm mt-4 font-sans leading-relaxed">
                    Grant specific dashboard permissions to managers, accounts,
                    and enue staff.
                  </p>
                </div>
              </div>
              <div className="h-[80px] w-full bg-[#050505] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=500&q=80"
                  alt="Management"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70"
                />
              </div>
            </div>

            {/* Card 4 */}
            <div className="flex-none w-[280px] md:w-[350px] h-[450px] rounded-[24px] overflow-hidden flex flex-col group snap-center cursor-pointer border border-white/10 hover:border-primary/30 transition-colors">
              <div className="flex-1 bg-card p-8 flex flex-col justify-between relative">
                <div>
                  <span className="text-primary text-[10px] font-bold tracking-widest uppercase mb-4 block">
                    TECHNOLOGY
                  </span>
                  <h3 className="text-white text-2xl md:text-3xl font-poppins font-medium leading-[1.2]">
                    Live Syncing
                  </h3>
                  <p className="text-white/50 text-sm mt-4 font-sans leading-relaxed">
                    Prevent double-bookings with instant, real-time availability
                    updates.
                  </p>
                </div>
              </div>
              <div className="h-[80px] w-full bg-[#050505] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&w=500&q=80"
                  alt="Tech"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70"
                />
              </div>
            </div>

            {/* Card 5 */}
            <div className="flex-none w-[280px] md:w-[350px] h-[450px] rounded-[24px] overflow-hidden flex flex-col group snap-center cursor-pointer border border-white/10 hover:border-primary/30 transition-colors">
              <div className="flex-1 bg-card p-8 flex flex-col justify-between relative">
                <div>
                  <span className="text-primary text-[10px] font-bold tracking-widest uppercase mb-4 block">
                    PAYMENTS
                  </span>
                  <h3 className="text-white text-2xl md:text-3xl font-poppins font-medium leading-[1.2]">
                    Instant Payouts
                  </h3>
                  <p className="text-white/50 text-sm mt-4 font-sans leading-relaxed">
                    Get your earnings transferred directly to your bank account
                    instantly.
                  </p>
                </div>
              </div>
              <div className="h-[80px] w-full bg-[#050505] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?auto=format&fit=crop&w=500&q=80"
                  alt="Payments"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70"
                />
              </div>
            </div>

            {/* Card 6 */}
            <div className="flex-none w-[280px] md:w-[350px] h-[450px] rounded-[24px] overflow-hidden flex flex-col group snap-center cursor-pointer border border-white/10 hover:border-primary/30 transition-colors">
              <div className="flex-1 bg-card p-8 flex flex-col justify-between relative">
                <div>
                  <span className="text-primary text-[10px] font-bold tracking-widest uppercase mb-4 block">
                    DATA
                  </span>
                  <h3 className="text-white text-2xl md:text-3xl font-poppins font-medium leading-[1.2]">
                    Revenue Analytics
                  </h3>
                  <p className="text-white/50 text-sm mt-4 font-sans leading-relaxed">
                    Track your daily, weekly, and monthly financial growth in
                    one dashboard.
                  </p>
                </div>
              </div>
              <div className="h-[80px] w-full bg-[#050505] relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=500&q=80"
                  alt="Data"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 md:py-24 bg-[#050505]">
        <div className="w-full px-2 md:px-4 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-[20px] md:text-4xl font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case text-white">
              What Our Customers Say
            </h2>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
            {/* Card 1 */}
            <div className="bg-card p-8 rounded-2xl border border-white/5 break-inside-avoid mb-6">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-[#FBBF24]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-8">
                "We never needed to do much marketing as we started getting
                bookings from Day 1, thanks to the visibility and convenience of
                Kridaz. Their platform simplifies booking management, staff
                management, and payment collection."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://ui-avatars.com/api/?name=Imran+Patel&background=222&color=fff"
                  alt="Imran Patel"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-white font-bold text-sm">Imran Patel</p>
                  <p className="text-white/50 text-xs">
                    The Willingdon Sports Club
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-card p-8 rounded-2xl border border-white/5 break-inside-avoid mb-6">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-[#FBBF24]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-8">
                "Kridaz has been a game-changer for managing our five venues
                with multiple courts. From automating bookings to streamlining
                invoicing, accounting, and payment collection, it has simplified
                operations that would’ve required a large team otherwise."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://ui-avatars.com/api/?name=Rehan+Sumar&background=222&color=BFF367"
                  alt="Rehan Sumar"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-white font-bold text-sm">Rehan Sumar</p>
                  <p className="text-white/50 text-xs">Founder | VPadel</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-card p-8 rounded-2xl border border-white/5 break-inside-avoid mb-6">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-[#FBBF24]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-8">
                "Managing 18 facilities across with sports like Football, Box
                Cricket & Pickleball would have been overwhelming if we weren’t
                using Kridaz. Its seamless automation for bookings, lead
                generation, and payment collection has really helped to
                streamline our operations."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://ui-avatars.com/api/?name=Samir+Sahni&background=222&color=fff"
                  alt="Samir Sahni"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-white font-bold text-sm">Samir Sahni</p>
                  <p className="text-white/50 text-xs">CEO | Claygrounds</p>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-card p-8 rounded-2xl border border-white/5 break-inside-avoid mb-6 hidden md:block">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-[#FBBF24]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-8">
                "Our revenue literally doubled after we switched to Kridaz. The
                dynamic pricing alone helps us maximize court utilization on
                weekends. I can't imagine running my venue without this platform
                now."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://ui-avatars.com/api/?name=Arjun+Reddy&background=222&color=BFF367"
                  alt="Arjun Reddy"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-white font-bold text-sm">Arjun Reddy</p>
                  <p className="text-white/50 text-xs">Manager | Smash Arena</p>
                </div>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-card p-8 rounded-2xl border border-white/5 break-inside-avoid mb-6 hidden lg:block">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-[#FBBF24]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-8">
                "The live cross-platform syncing is flawless. We used to
                struggle with double bookings all the time, but now it's
                completely automated. Staff roles also make it super easy to let
                my team handle operations."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://ui-avatars.com/api/?name=Priya+Sharma&background=222&color=fff"
                  alt="Priya Sharma"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-white font-bold text-sm">Priya Sharma</p>
                  <p className="text-white/50 text-xs">
                    Director | Elite Sports
                  </p>
                </div>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-card p-8 rounded-2xl border border-white/5 break-inside-avoid mb-6 hidden lg:block">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-[#FBBF24]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-8">
                "Instant payouts mean we never have cash flow issues. The
                platform is robust, the analytics dashboard gives us exactly the
                data we need, and the support team is incredible."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://ui-avatars.com/api/?name=Karan+Mehta&background=222&color=BFF367"
                  alt="Karan Mehta"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-white font-bold text-sm">Karan Mehta</p>
                  <p className="text-white/50 text-xs">Owner | Turf City</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Document Verification Modal ── */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-[10px] p-6 md:p-8 w-full max-w-lg relative animate-fadeInUp">
            <Button
              onClick={() => setShowDocumentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </Button>
            <h2 className="text-[20px] md:text-4xl font-black tracking-tight leading-[1.05] font-poppins font-medium normal-case text-white text-center mb-8">
              Document Verification
            </h2>

            <form className="space-y-6 mt-4" onSubmit={handleDocumentSubmit}>
              {/* Custom Tabs */}
              <div className="flex bg-[#1A1D1D] rounded-lg p-1 w-full max-w-[300px] mx-auto mb-6">
                <Button
                  type="button"
                  onClick={() => setActiveTab("aadhaar")}
                  className={`flex-1 py-2 px-4 rounded-md text-xs md:text-sm font-bold tracking-widest uppercase transition-all ${
                    activeTab === "aadhaar"
                      ? "bg-primary text-black shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Aadhaar
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab("pan")}
                  className={`flex-1 py-2 px-4 rounded-md text-xs md:text-sm font-bold tracking-widest uppercase transition-all ${
                    activeTab === "pan"
                      ? "bg-primary text-black shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  PAN
                </Button>
              </div>

              {activeTab === "aadhaar" && (
                <div className="grid grid-cols-2 gap-4 md:gap-6 animate-fadeIn">
                  {/* Aadhaar FRONT Upload Box */}
                  <label
                    className={`flex flex-col items-center gap-3 md:gap-4 cursor-pointer group ${aadharFront ? "opacity-80" : ""}`}
                  >
                    <span
                      className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base"
                      style={{ fontFamily: "'Inter'" }}
                    >
                      FRONT
                    </span>
                    <div
                      className={`relative w-full h-[110px] md:h-[130px] bg-[#D9D9D9] rounded-[10px] p-2 md:p-3 overflow-hidden shadow-inner flex flex-col justify-between transition-all ${aadharFront ? "ring-2 ring-primary" : "group-hover:ring-2 group-hover:ring-primary"}`}
                    >
                      {aadharFront ? (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                          <FileCheck
                            className="text-primary mb-2"
                            size={32}
                          />
                          <span
                            className="text-white font-bold tracking-wider uppercase text-center text-xs"
                            style={{ fontFamily: "'Inter'" }}
                          >
                            Uploaded
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100`}
                        >
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
                          <User
                            className="w-8 h-8 md:w-10 md:h-10 text-gray-600 -mb-1.5"
                            fill="currentColor"
                          />
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

                  {/* Aadhaar BACK Upload Box */}
                  <label
                    className={`flex flex-col items-center gap-3 md:gap-4 cursor-pointer group ${aadharBack ? "opacity-80" : ""}`}
                  >
                    <span
                      className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base"
                      style={{ fontFamily: "'Inter'" }}
                    >
                      BACK
                    </span>
                    <div
                      className={`relative w-full h-[110px] md:h-[130px] bg-[#D9D9D9] rounded-[10px] p-2 md:p-3 overflow-hidden shadow-inner flex flex-col justify-between transition-all ${aadharBack ? "ring-2 ring-primary" : "group-hover:ring-2 group-hover:ring-primary"}`}
                    >
                      {aadharBack ? (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                          <FileCheck
                            className="text-primary mb-2"
                            size={32}
                          />
                          <span
                            className="text-white font-bold tracking-wider uppercase text-center text-xs"
                            style={{ fontFamily: "'Inter'" }}
                          >
                            Uploaded
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100`}
                        >
                          <span
                            className="text-white font-bold tracking-wider uppercase text-center text-[10px] md:text-xs"
                            style={{ fontFamily: "'Inter'" }}
                          >
                            Upload Back
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col opacity-60">
                        <div className="w-16 md:w-24 h-2 md:h-2.5 bg-gray-600 mb-2 rounded-full"></div>
                        <div className="space-y-1.5 md:space-y-2 mt-2">
                          <div className="w-full h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                          <div className="w-11/12 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                          <div className="w-5/6 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                        </div>
                        <div className="mt-auto flex justify-between items-end pb-1 pt-4">
                          <div className="w-12 h-4 md:w-16 md:h-6 bg-gray-400 rounded-sm"></div>
                          <QrCode className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
                        </div>
                      </div>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAadharBackUpload}
                    />
                  </label>
                </div>
              )}

              {activeTab === "pan" && (
                <div className="flex justify-center animate-fadeIn">
                  {/* PAN Upload Box */}
                  <label
                    className={`flex flex-col items-center gap-3 md:gap-4 cursor-pointer group w-[220px] md:w-[260px] ${panFront ? "opacity-80" : ""}`}
                  >
                    <span
                      className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base"
                      style={{ fontFamily: "'Inter'" }}
                    >
                      FRONT
                    </span>
                    <div
                      className={`relative w-full h-[130px] md:h-[150px] bg-[#D9D9D9] rounded-[10px] overflow-hidden shadow-inner flex flex-col justify-between transition-all ${panFront ? "ring-2 ring-primary" : "group-hover:ring-2 group-hover:ring-primary"}`}
                    >
                      {panFront ? (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                          <FileCheck
                            className="text-primary mb-2"
                            size={32}
                          />
                          <span
                            className="text-white font-bold tracking-wider uppercase text-center text-xs"
                            style={{ fontFamily: "'Inter'" }}
                          >
                            Uploaded
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100`}
                        >
                          <span
                            className="text-white font-bold tracking-wider uppercase text-center text-[10px] md:text-xs"
                            style={{ fontFamily: "'Inter'" }}
                          >
                            Upload Front
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
              )}

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
