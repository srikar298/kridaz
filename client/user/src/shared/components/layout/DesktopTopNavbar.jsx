import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Search,
  Plus,
  MessageCircle,
  Bell,
  X,
  LogOut,
  Activity,
  Zap,
  Briefcase,
  Trophy,
  Clock,
  Users,
  Target,
  Bookmark,
  FileText,
  ArrowRight,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { logout } from "@redux/slices/authSlice";
import useNotifications from "@hooks/shared/useNotifications";
import { getDynamicProfileRoute } from "@utils/routeUtils";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const NotificationBadge = () => {
  const { unreadCount } = useNotifications();
  if (unreadCount <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white border border-[#050505]">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
};

export default function DesktopTopNavbar({
  isRightDrawerOpen,
  setIsRightDrawerOpen,
}) {
  const { isLoggedIn, role, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/user/auth/logout");
      dispatch(logout());
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      dispatch(logout());
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      navigate(`/search`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] bg-black/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-[80] select-none">
      {/* Left: Logo & Search */}
      <div className="flex items-center gap-8">
        <Link
          to="/"
          className="flex items-center gap-3 hover:scale-102 transition-transform"
        >
          <img
            src="/logo.png"
            alt="Kridaz"
            className="h-7 w-auto brightness-110"
          />
        </Link>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-80 group">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#BFF367] transition-colors"
          />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search players, venues, games..."
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 rounded-full py-2 pl-10 pr-4 text-xs font-semibold text-white outline-none focus:border-[#BFF367]/40 focus:bg-white/[0.08] transition-all placeholder:text-white/20"
          />
        </form>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <>
            {/* Create (+) Dropdown */}
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#BFF367]/50 hover:bg-[#BFF367]/10 transition-all cursor-pointer rounded-full text-white/60 hover:text-[#BFF367] group"
              >
                <Plus
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content z-[110] mt-2 p-1 shadow-2xl bg-[#0A0A0A] border border-white/10 rounded-[8px] w-48 overflow-hidden backdrop-blur-xl"
              >
                <li>
                  <Link
                    to="/my-teams"
                    state={{ openStartScoringModal: true }}
                    className="flex items-center gap-3 p-3.5 text-xs font-bold text-white/60 hover:text-[#BFF367] hover:bg-white/5 transition-all"
                  >
                    Score Match
                  </Link>
                </li>
                <li>
                  <Link
                    to="/?createPost=true"
                    className="flex items-center gap-3 p-3.5 text-xs font-bold text-white/60 hover:text-[#BFF367] hover:bg-white/5 transition-all"
                  >
                    Share Post
                  </Link>
                </li>
              </ul>
            </div>

            {/* Messaging */}
            <Link
              to="/messages"
              className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#BFF367]/50 hover:bg-[#BFF367]/10 transition-all rounded-full text-white/60 hover:text-[#BFF367] relative"
            >
              <MessageCircle size={18} />
            </Link>

            {/* Notifications */}
            <Link
              to="/notifications"
              className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#BFF367]/50 hover:bg-[#BFF367]/10 transition-all rounded-full text-white/60 hover:text-[#BFF367] relative"
            >
              <Bell size={18} />
              <NotificationBadge />
            </Link>

            {/* Tablet Widget Panel Toggle (Visible only on 768px-1199px) */}
            <button
              onClick={() => setIsRightDrawerOpen(!isRightDrawerOpen)}
              className="xl:hidden w-10 h-10 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#BFF367]/50 hover:bg-[#BFF367]/10 transition-all rounded-full text-white/60 hover:text-[#BFF367]"
            >
              <Menu size={18} />
            </button>

            {/* User Profile Avatar */}
            <div className="relative">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/5 hover:border-[#BFF367]/50 transition-all rounded-full overflow-hidden relative group"
              >
                {user?.profilePicture || user?.profileImage ? (
                  <img
                    src={user.profilePicture || user.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <span className="text-[#84CC16] font-bold text-xs">
                      {user?.name
                        ?.split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "KR"}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-[#84CC16]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Account Sidebar Portal */}
              {isSidebarOpen &&
                createPortal(
                  <div
                    className="fixed inset-0 bg-black/60 z-[999] backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                  />,
                  document.body
                )}

              {isSidebarOpen &&
                createPortal(
                  <div
                    className={`fixed top-0 right-0 h-[100dvh] w-72 sm:w-80 bg-[#0A0A0A] border-l border-white/10 shadow-2xl overflow-y-auto z-[1000] transition-transform duration-300`}
                  >
                    <div className="p-4 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0A0A0A] z-50">
                      <span className="font-bold text-white uppercase tracking-widest text-xs">
                        Account
                      </span>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-4 flex flex-col gap-6">
                      {/* Profile Link */}
                      <Link
                        to={getDynamicProfileRoute(user, role)}
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center gap-4 p-4 rounded-[12px] bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all backdrop-blur-md mb-2"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#111] border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
                          {user?.profilePicture || user?.profileImage ? (
                            <img
                              src={user.profilePicture || user.profileImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[#BFF367] font-bold text-sm">
                              {user?.name
                                ?.split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2) || "KR"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black tracking-tight text-white truncate">
                            {user?.name || "Profile"}
                          </p>
                          <p className="text-[11px] font-medium text-white/40 truncate">
                            {user?.email || "View Account"}
                          </p>
                        </div>
                      </Link>

                      {/* Play */}
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">
                          Play
                        </span>
                        <div className="flex flex-col gap-1">
                          <Link
                            to="/booking-history"
                            onClick={() => setIsSidebarOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-white/5 text-white/75 hover:text-white transition-all"
                          >
                            <Clock size={16} className="text-white/40" />
                            <span className="text-xs font-semibold">
                              My Bookings
                            </span>
                          </Link>
                          <Link
                            to="/my-teams"
                            onClick={() => setIsSidebarOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-white/5 text-white/75 hover:text-white transition-all"
                          >
                            <Users size={16} className="text-white/40" />
                            <span className="text-xs font-semibold">
                              My Teams
                            </span>
                          </Link>
                          <Link
                            to="/joingame-history"
                            onClick={() => setIsSidebarOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-white/5 text-white/75 hover:text-white transition-all"
                          >
                            <Trophy size={16} className="text-white/40" />
                            <span className="text-xs font-semibold">
                              Game History
                            </span>
                          </Link>
                          <Link
                            to="/wallet"
                            onClick={() => setIsSidebarOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-white/5 text-white/75 hover:text-white transition-all"
                          >
                            <Zap size={16} className="text-white/40" />
                            <span className="text-xs font-semibold">
                              My Wallet
                            </span>
                          </Link>
                        </div>
                      </div>

                      {/* Professional Hub */}
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">
                          Professional Hub
                        </span>
                        <div className="flex flex-col gap-1">
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
                              onClick={() => setIsSidebarOpen(false)}
                              className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-white/5 text-white/75 hover:text-[#BFF367] transition-all"
                            >
                              <Activity size={16} className="text-[#BFF367]" />
                              <span className="text-xs font-semibold">
                                Venue Dashboard
                              </span>
                            </Link>
                          ) : [
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
                              onClick={() => setIsSidebarOpen(false)}
                              className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-white/5 text-white/75 hover:text-[#BFF367] transition-all"
                            >
                              <Zap size={16} className="text-[#BFF367]" />
                              <span className="text-xs font-semibold">
                                Professional Portal
                              </span>
                            </Link>
                          ) : (
                            <>
                              <Link
                                to="/business/venue"
                                onClick={() => setIsSidebarOpen(false)}
                                className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-white/5 text-white/75 hover:text-[#BFF367] transition-all"
                              >
                                <Briefcase
                                  size={16}
                                  className="text-[#BFF367]"
                                />
                                <span className="text-xs font-semibold">
                                  Host Venue
                                </span>
                              </Link>
                              <Link
                                to="/business/professional"
                                onClick={() => setIsSidebarOpen(false)}
                                className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-white/5 text-white/75 hover:text-[#BFF367] transition-all"
                              >
                                <Zap size={16} className="text-[#BFF367]" />
                                <span className="text-xs font-semibold">
                                  Register as Pro
                                </span>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Community & Saved */}
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-1">
                          Community
                        </span>
                        <div className="flex flex-col gap-1">
                          <Link
                            to="/leaderboard"
                            onClick={() => setIsSidebarOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-white/5 text-white/75 hover:text-white transition-all"
                          >
                            <Trophy size={16} className="text-white/40" />
                            <span className="text-xs font-semibold">
                              Global Leaderboard
                            </span>
                          </Link>
                          <Link
                            to="/saved"
                            onClick={() => setIsSidebarOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-white/5 text-white/75 hover:text-white transition-all"
                          >
                            <Bookmark size={16} className="text-white/40" />
                            <span className="text-xs font-semibold">
                              Saved Items
                            </span>
                          </Link>
                          <Link
                            to="/blogs"
                            onClick={() => setIsSidebarOpen(false)}
                            className="flex items-center gap-3 p-2.5 rounded-[8px] hover:bg-white/5 text-white/75 hover:text-white transition-all"
                          >
                            <FileText size={16} className="text-white/40" />
                            <span className="text-xs font-semibold">Blogs</span>
                          </Link>
                        </div>
                      </div>

                      {/* Logout */}
                      <div className="pt-4 border-t border-white/5 mt-auto">
                        <button
                          onClick={() => {
                            setIsSidebarOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-[8px] bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 hover:text-red-350 transition-all"
                        >
                          <LogOut size={14} className="opacity-70" />
                          <span className="text-xs font-bold tracking-wide">
                            Logout
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-white/60 hover:text-white transition-colors"
            >
              Login
            </Link>

            <Link
              to="/login"
              className="bg-[#84CC16] hover:bg-[#a3e635] text-black h-9 px-5 text-xs font-bold flex items-center gap-2 rounded-[8px] transition-all shadow-[0_0_15px_rgba(132,204,22,0.15)]"
            >
              Join Now <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
