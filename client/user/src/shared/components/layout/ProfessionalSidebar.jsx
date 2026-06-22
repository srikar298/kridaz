import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  X,
  LayoutDashboard,
  Activity,
  User,
  IndianRupee,
  Star,
  MessageSquare,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";import { Button } from "@kridaz/ui";


const ProfessionalSidebar = ({
  isOpen,
  toggleSidebar,
  isMinimized,
  className,
}) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authState = useSelector((state) => state.auth);
  const user = authState?.user;
  const userRole = authState?.role;
  const { role } = useParams(); // e.g. coach, umpire, streamer, commentator

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const mainNavItems = [
    { to: `/professional/${role}`, label: "Overview", icon: LayoutDashboard },
    { to: `/professional/${role}/profile`, label: "Edit Profile", icon: User },
    { to: `/professional/${role}/inquiries`, label: "Inquiries", icon: MessageSquare },
    { to: `/professional/${role}/bookings`, label: "Bookings", icon: Activity },
    {
      to: `/professional/${role}/payouts`,
      label: "Payouts & Earnings",
      icon: IndianRupee,
    },
    {
      to: `/professional/${role}/reviews`,
      label: "Reviews & Feedback",
      icon: Star,
    },
  ];

  const bottomNavItems = [];

  const renderNavItem = (item) => {
    const isLogout = item.action === "logout";
    // Check active status properly accounting for potential trailing slashes or exact matches
    const isActive =
      !isLogout &&
      (location.pathname === item.to || location.pathname === item.to + "/");
    const Icon = item.icon;

    return (
      <Link
        key={item.to || item.label}
        to={item.to || "#"}
        className={`flex items-center px-4 py-3 group relative transition-all duration-300 font-inter ${isLogout ? "text-white/40 hover:text-red-500" : isActive ? "text-black" : "text-muted-foreground hover:text-white"}`}
        onClick={(e) => {
          if (isLogout) {
            e.preventDefault();
            handleLogout();
            return;
          }
          if (window.innerWidth < 1024) {
            toggleSidebar();
          }
        }}
      >
        {/* Active Glow/Background */}
        {isActive && !isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-primary rounded-[6px] -z-10 shadow-[var(--shadow-2)] transition-all duration-300" />
        )}

        {/* Hover Background */}
        {!isActive && !isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-border/30 border border-border rounded-[6px] -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
        )}

        {isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-white/5 rounded-[6px] -z-10 opacity-0 group-hover:opacity-100 group-hover:bg-red-500/10 transition-all duration-300" />
        )}

        <div className="flex-shrink-0 flex items-center justify-center w-6">
          <Icon
            size={18}
            className={`transition-colors duration-300 ${isLogout ? "text-white/20 group-hover:text-red-500" : isActive ? "text-black" : "text-muted-foreground group-hover:text-primary"}`}
          />
        </div>

        <span
          className={`font-semibold text-[13px] tracking-wide ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto"}`}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-300"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] sidebar-glass border-r border-border overflow-x-hidden transition-all duration-300 ease-in-out z-50 flex flex-col font-open-sans ${isMinimized ? "lg:w-20" : "w-64"} ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${className || ""}`}
      >
        <div className="flex flex-col p-4 border-b border-border bg-background gap-4 lg:hidden">
          <div className="flex items-center justify-end">
            <Button
              onClick={toggleSidebar}
              className="text-white hover:text-primary transition-colors"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar py-6">
          <nav className="px-2 space-y-1">
            {mainNavItems.map(renderNavItem)}
          </nav>
        </div>

        <div className="p-2 border-t border-border space-y-1 mb-4">
          {bottomNavItems.map(renderNavItem)}
        </div>
      </aside>
    </>
  );
};

export default ProfessionalSidebar;
