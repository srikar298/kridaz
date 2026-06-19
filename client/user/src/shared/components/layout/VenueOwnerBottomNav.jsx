import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useScrollDirection } from "@hooks/useScrollDirection.js";
import {
  LayoutGrid,
  BookOpen,
  MapPin,
  Users,
  IndianRupee,
  BarChart3,
  Star,
  Landmark,
} from "lucide-react";

const VenueOwnerBottomNav = () => {
  const location = useLocation();
  const { scrollDirection } = useScrollDirection();

  const mainNavItems = [
    { to: "/venue-owner", label: "Dashboard", icon: LayoutGrid },
    { to: "/venue-owner/bookings", label: "Bookings", icon: BookOpen },
    { to: "/venue-owner/turfs", label: "Grounds", icon: MapPin },
    { to: "/venue-owner/customers", label: "Customers", icon: Users },
    { to: "/venue-owner/intelligence", label: "Intelligence", icon: BarChart3 },
    { to: "/venue-owner/revenue", label: "Revenue", icon: IndianRupee },
    { to: "/venue-owner/banking", label: "Banking", icon: Landmark },
    { to: "/venue-owner/reviews", label: "Reviews", icon: Star },
  ];

  return (
    <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#000000] border-t border-[#2D2D2D] shadow-[0_-5px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 ${scrollDirection === "down" ? "translate-y-full" : "translate-y-0"}`}>
      <div className="flex overflow-x-auto no-scrollbar items-center justify-start px-2 py-2 gap-1 pb-safe">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center justify-center min-w-[70px] w-auto h-12 rounded-lg transition-all duration-300 gap-1
                ${isActive ? "text-[#BFF367]" : "text-[#878C9F] hover:text-white"}`}
            >
              <div
                className={`relative flex items-center justify-center transition-all duration-300 ${isActive ? "scale-110" : ""}`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={`text-[8px] font-black uppercase tracking-wider whitespace-nowrap px-1 transition-all duration-300 ${isActive ? "opacity-100" : "opacity-60"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default VenueOwnerBottomNav;
