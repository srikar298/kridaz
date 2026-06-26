import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Edit2, Trash2, Tag, Star, Eye, EyeOff } from "lucide-react";import { Button } from "@kridaz/ui";


const TurfCard = ({ turf, onEdit, onDelete, onToggleVisibility }) => {
  const mediaItems =
    turf.images?.length > 0 ? turf.images : [turf.image].filter(Boolean);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (mediaItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [mediaItems.length]);

  const isVideo = (url) =>
    url && typeof url === "string" && url.match(/\.(mp4|webm|ogg)$/i);

  return (
    <div className="bg-card border border-white/10 rounded-[16px] overflow-hidden group hover:border-primary/30 transition-all duration-500 h-full flex flex-col shadow-[var(--shadow-2)] relative">
      <Link
        to={`/venue-owner/turf/${turf._id}`}
        className="block aspect-video relative overflow-hidden group/media"
      >
        {mediaItems.length > 0 ? (
          mediaItems.map((media, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"}`}
            >
              {isVideo(media) ? (
                <video
                  src={media}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="object-cover w-full h-full opacity-80 group-hover/media:opacity-100 transition-opacity duration-700"
                />
              ) : (
                <img
                  src={media}
                  alt={turf.name}
                  className="object-cover w-full h-full opacity-80 group-hover/media:opacity-100 transition-all duration-700 group-hover/media:scale-105 transform"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/banner-2.png";
                  }}
                />
              )}
            </div>
          ))
        ) : (
          <img
            src="/banner-2.png"
            alt={turf.name}
            className="object-cover w-full h-full opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-20 pointer-events-none" />

        {/* Status Icon Overlay (Top Right) */}
        {!turf.isActive && (
          <div
            className="absolute top-3 right-3 z-30 bg-black/80 backdrop-blur-md border border-red-500/50 text-red-500 p-1.5 rounded-[16px] shadow-2xl"
            title="Venue Hidden"
          >
            <EyeOff size={10} />
          </div>
        )}
      </Link>

      <div className="p-2 md:p-3 flex flex-col flex-grow relative">
        <Link
          to={`/venue-owner/turf/${turf._id}`}
          className="block group/title"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="space-y-1">
              <h2 className="text-[11px] md:text-[13px] font-bold text-white uppercase tracking-widest group-hover/title:text-primary transition-colors font-open-sans">
                {turf.name}
              </h2>
              <div className="flex items-center gap-1.5">
                <div
                  className={`px-1.5 py-0.5 rounded-[16px] text-[8px] font-bold uppercase tracking-widest border ${turf.status === "approved" ? "bg-primary/10 border-primary/20 text-primary" : turf.status === "rejected" ? "bg-red-500/10 border-red-500/20 text-red-500" : turf.status === "decommissioned" ? "bg-orange-500/10 border-orange-500/20 text-orange-500" : turf.status === "deleted" ? "bg-zinc-800 border-zinc-700 text-zinc-500" : "bg-card border-white/10 text-yellow-500"}`}
                >
                  {turf.status}
                </div>
                <span className="text-[8px] text-[#444] font-medium uppercase tracking-widest">
                  G
                </span>
                <div className="flex items-center text-white/70 text-[8px] font-bold uppercase tracking-widest">
                  {turf.status === "decommissioned" ? (
                    <span className="text-orange-500/80 animate-pulse">
                      Action Required: Re-apply
                    </span>
                  ) : (
                    turf.location
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center bg-card px-1.5 py-0.5 rounded-[16px] border border-white/10 mt-0.5">
              <Star size={8} className="text-primary mr-1 fill-primary" />
              <span className="text-[8px] font-bold text-white font-open-sans">
                {turf.avgRating ? turf.avgRating.toFixed(1) : "NEW"}
              </span>
            </div>
          </div>
        </Link>

        <p className="text-white/70 font-inter text-[10px] md:text-[11px] leading-relaxed line-clamp-2 mb-2 md:mb-3 h-[28px] md:h-[32px]">
          {turf.description || "No description provided for this venue."}
        </p>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between">
            <button className="flex flex-row flex-nowrap items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 bg-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none hover:bg-white text-black rounded-[16px] text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all shadow-[0_5px_15px_rgba(204,255,0,0.1)] !h-6 !min-h-0 w-fit shrink-0">
              <Tag size={10} />
              Promotion
            </button>

            <div className="flex items-center gap-1.5">
              <Button
                onClick={onEdit}
                className="w-6 h-6 md:w-7 md:h-7 bg-card border border-white/10 hover:border-primary/40 text-white/70 hover:text-primary !min-h-0 rounded-full transition-all flex items-center justify-center group/btn"
              >
                <Edit2 size={11} />
              </Button>

              <Button
                onClick={onToggleVisibility}
                className={`w-6 h-6 md:w-7 md:h-7 !min-h-0 rounded-full transition-all flex items-center justify-center border ${turf.isActive ? "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10" : "bg-black border-white/10 text-[#444] hover:text-white"}`}
               aria-label="Toggle menu">
                {turf.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
              </Button>

              <Button
                onClick={onDelete}
                className="w-6 h-6 md:w-7 md:h-7 bg-card border border-white/10 hover:border-red-500/40 text-white/70 hover:text-red-500 !min-h-0 rounded-full transition-all flex items-center justify-center"
              >
                <Trash2 size={11} />
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TurfCard;
