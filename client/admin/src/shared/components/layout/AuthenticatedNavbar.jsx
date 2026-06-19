import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Menu,
  Bell,
  LogOut,
  Search,
  Command,
  ChevronDown,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  History,
  ShieldAlert,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import axiosInstance from "@hooks/useAxiosInstance";
import useNotifications from "@hooks/shared/useNotifications";
import { formatDistanceToNow } from "date-fns";

/**
 * AuthenticatedNavbar Rs � Role-aware top navigation.
 * Fully rebranded for Scorer users with Teal Green (#00C187) and Inter typography.
 */

const AuthenticatedNavbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const user = useSelector((state) => state?.auth?.user);
  const role = useSelector((state) => state?.auth?.role);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#00C187" : "#55DEE8";

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
    if (r?.includes("scorer")) return "/scorer";
    return "";
  };

  const handleProfileClick = () => {
    navigate(`${getBasePath()}/profile`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
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

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

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
    setShowNotifications(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col font-inter">
      <nav className="navbar bg-[#000000] border-b border-[#2D2D2D] px-4 md:px-8 h-16 lg:h-20 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-4 lg:min-w-[200px]">
          <button
            className="p-2 text-white hover:opacity-80 transition-opacity lg:hidden"
            style={{ color: themeColor }}
            onClick={toggleSidebar}
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-20 h-10 sm:w-32 sm:h-12 bg-transparent flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="Kridaz Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
        </div>

        <div className="hidden xl:flex flex-1 items-center justify-center gap-6 max-w-4xl px-8">
          <div className="relative flex-1 group">
            <div
              className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/40 transition-colors"
              style={{ color: themeColor + "66" }}
            >
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search bookings, players, or reports..."
              className="w-full bg-[#0d0d0d] border border-white/5 rounded-lg py-2.5 pl-12 pr-16 text-sm text-white placeholder:text-white/20 focus:outline-none transition-all font-inter shadow-inner"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
              onFocus={(e) => (e.target.style.borderColor = themeColor + "80")}
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.05)")
              }
            />
            <div className="absolute inset-y-0 right-4 flex items-center gap-1.5">
              <div className="flex items-center justify-center w-5 h-5 rounded bg-white/5 text-[10px] text-white/30 border border-white/5">
                <Command size={10} />
              </div>
              <div className="flex items-center justify-center w-5 h-5 rounded bg-white/5 text-[10px] text-white/30 border border-white/5 font-bold">
                K
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 lg:min-w-[200px] justify-end">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-[8px] transition-all duration-300 relative border ${showNotifications ? "" : "bg-[#0d0d0d] text-[#999999] border-white/5 hover:border-white/10"}`}
              style={{
                backgroundColor: showNotifications ? themeColor : undefined,
                color: showNotifications ? "#000" : undefined,
                borderColor: showNotifications ? themeColor : undefined,
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-[#000000] border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white tracking-widest text-[10px] uppercase">
                      Notification Vault
                    </h3>
                    {unreadCount > 0 && (
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: themeColor, color: "#000" }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={markAllRead}
                      className="text-[9px] font-black uppercase tracking-widest hover:opacity-80 transition-all"
                      style={{ color: themeColor }}
                    >
                      Mark All
                    </button>
                    <button
                      onClick={clearAll}
                      className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id || notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-5 border-b border-white/5 transition-colors cursor-pointer group ${notif.isRead ? "opacity-60" : "bg-white/[0.02]"}`}
                      >
                        <div className="flex gap-4">
                          <div
                            className="mt-0.5 p-2 rounded-[8px] border border-white/5 flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: notif.isRead
                                ? "rgba(255,255,255,0.05)"
                                : themeColor + "1A",
                              color: notif.isRead ? "#555" : themeColor,
                            }}
                          >
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                              <h4
                                className={`text-[12px] font-black transition-colors uppercase tracking-tight ${notif.isRead ? "text-gray-500" : "text-white"}`}
                                style={{ "--hover-color": themeColor }}
                              >
                                {notif.title}
                              </h4>
                              <span className="text-[9px] text-neutral-600 font-bold flex items-center gap-1 uppercase">
                                {formatDistanceToNow(
                                  new Date(notif.createdAt),
                                  { addSuffix: true }
                                ).replace("about ", "")}
                              </span>
                            </div>
                            <p
                              className={`text-[11px] leading-relaxed font-medium ${notif.isRead ? "text-gray-600" : "text-neutral-400"}`}
                            >
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-16 text-center flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center text-neutral-800">
                        <Bell size={40} />
                      </div>
                      <p className="text-[10px] text-neutral-600 font-black tracking-widest uppercase">
                        Vault is empty
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-[1px] bg-white/5 mx-1 hidden sm:block" />

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-4 p-1.5 pr-5 bg-[#0d0d0d] border border-white/5 rounded-[8px] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 group"
            >
              <div
                className="w-11 h-11 rounded-lg overflow-hidden flex items-center justify-center text-black shadow-2xl group-hover:scale-105 transition-transform"
                style={{ backgroundColor: themeColor }}
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[15px] font-black uppercase tracking-tighter">
                    {user?.name
                      ?.split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "U"}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-[13px] font-black text-white tracking-tight uppercase leading-none mb-1.5">
                  {user?.name || user?.fullName || "User"}
                </span>
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.2em] leading-none">
                  {role?.replace("BMSP_", "") || "OWNER"}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-neutral-500 transition-transform duration-300 ${showProfileMenu ? "rotate-180 text-white" : ""}`}
              />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-4 w-52 bg-[#000000] border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default AuthenticatedNavbar;
