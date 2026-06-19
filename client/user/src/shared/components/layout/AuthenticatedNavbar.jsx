import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  LogOut,
  Plus,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  History,
  ShieldAlert,
  ExternalLink,
  ArrowLeft,
  HelpCircle,
  Info,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout, updateUser } from "@redux/slices/authSlice.js";
import axiosInstance from "@hooks/useAxiosInstance";
import ManualBookingModal from "@features/venue-owner/ManualBookingModal";
import useNotifications from "@hooks/shared/useNotifications";
import {
  useGetDashboardStatsQuery,
  useToggleOnlineMutation,
} from "@redux/api/professionalApi";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { getDynamicProfileRoute } from "@utils/routeUtils";
import GlobalBackButton from "@/shared/components/GlobalBackButton";

/**
 * AuthenticatedNavbar Rs � Role-aware top navigation.
 * Fully rebranded for Scorer users with Teal Green (#BFF367) and Inter typography.
 */

const AuthenticatedNavbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const location = useLocation();
  const isProfessionalDashboard = location.pathname.startsWith("/professional");

  const user = useSelector((state) => state?.auth?.user);
  const role = useSelector((state) => state?.auth?.role);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#BFF367" : "#BFF367";

  const { data: statsData } = useGetDashboardStatsQuery(undefined, {
    skip: !isProfessionalDashboard,
  });
  const [toggleOnline, { isLoading: isToggling }] = useToggleOnlineMutation();
  const isOnline = user?.isOnline || false;

  const {
    notifications,
    loading,
    unreadCount,
    markRead,
    markAllRead,
    clearAll,
  } = useNotifications();

  const getBasePath = () => {
    const r = role?.toLowerCase();
    if (r === "admin" || r === "bmsp_admin") return "/admin";
    if (
      r === "venu_owners" ||
      r?.includes("venu_owners") ||
      r === "owner" ||
      r === "bmsp_owner" ||
      r === "verified_venue_owner" ||
      r === "venue_owner"
    )
      return "/venue-owner";
    if (r === "coach" || r === "bmsp_coach") return "/professional/coach";
    if (r?.includes("umpire")) return "/umpire";
    if (r === "scorer" || r?.includes("scorer")) return "/scorer";
    return "";
  };

  const isVenueOwner = [
    "venu_owners",
    "owner",
    "venue_owner",
    "verified_venue_owner",
    "bmsp_owner",
  ].some((r) => role?.toLowerCase()?.includes(r));

  const handleProfileClick = () => {
    navigate(getDynamicProfileRoute(user, role));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/user/auth/logout");
      dispatch(logout());
      navigate("/", { replace: true });
    } catch (error) {
      dispatch(logout());
      navigate("/", { replace: true });
    }
  };

  const handleCheckVenue = async () => {
    try {
      const response = await axiosInstance.get("/api/owner/turf/owner/all");
      const turfs = response.data;
      if (turfs && turfs.length > 0) {
        navigate(`/venue/${turfs[0]._id}`);
      } else {
        toast.error("You don't have any venues yet!");
      }
    } catch (err) {
      toast.error("Failed to load your venue");
    }
  };

  const handleToggleOnline = async () => {
    const nextState = !isOnline;
    // Optimistic update — flip UI instantly before API responds
    dispatch(updateUser({ isOnline: nextState }));

    const performToggle = async (coords = {}) => {
      try {
        await toggleOnline({ isOnline: nextState, ...coords }).unwrap();
        toast.success(
          nextState
            ? "You are now online and visible to users"
            : "You are now offline"
        );
      } catch (err) {
        console.error("Failed to toggle online status", err);
        // Rollback on failure
        dispatch(updateUser({ isOnline: !nextState }));
        toast.error(err?.data?.message || "Failed to update online status");
      }
    };

    if (nextState && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          performToggle({ latitude, longitude });
        },
        () => {
          performToggle();
        }
      );
    } else {
      performToggle();
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const trustScore = statsData?.stats?.trustScore || 100;
  const trustMax = 100;
  const trustPercent = Math.min(
    100,
    Math.max(0, (trustScore / trustMax) * 100)
  );
  const trustLevel =
    trustScore >= 90
      ? "Elite"
      : trustScore >= 70
        ? "Pro"
        : trustScore >= 50
          ? "Rising"
          : "Rookie";
  // SVG ring math (radius=18, circumference=~113)
  const ringRadius = 18;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - trustPercent / 100);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "BOOKING":
        return <History size={14} style={{ color: themeColor }} />;
      case "PAYMENT":
        return <CreditCard size={14} className="text-green-500" />;
      case "SUPPORT":
        return <MessageSquare size={14} className="text-blue-500" />;
      case "WITHDRAWAL":
        return <AlertTriangle size={14} className="text-orange-500" />;
      case "REVIEW":
        return <ShieldAlert size={14} className="text-yellow-500" />;
      default:
        return <Bell size={14} style={{ color: themeColor }} />;
    }
  };

  const handleNotificationClick = (notif) => {
    markRead(notif.id || notif._id);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col font-inter">
      <nav
        className={`bg-[#000000] border-b border-[#2D2D2D] px-4 md:px-8 pt-2 pb-2 lg:pt-0 h-[56px] lg:h-20 shadow-2xl flex items-center justify-between w-full box-border`}
      >
        <div className="flex items-center gap-4 lg:min-w-[200px]">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 transition-all duration-300 relative text-[#999999] hover:text-white bg-[#0d0d0d] border border-white/5 hover:border-[#BFF367]/30 rounded-full hover:bg-[#BFF367]/10 hover:text-[#BFF367] flex items-center justify-center outline-none"
            title="Go Back"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>

          {!isProfessionalDashboard && !isVenueOwner && (
            <button
              className="p-2 text-white hover:opacity-80 transition-opacity lg:hidden"
              style={{ color: themeColor }}
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-5 lg:min-w-[200px] justify-end">
          {[
            "venu_owners",
            "owner",
            "venue_owner",
            "verified_venue_owner",
            "bmsp_owner",
          ].some((r) => role?.toLowerCase()?.includes(r)) && (
            <>
              <button
                onClick={() => setIsManualBookingOpen(true)}
                className="hidden md:flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95"
                style={{
                  background:
                    "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)",
                  color: "#000",
                  boxShadow: `0 5px 15px ${themeColor}33`,
                }}
                title="Manual Booking"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Manual Booking</span>
              </button>
              <ManualBookingModal
                isOpen={isManualBookingOpen}
                onClose={() => setIsManualBookingOpen(false)}
              />
            </>
          )}

          {[
            "venu_owners",
            "owner",
            "venue_owner",
            "verified_venue_owner",
            "bmsp_owner",
          ].some((r) => role?.toLowerCase()?.includes(r)) && (
            <Link
              to="/venue-owner/support"
              className="hidden md:flex p-2.5 rounded-[8px] bg-[#0d0d0d] text-[#999999] border border-white/5 hover:border-white/10 hover:text-white transition-all duration-300"
              title="Docs & Support"
            >
              <HelpCircle size={20} />
            </Link>
          )}

          <div className="relative">
            <button
              onClick={() => {
                navigate(`${getBasePath()}/notifications`);
                setShowMobileMenu(false);
              }}
              className="p-2 transition-all duration-300 relative text-[#999999] hover:text-white bg-transparent outline-none"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#B3DC26] rounded-full border-2 border-black" />
              )}
            </button>
          </div>

          <div className="h-8 w-[1px] bg-white/5 mx-1 hidden sm:block" />

          {isProfessionalDashboard && (
            <div className="flex relative">
              <Link
                to={`/professional/${role}/support`}
                className="flex items-center justify-center p-2.5 bg-transparent md:bg-[#0d0d0d] md:border border-white/5 hover:border-[#BFF367]/30 rounded-[8px] hover:bg-[#BFF367]/10 hover:text-[#BFF367] text-[#999999] hover:text-white transition-all duration-300"
                title="Docs & Support"
              >
                <Info size={24} strokeWidth={2.5} className="md:w-5 md:h-5" />
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Professional Sub-Bar — visible on ALL screen sizes */}
      {isProfessionalDashboard && user && (
        <div className="bg-[#0A0A0A] border-b border-[#1a1a1a] px-6 md:px-8 py-3 w-full box-border">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Online / Offline Toggle */}
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
              <button
                onClick={handleToggleOnline}
                disabled={isToggling}
                title={isOnline ? "Go Offline" : "Go Online"}
                className={`relative w-12 h-6 rounded-full border transition-all duration-300 shrink-0 ${
                  isOnline
                    ? "border-[#BFF367]/40 bg-[#BFF367]/15"
                    : "border-white/10 bg-white/5"
                } ${isToggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-90 active:scale-95"}`}
              >
                {/* Track glow when online */}
                {isOnline && (
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{ boxShadow: "0 0 8px rgba(191,243,103,0.3)" }}
                  />
                )}
                {/* Thumb */}
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
                    isOnline
                      ? "left-[calc(100%-1.375rem)] bg-[#BFF367]"
                      : "left-0.5 bg-[#444]"
                  }`}
                >
                  {/* Dot indicator */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-black" : "bg-gray-600"}`}
                  />
                </span>
              </button>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span
                  className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate"
                  style={{ color: isOnline ? "#BFF367" : "#555" }}
                >
                  {isOnline ? "Online" : "Offline"} Mode
                </span>
                <span className="text-[9px] font-semibold text-gray-500 tracking-wider truncate">
                  {isOnline
                    ? "You are visible to players"
                    : "Your profile is hidden"}
                </span>
              </div>
            </div>

            {/* Right: Trust Score Ring (clickable to go to Trust Score ledger) */}
            <div
              onClick={() =>
                navigate(`/professional/${role?.toLowerCase()}/trust-score`)
              }
              className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity active:scale-95 duration-200 justify-end shrink-0"
            >
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                  Trust
                </span>
                <span className="text-[10px] sm:text-xs font-black text-[#BFF367] uppercase">
                  {trustScore} XP
                </span>
              </div>
              <div
                className="relative flex items-center justify-center"
                style={{ width: 40, height: 40 }}
              >
                {/* SVG Ring */}
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 44 44"
                  className="-rotate-90"
                >
                  {/* Background track */}
                  <circle
                    cx="22"
                    cy="22"
                    r={ringRadius}
                    fill="transparent"
                    stroke="#1a1a1a"
                    strokeWidth="3"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="22"
                    cy="22"
                    r={ringRadius}
                    fill="transparent"
                    stroke="#BFF367"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    style={{
                      transition: "stroke-dashoffset 0.8s ease",
                      filter: "drop-shadow(0 0 4px rgba(191,243,103,0.4))",
                    }}
                  />
                </svg>
                {/* Center score */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] font-black text-[#BFF367] leading-none">
                    {trustScore}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthenticatedNavbar;
