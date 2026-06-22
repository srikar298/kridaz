import React from "react";
import { Link } from "react-router-dom";

export default function DashboardHero() {
  return (
    <div className="grid grid-cols-4 gap-2 md:gap-3 mb-0 w-full pb-0 px-2">
      {/* Leaderboard / Players Nearby */}
      <Link
        to="/players"
        className="w-full flex flex-col items-center gap-1.5 md:gap-2 cursor-pointer group"
      >
        <div
          className="relative w-full rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square transition-all duration-300 shadow-xl border border-[#EBEBEB]/15 group-hover:scale-[1.02]"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, #2087FF 0%, #0E49B5 45%, #031533 100%)",
          }}
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
          <img
            src="/3d_map_location.svg"
            alt="Leaderboard Map Icon"
            className="absolute inset-0 w-full h-full object-contain p-[5%] pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
          />
        </div>
        <div className="h-[28px] flex items-start justify-center">
          <span
            className="text-[7px] md:text-[9px] font-normal text-white/70 uppercase whitespace-nowrap text-center leading-tight group-hover:text-white transition-colors"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Players Nearby
          </span>
        </div>
      </Link>

      {/* Scoring */}
      <Link
        to="/my-teams"
        state={{ openStartScoringModal: true }}
        className="w-full flex flex-col items-center gap-1.5 md:gap-2 cursor-pointer group"
      >
        <div
          className="relative w-full rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square transition-all duration-300 shadow-xl border border-[#EBEBEB]/15 group-hover:scale-[1.02]"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, #FF9800 0%, #E65100 45%, #3E1700 100%)",
          }}
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
          <img
            src="/3d_scoreboard_v2.png"
            alt="Scorer Icon"
            className="absolute inset-0 w-full h-full object-contain p-[2.5%] pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
          />
        </div>
        <div className="h-[28px] flex items-start justify-center">
          <span
            className="text-[7px] md:text-[9px] font-normal text-white/70 uppercase whitespace-nowrap text-center leading-tight group-hover:text-white transition-colors"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Score Match
          </span>
        </div>
      </Link>

      {/* Host & Join Games */}
      <Link
        to="/join-games"
        className="w-full flex flex-col items-center gap-1.5 md:gap-2 cursor-pointer group"
      >
        <div
          className="relative w-full rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square transition-all duration-300 shadow-xl border border-[#EBEBEB]/15 group-hover:scale-[1.02]"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, var(--success) 0%, #15803D 45%, #032512 100%)",
          }}
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
          <img
            src="/3d_whistle.svg"
            alt="Host & Join Games Whistle Icon"
            className="absolute inset-0 w-full h-full object-contain p-[2.5%] pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
          />
        </div>
        <div className="h-[28px] flex items-start justify-center">
          <span
            className="text-[7px] md:text-[9px] font-normal text-white/70 uppercase whitespace-nowrap text-center leading-tight group-hover:text-white transition-colors"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Join Game
          </span>
        </div>
      </Link>

      {/* Pros */}
      <Link
        to="/professionals"
        className="w-full flex flex-col items-center gap-1.5 md:gap-2 cursor-pointer group"
      >
        <div
          className="relative w-full rounded-[12px] overflow-visible force-overflow-visible flex items-center justify-center aspect-square transition-all duration-300 shadow-xl border border-[#EBEBEB]/15 group-hover:scale-[1.02]"
          style={{
            background:
              "radial-gradient(circle at 80% 50%, #FFA2FF 0%, #A726E2 50%, #220038 100%)",
          }}
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[12px]" />
          <img
            src="/sports/3d_professional_v2.png"
            alt="Pros Icon"
            className="absolute inset-0 w-full h-full object-contain p-[10%] pointer-events-none transform group-hover:scale-110 transition-all duration-300 z-10"
          />
        </div>
        <div className="h-[28px] flex items-start justify-center">
          <span
            className="text-[7px] md:text-[9px] font-normal text-white/70 uppercase whitespace-nowrap text-center leading-tight group-hover:text-white transition-colors"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Pro's
          </span>
        </div>
      </Link>
    </div>
  );
}
