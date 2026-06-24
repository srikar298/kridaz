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



const StadiumIcon = ({ size = 24, className }) => {
  const adjustedSize = size + 4;
  return (
    <svg width={adjustedSize} height={adjustedSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 7V3L7 5L3 7ZM18 7V3L22 5L18 7ZM11 6V2L15 4L11 6ZM11 22C9.73333 21.9667 8.55433 21.8627 7.463 21.688C6.37167 21.5133 5.42167 21.2923 4.613 21.025C3.80433 20.7577 3.16667 20.4493 2.7 20.1C2.23333 19.7507 2 19.384 2 19V10C2 9.58333 2.26267 9.196 2.788 8.838C3.31333 8.48 4.02567 8.16333 4.925 7.888C5.82433 7.61267 6.88267 7.396 8.1 7.238C9.31733 7.08 10.6173 7.00067 12 7C13.3827 6.99933 14.6827 7.07867 15.9 7.238C17.1173 7.39733 18.1757 7.614 19.075 7.888C19.9743 8.162 20.687 8.47867 21.213 8.838C21.739 9.19733 22.0013 9.58467 22 10V19C22 19.3833 21.7667 19.75 21.3 20.1C20.8333 20.45 20.196 20.7583 19.388 21.025C18.58 21.2917 17.63 21.5127 16.538 21.688C15.446 21.8633 14.2667 21.9673 13 22V18H11V22ZM12 11C13.6167 11 15.0127 10.904 16.188 10.712C17.3633 10.52 18.3007 10.2993 19 10.05C19 9.96667 18.3667 9.771 17.1 9.463C15.8333 9.155 14.1333 9.00067 12 9C9.86667 8.99933 8.16667 9.15367 6.9 9.463C5.63333 9.77233 5 9.968 5 10.05C5.7 10.3 6.63733 10.521 7.812 10.713C8.98667 10.905 10.3827 11.0007 12 11ZM9 19.85V16H15V19.85C16.3333 19.7167 17.425 19.521 18.275 19.263C19.125 19.005 19.7 18.7757 20 18.575V11.8C19.0833 12.1667 17.9333 12.4583 16.55 12.675C15.1667 12.8917 13.65 13 12 13C10.35 13 8.83333 12.8917 7.45 12.675C6.06667 12.4583 4.91667 12.1667 4 11.8V18.575C4.3 18.775 4.875 19.0043 5.725 19.263C6.575 19.5217 7.66667 19.7173 9 19.85Z" fill="currentColor"/>
    </svg>
  );
};

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
    { to: "/venue-owner/turfs", label: "Venues", icon: StadiumIcon },
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
