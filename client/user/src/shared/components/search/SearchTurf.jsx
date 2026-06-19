import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  MapPin,
  RotateCcw,
  Building2,
  Trophy,
  Loader2,
  Search,
} from "lucide-react";
import { fetchStates, fetchCities } from "@utils/locationService";

/**
 * SearchTurf — unified filter bar for the venue discovery page.
 * Provides Sport, State, and City dropdown filters.
 */
const SearchTurf = ({ onSearch, userLocation }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sport, setSport] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  /**
   * Prefill state/city from userLocation — but ONLY ONCE on first detection.
   * Using a ref flag prevents the effect from re-running when the user manually
   * selects "All States" or "All Cities" (which clears the values), which was
   * causing the location to be immediately re-applied after clearing.
   */
  const locationPrefilled = useRef(false);
  useEffect(() => {
    if (locationPrefilled.current) return; // Already prefilled — never override user's choice
    if (userLocation?.state || userLocation?.city) {
      if (userLocation.state) setSelectedState(userLocation.state);
      if (userLocation.city) setSelectedCity(userLocation.city);
      locationPrefilled.current = true; // Mark as done — won't run again
    }
  }, [userLocation]);

  // Location data from API
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const sportDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

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

  // Fetch all Indian states on mount
  useEffect(() => {
    const getStates = async () => {
      setLoadingStates(true);
      try {
        const stateList = await fetchStates();
        setStates(stateList || []);
      } catch (err) {
        console.error("Failed to fetch states:", err);
      } finally {
        setLoadingStates(false);
      }
    };
    getStates();
  }, []);

  // Fetch cities when a state is selected
  useEffect(() => {
    const getCities = async () => {
      if (selectedState) {
        setLoadingCities(true);
        try {
          const cityList = await fetchCities(selectedState);
          setCities(cityList || []);
        } catch (err) {
          console.error(`Failed to fetch cities for ${selectedState}:`, err);
        } finally {
          setLoadingCities(false);
        }
      } else {
        setCities([]);
      }
      setSelectedCity(""); // Reset city when state changes
    };
    getCities();
  }, [selectedState]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sportDropdownRef.current &&
        !sportDropdownRef.current.contains(e.target)
      )
        setShowSportDropdown(false);
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(e.target)
      )
        setShowStateDropdown(false);
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(e.target)
      )
        setShowCityDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger search when filters change
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      // Combine searchTerm and sport for the backend search
      const combinedSearch =
        [searchTerm, sport].filter(Boolean).join(" ") || undefined;
      onSearchRef.current({
        searchTerm: combinedSearch,
        state: selectedState || undefined,
        city: selectedCity || undefined,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm, sport, selectedState, selectedCity]);

  const resetFilters = () => {
    setSearchTerm("");
    setSport("");
    setSelectedState("");
    setSelectedCity("");
  };

  return (
    <div className="w-full max-w-4xl animate-fade-in-up relative z-[50]">
      <div className="flex flex-col gap-3">
        {/* Search Input Box */}
        <div className="w-full relative flex items-center bg-[#18181A] rounded-[12px] p-4 shadow-xl">
          <Search size={22} className="text-white mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search arenas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-full bg-transparent text-white outline-none text-[16px] font-medium placeholder-gray-400 tracking-wide"
          />
        </div>

        {/* Filter Buttons Row */}
        <div className="flex gap-2 sm:gap-3 items-center w-full">
          {/* Sport Selector */}
          <div className="flex-1 relative" ref={sportDropdownRef}>
            <button
              onClick={() => {
                setShowSportDropdown(!showSportDropdown);
                setShowStateDropdown(false);
                setShowCityDropdown(false);
              }}
              className="w-full flex items-center justify-center px-2 py-3 bg-[#18181A] hover:bg-[#222] rounded-[8px] text-white text-[13px] sm:text-[14px] font-medium transition-colors"
            >
              <span className="truncate">{sport || "Sport"}</span>
            </button>

            {showSportDropdown && (
              <div className="absolute top-full mt-2 left-0 w-56 bg-[#0a0a0a] border border-white/10 rounded-[8px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in slide-in-from-top-2 duration-200">
                <div className="p-2 max-h-[300px] overflow-y-auto grid grid-cols-1 gap-1 custom-scrollbar">
                  <button
                    onClick={() => {
                      setSport("");
                      setShowSportDropdown(false);
                    }}
                    className="flex items-center px-4 py-3 rounded-[8px] hover:bg-[#BFF367]/10 text-left transition-colors group/item"
                  >
                    <Trophy
                      size={14}
                      className="mr-3 text-gray-600 group-hover/item:text-[#BFF367]"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      All Categories
                    </span>
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  {SPORTS_LIST.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSport(s);
                        setShowSportDropdown(false);
                      }}
                      className={`flex items-center px-4 py-2.5 rounded-[8px] transition-all text-left ${sport === s ? "bg-[#BFF367] text-black shadow-[0_0_15px_rgba(191,243,103,0.3)]" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${sport === s ? "text-black" : ""}`}
                      >
                        {s}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* State Selector */}
          <div className="flex-1 relative" ref={stateDropdownRef}>
            <button
              onClick={() => {
                setShowStateDropdown(!showStateDropdown);
                setShowSportDropdown(false);
                setShowCityDropdown(false);
              }}
              className="w-full flex items-center justify-center px-2 py-3 bg-[#18181A] hover:bg-[#222] rounded-[8px] text-white text-[13px] sm:text-[14px] font-medium transition-colors"
            >
              <span className="truncate">{selectedState || "State"}</span>
            </button>

            {showStateDropdown && (
              <div className="absolute top-full mt-2 left-0 w-56 bg-[#0a0a0a] border border-white/10 rounded-[8px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in slide-in-from-top-2 duration-200">
                <div className="p-2 max-h-[300px] overflow-y-auto grid grid-cols-1 gap-1 custom-scrollbar">
                  <button
                    onClick={() => {
                      setSelectedState("");
                      setShowStateDropdown(false);
                    }}
                    className="flex items-center px-4 py-3 rounded-[8px] hover:bg-[#BFF367]/10 text-left transition-colors group/item"
                  >
                    <MapPin
                      size={14}
                      className="mr-3 text-gray-600 group-hover/item:text-[#BFF367]"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      All States
                    </span>
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  {states.map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setSelectedState(st);
                        setShowStateDropdown(false);
                      }}
                      className={`flex items-center px-4 py-2.5 rounded-[8px] transition-all text-left ${selectedState === st ? "bg-[#BFF367] text-black shadow-[0_0_15px_rgba(191,243,103,0.3)]" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${selectedState === st ? "text-black" : ""}`}
                      >
                        {st}
                      </span>
                    </button>
                  ))}
                  {loadingStates ? (
                    <div className="px-4 py-6 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-5 h-5 text-[#BFF367] animate-spin mb-2" />
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        Loading states...
                      </p>
                    </div>
                  ) : states.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        No states available
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* City Selector */}
          <div className="flex-1 relative" ref={cityDropdownRef}>
            <button
              onClick={() => {
                setShowCityDropdown(!showCityDropdown);
                setShowSportDropdown(false);
                setShowStateDropdown(false);
              }}
              className="w-full flex items-center justify-center px-2 py-3 bg-[#18181A] hover:bg-[#222] rounded-[8px] text-white text-[13px] sm:text-[14px] font-medium transition-colors"
            >
              <span className="truncate">{selectedCity || "City"}</span>
            </button>

            {showCityDropdown && (
              <div className="absolute top-full mt-2 right-0 w-56 bg-[#0a0a0a] border border-white/10 rounded-[8px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in slide-in-from-top-2 duration-200">
                <div className="p-2 max-h-[300px] overflow-y-auto grid grid-cols-1 gap-1 custom-scrollbar">
                  <button
                    onClick={() => {
                      setSelectedCity("");
                      setShowCityDropdown(false);
                    }}
                    className="flex items-center px-4 py-3 rounded-[8px] hover:bg-[#BFF367]/10 text-left transition-colors group/item"
                  >
                    <Building2
                      size={14}
                      className="mr-3 text-gray-600 group-hover/item:text-[#BFF367]"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      All Cities
                    </span>
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  {cities.map((ct) => (
                    <button
                      key={ct}
                      onClick={() => {
                        setSelectedCity(ct);
                        setShowCityDropdown(false);
                      }}
                      className={`flex items-center px-4 py-2.5 rounded-[8px] transition-all text-left ${selectedCity === ct ? "bg-[#BFF367] text-black shadow-[0_0_15px_rgba(191,243,103,0.3)]" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${selectedCity === ct ? "text-black" : ""}`}
                      >
                        {ct}
                      </span>
                    </button>
                  ))}
                  {loadingCities ? (
                    <div className="px-4 py-6 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-5 h-5 text-[#BFF367] animate-spin mb-2" />
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        Loading cities...
                      </p>
                    </div>
                  ) : cities.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        {!selectedState
                          ? "Select a state first"
                          : "No cities available"}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchTurf;
