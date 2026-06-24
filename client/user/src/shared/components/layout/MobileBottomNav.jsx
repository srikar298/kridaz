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

const StadiumIcon = ({ size = 24, className }) => {
  const adjustedSize = size + 4;
  return (
    <svg width={adjustedSize} height={adjustedSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 7V3L7 5L3 7ZM18 7V3L22 5L18 7ZM11 6V2L15 4L11 6ZM11 22C9.73333 21.9667 8.55433 21.8627 7.463 21.688C6.37167 21.5133 5.42167 21.2923 4.613 21.025C3.80433 20.7577 3.16667 20.4493 2.7 20.1C2.23333 19.7507 2 19.384 2 19V10C2 9.58333 2.26267 9.196 2.788 8.838C3.31333 8.48 4.02567 8.16333 4.925 7.888C5.82433 7.61267 6.88267 7.396 8.1 7.238C9.31733 7.08 10.6173 7.00067 12 7C13.3827 6.99933 14.6827 7.07867 15.9 7.238C17.1173 7.39733 18.1757 7.614 19.075 7.888C19.9743 8.162 20.687 8.47867 21.213 8.838C21.739 9.19733 22.0013 9.58467 22 10V19C22 19.3833 21.7667 19.75 21.3 20.1C20.8333 20.45 20.196 20.7583 19.388 21.025C18.58 21.2917 17.63 21.5127 16.538 21.688C15.446 21.8633 14.2667 21.9673 13 22V18H11V22ZM12 11C13.6167 11 15.0127 10.904 16.188 10.712C17.3633 10.52 18.3007 10.2993 19 10.05C19 9.96667 18.3667 9.771 17.1 9.463C15.8333 9.155 14.1333 9.00067 12 9C9.86667 8.99933 8.16667 9.15367 6.9 9.463C5.63333 9.77233 5 9.968 5 10.05C5.7 10.3 6.63733 10.521 7.812 10.713C8.98667 10.905 10.3827 11.0007 12 11ZM9 19.85V16H15V19.85C16.3333 19.7167 17.425 19.521 18.275 19.263C19.125 19.005 19.7 18.7757 20 18.575V11.8C19.0833 12.1667 17.9333 12.4583 16.55 12.675C15.1667 12.8917 13.65 13 12 13C10.35 13 8.83333 12.8917 7.45 12.675C6.06667 12.4583 4.91667 12.1667 4 11.8V18.575C4.3 18.775 4.875 19.0043 5.725 19.263C6.575 19.5217 7.66667 19.7173 9 19.85Z" fill="currentColor"/>
    </svg>
  );
};

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
    { name: "Venues", path: "/venues", icon: StadiumIcon },
    { name: "Players", path: "/players", icon: UserSearch },
    { name: "Join Game", path: "/join-games", icon: Trophy },
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
