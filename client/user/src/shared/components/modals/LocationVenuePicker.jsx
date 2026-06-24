import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Map, Building2 } from "lucide-react";
import { Button, Input } from "@kridaz/ui";
import { searchLocations } from "@utils/locationService";
import useTurfData from "@features/turf/hooks/useTurfData";

const LocationVenuePicker = ({ isOpen, onClose, onSelect, onBookSlot }) => {
  const [activeTab, setActiveTab] = useState("custom"); // 'custom' | 'venues'
  const [searchQuery, setSearchQuery] = useState("");
  const [customSuggestions, setCustomSuggestions] = useState([]);
  const [isSearchingCustom, setIsSearchingCustom] = useState(false);
  const [selectedVenueForAction, setSelectedVenueForAction] = useState(null);

  // Kridaz Venues Data
  const { turfs, loading: loadingVenues } = useTurfData({
    searchTerm: searchQuery,
    limit: 10,
  });

  // Effect for OpenStreetMap Custom Location
  useEffect(() => {
    if (activeTab !== "custom") return;

    if (!searchQuery || searchQuery.length < 3) {
      setCustomSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCustom(true);
      try {
        const results = await searchLocations(searchQuery);
        setCustomSuggestions(results);
      } catch (error) {
        console.error("Location search error:", error);
      } finally {
        setIsSearchingCustom(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  if (!isOpen) return null;

  const handleSelectCustom = (suggestion) => {
    const cityName = suggestion.city || suggestion.display_name.split(",")[0];
    const stateName = suggestion.state || "";
    
    onSelect({
      type: "CUSTOM",
      displayName: suggestion.display_name,
      city: cityName,
      state: stateName,
      lat: suggestion.lat,
      lng: suggestion.lon,
    });
    setSelectedVenueForAction(null);
    onClose();
  };

  const handleSelectVenue = (venue) => {
    if (onBookSlot) {
      setSelectedVenueForAction(venue);
    } else {
      finalizeVenueSelection(venue);
    }
  };

  const finalizeVenueSelection = (venue) => {
    onSelect({
      type: "VENUE",
      venueId: venue.id || venue._id,
      displayName: venue.name,
      address: venue.address,
      city: venue.city,
      state: venue.state,
      lat: venue.location?.coordinates?.[1] || null,
      lng: venue.location?.coordinates?.[0] || null,
      image: venue.images?.[0] || null,
      venue: venue,
    });
    setSelectedVenueForAction(null);
    onClose();
  };

  const handleBookSlotAction = () => {
    if (selectedVenueForAction && onBookSlot) {
      onBookSlot(selectedVenueForAction);
      setSelectedVenueForAction(null);
      onClose();
    }
  };

  const closeAndReset = () => {
    setSelectedVenueForAction(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-xl sm:p-4 sm:items-center sm:justify-center"
        >
          <div className="w-full h-full sm:max-w-md sm:h-[600px] sm:max-h-[90vh] bg-[#0A0A0A] sm:rounded-2xl sm:border sm:border-white/10 flex flex-col relative overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-white font-bold text-lg">
                {selectedVenueForAction ? "Venue Action" : "Select Location"}
              </h2>
              <Button
                type="button"
                variant="ghost"
                className="w-8 h-8 p-0 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={closeAndReset}
              >
                <X size={18} />
              </Button>
            </div>

            {!selectedVenueForAction ? (
              <>
                {/* Tabs */}
            <div className="flex p-2 bg-[#111]">
              <button
                type="button"
                onClick={() => { setActiveTab("custom"); setSearchQuery(""); }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${
                  activeTab === "custom"
                    ? "bg-gradient-to-r from-secondary/20 to-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(191,243,103,0.15)]"
                    : "text-white/50 hover:bg-white/5"
                }`}
              >
                <Map size={16} /> Custom
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("venues"); setSearchQuery(""); }}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${
                  activeTab === "venues"
                    ? "bg-gradient-to-r from-secondary/20 to-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(191,243,103,0.15)]"
                    : "text-white/50 hover:bg-white/5"
                }`}
              >
                <Building2 size={16} /> Kridaz Venues
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-white/5 relative">
              <MapPin
                className="absolute left-7 top-1/2 -translate-y-1/2 text-cyan-400 z-10 pointer-events-none"
                size={18}
              />
              <Input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "custom" ? "Search for a city or area..." : "Search venue name..."}
                className="w-full bg-[#111] border border-white/10 hover:border-cyan-400/60 rounded-[12px] py-3.5 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
              />
              {isSearchingCustom && activeTab === "custom" && (
                <div className="absolute right-7 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {activeTab === "custom" && (
                <div className="space-y-1">
                  {searchQuery.length > 0 && searchQuery.length < 3 && (
                    <p className="text-center text-white/40 text-xs py-8">Type at least 3 characters to search</p>
                  )}
                  {customSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectCustom(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all flex flex-col gap-1 group"
                    >
                      <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {suggestion.city || suggestion.display_name.split(",")[0]}
                      </span>
                      <span className="text-[11px] text-white/40 line-clamp-1 w-full">
                        {suggestion.display_name}
                      </span>
                    </button>
                  ))}
                  {searchQuery.length >= 3 && !isSearchingCustom && customSuggestions.length === 0 && (
                    <p className="text-center text-white/40 text-xs py-8">No locations found</p>
                  )}
                </div>
              )}

              {activeTab === "venues" && (
                <div className="space-y-2">
                  {loadingVenues ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      {turfs.map((venue) => (
                        <button
                          key={venue.id || venue._id}
                          onClick={() => handleSelectVenue(venue)}
                          className="w-full p-3 text-left bg-[#111]/50 hover:bg-[#161616] rounded-xl border border-white/5 transition-all flex items-center gap-4 group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                            {venue.images?.[0] ? (
                              <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20">
                                <Building2 size={20} />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                              {venue.name}
                            </span>
                            <span className="text-[11px] text-white/40 truncate">
                              {venue.address || venue.city}
                            </span>
                          </div>
                        </button>
                      ))}
                      {turfs.length === 0 && !loadingVenues && (
                        <p className="text-center text-white/40 text-xs py-8">No venues found</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="w-24 h-24 rounded-2xl overflow-hidden mb-5 border border-white/10 shadow-lg bg-card flex items-center justify-center">
                  {selectedVenueForAction.images?.[0] ? (
                    <img src={selectedVenueForAction.images[0]} alt={selectedVenueForAction.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={32} className="text-white/20" />
                  )}
                </div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight font-open-sans">
                  {selectedVenueForAction.name}
                </h3>
                <p className="text-white/50 text-xs mb-8 font-inter">
                  Would you like to book a time slot for this venue, or just add it as the match location?
                </p>
                
                <div className="flex flex-col w-full gap-3">
                  <Button 
                    onClick={handleBookSlotAction} 
                    className="w-full bg-gradient-to-r from-secondary to-primary text-black font-black py-4 rounded-[16px] text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-[0_8px_24px_rgba(191,243,103,0.15)]"
                  >
                    BOOK SLOT
                  </Button>
                  <Button 
                    onClick={() => finalizeVenueSelection(selectedVenueForAction)} 
                    className="w-full bg-white/5 text-white/90 border border-white/10 font-bold py-4 rounded-[16px] text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                  >
                    ADD GROUND (NO BOOKING)
                  </Button>
                  <Button 
                    onClick={() => setSelectedVenueForAction(null)} 
                    className="w-full bg-transparent text-white/50 py-3 mt-2 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationVenuePicker;
