import React from "react";
import { useNavigate } from "react-router-dom";

const sportsCategories = [
  { name: "Basketball", image: "/sports/basketball.png" },
  { name: "Badminton", image: "/sports/badminton.png" },
  { name: "Football", image: "/sports/football.png" },
  { name: "Cricket", image: "/sports/cricket.png" },
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
            <img
              src={sport.image}
              alt={sport.name}
              loading="lazy"
              className="w-full h-full object-contain group-hover:-translate-y-1 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
