import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { followUser, unfollowUser } from "@redux/slices/authSlice";
import axiosInstance from "@hooks/useAxiosInstance";
import { motion } from "framer-motion";
import ProfessionalCard from "../components/ProfessionalCard";
import MatchRequestModal from "../components/MatchRequestModal";
import LocationVenuePicker from "../../../shared/components/modals/LocationVenuePicker";
import { AdBannerSection } from "../../../shared/components/Marketing/AdBannerSection";
import {
  Search,
  MapPin,
  Star,
  Users,
  Shield,
  Trophy,
  Activity,
  Filter,
  Loader2,
  Check,
  X,
  Video,
  ChevronDown,
  Navigation,
  Zap,
  Calendar,
  Clock,
  Heart,
  User,
  ClipboardList,
  Crosshair,
  MoreHorizontal,
  MessageCircle,
  ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchStates, fetchCities, formatLocation } from "@utils/locationService";
import { useSocket } from "@context/SocketContext";
import { Button, Input, Select } from "@kridaz/ui";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

import {
  useCreateMatchRequestMutation,
  useGetUserOnDemandBookingsQuery,
} from "../../../redux/api/professionalApi";

const sports = [
  "ALL SPORTS",
  "CRICKET",
  "BADMINTON",
  "FOOTBALL",
  "TENNIS",
  "PICKLEBALL",
];
const roles = [
  "All",
  "Coach",
  "Umpire",
  "Streamer",
  "Commentator",
  "Scorer",
  "Cheerleader",
];

export default function FindProfessionals() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, user, followingIds = [] } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Browse State
  const [professionals, setProfessionals] = useState([]);
  const [adBanners, setAdBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState("ALL SPORTS");
  const [selectedRole, setSelectedRole] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [stateFilter, setStateFilter] = useState("All");
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  // Match Modal State
  const [showMatchModal, setShowMatchModal] = useState(searchParams.get("modal") === "true" || !!searchParams.get("role"));
  const [selectedGroundId, setSelectedGroundId] = useState("");
  const [customLocation, setCustomLocation] = useState({
    latitude: "",
    longitude: "",
    address: "",
  });

  // Location Auto-Search State
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [showLocationSearchModal, setShowLocationSearchModal] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(!!searchParams.get("search"));
  const [proSearchTerm, setProSearchTerm] = useState(searchParams.get("search") || "");
  const filterMenuRef = useRef(null);
  const [selectedRoles, setSelectedRoles] = useState(() => {
    const validRoles = [
      "COACH",
      "UMPIRE",
      "PHYSIO",
      "STREAMER",
      "COMMENTATOR",
      "SCORER",
      "CHEERLEADER",
    ];
    const queryRole = searchParams.get("role")?.toUpperCase();
    return queryRole && validRoles.includes(queryRole) ? [queryRole] : [];
  });
  const [budget, setBudget] = useState(1000);
  const [matchDate, setMatchDate] = useState("");
  const [matchStartTime, setMatchStartTime] = useState("");
  const [matchEndTime, setMatchEndTime] = useState("");
  const [expiresInSeconds, setExpiresInSeconds] = useState(40);
  const [grounds, setGrounds] = useState([]);
  const [loadingGrounds, setLoadingGrounds] = useState(false);

  // RTK Query Mutations & Queries
  const [createMatchRequest, { isLoading: isCreatingRequest }] =
    useCreateMatchRequestMutation();
  const { data: bookingsData, refetch: refetchBookings } = useGetUserOnDemandBookingsQuery(
    undefined,
    {
      skip: !isLoggedIn,
    }
  );
  const assignedBookings = bookingsData?.bookings || [];
  const { socket } = useSocket();

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    
    if (proSearchTerm) params.set("search", proSearchTerm);
    else params.delete("search");
    
    if (showMatchModal) params.set("modal", "true");
    else params.delete("modal");
    
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [proSearchTerm, showMatchModal, searchParams, setSearchParams]);

  // Hide bottom nav when modal is open
  useEffect(() => {
    if (showMatchModal) {
      document.body.setAttribute("data-hide-bottom-nav", "true");
    } else {
      document.body.removeAttribute("data-hide-bottom-nav");
    }
    return () => document.body.removeAttribute("data-hide-bottom-nav");
  }, [showMatchModal]);

  // Load States, Grounds & Banners
  useEffect(() => {
    loadStates();
    fetchGrounds();
    fetchAdBanners();
  }, []);

  useEffect(() => {
    if (stateFilter !== "All") {
      loadCities(stateFilter);
    } else {
      setAvailableCities([]);
    }
    setCityFilter("All");
  }, [stateFilter]);

  useEffect(() => {
    fetchProfessionals();
  }, [selectedSport, selectedRole, cityFilter, stateFilter]);

  // Socket confirmation listener
  useEffect(() => {
    if (socket && isLoggedIn) {
      const handleMatchConfirmed = (data) => {
        toast.success(`Match Confirmed! ${data.professionalName} is assigned.`);
        if (data.otp && data.bookingId) {
          // localStorage OTP removed per security audit
        }
        refetchBookings();
      };

      socket.on("professional:match_confirmed", handleMatchConfirmed);
      return () => {
        socket.off("professional:match_confirmed", handleMatchConfirmed);
      };
    }
  }, [socket, isLoggedIn, refetchBookings]);

  const loadStates = async () => {
    try {
      const states = await fetchStates();
      setAvailableStates(states);
    } catch (error) {
      console.error("Error loading states:", error);
    }
  };

  const loadCities = async (state) => {
    try {
      const cities = await fetchCities(state);
      setAvailableCities(cities);
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };

  const fetchGrounds = async () => {
    try {
      setLoadingGrounds(true);
      const res = await axiosInstance.get("/api/user/turf/all");
      setGrounds(res.data.turfs || []);
    } catch (err) {
      console.error("Error loading grounds:", err);
    } finally {
      setLoadingGrounds(false);
    }
  };

  const fetchAdBanners = async () => {
    try {
      const res = await axiosInstance.get("/api/features/marketing");
      if (res.data?.success && res.data?.banners) {
        setAdBanners(res.data.banners.filter(b => b.type === "PROFESSIONAL"));
      }
    } catch (err) {
      console.error("Error loading banners:", err);
    }
  };

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const params = {
        sport: selectedSport === "ALL SPORTS" ? "" : selectedSport,
        role: selectedRole === "All" ? "" : selectedRole.toLowerCase(),
        city: cityFilter === "All" ? "" : cityFilter,
        state: stateFilter === "All" ? "" : stateFilter,
        searchTerm: proSearchTerm,
      };
      const res = await axiosInstance.get("/api/professional/list", { params });
      setProfessionals(res.data.professionals || []);
    } catch (error) {
      console.error("Error fetching professionals:", error);
      toast.error("Failed to load professionals");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProfessionals();
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "Select Date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return "Select Time";
    const [h, m] = timeStr.split(":");
    const d = new Date();
    d.setHours(h);
    d.setMinutes(m);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleLocationVenueSelect = (loc) => {
    if (loc.type === "VENUE") {
      setSelectedGroundId(loc.venueId);
      const ground = grounds.find(g => g._id === loc.venueId || g.id === loc.venueId);
      if (ground) {
        setCityFilter(ground.city || "All");
        setStateFilter(ground.state || "All");
      }
      setCustomLocation({
        latitude: "",
        longitude: "",
        address: "",
      });
    } else if (loc.type === "CUSTOM") {
      setSelectedGroundId("custom");
      setCityFilter(loc.city || "All");
      setStateFilter(loc.state || "All");
      setCustomLocation({
        latitude: loc.lat,
        longitude: loc.lng,
        address: loc.displayName || `${loc.city}, ${loc.state}`,
      });
    }
    setShowLocationSearchModal(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowMoreFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleRole = (roleVal) => {
    if (selectedRoles.includes(roleVal)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleVal));
    } else {
      setSelectedRoles([...selectedRoles, roleVal]);
    }
  };

  const handleRequestMatch = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to request matchmaking");
      navigate("/login");
      return;
    }

    if (
      !selectedGroundId &&
      (!customLocation.latitude || !customLocation.longitude)
    ) {
      toast.error("Please select a ground or capture custom geolocation");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    if (!matchDate || !matchStartTime || !matchEndTime) {
      toast.error(
        "Please select date, start time, and end time for the match."
      );
      return;
    }

    const payload = {
      roles: selectedRoles,
      minBudget: 500,
      maxBudget: parseFloat(budget),
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      matchDate,
      matchStartTime,
      matchEndTime,
    };

    if (selectedGroundId && selectedGroundId !== "custom") {
      payload.groundId = selectedGroundId;
    } else {
      payload.customLocation = {
        latitude: parseFloat(customLocation.latitude),
        longitude: parseFloat(customLocation.longitude),
        address: customLocation.address || "Custom Geocoded Location",
      };
    }

    try {
      const res = await createMatchRequest(payload).unwrap();
      if (res.success) {
        toast.success(
          "Match request placed! We'll notify you once a pro accepts."
        );
        setSelectedRoles([]);
        setSelectedGroundId("");
        setCustomLocation({ latitude: "", longitude: "", address: "" });
        setShowMatchModal(false);
        refetchBookings();
      }
    } catch (err) {
      const errorMessage = err.data?.message || "Failed to create match request";
      toast.error(errorMessage);
      if (errorMessage.toLowerCase().includes("insufficient") || errorMessage.toLowerCase().includes("balance")) {
        // Automatically redirect to wallet screen
        setTimeout(() => {
          navigate("/wallet");
        }, 1000);
      }
    }
  };

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??"
    );
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white px-0 pb-20 font-sans relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 space-y-6 mt-6">
        {!isSearchExpanded && (
          <div className="space-y-6">


            {/* Title */}
            <h2 
              onClick={() => {
                if (!isLoggedIn) {
                  toast.error("Please login to request matchmaking");
                  navigate("/login");
                  return;
                }
                setShowMatchModal(true);
              }}
              className="text-[20px] sm:text-2xl uppercase whitespace-nowrap tracking-tight font-black font-inter text-white cursor-pointer select-none -mb-2"
            >
              Whom do you want to <span className="text-primary">hire</span>?
            </h2>

            {/* Grid Categories */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { id: "Umpire", icon: User, active: selectedRole === "Umpire" },
                { id: "Coach", icon: Activity, active: selectedRole === "Coach" },
                { id: "Physio", icon: Crosshair, active: selectedRole === "Physio" },
                { id: "Scorer", icon: ClipboardList, active: selectedRole === "Scorer" },
                { id: "Streamer", icon: Video, active: selectedRole === "Streamer" },
                { id: "Commentator", icon: MessageCircle, active: selectedRole === "Commentator" },
                { id: "Cheerleader", icon: Users, active: selectedRole === "Cheerleader" },
                { id: "More", icon: MoreHorizontal, active: false }
              ].map((cat) => (
                <button 
                  key={cat.id} 
                  onClick={() => {
                    if (cat.id !== "More") {
                      if (!isLoggedIn) {
                        toast.error("Please login to request matchmaking");
                        navigate("/login");
                        return;
                      }
                      setSelectedRole(cat.id === "All" ? "All" : cat.id);
                      setShowMatchModal(true);
                    }
                  }}
                  className="flex flex-col items-center gap-2 group snap-start shrink-0"
                >
                  <div className={`w-[70px] h-[48px] rounded-xl flex items-center justify-center transition-colors ${
                    cat.active 
                      ? "bg-transparent border border-primary text-primary" 
                      : "bg-[#111111] border border-transparent text-white/70 group-hover:bg-[#1a1a1a]"
                  }`}>
                    <cat.icon size={20} className={cat.active ? "text-primary" : ""} strokeWidth={cat.active ? 2 : 1.5} />
                  </div>
                  <span className={`text-[11px] font-medium transition-colors ${cat.active ? "text-primary" : "text-white/70"}`}>
                    {cat.id}
                  </span>
                </button>
              ))}
            </div>

        {/* 3. Assigned to you (Real Data) */}
        {assignedBookings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-base font-bold font-['Open_Sans']">Assigned to you</h3>
              <button 
                onClick={() => navigate('/booking-history?subTab=professionals')}
                className="text-primary text-[11px] font-bold"
              >
                View history
              </button>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
              {assignedBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  onClick={() => navigate('/booking-history?subTab=professionals')}
                  className="w-full cursor-pointer min-w-full shrink-0 bg-[#111] border border-white/10 rounded-2xl p-3 snap-start shadow-xl flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-card overflow-hidden shrink-0 border border-white/5">
                        <img 
                          src={booking.professional?.user?.profilePicture || `https://ui-avatars.com/api/?name=${booking.professional?.user?.name || 'P'}&background=random`} 
                          alt={booking.professional?.user?.name || "Professional"} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold text-white truncate font-inter leading-none mb-1">
                          {booking.professional?.user?.name || "Professional"}
                        </h4>
                        <p className="text-[10.5px] text-white/50 truncate capitalize">{booking.role?.toLowerCase() || "Professional"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[#FFD700] text-[9.5px] font-black bg-white/5 px-2 py-1 rounded-lg mt-0.5">
                      <Star size={10} className="fill-[#FFD700]" /> 4.8 <span className="text-white/40 font-medium">(120)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full mt-1 mb-2 bg-[#161616] p-2 rounded-lg border border-white/5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <Calendar size={10} className="text-primary" /> {booking.matchDate || "N/A"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <Clock size={10} className="text-primary" /> {booking.matchStartTime || "N/A"} - {booking.matchEndTime || "N/A"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">
                        <MapPin size={10} className="text-primary" /> {booking.ground?.name || booking.customLocation?.address || "Custom Location"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">
                        ID: #{booking.id?.substring(0, 5).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                      {booking.status === 'ASSIGNED' ? `${booking.role || 'Pro'} Assigned` : booking.status}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/booking-history?subTab=professionals');
                      }}
                      className="shrink-0 bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-bold px-3 py-1 h-[26px] rounded-md border border-primary/30 flex items-center justify-center transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Offers for you */}
        {adBanners.length > 0 && (
          <div className="-mx-4 sm:mx-0">
            <AdBannerSection banners={adBanners} loading={false} />
          </div>
        )}

        {/* 5. Professionals List on Main Page */}
        <div className="pt-4">
          <h3 className="text-white text-base font-bold font-['Open_Sans'] mb-3">
            Find more professionals
          </h3>

          <div 
            onClick={() => setIsSearchExpanded(true)}
            className="w-full flex items-center bg-[#111111] rounded-[16px] border border-white/10 p-1.5 transition-colors h-14 cursor-text mb-4"
          >
            <Search className="text-white/40 ml-3 mr-2 shrink-0" size={18} />
            <div className="flex-1 text-[14px] font-medium text-white/40">
              Search professionals...
            </div>
          </div>
          
          {/* Roles Filter Segmented Control */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl p-1.5 flex items-center overflow-x-auto gap-1 mb-4 [&::-webkit-scrollbar]:hidden">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`shrink-0 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                  selectedRole === role
                    ? "bg-[#2a2a2a] text-white shadow-sm"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {role === "All" ? "All Categories" : role}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-[#111] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : professionals.length === 0 ? (
            <div className="text-center py-12 px-4 border border-[rgba(255,255,255,0.08)] rounded-2xl bg-[#111]">
              <p className="text-white/50 text-sm">No professionals found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {professionals.map((pro) => (
                <ProfessionalCard key={pro.id || pro._id} pro={pro} getInitials={getInitials} />
              ))}
            </div>
          )}
        </div>
        </div>
        )}

        {/* Global Search Modal Overlay */}
        {isSearchExpanded && (
          <div className="fixed inset-0 z-[100] bg-[#000000] flex flex-col pt-0 sm:pt-4 overflow-hidden">
            <div className="p-4 bg-[#0a0a0c] border-b border-white/5 flex items-center gap-3">
              <button 
                onClick={() => { setIsSearchExpanded(false); setProSearchTerm(""); }}
                className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <form 
                onSubmit={(e) => { e.preventDefault(); fetchProfessionals(); }}
                className="flex-1 flex items-center bg-[#151515] rounded-2xl border border-white/5 p-1 focus-within:bg-[#1a1a1c] focus-within:border-white/20 transition-all h-12"
              >
                <div className="pl-4 pr-2 text-white/40 flex items-center justify-center">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={proSearchTerm}
                  onChange={(e) => setProSearchTerm(e.target.value)}
                  placeholder="Search professionals..."
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none text-[14px] font-medium text-white placeholder:text-white/30 h-full py-0 px-1 shadow-none"
                />
              </form>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-white/50 text-sm font-medium mb-4">
                Search Results
              </h3>
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-2xl bg-[#111] border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : professionals.filter(pro => 
                  pro.name?.toLowerCase().includes(proSearchTerm.toLowerCase()) || 
                  pro.role?.toLowerCase().includes(proSearchTerm.toLowerCase())
                ).length === 0 ? (
                <div className="text-center py-12 px-4 border border-[rgba(255,255,255,0.08)] rounded-2xl bg-[#111]">
                  <p className="text-white/50 text-sm">No professionals found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {professionals.filter(pro => 
                    pro.name?.toLowerCase().includes(proSearchTerm.toLowerCase()) || 
                    pro.role?.toLowerCase().includes(proSearchTerm.toLowerCase())
                  ).map((pro) => (
                    <ProfessionalCard key={pro.id || pro._id} pro={pro} getInitials={getInitials} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Match Request Modal */}
      <MatchRequestModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        initialSelectedRoles={selectedRole && selectedRole !== "All" ? [selectedRole.toUpperCase()] : []}
      />
    </div>
  );
}
