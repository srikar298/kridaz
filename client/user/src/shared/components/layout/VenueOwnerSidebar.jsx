import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  X,
  LayoutGrid,
  BookOpen,
  MapPin,
  Users,
  IndianRupee,
  BarChart3,
  Star,
  Tag,
  HelpCircle,
  Landmark,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";import { Button } from "@kridaz/ui";


const PartnerSidebar = ({ isOpen, toggleSidebar, isMinimized, className }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const mainNavItems = [
    { to: "/venue-owner", label: "Dashboard", icon: LayoutGrid },
    { to: "/venue-owner/bookings", label: "Bookings", icon: BookOpen },
    { to: "/venue-owner/turfs", label: "enues", icon: MapPin },
    { to: "/venue-owner/customers", label: "Customers", icon: Users },
    { to: "/venue-owner/intelligence", label: "Intelligence", icon: BarChart3 },
    { to: "/venue-owner/revenue", label: "Revenue", icon: IndianRupee },
    { to: "/venue-owner/banking", label: "Payout & Banking", icon: Landmark },
    { to: "/venue-owner/reviews", label: "Reviews", icon: Star },
  ];

  const renderNavItem = (item) => {
    const isLogout = item.action === "logout";
    const isActive = !isLogout && location.pathname === item.to;
    const Icon = item.icon;

    return (
      <Link
        key={item.to || item.label}
        to={item.to || "#"}
        className={`flex items-center h-[48px] px-4 group relative transition-all duration-300 rounded-[8px] mx-2 mb-1 border border-transparent ${isActive ? "bg-primary text-black shadow-[0_4px_15px_rgba(204,255,0,0.2)] border-primary/20" : "bg-transparent text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/10"} ${isLogout ? "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20" : ""}`}
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
        <div className="flex-shrink-0 flex items-center justify-center w-6">
          <Icon
            size={20}
            className={`transition-colors duration-300 ${isActive ? "text-black" : "text-muted-foreground group-hover:text-primary"} ${isLogout ? "group-hover:text-red-500" : ""}`}
          />
        </div>

        <span
          className={`text-[13px] font-bold uppercase tracking-widest ml-4 whitespace-nowrap overflow-hidden transition-all duration-300 ${isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto"} ${isActive ? "text-black" : ""}`}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <aside
      className={`hidden lg:flex fixed left-0 top-16 lg:top-20 h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] sidebar-glass border-r border-border overflow-x-hidden transition-all duration-300 ease-in-out z-40 flex-col ${isMinimized ? "lg:w-20" : "w-64 lg:w-[280px]"} ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${className || ""}`}
    >
      <div className="flex flex-col p-4 border-b border-border bg-background gap-4 lg:hidden">
        <div className="flex items-center justify-end">
          <Button
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-6">
        <nav className="space-y-1">{mainNavItems.map(renderNavItem)}</nav>
      </div>
    </aside>
  );
};

export default PartnerSidebar;
