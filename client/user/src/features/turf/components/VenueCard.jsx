import React from "react";
import { Heart, MapPin, Star } from "lucide-react";
import { useSelector } from "react-redux";
import { useGetSavedTurfsQuery, useToggleTurfLikeMutation } from "@redux/api/turfApi";
import toast from "react-hot-toast";

const VenueCard = ({ t, onClick, isActive = true }) => {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const { data: savedData } = useGetSavedTurfsQuery(undefined, {
    skip: !isLoggedIn,
  });
  const [toggleTurfLike] = useToggleTurfLikeMutation();

  const isFavorite =
    isLoggedIn && savedData?.turfs?.some((turf) => (turf.id || turf._id) === t._id);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.error("Please login to save venues");
      return;
    }

    try {
      await toggleTurfLike(t._id).unwrap();
      toast.success(isFavorite ? "Removed from saved" : "Saved successfully");
    } catch (err) {
      console.error("Failed to toggle wishlist like:", err);
      toast.error("Failed to update saved status");
    }
  };
  return (
    <article
      onClick={onClick}
      className={`inline-flex flex-col items-center gap-3 relative flex-[0_0_auto] cursor-pointer transition-all duration-300 ${!isActive ? "opacity-50" : "opacity-100"}`}
    >
      <div
        className={`relative rounded-xl border border-solid border-[#434242] overflow-hidden transition-all duration-300 ${isActive ? "w-[280px] h-[280px] md:w-80 md:h-80" : "w-[220px] h-[240px] md:w-60 md:h-[260px]"}`}
      >
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
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 w-full px-2.5 flex items-center justify-between">
          <div className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-[#04050447] rounded-lg backdrop-blur-md">
            <Star size={14} className="text-white" fill="currentColor" />
            <span className="font-medium text-white text-xs tracking-[0] leading-[14.4px] whitespace-nowrap">
              {t.averageRating || t.avgRating || t.rating || "4.8"}
            </span>
          </div>

          <button
            type="button"
            aria-label="Add to favorites"
            className="inline-flex items-center justify-center p-2 bg-[#ffffff14] rounded-lg backdrop-brightness-[84.0%] backdrop-saturate-[104.3%] backdrop-hue-rotate-[-4.8deg] [-webkit-backdrop-filter:brightness(84.0%)_saturate(104.3%)_hue-rotate(-4.8deg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.20),inset_1px_0_0_rgba(255,255,255,0.16),inset_0_-1px_1px_rgba(0,0,0,0.05),inset_-1px_0_1px_rgba(0,0,0,0.04)] hover:bg-[#ffffff25] transition-colors"
            onClick={toggleFavorite}
          >
            <Heart size={18} className={isFavorite ? "text-red-500 fill-red-500" : "text-white"} />
          </button>
        </div>
      </div>

      {/* Text Container (Below Image) */}
      <div
        className={`inline-flex flex-col items-center gap-4 relative transition-all duration-300 ${!isActive ? "opacity-0 pointer-events-none invisible" : "opacity-100 visible"}`}
      >
        <div className="flex flex-col w-[222px] items-center gap-1.5">
          <h2 
            className="font-semibold text-white text-[16px] tracking-[0px] leading-[1.2] text-center line-clamp-1 normal-case"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {t.name ? t.name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : ""}
          </h2>
          <div className="inline-flex items-center gap-1 text-[#a5a5a5]">
            <MapPin size={14} />
            <p className="font-normal text-[#a5a5a5] text-xs tracking-[0] leading-[14.4px] whitespace-nowrap truncate max-w-[180px]">
              {t.address || t.city || "Paramount colony, Hyderabad"}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};

export default VenueCard;
