import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import TurfCardMobile from "./TurfCardMobile.jsx";
import TurfCardSkeleton from "@components/ui/TurfCardSkeleton.jsx";
import useTurfData from "../hooks/useTurfData.jsx";
import SearchTurf from "@components/search/SearchTurf.jsx";
import { Trophy, MapPin, Loader2, Sparkles, Search, Filter, Dribbble, X, ChevronRight } from "lucide-react";
import useRecommendations from "@hooks/useRecommendations";
import { setFilters } from "@redux/slices/turfSlice";

/**
 * Turf — Venue discovery page.
 */
const Turf = () => {
  const dispatch = useDispatch();
  const searchFilters = useSelector((state) => state.turf.filters);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("detecting"); // 'detecting' | 'granted' | 'denied'

  // Mobile Drawers
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSportsOpen, setIsMobileSportsOpen] = useState(false);
  const [isMobileLocationOpen, setIsMobileLocationOpen] = useState(false);
  const [locationSearchInput, setLocationSearchInput] = useState("");

  const { turfs, loading } = useTurfData(searchFilters);

  const { recommendations, loading: recsLoading } = useRecommendations({
    lat: userLocation?.lat,
    lng: userLocation?.lng,
    limit: 4
  });

  // ── Auto-detect location ──────────────────────────────────────────
  const detectLocation = () => {
    setLocationStatus("detecting");
    
    if (!navigator.geolocation) {
      fallbackToIPLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        // Reverse Geocode to get City/State names for the search bar
        let city = "";
        let state = "";
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
          const data = await res.json();
          city = data.city || data.locality || "";
          state = data.principalSubdivision || "";
        } catch (error) {
          console.warn("Reverse geocoding failed:", error);
        }

        const loc = { lat, lng, city, state };
        setUserLocation(loc);
        setLocationStatus("granted");
        
        dispatch(setFilters({ 
          lat,
          lng
        }));
      },
      (err) => {
        console.warn("Geolocation denied or failed:", err.message);
        fallbackToIPLocation();
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const fallbackToIPLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const lat = data.latitude;
        const lng = data.longitude;
        
        const loc = { lat, lng };
        setUserLocation(loc);
        setLocationStatus("granted");
        
        dispatch(setFilters({ 
          lat,
          lng
        }));
      } else {
        setLocationStatus("denied");
      }
    } catch (error) {
      setLocationStatus("denied");
    }
  };

  useEffect(() => {
    // detectLocation(); // DISABLED for privacy (manual entry only)
  }, []);

  // ── Handle search filters from the SearchTurf bar ─────────────────
  const handleSearch = (filters) => {
    dispatch(setFilters({
      ...filters,
      lat: userLocation?.lat,
      lng: userLocation?.lng,
    }));
  };

  return (
    <div className="min-h-screen bg-[#000000] font-sans text-[#FFFFFF] pb-20 overflow-x-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 pt-0 relative z-10">

        {/* ── Mobile Search & Filters ── */}
        <div className="block lg:hidden mb-6 mt-6 space-y-3">
          {/* Mobile Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.70)]" size={18} />
            <input 
              type="text" 
              placeholder="Search arenas..." 
              value={searchFilters.searchTerm || ""}
              onChange={(e) => dispatch(setFilters({ searchTerm: e.target.value }))}
              className="w-full bg-[#1B1B1B] border border-[rgba(255,255,255,0.08)] rounded-[16px] py-3.5 pl-11 pr-4 text-[14px] font-[400] text-[#FFFFFF] placeholder:text-[rgba(255,255,255,0.70)] focus:outline-none focus:border-[#55DEE8] transition-all shadow-md"
            />
          </div>
          
          {/* Mobile Filter & Sports Buttons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileLocationOpen(true)}
              className="flex-1 bg-[#1B1B1B] border border-[rgba(255,255,255,0.08)] rounded-[16px] py-3 flex items-center justify-center gap-1.5 text-[12px] font-[600] text-[#FFFFFF] hover:bg-[#121212] transition-colors shadow-md"
            >
              <MapPin size={13} className="text-[#BFF367]" />
              Location
            </button>
            <button 
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex-1 bg-[#1B1B1B] border border-[rgba(255,255,255,0.08)] rounded-[16px] py-3 flex items-center justify-center gap-1.5 text-[12px] font-[600] text-[#FFFFFF] hover:bg-[#121212] transition-colors shadow-md"
            >
              <Filter size={13} className="text-[#BFF367]" />
              Filters
            </button>
            <button 
              onClick={() => setIsMobileSportsOpen(true)}
              className="flex-1 bg-[#1B1B1B] border border-[rgba(255,255,255,0.08)] rounded-[16px] py-3 flex items-center justify-center gap-1.5 text-[12px] font-[600] text-[#FFFFFF] hover:bg-[#121212] transition-colors shadow-md"
            >
              <Dribbble size={13} className="text-[#BFF367]" />
              Sports
            </button>
          </div>
        </div>

        {/* ── Cards Grid ───────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:gap-8 max-w-md mx-auto lg:mt-[15px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <TurfCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : turfs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:gap-8 max-w-md mx-auto lg:mt-[15px]">
            {turfs.map((turf, idx) => (
              <div
                key={turf._id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <TurfCardMobile
                  turf={turf}
                  featured={idx === 0 && locationStatus === "granted"}
                  distance={
                    turf.distance != null
                      ? `${(turf.distance / 1000).toFixed(1)} km`
                      : null
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <Trophy size={48} className="mx-auto text-gray-800 mb-6" />
            <h3 className="text-2xl font-display uppercase text-gray-400 mb-2">Venues Not Found</h3>
            <p className="text-gray-600">Try adjusting your filters or search keywords.</p>
            <button
              onClick={() =>
                dispatch(setFilters(
                  userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : {}
                ))
              }
              className="mt-8 px-10 py-3 border border-white/10 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Clear All Filters
            </button>

            {/* Handpicked Alternate Recommendations */}
            {(recsLoading || (recommendations && recommendations.length > 0)) && (
              <div className="mt-24 pt-16 border-t border-white/5 space-y-10 text-left max-w-7xl mx-auto w-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#84CC16]">
                    <Sparkles size={18} className="fill-current animate-pulse" />
                    <span className="text-sm font-black uppercase tracking-[0.2em] font-sans">Handpicked Alternates</span>
                  </div>
                  <h4 className="text-3xl font-black uppercase tracking-tight text-white font-open-sans">
                    Trending Spots Active In Your City
                  </h4>
                  <p className="text-xs font-semibold text-zinc-500 font-inter">
                    ML-ranked suggestions based on real-time location metrics & teammate sport affinities.
                  </p>
                </div>

                {recsLoading ? (
                  <div className="grid grid-cols-1 gap-6 md:gap-8 max-w-md mx-auto">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <TurfCardSkeleton key={`recs-skeleton-${i}`} />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:gap-8 max-w-md mx-auto">
                    {recommendations.map((t) => (
                      <TurfCardMobile 
                        key={t.id || t._id} 
                        turf={t} 
                        distance={t.distance ? `${(t.distance / 1000).toFixed(1)} km Away` : "Nearby"}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile Overlays ── */}
      {/* Backdrop */}
      {(isMobileFilterOpen || isMobileSportsOpen || isMobileLocationOpen) && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] lg:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => { setIsMobileFilterOpen(false); setIsMobileSportsOpen(false); setIsMobileLocationOpen(false); }}
        />
      )}

      {/* Filter Drawer */}
      <div className={`fixed top-0 bottom-0 right-0 w-[85%] max-w-[360px] bg-[#121212] border-l border-[rgba(255,255,255,0.08)] z-[101] transform transition-transform duration-300 ease-in-out ${isMobileFilterOpen ? "translate-x-0" : "translate-x-full"} overflow-y-auto no-scrollbar pb-24`}>
        <div className="sticky top-0 bg-[#121212]/95 backdrop-blur-md p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between z-10">
          <h3 className="text-[15px] font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Filter size={16} className="text-[#BFF367]" />
            Filters
          </h3>
          <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={18} className="text-white/60 hover:text-white" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Slot Availability */}
          <div className="space-y-4">
            <h5 className="text-[13px] font-black uppercase text-white tracking-wider">Slot Availability</h5>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={searchFilters.onlyAvailable || false}
                  onChange={(e) => dispatch(setFilters({ onlyAvailable: e.target.checked }))}
                  className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" 
                />
                <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Show Only Available Venues</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={searchFilters.onlyFavorites || false}
                  onChange={(e) => dispatch(setFilters({ onlyFavorites: e.target.checked }))}
                  className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" 
                />
                <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Show Only Favorites</span>
              </label>
            </div>
          </div>

          {/* Slot Timings */}
          <div className="space-y-4">
            <h5 className="text-[13px] font-black uppercase text-white tracking-wider">Slot Timings</h5>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={searchFilters.timingMorning || false}
                  onChange={(e) => dispatch(setFilters({ timingMorning: e.target.checked }))}
                  className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" 
                />
                <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Morning (6:00 AM - 11:00 AM)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={searchFilters.timingAfternoon || false}
                  onChange={(e) => dispatch(setFilters({ timingAfternoon: e.target.checked }))}
                  className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" 
                />
                <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Afternoon (11:00 AM - 5:00 PM)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={searchFilters.timingEvening || false}
                  onChange={(e) => dispatch(setFilters({ timingEvening: e.target.checked }))}
                  className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" 
                />
                <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Evening (5:00 PM - 10:00 PM)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={searchFilters.timingLateNight || false}
                  onChange={(e) => dispatch(setFilters({ timingLateNight: e.target.checked }))}
                  className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" 
                />
                <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Late Night (After 10 PM)</span>
              </label>
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-4">
            <h5 className="text-[13px] font-black uppercase text-white tracking-wider">Star Rating: {(searchFilters.minRating || 0).toFixed(1)} - 5.0</h5>
            <div className="space-y-5 px-1 pt-1">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <span>Min Rating: {(searchFilters.minRating || 0).toFixed(1)}</span>
                </div>
                <input 
                  type="range" min="0" max="5" step="0.5" 
                  value={searchFilters.minRating || 0}
                  onChange={(e) => dispatch(setFilters({ minRating: parseFloat(e.target.value) }))}
                  style={{ background: `linear-gradient(to right, #BFF367 ${((searchFilters.minRating || 0) / 5) * 100}%, #1F1F1F ${((searchFilters.minRating || 0) / 5) * 100}%)` }}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#BFF367]" 
                />
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-4">
            <h5 className="text-[13px] font-black uppercase text-white tracking-wider">Price</h5>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={searchFilters.priceLessThan5000 || false}
                  onChange={(e) => dispatch(setFilters({ priceLessThan5000: e.target.checked }))}
                  className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" 
                />
                <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">Less than ₹5000</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={searchFilters.price5000AndAbove || false}
                  onChange={(e) => dispatch(setFilters({ price5000AndAbove: e.target.checked }))}
                  className="accent-[#BFF367] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer" 
                />
                <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">₹5000 and above</span>
              </label>
            </div>
          </div>

          <button onClick={() => setIsMobileFilterOpen(false)} className="w-full mt-6 py-4 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-[#000000] font-black uppercase tracking-wider rounded-[16px] hover:opacity-90 transition-opacity">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Sports Drawer */}
      <div className={`fixed top-0 bottom-0 right-0 w-[85%] max-w-[360px] bg-[#121212] border-l border-[rgba(255,255,255,0.08)] z-[101] transform transition-transform duration-300 ease-in-out ${isMobileSportsOpen ? "translate-x-0" : "translate-x-full"} overflow-y-auto no-scrollbar pb-24`}>
        <div className="sticky top-0 bg-[#121212]/95 backdrop-blur-md p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between z-10">
          <h3 className="text-[15px] font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Dribbble size={16} className="text-[#BFF367]" />
            Select Sport
          </h3>
          <button onClick={() => setIsMobileSportsOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={18} className="text-white/60 hover:text-white" />
          </button>
        </div>

        <div className="p-4 space-y-1">
          {["Football", "Cricket", "Badminton", "Tennis", "Basketball", "Swimming", "Volleyball", "Table Tennis", "Squash", "Hockey"].map((sport) => {
            const isSelected = searchFilters.sport === sport;
            return (
              <button 
                key={sport}
                onClick={() => {
                  dispatch(setFilters({ sport: isSelected ? "" : sport }));
                  setIsMobileSportsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors group ${
                  isSelected ? "bg-[#BFF367]/10 border border-[#BFF367]/30" : "hover:bg-[#111]"
                }`}
              >
                <span className={`text-[14px] font-bold transition-colors ${
                  isSelected ? "text-[#BFF367]" : "text-gray-300 group-hover:text-[#BFF367]"
                }`}>
                  {sport}
                </span>
                {isSelected ? (
                  <div className="w-2 h-2 rounded-full bg-[#BFF367]" />
                ) : (
                  <ChevronRight size={16} className="text-white/20 group-hover:text-[#BFF367]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location Drawer */}
      <div className={`fixed top-0 bottom-0 right-0 w-[85%] max-w-[360px] bg-[#121212] border-l border-[rgba(255,255,255,0.08)] z-[101] transform transition-transform duration-300 ease-in-out ${isMobileLocationOpen ? "translate-x-0" : "translate-x-full"} overflow-y-auto no-scrollbar pb-24`}>
        <div className="sticky top-0 bg-[#121212]/95 backdrop-blur-md p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between z-10">
          <h3 className="text-[15px] font-black uppercase tracking-wider text-white flex items-center gap-2">
            <MapPin size={16} className="text-[#BFF367]" />
            Select Location
          </h3>
          <button onClick={() => setIsMobileLocationOpen(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={18} className="text-white/60 hover:text-white" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.70)]" size={16} />
            <input 
              type="text" 
              placeholder="Search city or area..." 
              value={locationSearchInput}
              onChange={(e) => setLocationSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  dispatch(setFilters({ city: locationSearchInput }));
                  setIsMobileLocationOpen(false);
                }
              }}
              className="w-full bg-[#1B1B1B] border border-[rgba(255,255,255,0.08)] rounded-[16px] py-3.5 pl-11 pr-4 text-[14px] text-[#FFFFFF] placeholder:text-[rgba(255,255,255,0.70)] focus:outline-none focus:border-[#55DEE8] transition-all shadow-md"
            />
          </div>

          <div className="space-y-4">
            <h5 className="text-[11px] font-black uppercase text-white/50 tracking-wider">Popular Cities</h5>
            <div className="grid grid-cols-2 gap-3">
              {["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Chennai"].map((city) => (
                <button 
                  key={city}
                  onClick={() => {
                    dispatch(setFilters({ city }));
                    setIsMobileLocationOpen(false);
                  }}
                  className={`py-3 px-4 rounded-[12px] border flex items-center justify-center text-xs font-bold transition-all ${searchFilters.city === city ? "bg-[#BFF367]/10 border-[#BFF367] text-[#BFF367]" : "bg-[#1B1B1B] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.70)] hover:border-[rgba(255,255,255,0.20)]"}`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
               if(locationSearchInput.trim()) {
                 dispatch(setFilters({ city: locationSearchInput.trim() }));
               }
               setIsMobileLocationOpen(false);
            }} 
            className="w-full mt-4 py-4 bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-[#000000] font-black uppercase tracking-wider rounded-[16px] hover:opacity-90 transition-opacity"
          >
            Apply Location
          </button>
        </div>
      </div>

    </div>
  );
};

export default Turf;
