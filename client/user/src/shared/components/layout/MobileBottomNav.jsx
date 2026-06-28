import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useScrollDirection } from "@hooks/useScrollDirection.js";
import {
  Home,
  Map,
  Gamepad2,
  User,
  Search,
  Users,
  Trophy,
  Plus,
  X,
  PenSquare,
  MessageCircle,
  Briefcase,
  Wallet,
  UserSearch,
} from "lucide-react";
import { useSelector } from "react-redux";

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn || !!state.auth?.token);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollDirection } = useScrollDirection();

  // Hide bottom nav when a modal sets the body attribute
  const [isHidden, setIsHidden] = useState(
    () => document.body.hasAttribute("data-hide-bottom-nav")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsHidden(document.body.hasAttribute("data-hide-bottom-nav"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-hide-bottom-nav"] });
    return () => observer.disconnect();
  }, []);

  if (isHidden) return null;

  const handleToggle = () => {
    if (isMenuOpen) {
      handleClose();
    } else {
      setIsMenuOpen(true);
    }
  };

  const handleClose = () => {
    setIsMenuOpen(false);
  };

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Venue", path: "/venues", icon: Map },
    { name: "Join Game", path: "/join-games", icon: Gamepad2 },
    { name: "Pro", path: "/professionals", icon: User },
  ];

  const popupItems = [
    {
      title: "Messages",
      path: "/messages",
      icon: MessageCircle,
      isSpecial: false,
    },
    {
      title: "Create Post",
      path: "/new-post",
      icon: PenSquare,
      isSpecial: false,
    },
    { title: "My Teams", path: "/my-teams", icon: Users, isSpecial: false },
    {
      title: "Wallet",
      path: "/wallet",
      icon: Wallet,
      isSpecial: false,
    },
    { title: "Players Nearby", path: "/players", icon: UserSearch, isSpecial: false },
  ];

  // Filter items based on login status and role
  const visibleItems = navItems.filter((item) => {
    if (item.protected && !isLoggedIn) return false;
    return true;
  });

  return (
    <>
      {/* Blurred Click-away Overlay */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[90] pointer-events-auto"
          onClick={handleClose}
        >
          <div
            className="absolute bottom-0 left-0 w-full h-[280px] backdrop-blur-xl bg-black/40 transition-all duration-300"
            style={{
              maskImage: "linear-gradient(to top, black 60%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to top, black 60%, transparent 100%)",
            }}
          />
        </div>
      )}

      {/* Floating Bottom Nav Container */}
      <div
        className={`lg:hidden fixed left-0 right-0 z-[100] flex flex-col items-center justify-end pointer-events-none pb-3 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          scrollDirection === "down" && !isMenuOpen ? "translate-y-[150%]" : "translate-y-0"
        }`}
        style={{ bottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Popup Menu (Floats ABOVE the navbar) */}
        <div 
          className={`w-full max-w-[363px] bg-[#050505]/95 backdrop-blur-3xl rounded-[24px] border border-white/10 flex items-center justify-around px-2 transition-all duration-300 ease-in-out pointer-events-auto mx-auto shadow-2xl ${
            isMenuOpen 
              ? "h-[56px] opacity-100 translate-y-0 mb-3" 
              : "h-0 opacity-0 translate-y-4 border-transparent overflow-hidden mb-0"
          }`}
        >
          {popupItems.map((item, i) => (
            <Link
              key={`primary-${i}`}
              to={item.path}
              state={item.state}
              onClick={handleClose}
              className="flex items-center justify-center group"
              title={item.title}
            >
              <div
                className={`w-11 h-11 flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 ${
                  item.isSpecial
                    ? "text-[#BFF367] drop-shadow-[0_0_10px_rgba(191,243,103,0.3)]"
                    : "text-white/50 group-hover:text-white/90"
                }`}
              >
                <item.icon size={22} strokeWidth={item.isSpecial ? 2.5 : 2} />
              </div>
            </Link>
          ))}
        </div>

        {/* Main Bottom Nav Row */}
        <div className="w-full flex items-center justify-center gap-2 pointer-events-auto px-4 max-w-[400px] mx-auto">
          
          {/* The flexible Pill */}
          <div className="flex-1 max-w-[291px] h-[56px] rounded-[28px] border border-white/15 bg-white/5 backdrop-blur-xl flex items-center justify-between p-[4px] shadow-lg">
            {visibleItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={handleClose}
                  className={`flex flex-col items-center justify-center rounded-[24px] transition-all duration-300 ${
                    isActive 
                      ? "w-[74px] h-full bg-white/[0.08] backdrop-blur-md border border-white/[0.14] shadow-[0_4px_30px_rgba(0,0,0,0.1)]" 
                      : "w-[54px] h-full hover:bg-white/5"
                  }`}
                >
                  <item.icon 
                    size={isActive ? 18 : 20} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className={isActive ? "text-[#bbf455]" : "text-white/50"} 
                  />
                  {isActive && (
                    <span 
                      className="text-[#bbf455] text-[10px] font-medium mt-[2px] leading-none" 
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* The + Button Circle (56x56) */}
          <button
            onClick={handleToggle}
            className={`w-[56px] h-[56px] rounded-full border border-white/15 bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-lg transition-transform duration-300 shrink-0 ${
              isMenuOpen ? "rotate-45 text-white/50" : "text-[#bbf455]"
            }`}
          >
            {isMenuOpen ? <X size={24} strokeWidth={2.5} /> : <Plus size={24} strokeWidth={2.5} />}
          </button>
          
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;
