import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDynamicProfileRoute } from "@utils/routeUtils";
import { useSelector, useDispatch } from "react-redux";
import {
  User,
  Users,
  X,
  LogOut,
  Activity,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Trophy,
  Target,
  MessageCircle,
  MapPin,
  Bell,
  UserSearch,
  Search,
  Plus,
  Bookmark,
  FileText,
  Home,
  Briefcase,
  ChevronDown,
  Award,
  Mail,
  HelpCircle,
  Share2,
  Menu,
  SlidersHorizontal,
  Map,
  CalendarDays,
  UserCheck,
  Edit3,
  PlayCircle,
  Camera,
  UserPlus,
  Swords,
  ClipboardList,
  BookOpen,
  Wallet,
  Building,
  Flag,
  Video,
  FileDigit,
  PlusCircle,
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { logout } from "@redux/slices/authSlice";
import {
  setUserLocation,
  setLocationStatus,
  openLocationSidebar,
  openMainSidebar,
  closeMainSidebar,
} from "@redux/slices/uiSlice";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import useNotifications from "@hooks/shared/useNotifications";
import { useScrollDirection } from "@hooks/useScrollDirection.js";
import { useAuthModal } from "../../../context/AuthModalContext";

import { Liquid } from "../ui/button-1";

const LIQUID_COLORS = {
  color1: "#FFFFFF",
  color2: "#1E10C5",
  color3: "#9089E2",
  color4: "#FCFCFE",
  color5: "#F9F9FD",
  color6: "#B2B8E7",
  color7: "#0E2DCB",
  color8: "#0017E9",
  color9: "#4743EF",
  color10: "#7D7BF4",
  color11: "#0B06FC",
  color12: "#C5C1EA",
  color13: "#1403DE",
  color14: "#B6BAF6",
  color15: "#C1BEEB",
  color16: "#290ECB",
  color17: "#3F4CC0",
};

/**
 * NotificationBadge — Shows unread notification count as a red dot/badge.
 * Extracted as a sub-component to isolate the useNotifications hook call.
 */
const NotificationBadge = () => {
  const { unreadCount } = useNotifications();
  if (unreadCount <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-[8px] flex items-center justify-center text-[9px] font-black text-white border-2 border-[#050505]">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
};

const StadiumIcon = ({ size = 24, className }) => {
  const adjustedSize = size + 4;
  return (
    <svg width={adjustedSize} height={adjustedSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 7V3L7 5L3 7ZM18 7V3L22 5L18 7ZM11 6V2L15 4L11 6ZM11 22C9.73333 21.9667 8.55433 21.8627 7.463 21.688C6.37167 21.5133 5.42167 21.2923 4.613 21.025C3.80433 20.7577 3.16667 20.4493 2.7 20.1C2.23333 19.7507 2 19.384 2 19V10C2 9.58333 2.26267 9.196 2.788 8.838C3.31333 8.48 4.02567 8.16333 4.925 7.888C5.82433 7.61267 6.88267 7.396 8.1 7.238C9.31733 7.08 10.6173 7.00067 12 7C13.3827 6.99933 14.6827 7.07867 15.9 7.238C17.1173 7.39733 18.1757 7.614 19.075 7.888C19.9743 8.162 20.687 8.47867 21.213 8.838C21.739 9.19733 22.0013 9.58467 22 10V19C22 19.3833 21.7667 19.75 21.3 20.1C20.8333 20.45 20.196 20.7583 19.388 21.025C18.58 21.2917 17.63 21.5127 16.538 21.688C15.446 21.8633 14.2667 21.9673 13 22V18H11V22ZM12 11C13.6167 11 15.0127 10.904 16.188 10.712C17.3633 10.52 18.3007 10.2993 19 10.05C19 9.96667 18.3667 9.771 17.1 9.463C15.8333 9.155 14.1333 9.00067 12 9C9.86667 8.99933 8.16667 9.15367 6.9 9.463C5.63333 9.77233 5 9.968 5 10.05C5.7 10.3 6.63733 10.521 7.812 10.713C8.98667 10.905 10.3827 11.0007 12 11ZM9 19.85V16H15V19.85C16.3333 19.7167 17.425 19.521 18.275 19.263C19.125 19.005 19.7 18.7757 20 18.575V11.8C19.0833 12.1667 17.9333 12.4583 16.55 12.675C15.1667 12.8917 13.65 13 12 13C10.35 13 8.83333 12.8917 7.45 12.675C6.06667 12.4583 4.91667 12.1667 4 11.8V18.575C4.3 18.775 4.875 19.0043 5.725 19.263C6.575 19.5217 7.66667 19.7173 9 19.85Z" fill="currentColor"/>
    </svg>
  );
};

const Navbar = () => {
  const { role, user } = useSelector((state) => state.auth || {});
  const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn || !!state.auth?.token);
  const { openAuthModal } = useAuthModal();
  const userLocation = useSelector((state) => state.ui.userLocation);
  const locationStatus = useSelector((state) => state.ui.locationStatus);
  const isSidebarOpen = useSelector((state) => state.ui.mainSidebar?.isOpen);
  // Auth state log removed
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const partnerUrl =
    import.meta.env.VITE_PARTNER_URL || "http://localhost:5174";
  const isPartnerPortal = location.pathname.startsWith("/partners");
  const { scrollDirection, scrolled: isScrolled } = useScrollDirection();

  const [isInviteHovered, setIsInviteHovered] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [plusMenuSearch, setPlusMenuSearch] = useState("");

  useEffect(() => {
    if (!isLoggedIn) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, navigate]);

  // Restrict body scroll when menus are open
  useEffect(() => {
    if (isPlusMenuOpen || isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPlusMenuOpen, isSidebarOpen]);

  const geoLoading = locationStatus === "detecting";
  const geoLabel = userLocation
    ? userLocation.city && userLocation.state
      ? `${userLocation.city}, ${userLocation.state}`
      : userLocation.city || userLocation.state || "Unknown"
    : null;

  const detectLocation = useCallback(() => {
    dispatch(setLocationStatus("detecting"));
    if (!navigator.geolocation) {
      dispatch(setLocationStatus("denied"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let city = "";
        let state = "";
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          const data = await res.json();
          city = data.city || data.locality || "";
          state = data.principalSubdivision || "";
        } catch (error) {
          console.warn("Reverse geocoding failed:", error);
        }
        dispatch(setUserLocation({ lat, lng, city, state }));
        dispatch(setLocationStatus("granted"));
      },
      () => {
        dispatch(setLocationStatus("denied"));
      },
      { timeout: 8000 }
    );
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/user/auth/logout");
      dispatch(logout());
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API fails, clear local state
      dispatch(logout());
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  const navLinks = isPartnerPortal
    ? [
        { name: "Venues", path: "/business/venue", icon: MapPin },
        {
          name: "Professionals",
          path: "/business/professional",
          icon: Briefcase,
        },
      ]
    : [
        { name: "Home", path: "/", icon: Home },
        { name: "My Teams", path: "/my-teams", icon: Users },
        { name: "Pros", path: "/professionals", icon: Award },
        { name: "Join Games", path: "/join-games", icon: Trophy },
        { name: "Players", path: "/players", icon: Users },
        { name: "Business", path: "#", icon: Briefcase },
      ];

  const searchParams = new URLSearchParams(location.search);
  const isHome =
    location.pathname === "/" || location.pathname === "/community";
  const isSingleVenue = location.pathname.startsWith("/venue/");
  const isVenue =
    (location.pathname.startsWith("/venue") ||
      location.pathname === "/venues") &&
    !isSingleVenue;
  const isPlayer = location.pathname.startsWith("/players");
  const isProfessional = location.pathname.startsWith("/professionals");
  const isJoinGames = location.pathname.startsWith("/join-games");
  const isUploadReel =
    location.pathname.startsWith("/reels/upload") ||
    location.pathname.startsWith("/shorts/upload");
  const isTeamsPage = location.pathname.startsWith("/my-teams");
  const isMessagesPage = location.pathname.startsWith("/messages");
  const useRestrictedWidth =
    isHome ||
    isVenue ||
    isUploadReel ||
    isTeamsPage ||
    isPlayer ||
    isProfessional ||
    isJoinGames;

  return (
    <>
      {" "}
      {/* Mobile Top Header (100% original layout and classes) */}
      <nav
        onClick={() => isPlusMenuOpen && setIsPlusMenuOpen(false)}
        className={`sticky top-0 w-full z-[90] flex flex-col transition-all duration-300 group/nav overflow-hidden bg-black/40 backdrop-blur-xl lg:hidden
          ${scrollDirection === "down" && window.innerWidth < 1024 ? "-translate-y-full" : "translate-y-0"}
        `}
      >
        <div className="flex justify-center">
          <div
            className={`relative w-full max-w-full flex items-center justify-between px-4 pt-1 sm:pt-2 h-[56px] sm:h-[72px] ${isLoggedIn ? "border-b border-white/10" : ""}`}
          >
            {/* Logo & Mobile Location Section */}
            <div className="flex items-center justify-between w-full overflow-visible">
              {isLoggedIn ? (
                <div className="flex flex-row items-center gap-1 py-1 w-full">
                  {/* PROFILE SIDEBAR TOGGLE MOVED TO LEFT */}
                  <div className="relative shrink-0 flex items-center justify-center -mt-[3px]">
                    <div
                      onClick={() => dispatch(openMainSidebar())}
                      role="button"
                      aria-label="Open sidebar menu"
                      className="relative p-1 flex items-center justify-center transition-all cursor-pointer group"
                    >
                      <Menu
                        size={24}
                        className="text-white/80 group-hover:text-[#84CC16] transition-colors relative z-10"
                      />
                    </div>
                  </div>

                  {/* Header Logo */}
                  <Link to="/" className="flex shrink-0">
                    <img
                      src="/logo.png"
                      alt="Kridaz"
                      className="h-5 sm:h-6 object-contain"
                    />
                  </Link>
                </div>
              ) : (
                <div className="flex w-full items-center justify-between">
                  <Link to="/" className="flex shrink-0">
                    <img
                      src="/logo.png"
                      alt="Kridaz"
                      className="h-5 sm:h-6 object-contain"
                    />
                  </Link>
                  <button
                    onClick={() => navigate("/login")}
                    className="bg-gradient-to-r from-[#D2F40E] to-[#B8ED30] text-black px-5 py-1.5 rounded-[5px] text-[11px] uppercase tracking-widest font-black shadow-[0_0_15px_rgba(210,244,14,0.2)] hover:shadow-[0_0_20px_rgba(210,244,14,0.4)] hover:scale-105 active:scale-95 transition-all"
                  >
                    JOIN
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Desktop Top Header */}
      <nav
        onClick={() => isPlusMenuOpen && setIsPlusMenuOpen(false)}
        className="hidden lg:flex sticky top-0 w-full z-[90] flex-col transition-all duration-300 border-b border-white/10 bg-black/40 backdrop-blur-xl"
      >
        <div className="flex justify-center h-16 sm:h-20 w-full">
          <div className="relative w-full max-w-[1400px] h-full flex items-center justify-between px-6">
            <div className="flex items-center gap-6">
              {/* Logo removed as requested */}
            </div>
          </div>
        </div>
      </nav>
      {/* ACTIONS (Moved outside nav to prevent dropdown clipping) */}
      <div
        className={`flex items-center gap-2 sm:gap-4 fixed right-2 sm:right-4 z-[1000] transition-all duration-300 ${scrollDirection === "down" && window.innerWidth < 1024 ? "-translate-y-full top-[-100px]" : "translate-y-0 top-3 sm:top-4 lg:top-5"}`}
      >
        {!isLoggedIn ? (
          <>
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-all hover:translate-x-1"
            >
              <ShieldCheck size={16} className="opacity-50" />
              Login
            </button>
          </>
        ) : (
          <div className="flex items-center gap-[4px]">
            {/* Wallet / Coins Button */}
            <Link
              to="/wallet"
              className="flex items-center justify-center gap-1.5 h-[40px] px-3 bg-[#FFD600] rounded-[10px] hover:scale-105 active:scale-95 transition-all"
            >
              <div className="flex items-center justify-center bg-black rounded-full w-4 h-4">
                <div className="w-[6px] h-[6px] bg-[#FFD600] rotate-45" />
              </div>
              <span className="text-black font-bold text-[14px] font-inter">32</span>
            </Link>

            {/* Search Box */}
            <Link
              to="/search"
              aria-label="Search"
              className="flex items-center justify-center w-[40px] h-[40px] bg-white/10 rounded-[10px] hover:bg-white/20 transition-colors"
            >
              <Search size={20} className="text-white" />
            </Link>

            {/* Notification Box */}
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="flex items-center justify-center w-[40px] h-[40px] bg-white/10 rounded-[10px] hover:bg-white/20 transition-colors"
            >
              <Bell size={20} className="text-white" />
            </Link>

            <div className="flex items-center gap-2">
              <div className="relative">
                {/* OVERLAY */}
                {isSidebarOpen &&
                  createPortal(
                    <div
                      className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm transition-opacity"
                      onClick={() => dispatch(closeMainSidebar())}
                    />,
                    document.body
                  )}

                {/* SIDEBAR PANEL */}
                {createPortal(
                  <div
                    className={`fixed top-0 left-0 h-[100dvh] w-72 sm:w-80 bg-[#0A0A0A] border-r border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] z-[1000] transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
                  >
                    <div className="p-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0A0A0A] z-50">
                      <span className="font-bold text-white uppercase tracking-widest text-sm">
                        Account
                      </span>
                      <button
                        onClick={() => dispatch(closeMainSidebar())}
                        aria-label="Close sidebar menu"
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Navigation Groups */}
                    <div className="p-4 flex flex-col gap-6">
                      {/* Profile Card */}
                      <Link
                        to={getDynamicProfileRoute(user, role)}
                        onClick={() => dispatch(closeMainSidebar())}
                        className="flex items-center gap-3 p-3 rounded-[10px] bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all backdrop-blur-md mb-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#111] border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                          {(() => {
                            if (user?.profilePicture || user?.profileImage) {
                              return (
                                <img
                                  src={user.profilePicture || user.profileImage}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              );
                            }
                            const gender = user?.gender?.toLowerCase();
                            if (gender === "male" || gender === "m") {
                              return (
                                <img
                                  src={`https://avatar.iran.liara.run/public/boy?username=${user?.name || "user"}`}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              );
                            }
                            if (gender === "female" || gender === "f") {
                              return (
                                <img
                                  src={`https://avatar.iran.liara.run/public/girl?username=${user?.name || "user"}`}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              );
                            }
                            if (user?.name) {
                              return (
                                <span className="text-[#BFF367] font-bold text-xs">
                                  {user.name
                                    .split(" ")
                                    .map((w) => w[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </span>
                              );
                            }
                            return (
                              <User size={18} className="text-[#BFF367]" />
                            );
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-black tracking-tight text-white truncate">
                            {user?.name || "Profile"}
                          </p>
                          <p className="text-[10px] font-bold text-[#BFF367] uppercase tracking-wider">
                            View Profile
                          </p>
                        </div>
                      </Link>
                      {/* LOCATION SELECTOR */}
                      <div className="flex flex-col mb-2">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">
                          Location
                        </span>
                        <div
                          className="flex items-center justify-between p-3 rounded-[8px] bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                          onClick={() => {
                            dispatch(closeMainSidebar());
                            dispatch(openLocationSidebar());
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center border border-white/5">
                              <MapPin size={16} className="text-[#BFF367]" />
                            </div>
                            <div className="flex flex-col">
                              {geoLoading ? (
                                <span className="text-[13px] font-bold text-white tracking-tight leading-none animate-pulse">
                                  Locating...
                                </span>
                              ) : geoLabel ? (
                                <span className="text-[13px] font-bold text-white tracking-tight leading-none truncate max-w-[150px]">
                                  {userLocation?.city || geoLabel.split(",")[0]}
                                </span>
                              ) : (
                                <span className="text-[13px] font-bold text-white tracking-tight leading-none">
                                  Set Location
                                </span>
                              )}
                              <span className="text-[10px] font-medium text-white/50 mt-1">
                                Tap to change
                              </span>
                            </div>
                          </div>
                          <ChevronDown size={14} className="text-white/50" />
                        </div>
                      </div>

                      {/* PROFESSIONAL HUB */}
                      <div className="flex flex-col mb-2">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">
                          Professional Hub
                        </span>
                        <div className="flex flex-col gap-1">
                          {/* Venue Option */}
                          {[
                            "bmsp_admin",
                            "admin",
                            "venu_owners",
                            "venue_owners",
                            "venue",
                            "owner",
                          ].some(
                            (r) =>
                              role?.toLowerCase().includes(r) ||
                              user?.role?.toLowerCase().includes(r)
                          ) ? (
                            <Link
                              to="/venue-owner"
                              onClick={() => dispatch(closeMainSidebar())}
                              className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                            >
                              <Activity size={18} className="text-[#BFF367]" />
                              <span className="text-sm font-semibold">
                                Venue Dashboard
                              </span>
                            </Link>
                          ) : (
                            <Link
                              to="/business/venue"
                              onClick={() => dispatch(closeMainSidebar())}
                              className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                            >
                              <Briefcase size={18} className="text-[#BFF367]" />
                              <span className="text-sm font-semibold">
                                Host Venue
                              </span>
                            </Link>
                          )}

                          {/* Professional Option */}
                          {[
                            "coach",
                            "umpire",
                            "streamer",
                            "commentator",
                            "scorer",
                            "cheerleader",
                          ].some(
                            (r) =>
                              role?.toLowerCase().includes(r) ||
                              user?.role?.toLowerCase().includes(r)
                          ) ? (
                            <Link
                              to={`/professional/${role?.toLowerCase() || user?.role?.toLowerCase()}`}
                              onClick={() => dispatch(closeMainSidebar())}
                              className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                            >
                              <Zap size={18} className="text-[#BFF367]" />
                              <span className="text-sm font-semibold">
                                Professional Portal
                              </span>
                            </Link>
                          ) : (
                            <Link
                              to="/business/professional"
                              onClick={() => dispatch(closeMainSidebar())}
                              className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                            >
                              <Zap size={18} className="text-[#BFF367]" />
                              <span className="text-sm font-semibold">
                                Register as Pro
                              </span>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* PLAY */}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">
                          Play
                        </span>
                        <div className="flex flex-col gap-1">
                          <Link
                            to="/booking-history"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <Clock size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">
                              My Bookings
                            </span>
                          </Link>
                          <Link
                            to="/my-teams"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <Users size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">
                              My Teams
                            </span>
                          </Link>
                          <Link
                            to="/joingame-history"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <Trophy size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">
                              Game History
                            </span>
                          </Link>
                          <Link
                            to="/wallet"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <Zap size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">
                              My Wallet
                            </span>
                          </Link>
                        </div>
                      </div>

                      {/* COMMUNITY */}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">
                          Community
                        </span>
                        <div className="flex flex-col gap-1">
                          <Link
                            to="/leaderboard"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <Trophy size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">
                              Global Leaderboard
                            </span>
                          </Link>
                          <Link
                            to="/saved"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <Bookmark size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">
                              Saved Items
                            </span>
                          </Link>
                          <Link
                            to="/blogs"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <FileText size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">Blogs</span>
                          </Link>
                        </div>
                      </div>

                      {/* SUPPORT & LEGAL */}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">
                          Support & Legal
                        </span>
                        <div className="flex flex-col gap-1">
                          <Link
                            to="/contact-us"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <Mail size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">
                              Contact Us
                            </span>
                          </Link>
                          <Link
                            to="/faq"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <HelpCircle size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">FAQ</span>
                          </Link>
                          <Link
                            to="/terms-of-service"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <FileText size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">
                              Terms & Conditions
                            </span>
                          </Link>
                          <Link
                            to="/privacy-policy"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <ShieldCheck size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">
                              Privacy Policy
                            </span>
                          </Link>

                          <div
                            className="w-full mt-2 flex justify-center"
                            onClick={() => dispatch(closeMainSidebar())}
                          >
                            <Link
                              to="/wallet"
                              className="relative inline-block w-full h-[3.5em] group dark:bg-black bg-white dark:border-white border-black border rounded-xl overflow-visible"
                            >
                              {/* Inner container */}
                              <div className="relative w-full h-full overflow-hidden rounded-xl">
                                <span className="absolute inset-0 rounded-xl bg-[#d9d9d9]"></span>
                                <span className="absolute inset-0 rounded-xl bg-black"></span>
                                <Liquid
                                  isHovered={isInviteHovered}
                                  colors={LIQUID_COLORS}
                                />

                                {[1, 2, 3, 4, 5].map((i) => (
                                  <span
                                    key={i}
                                    className={`absolute inset-0 rounded-xl border-solid border-[3px] border-gradient-to-b from-transparent to-white mix-blend-overlay filter ${i <= 2 ? "blur-[3px]" : i === 3 ? "blur-[5px]" : "blur-[4px]"}`}
                                  ></span>
                                ))}
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[70.8%] h-[42.85%] rounded-xl filter blur-[15px] bg-[#006]"></span>
                              </div>

                              <div
                                className="absolute inset-0 rounded-xl bg-transparent cursor-pointer flex items-center justify-center gap-3 px-5"
                                onMouseEnter={() => setIsInviteHovered(true)}
                                onMouseLeave={() => setIsInviteHovered(false)}
                              >
                                <Share2
                                  size={18}
                                  className="group-hover:text-yellow-400 text-white flex-shrink-0 transition-colors"
                                />
                                <span className="group-hover:text-yellow-400 text-white text-[14px] font-black tracking-wide whitespace-nowrap transition-colors uppercase">
                                  Invite & Earn
                                </span>
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* BOTTOM FIXED (LOGOUT) */}
                      <div className="pt-4 border-t border-white/5 mt-auto">
                        <button
                          onClick={() => {
                            dispatch(closeMainSidebar());
                            handleLogout();
                          }}
                          className="w-full flex items-center justify-center gap-2 p-3 rounded-[8px] bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 hover:text-red-300 transition-all"
                        >
                          <LogOut size={16} className="opacity-70" />
                          <span className="text-sm font-bold tracking-wide">
                            Logout
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;
