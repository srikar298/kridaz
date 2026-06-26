import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Crosshair,
  MapPin,
  ArrowRight,
  Search,
  Loader2,
} from "lucide-react";
import { searchLocations } from "@utils/locationService";
import {
  closeLocationSidebar,
  setUserLocation,
  setLocationStatus,
} from "@redux/slices/uiSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input } from "@kridaz/ui";


const LocationSidebar = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.ui.locationSidebar?.isOpen);
  const userLocation = useSelector((state) => state.ui.userLocation);

  const [isDetecting, setIsDetecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [nearbySuggestions, setNearbySuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const currentCity = userLocation?.city || "Chennai";

  useEffect(() => {
    if (isOpen && searchQuery.length < 3) {
      const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
          // Fetch locations related to the current city to show as nearby suggestions
          const results = await searchLocations(currentCity);
          setNearbySuggestions(results);
        } catch (err) {
          console.error("Error fetching nearby suggestions", err);
        } finally {
          setLoadingSuggestions(false);
        }
      };
      fetchSuggestions();
    }
  }, [isOpen, currentCity, searchQuery.length]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSelectResult = (result) => {
    dispatch(
      setUserLocation({
        lat: null,
        lng: null,
        city: result.city || result.suburb || result.display_name.split(",")[0],
        state: result.state,
      })
    );
    dispatch(setLocationStatus("granted"));
    setSearchQuery("");
    setSearchResults([]);
    handleClose();
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch(closeLocationSidebar());
  };

  const handleDetectLocation = () => {
    setIsDetecting(true);
    dispatch(setLocationStatus("detecting"));
    if (!navigator.geolocation) {
      dispatch(setLocationStatus("denied"));
      setIsDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let city = "";
        let state = "";
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          const data = await res.json();
          city = data.city || data.locality || "";
          state = data.principalSubdivision || "";
        } catch (error) {
          console.warn("Reverse geocoding failed:", error);
        }
        dispatch(setUserLocation({ lat, lng, city, state }));
        dispatch(setLocationStatus("granted"));
        setIsDetecting(false);
        handleClose();
      },
      () => {
        dispatch(setLocationStatus("denied"));
        setIsDetecting(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSelectArea = (area) => {
    dispatch(
      setUserLocation({
        lat: null,
        lng: null,
        city: area,
        state: userLocation?.state || "",
      })
    );
    dispatch(setLocationStatus("granted"));
    handleClose();
  };

  const sidebarContent = (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
        onClick={handleClose}
      />

      {/* Sidebar Panel */}
      <motion.div
        key="panel"
        initial={isMobile ? { y: "100%", x: 0 } : { x: "100%", y: 0 }}
        animate={{ x: 0, y: 0 }}
        exit={isMobile ? { y: "100%", x: 0 } : { x: "100%", y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 sm:left-auto sm:right-0 w-full sm:w-[400px] h-[100dvh] bg-[#161616] flex flex-col shadow-2xl sm:border-l border-white/5 z-[10000]"
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-5 pb-4">
          <Button
            onClick={handleClose}
            className="text-white hover:text-white/70 transition-colors"
           aria-label="Go back">
            <ArrowLeft size={24} />
          </Button>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Set Location
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pt-2 flex flex-col gap-8 no-scrollbar">
          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search for a city or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#242424] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors"
            />
            {isSearching && (
              <Loader2
                className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-spin"
                size={18}
              />
            )}
          </div>

          {/* Search Results */}
          {searchQuery.length >= 3 && (
            <div className="flex flex-col gap-2">
              {isSearching ? (
                <div className="text-white/40 text-sm text-center py-4">
                  Searching locations...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result, idx) => (
                  <Button
                    key={idx}
                    onClick={() => handleSelectResult(result)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-primary" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[14px] font-bold text-white/90 truncate">
                        {result.city ||
                          result.suburb ||
                          result.display_name.split(",")[0]}
                      </span>
                      <span className="text-[11px] text-white/40 truncate">
                        {result.display_name}
                      </span>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-white/40 text-sm text-center py-4">
                  No locations found
                </div>
              )}
            </div>
          )}

          {/* Current Location Button */}
          <Button
            onClick={handleDetectLocation}
            className="w-full flex items-center justify-between bg-[#242424] hover:bg-border transition-colors rounded-xl p-4 border border-white/5 group"
          >
            <div className="flex items-center gap-4">
              <Crosshair size={22} className="text-primary" />
              <span className="text-[16px] font-bold text-white">
                {isDetecting ? "Detecting..." : "Use Current Location"}
              </span>
            </div>
            <ArrowRight
              size={20}
              className="text-white/40 group-hover:text-white transition-colors group-hover:translate-x-1"
            />
          </Button>

          {/* Nearby Suggestions Section */}
          {searchQuery.length < 3 && (
            <div className="flex flex-col">
              <h3 className="text-[12px] font-bold text-white/50 uppercase tracking-[0.1em] mb-4">
                Nearby {currentCity} Areas
              </h3>
              <div className="flex flex-col gap-2">
                {loadingSuggestions ? (
                  <div className="text-white/40 text-sm text-center py-4">
                    Loading suggestions...
                  </div>
                ) : nearbySuggestions.length > 0 ? (
                  nearbySuggestions.map((result, idx) => (
                    <Button
                      key={idx}
                      onClick={() => handleSelectResult(result)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors text-left border border-white/5"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <MapPin size={18} className="text-white/60" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[14px] font-bold text-white/90 truncate">
                          {result.city ||
                            result.suburb ||
                            result.display_name.split(",")[0]}
                        </span>
                        <span className="text-[11px] text-white/40 truncate">
                          {result.display_name}
                        </span>
                      </div>
                    </Button>
                  ))
                ) : (
                  <div className="text-white/40 text-sm text-center py-4">
                    No suggestions found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );

  return createPortal(
    <AnimatePresence>{isOpen && sidebarContent}</AnimatePresence>,
    document.body
  );
};

export default LocationSidebar;
