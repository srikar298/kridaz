import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  RotateCcw,
  Search,
  MapPin,
  Navigation,
  Loader2,
} from "lucide-react";
import { searchLocations } from "@utils/locationService";

const SPORTS_LIST = [
  "Football",
  "Cricket",
  "Badminton",
  "Tennis",
  "Basketball",
  "Swimming",
  "Volleyball",
  "Table Tennis",
  "Squash",
  "Hockey",
];

const SearchPlayers = ({ onSearch, userLocation }) => {
  const [sport, setSport] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const sportDropdownRef = useRef(null);
  const locationRef = useRef(null);

  // Sync with userLocation prop
  // Sync with userLocation prop - DISABLED AS PER USER REQUEST
  /*
  useEffect(() => {
    if (userLocation?.city && !selectedLocation) {
      const display = `${userLocation.city}${userLocation.state ? `, ${userLocation.state}` : ""}`;
      setLocationInput(display);
      setSelectedLocation({
        city: userLocation.city,
        state: userLocation.state,
        lat: userLocation.lat,
        lng: userLocation.lng,
        display_name: display
      });
    }
  }, [userLocation]);
  */

  // Debounced real-time location autocomplete
  useEffect(() => {
    if (
      !locationInput ||
      locationInput.length < 3 ||
      (selectedLocation && selectedLocation.display_name === locationInput)
    ) {
      if (locationInput === "") {
        setSuggestions([]);
        setSelectedLocation(null);
      }
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(locationInput);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error("Location search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationInput]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sportDropdownRef.current &&
        !sportDropdownRef.current.contains(e.target)
      )
        setShowSportDropdown(false);
      if (locationRef.current && !locationRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      onSearchRef.current({
        sport,
        city: selectedLocation?.city || "",
        state: selectedLocation?.state || "",
        lat: selectedLocation?.lat,
        lng: selectedLocation?.lng,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [sport, selectedLocation]);

  const handleSelectLocation = (suggestion) => {
    setLocationInput(suggestion.display_name);
    setSelectedLocation({
      city: suggestion.city,
      state: suggestion.state,
      lat: suggestion.lat,
      lng: suggestion.lng,
      display_name: suggestion.display_name,
    });
    setShowSuggestions(false);
  };

  const resetFilters = () => {
    setSport("");
    setLocationInput("");
    setSelectedLocation(null);
    setSuggestions([]);
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="relative group">
        <div className="relative flex flex-row items-center bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[8px] p-2 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-500 hover:border-[#BFF367]/40 min-h-[60px] md:min-h-[70px]">
          {/* Sport Selection */}
          <div
            className="flex-1 min-w-[80px] relative z-[100] border-r border-white/5"
            ref={sportDropdownRef}
          >
            <button
              onClick={() => setShowSportDropdown(!showSportDropdown)}
              className="flex items-center justify-center w-full h-full px-2 md:px-5 py-2 md:py-3 text-left"
            >
              <Search
                className={`hidden sm:block mr-1 md:mr-2 shrink-0 w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-500 ${showSportDropdown ? "scale-110 text-[#BFF367]" : "text-gray-500"}`}
              />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full">
                <span className="text-[6px] md:text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">
                  Sport
                </span>
                <span className="text-[9px] md:text-[11px] font-black text-white uppercase tracking-wider truncate w-full">
                  {sport || "All"}
                </span>
              </div>
              <ChevronDown
                className={`hidden md:block ml-auto w-2.5 h-2.5 text-gray-600 transition-transform duration-500 ${showSportDropdown ? "rotate-180 text-[#BFF367]" : ""}`}
              />
            </button>
            {showSportDropdown && (
              <div className="absolute top-full mt-3 left-0 w-64 bg-[#0a0a0a] border border-white/10 rounded-[8px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110]">
                <div className="p-2 max-h-[250px] overflow-y-auto grid grid-cols-1 gap-1">
                  <button
                    onClick={() => {
                      setSport("");
                      setShowSportDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[10px] font-bold text-gray-400 hover:bg-white/5 rounded-[8px] uppercase"
                  >
                    All Sports
                  </button>
                  {SPORTS_LIST.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSport(s);
                        setShowSportDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[10px] font-bold rounded-[8px] uppercase transition-colors ${sport === s ? "bg-[#BFF367] text-black" : "text-gray-400 hover:bg-white/5"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Unified Location Search */}
          <div
            className="flex-[1.5] min-w-[150px] relative z-[90]"
            ref={locationRef}
          >
            <div className="flex items-center justify-center w-full h-full px-2 md:px-5 py-2 md:py-3">
              <MapPin
                className={`hidden sm:block mr-1 md:mr-2 shrink-0 w-3.5 h-3.5 md:w-4 md:h-4 transition-colors duration-500 ${locationInput ? "text-[#BFF367]" : "text-gray-500"}`}
              />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full relative">
                <span className="text-[6px] md:text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">
                  Location
                </span>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  placeholder="Find players..."
                  className="bg-transparent border-none p-0 text-[9px] md:text-[11px] font-black text-white placeholder-gray-700 outline-none w-full uppercase tracking-wider"
                />

                {isSearching && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3 h-3 text-[#BFF367] animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {showSuggestions && (suggestions.length > 0 || isSearching) && (
              <div className="absolute top-full mt-3 left-0 right-0 bg-[#0a0a0a] border border-white/10 rounded-[8px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {isSearching && suggestions.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <Loader2 className="w-6 h-6 text-[#BFF367] animate-spin mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Searching Locations...
                      </p>
                    </div>
                  )}
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectLocation(suggestion)}
                      className="w-full flex items-start gap-4 px-4 py-3 text-left hover:bg-white/5 rounded-[8px] transition-all group/item"
                    >
                      <div className="mt-0.5 p-2 rounded-lg bg-white/5 group-hover/item:bg-[#BFF367]/20 transition-colors">
                        <Navigation className="w-3.5 h-3.5 text-gray-500 group-hover/item:text-[#BFF367]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white uppercase tracking-wider mb-0.5">
                          {suggestion.city}
                        </span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight line-clamp-1">
                          {suggestion.display_name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reset Filter */}
          <button
            onClick={resetFilters}
            className="flex items-center justify-center p-2 md:p-3 text-gray-500 hover:text-[#BFF367] transition-colors shrink-0 group/reset"
          >
            <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-500 group-hover/reset:rotate-[-180deg]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchPlayers;
