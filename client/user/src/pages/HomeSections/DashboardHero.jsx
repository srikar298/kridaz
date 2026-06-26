import React from "react";
import { Link } from "react-router-dom";

export default function DashboardHero() {
  return (
    <div className="grid grid-cols-2 gap-3 mb-0 w-full pb-0 px-2 mt-2">
      {/* My Bookings */}
      <Link
        to="/venues"
        className="relative w-full rounded-2xl flex items-center p-3 h-[72px] md:h-24 transition-transform duration-300 shadow-lg border border-white/10 hover:scale-[1.02] overflow-visible"
        style={{
          background: "linear-gradient(to right, #e85f04, #f5a623)",
        }}
      >
        <div className="flex flex-col z-10 max-w-[55%] justify-center h-full">
          <span 
            className="text-[11px] md:text-sm font-semibold text-white whitespace-nowrap mb-0.5 leading-tight" 
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Book Venue
          </span>
          <span className="text-[7px] md:text-[9px] text-white/80 leading-tight pr-1">
            All your games in one place.
          </span>
        </div>
        <img
          src="/3d-venue.png"
          alt="My Bookings"
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-[70px] h-[70px] md:w-28 md:h-28 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] pointer-events-none scale-[1.3]"
        />
      </Link>

      {/* Host a Game */}
      <Link
        to="/my-teams"
        state={{ openStartScoringModal: true }}
        className="relative w-full rounded-2xl flex items-center p-3 h-[72px] md:h-24 transition-transform duration-300 shadow-lg border border-white/10 hover:scale-[1.02] overflow-visible"
        style={{
          background: "linear-gradient(to right, #116834, #44d467)",
        }}
      >
        <div className="flex flex-col z-10 max-w-[55%] justify-center h-full">
          <span 
            className="text-[11px] md:text-sm font-semibold text-white whitespace-nowrap mb-0.5 leading-tight" 
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Host a Game
          </span>
          <span className="text-[7px] md:text-[9px] text-white/80 leading-tight pr-1">
            Create your match and invite.
          </span>
        </div>
        <img
          src="/3d-whistle.png"
          alt="Host a Game"
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-[70px] h-[70px] md:w-28 md:h-28 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] pointer-events-none scale-[1.3]"
        />
      </Link>

      {/* Score Match */}
      <Link
        to="/my-teams"
        state={{ openStartScoringModal: true }}
        className="relative w-full rounded-2xl flex items-center p-3 h-[72px] md:h-24 transition-transform duration-300 shadow-lg border border-white/10 hover:scale-[1.02] overflow-visible"
        style={{
          background: "linear-gradient(to right, #9a3412, #f97316)",
        }}
      >
        <div className="flex flex-col z-10 max-w-[55%] justify-center h-full">
          <span 
            className="text-[11px] md:text-sm font-semibold text-white whitespace-nowrap mb-0.5 leading-tight" 
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Score Match
          </span>
          <span className="text-[7px] md:text-[9px] text-white/80 leading-tight pr-1">
            Track and update scores.
          </span>
        </div>
        <img
          src="/3d-scoreboard-v2.webp"
          alt="Score Match"
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-[70px] h-[70px] md:w-28 md:h-28 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] pointer-events-none scale-[1.3]"
        />
      </Link>

      {/* Pro's */}
      <Link
        to="/professionals"
        className="relative w-full rounded-2xl flex items-center p-3 h-[72px] md:h-24 transition-transform duration-300 shadow-lg border border-white/10 hover:scale-[1.02] overflow-visible"
        style={{
          background: "linear-gradient(to right, #6b21a8, #d946ef)",
        }}
      >
        <div className="flex flex-col z-10 max-w-[55%] justify-center h-full">
          <span 
            className="text-[11px] md:text-sm font-semibold text-white whitespace-nowrap mb-0.5 leading-tight" 
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Find Pro's
          </span>
          <span className="text-[7px] md:text-[9px] text-white/80 leading-tight pr-1">
            Connect with professionals.
          </span>
        </div>
        <img
          src="/sports/3d-professional-v2.webp"
          alt="Pro's"
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-[70px] h-[70px] md:w-28 md:h-28 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] pointer-events-none scale-[1.3]"
        />
      </Link>
    </div>
  );
}
