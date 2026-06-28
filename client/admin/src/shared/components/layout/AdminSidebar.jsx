import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  X,
  LayoutGrid,
  Users,
  MapPin,
  IndianRupee,
  ChevronDown,
  ChevronUp,
  ToggleRight,
  Activity,
  FileText,
  HelpCircle,
  Shield,
  ShieldCheck,
  LogOut,
  Trophy,
  Tag,
  QrCode,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";
import { Button } from "@kridaz/ui";


const AdminSidebar = ({ isOpen, toggleSidebar, isMinimized, className }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState("");

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const toggleMenu = (label) => {
    setOpenMenu(openMenu === label ? "" : label);
  };

  const mainNavItems = [
    { to: "/admin", label: "Dashboard", icon: LayoutGrid },
    {
      to: "/admin/verification-center",
      label: "Verification Center",
      icon: ShieldCheck,
    },
    {
      label: "Roles",
      icon: Users,
      subItems: [
        { to: "/admin/professionals/all", label: "All Professionals" },
        { to: "/admin/owners", label: "Venue Owners" },
        { to: "/admin/professionals/coaches", label: "Coaches" },
        { to: "/admin/professionals/umpires", label: "Umpires" },
        { to: "/admin/professionals/scorers", label: "Scorers" },
        { to: "/admin/professionals/streamers", label: "Streamers" },
        { to: "/admin/users", label: "General Users" },
      ],
    },
    { to: "/admin/turfs", label: "Venues", icon: MapPin },
    { to: "/admin/games", label: "Hosted Games", icon: Trophy },
    {
      label: "Finance",
      icon: IndianRupee,
      subItems: [
        { to: "/admin/transactions", label: "Revenue" },
        { to: "/admin/finance", label: "Mission Control" },
      ],
    },
    {
      label: "Resolution",
      icon: HelpCircle,
      subItems: [
        { to: "/admin/support", label: "Tickets" },
        { to: "/admin/disputes", label: "Booking Disputes" },
        { to: "/admin/game-disputes", label: "Game Disputes" },
        { to: "/admin/reels-reports", label: "Reel Reports" },
      ],
    },
    { to: "/admin/audit", label: "Audit Logs", icon: Shield },
    { to: "/admin/error-logs", label: "System Errors", icon: Shield },
    { to: "/admin/marketing", label: "Marketing", icon: Activity },
    { to: "/admin/banner-ads", label: "Banner Ads", icon: Tag },
    { to: "/admin/home-ui-updates", label: "Home UI Updates", icon: LayoutGrid },
    { to: "/admin/qrcodes", label: "QR Codes", icon: QrCode },
    { to: "/admin/coupons", label: "Coupons", icon: Tag },
    { to: "/admin/blogs", label: "Blogs", icon: FileText },
    {
      label: "Community",
      icon: Users,
      subItems: [
        { to: "/admin/community", label: "Management" },
        { to: "/admin/community-posts", label: "Reported Posts" },
      ],
    },
    { to: "/admin/features", label: "Features", icon: ToggleRight },
    { to: "/admin/support", label: "Docs & Support", icon: HelpCircle },
  ];

  const bottomNavItems = [
    { label: "Sign Out", icon: LogOut, action: "logout" },
  ];

  const renderNavItem = (item) => {
    const isLogout = item.action === "logout";
    const isActive =
      !isLogout &&
      (item.to
        ? location.pathname === item.to
        : item.subItems?.some((sub) => location.pathname === sub.to));
    const Icon = item.icon;
    const isMenuOpen = openMenu === item.label;

    if (item.subItems) {
      return (
        <div key={item.label} className="space-y-1">
          <Button
            onClick={() => !isMinimized && toggleMenu(item.label)}
            className={`flex items-center justify-between w-full px-4 py-3 group relative transition-all duration-300 ${isActive ? "text-black" : "text-white/40 hover:text-white"}`}
          >
            {isActive && (
              <div className="absolute inset-x-2 inset-y-1 bg-primary rounded-[8px] -z-10 shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all duration-300" />
            )}
            {!isActive && (
              <div className="absolute inset-x-2 inset-y-1 bg-white/5 rounded-[8px] -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            )}

            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center justify-center w-6">
                <Icon
                  size={18}
                  className={`transition-colors ${isActive ? "text-black" : "text-white/20 group-hover:text-primary"}`}
                />
              </div>
              <span
                className={`font-medium text-sm tracking-wide ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto"}`}
              >
                {item.label}
              </span>
            </div>

            {!isMinimized && (
              <div className="transition-all duration-300">
                {isMenuOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </div>
            )}
          </Button>

          <div
            className={`overflow-hidden transition-all duration-500 ${!isMinimized && isMenuOpen ? "max-h-96 opacity-100 mb-2" : "max-h-0 opacity-0"}`}
          >
            <div className="ml-10 space-y-1 border-l border-white/10 mt-1">
              {item.subItems.map((subItem) => {
                const isSubActive = location.pathname === subItem.to;
                return (
                  <Link
                    key={subItem.to}
                    to={subItem.to}
                    className={`flex items-center px-4 py-2 transition-all duration-300 ${isSubActive ? "text-primary" : "text-white/30 hover:text-white"}`}
                  >
                    <span
                      className={`font-medium tracking-wide ${isSubActive ? "text-sm" : "text-xs"}`}
                    >
                      {subItem.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.to || item.label}
        to={item.to || "#"}
        className={`flex items-center px-4 py-3 group relative transition-all duration-300 ${isLogout ? "text-white/40 hover:text-red-500" : isActive ? "text-black" : "text-white/40 hover:text-white"}`}
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
        {isActive && !isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-primary rounded-[8px] -z-10 shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all duration-300" />
        )}

        {!isActive && !isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-white/5 rounded-[8px] -z-10 opacity-0 group-hover:opacity-100 transition-all duration-300" />
        )}

        {isLogout && (
          <div className="absolute inset-x-2 inset-y-1 bg-white/5 rounded-[8px] -z-10 opacity-0 group-hover:opacity-100 group-hover:bg-red-500/10 transition-all duration-300" />
        )}

        <div className="flex-shrink-0 flex items-center justify-center w-6">
          <Icon
            size={18}
            className={`transition-colors duration-300 ${isLogout ? "text-white/20 group-hover:text-red-500" : isActive ? "text-black" : "text-white/20 group-hover:text-primary"}`}
          />
        </div>

        <span
          className={`font-medium text-sm tracking-wide ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto"}`}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] sidebar-glass border-r border-white/5 overflow-x-hidden transition-all duration-300 ease-in-out z-40 flex flex-col ${isMinimized ? "lg:w-20" : "w-64"} ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${className || ""}`}
    >
      <div className="flex flex-col p-4 border-b border-white/5 bg-black/20 gap-4 lg:hidden">
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
        <nav className="px-2 space-y-1">{mainNavItems.map(renderNavItem)}</nav>
      </div>

      <div className="p-2 border-t border-white/5 space-y-1 mb-4">
        {bottomNavItems.map(renderNavItem)}
      </div>
    </aside>
  );
};

export default AdminSidebar;
