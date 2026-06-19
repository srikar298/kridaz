import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, MapPin, Check, MessageCircle } from "lucide-react";
import useLoginOnDemand from "@hooks/useLoginOnDemand";

const GRAD = "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)";
const BDR = "#2A2A2A";

export default function PlayersSection({
  loading,
  players,
  followingIds = [],
  handleFollowToggle,
}) {
  const navigate = useNavigate();
  const { gateInteraction } = useLoginOnDemand();

  return (
    <section className="py-6 mb-6 w-full">
      <div className="w-full">
        {/* Refined Section Header */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 mb-6 border-b border-white/5 pb-4">
          <div className="relative">
            <div
              className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full shadow-[0_0_20px_rgba(85,222,232,0.4)] hidden md:block"
              style={{ background: GRAD }}
            ></div>
            <h2
              className="text-[14px] font-black text-white tracking-tighter leading-none"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              Find Players{" "}
              <span
                style={{
                  background: GRAD,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Near You
              </span>
            </h2>
            <p
              className="text-xs md:text-sm font-bold text-white/40 uppercase tracking-[0.3em] mt-3"
              style={{ fontFamily: "'Inter 28pt Light', sans-serif" }}
            >
              Global Talent Network • Skill-Matched Athletes
            </p>
          </div>
        </div>

        {/* Player cards — 10 in one scrollable row */}
        {loading ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[44vw] sm:w-[155px] md:w-[175px] snap-start rounded-[12px] border border-white/5 animate-pulse bg-white/5"
                style={{ height: 190 }}
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
              className="inline-flex items-center gap-2 mt-4 font-bold text-black px-6 py-2.5 rounded-full"
              style={{
                background: "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)",
              }}
            >
              Join Now
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
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
                  className="shrink-0 w-[44vw] sm:w-[155px] md:w-[175px] h-[190px] snap-start relative rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[#1A1A1A] overflow-hidden transition-all duration-500 group hover:border-[#B3DC26]/50 hover:shadow-[0px_8px_24px_rgba(85,222,232,0.10)] cursor-pointer"
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
                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#000000]"
                    style={{
                      display:
                        p.profilePicture || p.profileImage ? "none" : "flex",
                    }}
                  >
                    <span
                      className="text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] font-[700] text-2xl opacity-50"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {initials}
                    </span>
                  </div>

                  {/* Gradient Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/60 to-transparent" />

                  {/* Primary Sport badge - Top Right */}
                  <div
                    className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[7px] font-[700] text-[#000000] bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] z-10"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {primarySport}
                  </div>

                  {/* Bottom Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col z-10">
                    {/* Player Name */}
                    <h3
                      className="text-[#FFFFFF] text-[10px] font-[600] leading-[14px] line-clamp-1 mb-0.5"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {p.name || "Anonymous"}
                    </h3>

                    {/* Location: City */}
                    <p
                      className="text-[rgba(255,255,255,0.70)] text-[8px] font-[400] leading-[10px] line-clamp-1 mb-2"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {locationText}
                    </p>

                    {/* Follow / Message Row */}
                    <div className="w-full flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(playerId);
                        }}
                        className={`flex-1 h-5 rounded-[4px] text-[8px] font-[600] leading-[10px] transition-all active:scale-[0.98] text-center ${
                          isFollowing
                            ? "text-[#FFFFFF] bg-[#1B1B1B]/80 backdrop-blur-md border border-[rgba(255,255,255,0.08)] hover:brightness-110"
                            : "text-[#000000] bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0px_8px_24px_rgba(179,220,38,0.15)] hover:scale-[1.02] border-none"
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
                        className="w-5 h-5 rounded-[4px] text-[#FFFFFF] bg-[#1B1B1B]/80 backdrop-blur-md border border-[rgba(255,255,255,0.08)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center shrink-0"
                        title="Message"
                      >
                        <MessageCircle size={9} className="shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View More Players btn */}
        <div className="text-center mt-6 lg:mt-10">
          <Link
            to="/players"
            className="inline-flex items-center gap-2 font-semibold text-sm py-3 px-10 rounded-[6px] border transition-all hover:border-[#BFF367] hover:text-[#BFF367]"
            style={{ borderColor: BDR, color: "#888" }}
          >
            View More Players <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
