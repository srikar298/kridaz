import React from "react";
import { Link } from "react-router-dom";

export default function DashboardHero() {
  return (
    <div className="grid grid-cols-4 gap-2 md:gap-3 mb-0 w-full pb-0 px-2">
      {/* Players Nearby */}
      <Link
        to="/players"
        className="relative w-full h-[90px] md:h-[110px] bg-[#1B1B1B] border border-[#434242] rounded-[12px] overflow-hidden flex flex-col items-start justify-start p-2.5 cursor-pointer shadow-lg"
      >
        <div 
          className="absolute pointer-events-none z-0"
          style={{
            width: '81.88px',
            height: '48.91px',
            top: '-30px',
            left: '-33px',
            transform: 'rotate(-39.56deg)',
            backgroundColor: 'rgba(73, 170, 233, 0.4)',
            opacity: 0.6,
            filter: 'blur(20px)'
          }}
        />
        <span
          className="text-[12px] font-medium text-white leading-[1.2] z-10 text-left tracking-normal"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Players<br />Nearby
        </span>
        <img
          src="/3d-map-location.png"
          alt="Players Nearby Icon"
          className="absolute -bottom-1 -right-2 w-[80px] h-[80px] md:w-[90px] md:h-[90px] object-contain object-right-bottom z-10 pointer-events-none"
        />
      </Link>

      {/* Scoring */}
      <Link
        to="/my-teams"
        state={{ openStartScoringModal: true }}
        className="relative w-full h-[90px] md:h-[110px] bg-[#1B1B1B] border border-[#434242] rounded-[12px] overflow-hidden flex flex-col items-start justify-start p-2.5 cursor-pointer shadow-lg"
      >
        <div 
          className="absolute pointer-events-none z-0"
          style={{
            width: '81.88px',
            height: '48.91px',
            top: '-30px',
            left: '-33.25px',
            transform: 'rotate(-39.56deg)',
            backgroundColor: 'rgba(249, 159, 67, 0.4)',
            opacity: 0.6,
            filter: 'blur(20px)'
          }}
        />
        <span
          className="text-[12px] font-medium text-white leading-[1.2] z-10 text-left tracking-normal"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Score<br />Match
        </span>
        <img
          src="/3d-scoreboard-v2.webp"
          alt="Scorer Icon"
          className="absolute object-contain z-10 pointer-events-none"
          style={{
            width: '61.62px',
            height: '51.26px',
            top: '50px',
            left: '28px',
            transform: 'rotate(12deg) scale(1.25)'
          }}
        />
      </Link>

      {/* Host & Join Games */}
      <Link
        to="/join-games"
        className="relative w-full h-[90px] md:h-[110px] bg-[#1B1B1B] border border-[#434242] rounded-[12px] overflow-hidden flex flex-col items-start justify-start p-2.5 cursor-pointer shadow-lg"
      >
        <div 
          className="absolute pointer-events-none z-0"
          style={{
            width: '81.88px',
            height: '48.91px',
            top: '-30px',
            left: '-32.5px',
            transform: 'rotate(-39.56deg)',
            backgroundColor: 'rgba(66, 154, 65, 0.4)',
            opacity: 0.6,
            filter: 'blur(20px)'
          }}
        />
        <span
          className="text-[12px] font-medium text-white leading-[1.2] z-10 text-left tracking-normal"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Join<br />Game
        </span>
        <img
          src="/3d-whistle.png"
          alt="Host & Join Games Icon"
          className="absolute -bottom-4 -right-4 w-[115px] h-[115px] md:w-[125px] md:h-[125px] object-contain object-right-bottom z-10 pointer-events-none -scale-x-100"
        />
      </Link>

      {/* Pros */}
      <Link
        to="/professionals"
        className="relative w-full h-[90px] md:h-[110px] bg-[#1B1B1B] border border-[#434242] rounded-[12px] overflow-hidden flex flex-col items-start justify-start p-2.5 cursor-pointer shadow-lg"
      >
        <div 
          className="absolute pointer-events-none z-0"
          style={{
            width: '81.88px',
            height: '48.91px',
            top: '-30px',
            left: '-32.75px',
            transform: 'rotate(-39.56deg)',
            backgroundColor: 'rgba(117, 58, 216, 0.4)',
            opacity: 0.6,
            filter: 'blur(20px)'
          }}
        />
        <span
          className="text-[12px] font-medium text-white leading-[1.2] z-10 text-left tracking-normal"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Pro's
        </span>
        <img
          src="/sports/3d-professional-v2.webp"
          alt="Pros Icon"
          className="absolute -bottom-1.5 -right-6 w-[65px] h-[65px] md:w-[70px] md:h-[70px] object-contain object-right-bottom z-10 pointer-events-none -rotate-6 -scale-x-100"
        />
      </Link>
    </div>
  );
}
