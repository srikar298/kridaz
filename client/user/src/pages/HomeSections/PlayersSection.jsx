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

  if (!loading && (!players || players.length === 0)) return null;

  return (
    <section className="mb-8 w-full">
      <div className="w-full">
        {/* Refined Section Header */}
        <div className="relative flex flex-row items-center justify-between gap-4 mb-4 px-1">
          <div className="relative">
            <div
              className="text-[16px] font-semibold text-white tracking-wide"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Find Players Near You
            </div>
          </div>
          <Link
            to="/players"
            className="flex items-center gap-1 text-[12px] font-medium text-[#bbf455] whitespace-nowrap"
          >
            View More &gt;
          </Link>
        </div>

        {/* Player cards — 10 in one scrollable row */}
        {loading ? (
          <div className="flex gap-[10px] overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[260px] h-[123px] snap-start rounded-[12px] border border-[#2b2b2b] bg-[#161616] animate-pulse"
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
          <div className="flex gap-[10px] overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
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
                  className="shrink-0 w-[260px] h-[123px] snap-start relative rounded-[12px] border border-[#2b2b2b] bg-[#161616] p-[14px] flex flex-col justify-between cursor-pointer transition-all hover:border-primary/50 group"
                >
                  {/* Top Section: Avatar & Action Buttons */}
                  <div className="flex justify-between items-start w-full">
                    {/* Avatar with Gradient Border */}
                    <div 
                      className="w-[50px] h-[50px] rounded-full p-[1.5px] shrink-0"
                      style={{ background: 'linear-gradient(149.28deg, #55DEE8 13.25%, #BFF367 83.54%)' }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#161616] flex items-center justify-center">
                        {p.profilePicture || p.profileImage ? (
                          <img
                            src={p.profilePicture || p.profileImage}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => {
                              e.target.style.display = "none";
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}
                        <span 
                          className="text-primary font-bold text-sm tracking-wider"
                          style={{ display: p.profilePicture || p.profileImage ? "none" : "flex" }}
                        >
                          {initials}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(playerId);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] font-semibold text-[11px] transition-all active:scale-95 ${
                          isFollowing
                            ? "bg-[#2b2b2b] text-white hover:bg-[#333]"
                            : "bg-white text-black hover:bg-gray-200"
                        }`}
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <Users size={12} className={isFollowing ? "text-white" : "text-black"} />
                        {isFollowing ? "Following" : "Follow"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          gateInteraction(() => navigate(`/messages?userId=${playerId}`));
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-[8px] border border-[#434242] bg-[#ffffff14] text-white hover:bg-white/20 transition-all active:scale-95 shrink-0"
                        title="Message"
                      >
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Section: Info & Tag */}
                  <div className="flex justify-between items-end w-full">
                    <div className="flex flex-col gap-0.5">
                      <h3
                        className="text-white font-semibold text-[14px] tracking-[0px] leading-[1.2] normal-case truncate max-w-[150px]"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {p.name ? p.name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : "Anonymous"}
                      </h3>
                      <p
                        className="text-[#a5a5a5] font-normal text-[12px] tracking-[0px] leading-[1.2] normal-case truncate max-w-[150px]"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {locationText}
                      </p>
                    </div>

                    <div
                      className="px-2.5 py-1 rounded-full bg-[#BFF3671F] text-[#BFF367] text-[10px] font-semibold tracking-wide"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {primarySport}
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
