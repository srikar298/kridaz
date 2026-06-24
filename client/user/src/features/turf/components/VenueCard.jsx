import React from "react";
import { Heart, MapPin, Star } from "lucide-react";

const VenueCard = ({ t, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="block relative w-full h-full rounded-[12px] overflow-hidden group bg-card border-2 border-gray-600/60 hover:border-white/40 transition-all duration-300 shadow-lg cursor-pointer"
    >
      {/* Normal Card Content */}
      <div className="absolute inset-0 w-full h-full bg-card">
        <img
          src={
            t.images?.[0] ||
            t.image ||
            "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80"
          }
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80";
          }}
          alt={t.name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 pointer-events-none"
        />

        {/* Dark gradient at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 z-0 pointer-events-none" />

        {/* Heart Icon top right */}
        <div className="absolute top-4 right-4 z-10">
          <button
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform shadow-md border-0 outline-none p-0 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Heart size={16} className="text-green-600" strokeWidth={2} />
          </button>
        </div>

        {/* Bottom Details Section */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex flex-col gap-3 pointer-events-none">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end gap-2">
              <h3
                className="text-[18px] font-bold text-white leading-tight line-clamp-2"
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                {t.name}
              </h3>
            </div>
          </div>

          {/* Location & Rating Row */}
          <div className="flex justify-between items-center mt-1 w-full gap-1 overflow-hidden">
            {/* Plain Text Location */}
            <div className="flex items-center gap-0.5 text-white/80 min-w-0">
              <MapPin size={8} className="text-white/70 shrink-0" />
              <span className="text-[8px] font-medium whitespace-nowrap truncate">
                {t.distance ? `${Math.round(t.distance)} km` : "1 km"} away
              </span>
            </div>

            {/* Rating Pill on the right */}
            <div className="flex items-center gap-0.5 px-1 py-0.5 bg-white/20 backdrop-blur-md rounded-full border border-white/10 shrink-0">
              <Star size={8} className="text-white" fill="currentColor" />
              <span className="text-[8px] font-semibold text-white">
                {t.averageRating || t.avgRating || t.rating || "4.8"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
