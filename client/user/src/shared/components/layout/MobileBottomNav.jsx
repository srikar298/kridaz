import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useScrollDirection } from "@hooks/useScrollDirection.js";
import {
  Home,
  Search,
  Users,
  UserSearch,
  Trophy,
  Plus,
  PenSquare,
  MessageCircle,
  Briefcase,
  Wallet,
  MapPin,
} from "lucide-react";
import { useSelector } from "react-redux";

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);
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
      navigate("/search");
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
    { name: "Venues", path: "/venues", icon: MapPin },
    { name: "Players", path: "/players", icon: UserSearch },
    { name: "My Teams", path: "/my-teams", icon: Users },
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
    { title: "Join Game", path: "/join-games", icon: Trophy, isSpecial: false },
    {
      title: "Wallet",
      path: "/wallet",
      icon: Wallet,
      isSpecial: false,
    },
    { title: "Professionals", path: "/professionals", icon: Briefcase, isSpecial: false },
  ];

  // Filter items based on login status and role
  const visibleItems = navItems.filter((item) => {
    if (item.protected && !isLoggedIn) return false;
    return true;
  });

  // Split into left (before +) and right (after +)
  const leftItems = visibleItems.slice(0, 2);
  const rightItems = visibleItems.slice(2, 4);

  return (
    <>
      {/* Blurred Click-away Overlay (Only covers bottom area) */}
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
        className={`lg:hidden fixed left-4 right-4 z-[100] flex flex-col justify-end pointer-events-none mb-4 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${scrollDirection === "down" && !isMenuOpen ? "translate-y-[150%]" : "translate-y-0"}`}
        style={{ bottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className={`relative w-full pointer-events-auto overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${
            isMenuOpen
              ? "h-[130px] rounded-[32px] bg-[#050505]/90 backdrop-blur-3xl"
              : "h-[60px] rounded-full bg-[#050505]/70 backdrop-blur-2xl"
          }`}
        >
          {/* Popup Items Row */}
          <div
            className={`absolute top-2 left-0 w-full h-[60px] flex items-center justify-around px-2 transition-all duration-300 ease-in-out ${
              isMenuOpen
                ? "opacity-100 translate-y-0 delay-75 pointer-events-auto"
                : "opacity-0 translate-y-4 pointer-events-none"
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
                      : "text-white/40 group-hover:text-white/80"
                  }`}
                >
                  <item.icon size={22} strokeWidth={item.isSpecial ? 2.5 : 2} />
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom Row (Main Floating Bar) */}
          <div className="absolute bottom-0 left-0 w-full h-[60px] grid grid-cols-5 items-center px-1 pb-0 z-50">
            {/* Left Nav Items */}
            {leftItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div
                  key={item.name}
                  className="flex justify-center items-center h-full relative z-10"
                >
                  <Link
                    to={item.path}
                    onClick={handleClose}
                    className="flex flex-col items-center justify-center p-2 transition-colors group"
                  >
                    <div
                      className={`relative flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "w-11 h-11 text-[#BFF367]"
                          : "w-11 h-11 text-white/40 group-hover:text-white/80 group-hover:scale-110"
                      }`}
                    >
                      <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* Center Floating Actions Container */}
            <div className="flex justify-center items-center h-full relative z-50">
              <div className="absolute bottom-[8px] flex justify-center items-center">
                <button
                  onClick={handleToggle}
                  className={`relative flex items-center justify-center w-[44px] h-[44px] rounded-full text-black transition-all duration-500 border-[3px] border-[#050505] overflow-hidden ${
                    isMenuOpen ? "bg-[#aade55]" : "bg-[#BFF367]"
                  }`}
                >
                  <Plus
                    size={22}
                    strokeWidth={3.5}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out ${isMenuOpen ? "opacity-0 scale-50 rotate-90" : "opacity-100 scale-100 rotate-0"}`}
                  />
                  <Search
                    size={20}
                    strokeWidth={3}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out ${isMenuOpen ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-90"}`}
                  />
                </button>
              </div>
            </div>

            {/* Right Nav Items */}
            {rightItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div
                  key={item.name}
                  className="flex justify-center items-center h-full relative z-10"
                >
                  <Link
                    to={item.path}
                    onClick={handleClose}
                    className="flex flex-col items-center justify-center p-2 transition-colors group"
                  >
                    <div
                      className={`relative flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "w-11 h-11 text-[#BFF367]"
                          : "w-11 h-11 text-white/40 group-hover:text-white/80 group-hover:scale-110"
                      }`}
                    >
                      <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>


    </>
  );
};

export default MobileBottomNav;
