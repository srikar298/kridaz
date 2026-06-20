import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, MapPin, Check, MessageCircle } from "lucide-react";
import useLoginOnDemand from "@hooks/useLoginOnDemand";



export default function PlayersSection({
  loading,
  players,
  followingIds = [],
  handleFollowToggle,
}) {
  const navigate = useNavigate();
  const { gateInteraction } = useLoginOnDemand();

  return (
    <section className="mb-8 w-full">
      <div className="w-full">
        {/* Refined Section Header */}
        <div className="relative flex flex-row items-center justify-between gap-4 mb-6">
          <div className="relative">
            <h2
              className="text-[14px] font-black text-white tracking-tighter leading-none"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              Find Players{" "}
              <span className="text-primary">
                Near You
              </span>
            </h2>
          </div>
          <Link
            to="/players"
            className="flex items-center gap-1 font-semibold text-[10px] md:text-[15px] transition-all hover:text-primary text-[#888] whitespace-nowrap"
          >
            View More <span className="hidden md:inline">Players</span>
          </Link>
        </div>

        {/* Player cards — 10 in one scrollable row */}
        {loading ? (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[44vw] sm:w-[155px] md:w-[175px] h-[220px] snap-start rounded-[16px] border border-white/5 animate-pulse bg-white/5"
              />
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12" style={{ color: "#888" }}>
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-display text-2xl">No Players Yet</p>
            <p className="text-sm mt-1">Be the first to join the community!</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 mt-4 font-bold text-black px-6 py-2.5 rounded-full bg-primary hover:brightness-110 transition-all"
            >
              Join Now
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
            {players.slice(0, 10).map((p) => {
              const playerId = p.id || p._id;
              const isFollowing = followingIds.includes(playerId);
              const initials =
                p.name
                  ?.split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "??";

              const city = p.city ? p.city.split(",")[0].trim() : "Nearby";
              const country = p.country || "India";
              const locationText = `${city}, ${country}`;
              const primarySport =
                p.preferredSport ||
                (p.sportTypes && p.sportTypes[0]) ||
                (p.interests && p.interests[0]) ||
                "Athlete";

              return (
                <div
                  key={playerId}
                  onClick={() => navigate(`/profile/${playerId}`)}
                  className="shrink-0 w-[44vw] sm:w-[155px] md:w-[175px] h-[220px] snap-start relative rounded-[16px] border border-white/5 bg-card overflow-hidden transition-all duration-300 group hover:border-primary/30 cursor-pointer"
                >
                  {/* Background Image or Initials */}
                  {p.profilePicture || p.profileImage ? (
                    <img
                      src={p.profilePicture || p.profileImage}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-white/5"
                    style={{
                      display:
                        p.profilePicture || p.profileImage ? "none" : "flex",
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 mb-10">
                      <span className="text-primary font-bold text-xl tracking-wider">
                        {initials}
                      </span>
                    </div>
                  </div>

                  {/* Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-transparent" />

                  {/* Primary Sport badge - Top Right */}
                  <div
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-primary bg-black/60 backdrop-blur-md border border-primary/20 z-10"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {primarySport}
                  </div>

                  {/* Bottom Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col z-10">
                    {/* Player Name */}
                    <h3
                      className="text-white text-sm font-bold line-clamp-1 mb-0.5"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {p.name || "Anonymous"}
                    </h3>

                    {/* Location: City */}
                    <p
                      className="text-white/60 text-xs font-medium line-clamp-1 mb-3"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {locationText}
                    </p>

                    {/* Follow / Message Row */}
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(playerId);
                        }}
                        className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center ${
                          isFollowing
                            ? "text-white bg-white/10 border border-white/10 hover:bg-white/20"
                            : "text-background bg-primary hover:brightness-110"
                        }`}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          gateInteraction(() =>
                            navigate(`/messages?userId=${playerId}`)
                          );
                        }}
                        className="w-8 h-8 rounded-lg text-white bg-white/10 border border-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center shrink-0"
                        title="Message"
                      >
                        <MessageCircle size={14} className="shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
