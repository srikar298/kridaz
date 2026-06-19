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

const Navbar = () => {
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
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
                      className="h-6 sm:h-8 object-contain"
                    />
                  </Link>
                </div>
              ) : (
                <div className="flex w-full items-center justify-between">
                  <Link to="/" className="flex shrink-0">
                    <img
                      src="/logo.png"
                      alt="Kridaz"
                      className="h-6 sm:h-8 object-contain"
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
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Icon */}
            {!isMessagesPage && (
              <Link
                to="/search"
                className="hidden sm:flex relative w-9 sm:w-11 h-9 sm:h-11 border border-white/10 items-center justify-center bg-white/5 hover:border-[#84CC16]/50 transition-all cursor-pointer rounded-full group"
              >
                <Search
                  size={18}
                  className="text-white/40 group-hover:text-[#84CC16] transition-colors"
                />
              </Link>
            )}

            {/* Message Button Removed as per user request */}

            {/* Notification Button Removed as per user request */}

            {/* Plus Button & Modal Overlay */}
            {!isMessagesPage && (
              <div className="relative">
                <button
                  onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                  className={`relative p-1 w-8 h-8 flex items-center justify-center transition-all cursor-pointer group ${isPlusMenuOpen ? "z-[1001]" : ""}`}
                >
                  <Plus
                    size={24}
                    className={`absolute transition-all duration-300 ease-in-out ${isPlusMenuOpen ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"} text-white/40 group-hover:text-[#84CC16]`}
                  />
                  <X
                    size={24}
                    className={`absolute transition-all duration-300 ease-in-out ${isPlusMenuOpen ? "opacity-100 scale-100 rotate-0 text-[#84CC16]" : "opacity-0 scale-50 -rotate-90 text-white/40"}`}
                  />
                </button>

                {/* Full Screen Blur Overlay & Modal */}
                {createPortal(
                  <AnimatePresence>
                    {isPlusMenuOpen && (
                      <div className="fixed inset-0 z-[999] pointer-events-none">
                        {/* Blurred Backdrop */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 bg-black/40 backdrop-blur-md cursor-pointer pointer-events-auto"
                          onClick={() => setIsPlusMenuOpen(false)}
                        />

                        {/* Menu Content expanding from Plus Icon */}
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={{
                            hidden: { opacity: 0, scale: 0 },
                            visible: {
                              opacity: 1,
                              scale: 1,
                              transition: {
                                type: "tween",
                                duration: 0.2,
                                staggerChildren: 0.05,
                                delayChildren: 0.1,
                              },
                            },
                          }}
                          style={{ transformOrigin: "top right" }}
                          className="absolute top-[56px] sm:top-[72px] right-2 sm:right-4 z-10 w-[calc(100vw-16px)] sm:w-[360px] max-w-[360px] p-3 shadow-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl flex flex-col gap-3 pointer-events-auto"
                        >
                          {/* Quick Search Button (Navigates to Search Page) */}
                          <motion.button
                            variants={{
                              hidden: { opacity: 0, y: 10 },
                              visible: { opacity: 1, y: 0 },
                            }}
                            onClick={() => {
                              setIsPlusMenuOpen(false);
                              navigate("/search");
                              setPlusMenuSearch("");
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl hover:border-[#BFF367]/50 hover:bg-[#222] transition-colors group cursor-pointer text-left"
                          >
                            <Search
                              size={14}
                              className="text-[#BFF367] group-hover:scale-110 transition-transform"
                            />
                            <span className="text-[#878C9F] text-xs font-semibold flex-1">
                              Search venues, games, players...
                            </span>
                          </motion.button>

                          {/* Scrollable grid container for categorized shortcuts */}
                          <div className="max-h-[50vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-1 flex flex-col gap-5 mt-1 pb-2">
                            {/* Play & Compete */}
                            <motion.div
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 },
                              }}
                            >
                              <h4 className="font-inter text-[8px] font-black uppercase tracking-[0.2em] text-[#BFF367] mb-2 px-2 opacity-80">
                                Play & Compete
                              </h4>
                              <div className="grid grid-cols-4 gap-2">
                                <Link
                                  to="/host-game"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <Trophy
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Host Game
                                  </span>
                                </Link>
                                <Link
                                  to="/join-games"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <Swords
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Join Games
                                  </span>
                                </Link>
                                <Link
                                  to="/my-teams"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <Users
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Teams
                                  </span>
                                </Link>
                                <Link
                                  to="/players"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <UserPlus
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Find Players
                                  </span>
                                </Link>
                                <Link
                                  to="/my-teams"
                                  state={{ openStartScoringModal: true }}
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <ClipboardList
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Score Match
                                  </span>
                                </Link>
                              </div>
                            </motion.div>

                            {/* Social & Content */}
                            <motion.div
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 },
                              }}
                            >
                              <h4 className="font-inter text-[8px] font-black uppercase tracking-[0.2em] text-[#BFF367] mb-2 px-2 opacity-80">
                                Social & Content
                              </h4>
                              <div className="grid grid-cols-4 gap-2">
                                <Link
                                  to="/?createPost=true"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <Edit3
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Share Post
                                  </span>
                                </Link>
                                <Link
                                  to="/reels/upload"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <PlayCircle
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Upload Reel
                                  </span>
                                </Link>
                                <Link
                                  to="/create-story"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <Camera
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Add Story
                                  </span>
                                </Link>
                                <Link
                                  to="/blogs"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <BookOpen
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Read Blogs
                                  </span>
                                </Link>
                              </div>
                            </motion.div>

                            {/* Services & Communications */}
                            <motion.div
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 },
                              }}
                            >
                              <h4 className="font-inter text-[8px] font-black uppercase tracking-[0.2em] text-[#BFF367] mb-2 px-2 opacity-80">
                                Explore & Connect
                              </h4>
                              <div className="grid grid-cols-4 gap-2">
                                <Link
                                  to="/venues"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <MapPin
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Book Venue
                                  </span>
                                </Link>
                                <Link
                                  to="/professionals"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <Briefcase
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Hire Pros
                                  </span>
                                </Link>
                                <Link
                                  to="/messages"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <MessageCircle
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Messages
                                  </span>
                                </Link>
                                <Link
                                  to="/notifications"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <div className="relative transition-all group-hover:scale-110">
                                    <Bell
                                      size={18}
                                      className="text-white/60 group-hover:text-[#BFF367]"
                                    />
                                    <NotificationBadge />
                                  </div>
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Alerts
                                  </span>
                                </Link>
                                <Link
                                  to="/wallet"
                                  onClick={() => setIsPlusMenuOpen(false)}
                                  className="flex flex-col items-center justify-start gap-1.5 p-2 hover:bg-white/5 rounded-2xl transition-all group"
                                >
                                  <Wallet
                                    size={18}
                                    className="text-white/60 group-hover:text-[#BFF367] transition-all group-hover:scale-110"
                                  />
                                  <span className="text-[8px] font-bold text-white/50 group-hover:text-white uppercase tracking-wider text-center leading-tight">
                                    Wallet
                                  </span>
                                </Link>
                              </div>
                            </motion.div>

                            {/* Partner & Business Opportunities */}
                            <motion.div
                              variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0 },
                              }}
                            >
                              <h4 className="font-inter text-[8px] font-black uppercase tracking-[0.2em] text-[#BFF367] mb-2 px-2 opacity-80">
                                Partners
                              </h4>
                              <div className="flex flex-wrap gap-2 px-2">
                                {role === "venu_owners" ? (
                                  <Link
                                    to="/venue-owner/profile"
                                    onClick={() => setIsPlusMenuOpen(false)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/70 hover:text-white uppercase tracking-wider transition-colors"
                                  >
                                    My Venue
                                  </Link>
                                ) : (
                                  <Link
                                    to="/business/venue"
                                    onClick={() => setIsPlusMenuOpen(false)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/70 hover:text-white uppercase tracking-wider transition-colors"
                                  >
                                    Add Venue
                                  </Link>
                                )}

                                {role === "coach" && (
                                  <Link
                                    to="/professional/coach/profile"
                                    onClick={() => setIsPlusMenuOpen(false)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/70 hover:text-white uppercase tracking-wider transition-colors"
                                  >
                                    My Coach Profile
                                  </Link>
                                )}

                                {role === "umpire" && (
                                  <Link
                                    to="/professional/umpire/profile"
                                    onClick={() => setIsPlusMenuOpen(false)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/70 hover:text-white uppercase tracking-wider transition-colors"
                                  >
                                    My Umpire Profile
                                  </Link>
                                )}

                                {role === "streamer" && (
                                  <Link
                                    to="/professional/streamer/profile"
                                    onClick={() => setIsPlusMenuOpen(false)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/70 hover:text-white uppercase tracking-wider transition-colors"
                                  >
                                    My Streamer Profile
                                  </Link>
                                )}

                                {role === "scorer" && (
                                  <Link
                                    to="/professional/scorer/profile"
                                    onClick={() => setIsPlusMenuOpen(false)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/70 hover:text-white uppercase tracking-wider transition-colors"
                                  >
                                    My Scorer Profile
                                  </Link>
                                )}

                                {![
                                  "coach",
                                  "umpire",
                                  "streamer",
                                  "scorer",
                                ].includes(role) && (
                                  <Link
                                    to="/signup/professional"
                                    onClick={() => setIsPlusMenuOpen(false)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold text-white/70 hover:text-white uppercase tracking-wider transition-colors"
                                  >
                                    Join as Professional
                                  </Link>
                                )}
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>,
                  document.body
                )}
              </div>
            )}

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
                            to="/my-joined-games"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <Trophy size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">
                              My Joined Matches
                            </span>
                          </Link>
                          <Link
                            to="/my-hosted-games"
                            onClick={() => dispatch(closeMainSidebar())}
                            className="flex items-center gap-3 p-3 rounded-[8px] hover:bg-white/5 text-white/70 hover:text-white transition-all"
                          >
                            <Target size={18} className="text-white/40" />
                            <span className="text-sm font-semibold">
                              My Hosted Games
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
