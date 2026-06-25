import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import { Search, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import { setUserLocation, setLocationStatus } from "@redux/slices/uiSlice";

import StoriesSection from "../components/StoriesSection";
import CommunityFeed from "../components/CommunityFeed";
import ReelsView from "../components/ReelsView";
import { Button, Input } from "@kridaz/ui";


const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };

const Community = ({ children, onSearchActive }) => {
  const { user, role, isLoggedIn } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAdmin = role === "admin" || role === "BMSP_ADMIN";
  const location = useLocation();

  // Auto-scroll to top when returning from content creation
  useEffect(() => {
    if (location.state?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Clear the state so it doesn't re-trigger on re-renders
      navigate(location.pathname + location.search, {
        replace: true,
        state: {},
      });
    }
  }, [location.state]);

  const userLocation = useSelector((state) => state.ui?.userLocation);
  const locationStatus = useSelector((state) => state.ui?.locationStatus);

  const geoLoading = locationStatus === "detecting";
  const geoLabel = userLocation
    ? userLocation.city && userLocation.state
      ? `${userLocation.city}, ${userLocation.state}`
      : userLocation.city || userLocation.state || "Unknown"
    : null;

  const detectLocation = () => {
    dispatch(setLocationStatus("detecting"));
    if (!navigator.geolocation) {
      dispatch(setLocationStatus("denied"));
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
      },
      () => {
        dispatch(setLocationStatus("denied"));
      },
      { timeout: 8000 }
    );
  };

  // Filter / panel state
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "shots" ? "Reels" : "All";
  const [activeFilter, setActiveFilter] = useState(initialTab);
  const [activeSportFilter, setActiveSportFilter] = useState("");

  // Sync activeFilter if URL changes (e.g. from Home page click)
  useEffect(() => {
    if (searchParams.get("tab") === "shots") {
      setActiveFilter("Reels");
    } else if (activeFilter === "Reels") {
      setActiveFilter("All");
    }
  }, [searchParams.get("tab")]);

  // Sync URL when Shots/Reels view is toggled
  const handleSetActiveFilter = (filter) => {
    setActiveFilter(filter);
    if (filter === "Reels") {
      searchParams.set("tab", "shots");
      setSearchParams(searchParams, { replace: true });
    } else {
      searchParams.delete("tab");
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  };

  // Disable body scroll when viewing Reels
  useEffect(() => {
    if (activeFilter === "Reels") {
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
  }, [activeFilter]);

  // Search state
  const [feedSearchQuery, setFeedSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Notify parent of search state
  useEffect(() => {
    if (onSearchActive) {
      onSearchActive(debouncedSearchQuery.trim() !== "");
    }
  }, [debouncedSearchQuery, onSearchActive]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(feedSearchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [feedSearchQuery]);

  // Global Search Modal states
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!showGlobalSearch) return;
    const delayDebounceFn = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await axiosInstance.get("/api/user/players", {
          params: { search: searchQuery },
        });
        if (res.data?.success) {
          setSearchResults(res.data.players || []);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, showGlobalSearch]);

  return (
    <div
      className={`min-h-screen bg-[#050505] text-white pt-0 pb-12 px-0 md:px-0 font-sans relative`}
    >
      {/* Global Search Modal */}
      <AnimatePresence>
        {showGlobalSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-32 bg-black/80 backdrop-blur-md"
            onClick={() => setShowGlobalSearch(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-background border border-white/10 rounded-[8px] overflow-hidden shadow-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 p-5 border-b border-white/5 bg-card">
                <Search size={20} className="text-primary" />
                <Input
                  type="text"
                  autoFocus
                  placeholder="Search players..."
                  className="flex-1 bg-transparent text-white text-[16px] outline-none placeholder:text-white/30 font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  onClick={() => setShowGlobalSearch(false)}
                  className="text-white/50 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg"
                >
                  <X size={16} />
                </Button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto no-scrollbar">
                {isSearching ? (
                  <div className="flex justify-center p-12">
                    <Loader2
                      size={32}
                      className="text-primary animate-spin"
                    />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {searchResults.map((player) => (
                      <div
                        key={player._id}
                        onClick={() => {
                          setShowGlobalSearch(false);
                          navigate(`/profile/${player._id}`);
                        }}
                        className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-[8px] cursor-pointer transition-all group"
                      >
                        <div className="w-[46px] h-[46px] rounded-full bg-card border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={
                              player.profilePicture ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`
                            }
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-bold text-white group-hover:text-primary transition-colors truncate">
                            {player.name}
                          </div>
                          <div className="text-[12px] font-medium text-white/40 truncate">
                            @
                            {player.username ||
                              player.name.toLowerCase().replace(/\s+/g, "")}
                          </div>
                        </div>
                        <div className="px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white/50 group-hover:border-primary group-hover:text-primary transition-all">
                          View Profile
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <div className="p-12 text-center text-white/30 font-bold text-[13px] uppercase tracking-widest">
                    No players found
                  </div>
                ) : (
                  <div className="p-12 text-center text-white/30 font-bold text-[13px] uppercase tracking-widest">
                    Type to start searching
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1500px] mx-auto w-full">
        <div className="grid grid-cols-1 gap-6">
          <div
            className={`max-w-3xl md:max-w-none mx-auto md:mx-0 w-full transition-all duration-300 flex flex-col ${activeFilter === "Reels" ? "h-[100dvh] sticky top-0 max-w-none" : "gap-1"}`}
          >
            {activeFilter === "Reels" ? (
              <ReelsView
                gateInteraction={gateInteraction}
                onBack={() => handleSetActiveFilter("All")}
              />
            ) : (
              <>
                <div className="mb-1">
                  <StoriesSection
                    user={user}
                    isLoggedIn={isLoggedIn}
                    isAdmin={isAdmin}
                    gateInteraction={gateInteraction}
                  />
                </div>

                <CommunityFeed
                  user={user}
                  isLoggedIn={isLoggedIn}
                  isAdmin={isAdmin}
                  gateInteraction={gateInteraction}
                  activeFilter={activeFilter}
                  handleSetActiveFilter={handleSetActiveFilter}
                  activeSportFilter={activeSportFilter}
                  setActiveSportFilter={setActiveSportFilter}
                  debouncedSearchQuery={debouncedSearchQuery}
                >
                  {children}
                </CommunityFeed>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
