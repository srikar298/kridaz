import React from "react";
import { useNavigate } from "react-router-dom";

const sportsCategories = [
  { name: "Basketball", image: "/🏀.svg" },
  { name: "Badminton", image: "/🏸.svg" },
  { name: "Football", image: "/⚽.svg" },
  { name: "Cricket", image: "/🏏.svg" },
  { name: "Tennis", image: "/sports/tennis.png" },
  { name: "Table Tennis", image: "/sports/table-tennis.png" },
  { name: "Pickleball", image: "/sports/pickleball.png" },
  { name: "Volleyball", image: "/sports/volleyball.png" },
];

export default function SportsCategoriesSection() {
  const navigate = useNavigate();

  return (
    <div className="!mt-8 mb-6 px-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 
          className="text-[16px] font-semibold text-white tracking-wide" 
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Sports Category
        </h2>
      </div>
      <div className="flex overflow-x-auto no-scrollbar gap-[14px] pb-4 snap-x snap-mandatory pt-4">
        {sportsCategories.map((sport, index) => (
          <div
            key={index}
            onClick={() =>
              navigate(`/search?q=${encodeURIComponent(sport.name)}`)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/search?q=${encodeURIComponent(sport.name)}`);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Search ${sport.name}`}
            className="relative w-[76px] h-[68px] mt-[3px] cursor-pointer snap-start shrink-0 focus:outline-none focus:ring-2 focus:ring-primary transition-transform active:scale-95 group"
          >
            {/* Back Card (3D Rim) */}
            <div className="absolute top-[-3px] left-0 w-[76px] h-[68px] rounded-[13px] bg-[#363636]"></div>

            {/* Front Card */}
            <div className="absolute bottom-0 left-0 w-[76px] h-[62px] rounded-[13px] border border-[#434242] bg-[#1B1B1B] z-10 flex flex-col items-center justify-end pb-1.5 shadow-lg">
              {/* Text Label */}
              <span 
                className="text-white text-[11px] font-medium leading-none" 
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {sport.name}
              </span>
            </div>

            {/* Pop-out 3D Image */}
            <img
              src={sport.image}
              alt={sport.name}
              loading="lazy"
              className={`absolute -top-7 left-1/2 -translate-x-1/2 w-[52px] h-[52px] object-contain z-20 drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] group-hover:-translate-y-1 transition-transform duration-300 ${sport.name === "Basketball" || sport.name === "Pickleball" ? "scale-[0.9]" : ""}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
