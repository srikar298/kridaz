import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  MapPin,
  RotateCcw,
  Building2,
  Trophy,
  Loader2,
} from "lucide-react";
import { fetchStates, fetchCities } from "../../utils/locationService";
import { Button } from "@kridaz/ui";


/**
 * SearchTurf ΓÇö unified filter bar for the venue discovery page.
 * Provides Sport, State, and City dropdown filters.
 */
const SearchTurf = ({ onSearch }) => {
  const [sport, setSport] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

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
      onSearchRef.current({
        searchTerm: sport || undefined,
        state: selectedState || undefined,
        city: selectedCity || undefined,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [sport, selectedState, selectedCity]);

  const resetFilters = () => {
    setSport("");
    setSelectedState("");
    setSelectedCity("");
  };

  return (
    <div className="w-full animate-fade-in-up relative z-[50]">
      <div className="relative group">
        <div className="relative flex flex-row items-center bg-black/60 backdrop-blur-2xl border border-white/5 rounded-[8px] p-1.5 shadow-2xl transition-all duration-500 hover:border-primary/30 min-h-[56px] md:min-h-[64px]">
          {/* Sport Selector */}
          <div
            className="flex-1 min-w-[80px] relative z-[100] border-r border-white/5"
            ref={sportDropdownRef}
          >
            <Button
              onClick={() => {
                setShowSportDropdown(!showSportDropdown);
                setShowStateDropdown(false);
                setShowCityDropdown(false);
              }}
              className="flex items-center gap-3 w-full h-full px-4 py-2 transition-all hover:bg-white/5 rounded-[8px] group/btn"
            >
              <div className="p-2 bg-white/5 rounded-[10px] group-hover/btn:bg-primary/10 transition-colors">
                <Trophy
                  size={14}
                  className={`${showSportDropdown ? "text-primary" : "text-gray-500"}`}
                />
              </div>
              <div className="flex flex-col text-left font-inter">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
                  Sport
                </span>
                <span className="text-[12px] font-bold text-white uppercase tracking-tight truncate w-full">
                  {sport || "All"}
                </span>
              </div>
              <ChevronDown
                size={12}
                className={`ml-auto text-gray-600 transition-transform duration-500 ${showSportDropdown ? "rotate-180 text-primary" : ""}`}
              />
            </Button>

            {showSportDropdown && (
              <div className="absolute top-full mt-2 left-0 w-64 lg:w-72 bg-background border border-white/10 rounded-[8px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in slide-in-from-top-2 duration-200">
                <div className="p-2 max-h-[300px] overflow-y-auto grid grid-cols-1 gap-1 custom-scrollbar">
                  <Button
                    onClick={() => {
                      setSport("");
                      setShowSportDropdown(false);
                    }}
                    className="flex items-center px-4 py-3 rounded-[8px] hover:bg-primary/10 text-left transition-colors group/item"
                  >
                    <Trophy
                      size={14}
                      className="mr-3 text-gray-600 group-hover/item:text-primary"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-inter">
                      All Categories
                    </span>
                  </Button>
                  <div className="h-px bg-white/5 my-1" />
                  {SPORTS_LIST.map((s) => (
                    <Button
                      key={s}
                      onClick={() => {
                        setSport(s);
                        setShowSportDropdown(false);
                      }}
                      className={`flex items-center px-4 py-2.5 rounded-[8px] transition-all text-left ${sport === s ? "bg-gradient-to-r from-primary to-primary text-black shadow-[0_0_15px_rgba(85,222,232,0.3)]" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider font-inter ${sport === s ? "text-black" : ""}`}
                      >
                        {s}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* State Selector */}
          <div
            className="flex-1 min-w-[80px] relative z-[95] border-r border-white/5"
            ref={stateDropdownRef}
          >
            <Button
              onClick={() => {
                setShowStateDropdown(!showStateDropdown);
                setShowSportDropdown(false);
                setShowCityDropdown(false);
              }}
              className="flex items-center gap-3 w-full h-full px-4 py-2 transition-all hover:bg-white/5 rounded-[8px] group/btn"
            >
              <div className="p-2 bg-white/5 rounded-[10px] group-hover/btn:bg-primary/10 transition-colors">
                <MapPin
                  size={14}
                  className={`${selectedState ? "text-primary" : "text-gray-500"}`}
                />
              </div>
              <div className="flex flex-col text-left flex-1 min-w-0 font-inter">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
                  State
                </span>
                <span className="text-[12px] font-bold text-white uppercase tracking-tight truncate">
                  {selectedState || "All"}
                </span>
              </div>
              <ChevronDown
                size={12}
                className={`ml-auto text-gray-600 transition-transform duration-500 flex-shrink-0 ${showStateDropdown ? "rotate-180 text-primary" : ""}`}
              />
            </Button>

            {showStateDropdown && (
              <div className="absolute top-full mt-2 left-0 w-64 lg:w-72 bg-background border border-white/10 rounded-[8px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in slide-in-from-top-2 duration-200">
                <div className="p-2 max-h-[300px] overflow-y-auto grid grid-cols-1 gap-1 custom-scrollbar">
                  <Button
                    onClick={() => {
                      setSelectedState("");
                      setShowStateDropdown(false);
                    }}
                    className="flex items-center px-4 py-3 rounded-[8px] hover:bg-primary/10 text-left transition-colors group/item"
                  >
                    <MapPin
                      size={14}
                      className="mr-3 text-gray-600 group-hover/item:text-primary"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-inter">
                      All States
                    </span>
                  </Button>
                  <div className="h-px bg-white/5 my-1" />
                  {states.map((st) => (
                    <Button
                      key={st}
                      onClick={() => {
                        setSelectedState(st);
                        setShowStateDropdown(false);
                      }}
                      className={`flex items-center px-4 py-2.5 rounded-[8px] transition-all text-left ${selectedState === st ? "bg-gradient-to-r from-primary to-primary text-black shadow-[0_0_15px_rgba(85,222,232,0.3)]" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider font-inter ${selectedState === st ? "text-black" : ""}`}
                      >
                        {st}
                      </span>
                    </Button>
                  ))}
                  {loadingStates ? (
                    <div className="px-4 py-6 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-5 h-5 text-primary animate-spin mb-2" />
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-inter">
                        Loading states...
                      </p>
                    </div>
                  ) : states.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-inter">
                        No states available
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* City Selector */}
          <div
            className="flex-1 min-w-[80px] relative z-[90]"
            ref={cityDropdownRef}
          >
            <Button
              onClick={() => {
                setShowCityDropdown(!showCityDropdown);
                setShowSportDropdown(false);
                setShowStateDropdown(false);
              }}
              className="flex items-center gap-3 w-full h-full px-4 py-2 transition-all hover:bg-white/5 rounded-[8px] group/btn"
            >
              <div className="p-2 bg-white/5 rounded-[10px] group-hover/btn:bg-primary/10 transition-colors">
                <Building2
                  size={14}
                  className={`${selectedCity ? "text-primary" : "text-gray-500"}`}
                />
              </div>
              <div className="flex flex-col text-left flex-1 min-w-0 font-inter">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
                  City
                </span>
                <span className="text-[12px] font-bold text-white uppercase tracking-tight truncate">
                  {selectedCity || "All"}
                </span>
              </div>
              <ChevronDown
                size={12}
                className={`ml-auto text-gray-600 transition-transform duration-500 flex-shrink-0 ${showCityDropdown ? "rotate-180 text-primary" : ""}`}
              />
            </Button>

            {showCityDropdown && (
              <div className="absolute top-full mt-2 left-0 w-64 lg:w-72 bg-background border border-white/10 rounded-[8px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in slide-in-from-top-2 duration-200">
                <div className="p-2 max-h-[300px] overflow-y-auto grid grid-cols-1 gap-1 custom-scrollbar">
                  <Button
                    onClick={() => {
                      setSelectedCity("");
                      setShowCityDropdown(false);
                    }}
                    className="flex items-center px-4 py-3 rounded-[8px] hover:bg-primary/10 text-left transition-colors group/item"
                  >
                    <Building2
                      size={14}
                      className="mr-3 text-gray-600 group-hover/item:text-primary"
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-inter">
                      All Cities
                    </span>
                  </Button>
                  <div className="h-px bg-white/5 my-1" />
                  {cities.map((ct) => (
                    <Button
                      key={ct}
                      onClick={() => {
                        setSelectedCity(ct);
                        setShowCityDropdown(false);
                      }}
                      className={`flex items-center px-4 py-2.5 rounded-[8px] transition-all text-left ${selectedCity === ct ? "bg-gradient-to-r from-primary to-primary text-black shadow-[0_0_15px_rgba(85,222,232,0.3)]" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider font-inter ${selectedCity === ct ? "text-black" : ""}`}
                      >
                        {ct}
                      </span>
                    </Button>
                  ))}
                  {loadingCities ? (
                    <div className="px-4 py-6 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-5 h-5 text-primary animate-spin mb-2" />
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-inter">
                        Loading cities...
                      </p>
                    </div>
                  ) : cities.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest font-inter">
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

          {/* Reset Filter */}
          <Button
            onClick={resetFilters}
            className="flex items-center justify-center p-3 text-gray-500 hover:text-primary transition-colors group/reset"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4 transition-transform duration-500 group-hover/reset:rotate-[-180deg]" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchTurf;
