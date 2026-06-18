/* eslint-disable no-restricted-imports */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useMemo } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { useSelector, useDispatch } from "react-redux";
import useTurfData from "../features/turf/hooks/useTurfData";
import DashboardHero from "./HomeSections/DashboardHero";
import VenuesSection from "./HomeSections/VenuesSection";
import PlayersSection from "./HomeSections/PlayersSection";
import SocialArenaSection from "./HomeSections/SocialArenaSection";
import Community from "../features/networking/pages/Community";
import JoinGamesSection from "./HomeSections/JoinGamesSection";
import ProfessionalsSection from "./HomeSections/ProfessionalsSection";
import { AdBannerSection } from "../shared/components/Marketing/AdBannerSection";
import InterestsModal from "../shared/components/modals/InterestsModal";
import toast from "react-hot-toast";
import { updateUser, followUser, unfollowUser } from "@redux/slices/authSlice";
import { useGetReelsFeedQuery } from "@redux/api/reelsApi";
import { useGetFeaturesFlagsQuery, useGetMarketingContentQuery } from "@redux/api/featuresApi";
import { useGetStatesListQuery, useGetCitiesListQuery } from "@redux/api/locationApi";
import { useListGamesQuery } from "@redux/api/gamesApi";
import { useGetProfessionalsListQuery } from "@redux/api/professionalApi";
import { useGetUserBookingsQuery } from "@redux/api/userApi";
import { useGetMyScoringGamesQuery } from "@redux/api/scoringApi";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, User, X, Check, Menu, MessageCircle, Plus } from "lucide-react";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const VENUE_TYPES = ["TURF", "GROUND", "INDOOR"];
const ROLES = ["COACH", "UMPIRE", "SCORER", "STREAMER", "CHEERLEADER"];
const SPORTS = ["CRICKET", "FOOTBALL", "BASKETBALL", "TENNIS", "SWIMMING", "TABLE TENNIS"];
const sportsCategories = [
  { name: 'Cricket', image: '/sports/cricket.png' },
  { name: 'Football', image: '/sports/football.png' },
  { name: 'Basketball', image: '/sports/basketball.png' },
  { name: 'Tennis', image: '/sports/tennis.png' },
  { name: 'Table Tennis', image: '/sports/table-tennis.png' },
  { name: 'Badminton', image: '/sports/badminton.png' },
  { name: 'Pickleball', image: '/sports/pickle-ball.png' },
  { name: 'Volleyball', image: '/sports/volley-ball.png' }
];

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, followingIds = [] } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const activeReel = searchParams.get('reel');
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const bookingsScrollRef = useRef(null);
  const liveMatchesScrollRef = useRef(null);
  const { isLoggedIn } = useSelector((state) => state.auth);

  useEffect(() => {
    if (activeReel) {
      navigate(`/community?reel=${activeReel}`);
    }
  }, [activeReel, navigate]);

  useEffect(() => {
    if (user && user.isNewUser && (!user.interests || user.interests.length === 0)) {
      setShowInterestsModal(true);
    }
  }, [user]);

  const { data: featureFlags = {} } = useGetFeaturesFlagsQuery();
  const { data: marketingContent } = useGetMarketingContentQuery();

  const [selectedHomeState, setSelectedHomeState] = useState("");
  const [selectedHomeCity, setSelectedHomeCity] = useState("");
  const [selectedGameSport, setSelectedGameSport] = useState("all");

  const { data: states = [], isLoading: loadingStates } = useGetStatesListQuery();
  const { data: cities = [], isLoading: loadingCities } = useGetCitiesListQuery(
    selectedHomeState,
    { skip: !selectedHomeState }
  );

  const { data: hostedGamesResp, isLoading: hostedGamesLoading } = useListGamesQuery({
    state: selectedHomeState,
    city: selectedHomeCity,
    sport: selectedGameSport === 'all' ? undefined : selectedGameSport,
    status: 'open'
  });
  const hostedGames = hostedGamesResp?.data || [];

  const { data: professionalsResp, isLoading: professionalsLoading } = useGetProfessionalsListQuery({
    state: selectedHomeState,
    city: selectedHomeCity,
    limit: 6
  });
  const professionals = professionalsResp?.data || [];

  const { data: reelsFeedResp } = useGetReelsFeedQuery();
  const reelsFeed = reelsFeedResp?.reels || [];

  // Upcoming Bookings
  const { data: bookingsData, isLoading: loadingBookings } = useGetUserBookingsQuery(
    undefined,
    { skip: !isLoggedIn }
  );
  const upcomingBookingsList = (bookingsData || []).filter((booking) => {
    const bookingDate = new Date(booking.date || booking.timeSlot?.date || booking.createdAt);
    bookingDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  });

  const scrollBookings = (direction) => {
    if (bookingsScrollRef.current) {
      const scrollAmount = 180;
      bookingsScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  // Live Matches
  const { data: scoringGamesData, isLoading: loadingScoringGames } = useGetMyScoringGamesQuery(
    undefined,
    { skip: !isLoggedIn }
  );
  
  const scoringGames = scoringGamesData?.games || (Array.isArray(scoringGamesData) ? scoringGamesData : []);
  const liveNetworkMatches = scoringGames.filter(game => game.status === "LIVE" || game.status === "ONGOING" || game.status === "live");

  const scrollLiveMatches = (direction) => {
    if (liveMatchesScrollRef.current) {
      const scrollAmount = liveMatchesScrollRef.current.clientWidth;
      liveMatchesScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const userLocation = useSelector((state) => state.ui.userLocation);
  const locationStatus = useSelector((state) => state.ui.locationStatus);

  const [playerFilters, setPlayerFilters] = useState({});
  const [turfFilters, setTurfFilters] = useState({});

  const combinedTurfFilters = useMemo(() => {
    if (locationStatus === "detecting") return { _skip: true };
    const base = { ...turfFilters };
    if (userLocation && userLocation.lat && userLocation.lng) {
      base.lat = userLocation.lat;
      base.lng = userLocation.lng;
    } else if (locationStatus === "denied") {
      base.city = "Hyderabad";
      base.state = "Telangana";
    }
    return base;
  }, [turfFilters, userLocation, locationStatus]);

  const { turfs, loading: turfLoading, error } = useTurfData(combinedTurfFilters);

  useEffect(() => {
    if (locationStatus === "granted" && userLocation) {
      setTurfFilters(prev => ({
        ...prev,
        state: userLocation.state || "",
        city: userLocation.city || "",
      }));
    } else if (locationStatus === "denied") {
      setTurfFilters(prev => ({ ...prev, state: "", city: "" }));
    }
  }, [locationStatus, userLocation]);

  const displayTurfs = useMemo(() => {
    if (!turfs || turfs.length === 0) return [];
    let sortedAll = [...turfs].sort((a, b) => (b.averageRating ?? b.rating ?? 0) - (a.averageRating ?? a.rating ?? 0));
    
    // Apply local sport filter from VenueSection if present
    if (turfFilters.sport && turfFilters.sport !== "all") {
        sortedAll = sortedAll.filter(t => t.sports?.includes(turfFilters.sport) || t.sportTypes?.includes(turfFilters.sport));
    }

    if (!userLocation || (!userLocation.city && !userLocation.state)) {
      return sortedAll;
    }
    
    const cityMatches = sortedAll.filter(t => t.city?.toLowerCase() === userLocation.city?.toLowerCase());
    const stateMatches = sortedAll.filter(t => t.city?.toLowerCase() !== userLocation.city?.toLowerCase() && t.state?.toLowerCase() === userLocation.state?.toLowerCase());
    const otherMatches = sortedAll.filter(t => t.city?.toLowerCase() !== userLocation.city?.toLowerCase() && t.state?.toLowerCase() !== userLocation.state?.toLowerCase());
    
    return [...cityMatches, ...stateMatches, ...otherMatches];
  }, [turfs, userLocation, turfFilters.sport]);

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locationStatus === "detecting") return;
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const params = {
          ...playerFilters,
          sortBy: "newest",
        };
        if (userLocation?.lat && userLocation?.lng) {
            params.lat = userLocation.lat;
            params.lng = userLocation.lng;
            params.radius = 50;
        }
        const res = await axiosInstance.get("/api/user/players", { params });
        setPlayers(res.data.players || []);
      } catch (error) {
        console.error("Error fetching players:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [playerFilters, userLocation, locationStatus]);



  const handleFollowToggle = async (eOrId, p) => {
    let playerId;
    if (typeof eOrId === 'string') {
      playerId = eOrId;
    } else {
      if (eOrId && eOrId.preventDefault) eOrId.preventDefault();
      if (eOrId && eOrId.stopPropagation) eOrId.stopPropagation();
      playerId = p?._id || p?.id;
    }
    
    if (!playerId) return;

    if (!user) {
      toast.error("Please login to follow players");
      return;
    }
    const isFollowing = followingIds.includes(playerId);
    
    // Optimistic Update
    dispatch(isFollowing ? unfollowUser(playerId) : followUser(playerId));

    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      await axiosInstance.post(`/api/user/players/${playerId}/${endpoint}`);
    } catch (err) {
      // Revert on error
      dispatch(isFollowing ? followUser(playerId) : unfollowUser(playerId));
      toast.error(err.response?.data?.message || err.message || "Failed to update follow status");
    }
  };

  const [isCommunitySearchActive, setIsCommunitySearchActive] = useState(false);
  const shouldHideRest = isCommunitySearchActive;

  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const normalizedSearchQuery = homeSearchQuery.toLowerCase();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState([]);
  const [selectedJoinGames, setSelectedJoinGames] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  const handleToggleRole = (role) => setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  const handleToggleVenueType = (type) => setSelectedVenueTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  const handleToggleJoinGame = (type) => setSelectedJoinGames(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  const handleTogglePlayerFilter = (type) => setSelectedPlayers(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);

  const filteredTurfs = useMemo(() => {
    if (!displayTurfs) return [];
    let result = displayTurfs;
    if (selectedVenueTypes.length > 0) {
      result = result.filter(t => selectedVenueTypes.some(type => t.venueType?.toUpperCase() === type || t.type?.toUpperCase() === type));
    }
    if (normalizedSearchQuery) {
      result = result.filter(t => 
        t.name?.toLowerCase().includes(normalizedSearchQuery) || 
        t.city?.toLowerCase().includes(normalizedSearchQuery) ||
        t.sports?.some(s => s.toLowerCase().includes(normalizedSearchQuery)) ||
        t.sportTypes?.some(s => s.toLowerCase().includes(normalizedSearchQuery))
      );
    }
    return result;
  }, [displayTurfs, normalizedSearchQuery, selectedVenueTypes]);

  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    let result = players;
    if (selectedPlayers.length > 0) {
      result = result.filter(p => selectedPlayers.some(sport => p.sports?.map(s => s.toUpperCase()).includes(sport)));
    }
    if (selectedRoles.length > 0) {
      result = result.filter(p => selectedRoles.some(role => p.roles?.map(r => r.toUpperCase()).includes(role) || p.role?.toUpperCase() === role));
    }
    if (normalizedSearchQuery) {
      result = result.filter(p => 
        p.name?.toLowerCase().includes(normalizedSearchQuery) || 
        p.username?.toLowerCase().includes(normalizedSearchQuery) ||
        p.sports?.some(s => s.toLowerCase().includes(normalizedSearchQuery)) ||
        p.roles?.some(r => r.toLowerCase().includes(normalizedSearchQuery))
      );
    }
    return result;
  }, [players, normalizedSearchQuery, selectedPlayers, selectedRoles]);

  const filteredHostedGames = useMemo(() => {
    if (!hostedGames) return [];
    let result = hostedGames;
    if (selectedJoinGames.length > 0) {
      if (selectedJoinGames.includes("LIVE GAMES") && !selectedJoinGames.includes("JOINABLE GAMES ONLY")) {
        result = result.filter(g => g.status === "LIVE" || g.status === "ONGOING");
      } else if (selectedJoinGames.includes("JOINABLE GAMES ONLY") && !selectedJoinGames.includes("LIVE GAMES")) {
        result = result.filter(g => g.status === "OPEN" || g.status === "open");
      } else if (selectedJoinGames.includes("LIVE GAMES") && selectedJoinGames.includes("JOINABLE GAMES ONLY")) {
        result = result.filter(g => g.status === "LIVE" || g.status === "ONGOING" || g.status === "OPEN" || g.status === "open");
      }
    }
    if (normalizedSearchQuery) {
      result = result.filter(g => 
        g.turfName?.toLowerCase().includes(normalizedSearchQuery) || 
        g.gameType?.toLowerCase().includes(normalizedSearchQuery) ||
        g.sport?.toLowerCase().includes(normalizedSearchQuery) ||
        g.customVenue?.toLowerCase().includes(normalizedSearchQuery) ||
        g.city?.toLowerCase().includes(normalizedSearchQuery)
      );
    }
    return result;
  }, [hostedGames, normalizedSearchQuery, selectedJoinGames]);

  const filteredProfessionals = useMemo(() => {
    if (!professionals) return [];
    if (!normalizedSearchQuery) return professionals;
    return professionals.filter(p => 
      p.name?.toLowerCase().includes(normalizedSearchQuery) || 
      p.role?.toLowerCase().includes(normalizedSearchQuery) ||
      p.city?.toLowerCase().includes(normalizedSearchQuery) ||
      p.expertise?.some(e => e.toLowerCase().includes(normalizedSearchQuery))
    );
  }, [professionals, normalizedSearchQuery]);

  return (

    <div className="bg-[#050505] min-h-screen text-white font-sans w-full max-w-[100vw] overflow-x-clip pt-0 pb-16 lg:pb-0">
      <div className="md:px-0 w-full mt-0 mb-4">
        


        <Community onSearchActive={setIsCommunitySearchActive}>

          {/* -- DASHBOARD HERO -- */}
          <div className="!mt-1 w-[100%] max-w-[100vw] overflow-x-hidden md:w-auto relative mb-0">
            <DashboardHero
              user={user}
              userLocation={userLocation}
              locationStatus={locationStatus}
              marketingContent={marketingContent}
              isLoggedIn={isLoggedIn}
            />
          </div>

          {/* -- LIVE MATCHES -- */}
          {isLoggedIn && (loadingScoringGames || liveNetworkMatches.length > 0) && (
            <div className="!mt-2 px-4">
              <div className="flex items-center justify-between px-1 mb-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Live Now</h4>
              </div>
              
              <div 
                ref={liveMatchesScrollRef}
                className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth gap-3"
              >
                {loadingScoringGames ? (
                  <div className="w-full py-4 flex justify-center items-center">
                    <div className="w-4 h-4 border-2 border-[#E83441] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  liveNetworkMatches.map((match) => {
                    const teamA = match.teamA || (Array.isArray(match.teams) ? match.teams.find(t => t.teamKey === 'teamA') : match.teams?.teamA) || {};
                    const teamB = match.teamB || (Array.isArray(match.teams) ? match.teams.find(t => t.teamKey === 'teamB') : match.teams?.teamB) || {};
                    return (
                      <Link key={match._id || match.id} to={`/match/live/${match._id || match.id}`} className="min-w-full md:min-w-[320px] shrink-0 snap-start block bg-gradient-to-br from-[#E83441]/20 via-[#0B0B0C] to-[#0B0B0C] border border-[#E83441]/20 rounded-xl p-4 hover:border-[#E83441]/40 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm group relative">
                        {/* Top section: Status & Info */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-3 items-center">
                            <div className="bg-[#E83441] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-[4px] tracking-widest shadow-[0_0_10px_rgba(232,52,65,0.4)]">
                              LIVE
                            </div>
                            <div>
                              <h5 className="text-[12px] font-bold text-white leading-none">{match.venue || "Kridaz Arena"}</h5>
                              <p className="text-[10px] text-white/50 mt-1 font-medium">{match.sportType || match.gameType || "Match"}</p>
                            </div>
                          </div>
                          <div className="text-[10px] font-medium text-right leading-tight">
                            <span className="text-[#BFF367]">Overs: {match.overs || 0}</span><br/>
                            {match.target && <span className="text-white/40 text-[9px]">Target: {match.target}</span>}
                          </div>
                        </div>
                        
                        {/* Bottom section: Scoreboard */}
                        <div className="flex flex-col gap-2.5 relative pr-6">
                          {/* Team 1 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded bg-[#111] border border-white/10 flex items-center justify-center shrink-0`}>
                                {teamA.logo ? <img src={teamA.logo} alt="A" className="w-full h-full object-cover rounded" /> : <span className={`text-[10px] font-black text-white`}>{(teamA.name || "A").substring(0,2)}</span>}
                              </div>
                              <span className="text-[11px] font-bold text-white/60">{teamA.name || "Team A"}</span>
                            </div>
                            <div className="text-[14px] font-black text-white/60 font-mono tracking-tight">
                              {teamA.score || "0"} <span className="text-[9px] font-medium text-white/40 ml-0.5">({teamA.oversPlayed || "0.0"})</span>
                            </div>
                          </div>
                          
                          {/* Team 2 (Batting) */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded bg-yellow-500/20 border border-white/10 flex items-center justify-center shrink-0`}>
                                {teamB.logo ? <img src={teamB.logo} alt="B" className="w-full h-full object-cover rounded" /> : <span className={`text-[10px] font-black text-yellow-500`}>{(teamB.name || "B").substring(0,2)}</span>}
                              </div>
                              <span className="text-[11px] font-bold text-white">{teamB.name || "Team B"}</span>
                            </div>
                            <div className="text-[14px] font-black text-white font-mono tracking-tight shadow-[#BFF367]">
                              {teamB.score || "0"} <span className="text-[9px] font-medium text-white/60 ml-0.5">({teamB.oversPlayed || "0.0"})</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* -- AD BANNERS -- */}
          <div className="!mt-3 mb-1 px-2">
            <AdBannerSection banners={(marketingContent?.banners || []).filter(b => b.type !== "PROMOTION")} />
          </div>

          {/* -- UPCOMING BOOKINGS -- */}
          {isLoggedIn && (loadingBookings || upcomingBookingsList.length > 0) && (
            <div className="!mt-2 px-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">Upcoming Bookings</h4>
              </div>
              <div ref={bookingsScrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
                {loadingBookings ? (
                  <div className="w-full py-4 flex justify-center items-center">
                    <div className="w-4 h-4 border-2 border-[#BFF367] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  upcomingBookingsList.map((booking) => {
                    const dateObj = new Date(booking.date || booking.bookingDate || booking.timeSlot?.date || Date.now());
                    const dayStr = dateObj.getDate().toString().padStart(2, '0');
                    const monthStr = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                    let startTime = booking.timeSlot?.formattedStartTime || booking.startTime || "Slot";
                    if (booking.startTime && booking.startTime.includes('T')) {
                      startTime = new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    } else if (booking.playStartTime) {
                      startTime = new Date(booking.playStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    }
                    const turfName = booking.turf?.name || booking.turfName || booking.customVenue || "Confirmed Venue";
                    const turfAddress = booking.turf?.address || booking.turf?.city || booking.turfCity || booking.city || booking.location || "View Details";
                    const turfImage = booking.turf?.images?.[0] || booking.turfImage || "/default-turf.jpg";
                    return (
                      <Link key={booking._id || booking.id} to={`/booking-pass/${booking.id || booking._id}`} className="min-w-[145px] w-[145px] flex flex-col rounded-xl border border-gray-600/60 bg-[#070708] overflow-hidden group shrink-0 shadow-sm transition-all hover:border-[#BFF367]/50">
                        <div className="relative w-full aspect-[4/5] overflow-hidden bg-white/5">
                          <img src={turfImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80"; }} alt={turfName} />
                          <div className="absolute bottom-0 left-0 right-0 bg-[#E81E73] p-1 px-2">
                            <p className="text-[9px] font-bold text-white text-center">Booked • {startTime}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 p-2">
                          <div className="bg-[#2A2D34] rounded-lg p-1 w-[36px] h-[40px] flex flex-col items-center justify-center shrink-0 border border-white/5">
                            <span className="text-[11px] font-black text-white leading-none">{dayStr}</span>
                            <span className="text-[7px] font-bold text-[#BFF367] leading-none mt-1 uppercase">{monthStr}</span>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h5 className="text-[10px] font-bold text-white leading-tight group-hover:text-[#BFF367] transition-colors line-clamp-2">{turfName}</h5>
                            <p className="text-[8px] text-white/50 truncate mt-0.5 font-medium">{turfAddress}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}





          {/* -- FIND YOUR ARENA -- */}
          <div className="!mt-2 px-2">
            <VenuesSection
              userLocation={userLocation}
              loading={loading}
              turfLoading={turfLoading}
              error={error}
              displayTurfs={displayTurfs}
              setTurfFilters={setTurfFilters}
            />
          </div>

          {/* -- FIND PLAYERS NEAR YOU -- */}
          <div className="!mt-2 px-2">
            <PlayersSection
              loading={loading}
              players={players}
              followingIds={followingIds}
              handleFollowToggle={handleFollowToggle}
            />
          </div>

          {/* -- SPORTS CATEGORIES -- */}
          <div className="!mt-2 mb-2 px-2">
             <div className="flex items-center justify-between mb-3">
                <h4 className="text-[12px] font-black uppercase text-white tracking-widest">Sports</h4>
             </div>
             <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2 snap-x snap-mandatory">
                {sportsCategories.map((sport, index) => (
                  <div key={index} onClick={() => navigate(`/search?q=${encodeURIComponent(sport.name)}`)} className="flex flex-col items-center cursor-pointer snap-start shrink-0">
                     <div className="w-[88px] h-[88px] rounded-[20px] overflow-hidden relative flex items-center justify-center">
                        <img src={sport.image} alt={sport.name} className={`w-full h-full object-contain drop-shadow-md ${(sport.name === 'Basketball' || sport.name === 'Pickleball') ? 'scale-[0.85]' : ''}`} />
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* -- HOST YOUR VENUE CTA -- */}
          <div className="!mt-4 px-2">
            <Link to="/business/venue" className="relative block overflow-hidden rounded-2xl w-full aspect-video shadow-[0_4px_20px_rgba(0,0,0,0.5)] group border border-white/[0.05] hover:border-[#BFF367]/50 transition-all duration-300">
              <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: "url('/host-venue-bg-custom-2.png')" }} />
              <div className="relative z-10 w-[45%] h-full p-4 flex flex-col justify-center gap-1.5 pl-5">
                <h3 className="text-[16px] leading-tight font-black text-white uppercase drop-shadow-lg">Host Your Venue</h3>
                <p className="text-[9px] font-medium text-white/90 leading-snug drop-shadow-md">Partner with us to list your turf and manage bookings seamlessly.</p>
              </div>
            </Link>
          </div>


          {/* -- SOCIAL ARENA -- */}
          <div className="!mt-2 px-2">
            <SocialArenaSection reelsFeed={reelsFeed} />
          </div>

          {/* -- JOIN GAMES NEAR YOU (Feature Flag) -- */}
          <div className="!mt-2 px-2">
            <JoinGamesSection
              featureFlags={featureFlags}
              selectedHomeState={selectedHomeState}
              setSelectedHomeState={setSelectedHomeState}
              selectedHomeCity={selectedHomeCity}
              setSelectedHomeCity={setSelectedHomeCity}
              states={states}
              loadingStates={loadingStates}
              cities={cities}
              loadingCities={loadingCities}
              selectedGameSport={selectedGameSport}
              setSelectedGameSport={setSelectedGameSport}
              hostedGames={hostedGames}
              hostedGamesLoading={hostedGamesLoading}
            />
          </div>

          <div className={`!mt-2 px-2 ${shouldHideRest ? 'hidden' : ''}`}>
            {/* -- FIND PROFESSIONALS (Feature Flag) -- */}
            <ProfessionalsSection
              featureFlags={featureFlags}
              professionals={professionals}
              professionalsLoading={professionalsLoading}
            />
          </div>
        </Community>
      </div>

      <InterestsModal
        isOpen={showInterestsModal}
        onClose={() => setShowInterestsModal(false)}
        onSave={async (selectedInterests) => {
          try {
            await dispatch(updateUser({ interests: selectedInterests })).unwrap();
            setShowInterestsModal(false);
          } catch (err) {
            console.error("Failed to update interests:", err);
          }
        }}
      />

      {/* Filter Sidebar Overlay */}
      {isFilterOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsFilterOpen(false)}
        ></div>
      )}
      
      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#050505] border-l border-white/10 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out ${isFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold uppercase tracking-widest text-[#BFF367]" style={HEADING_STYLE}>Filters</h2>
            <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            {/* Venue Filter */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">Venue</h4>
              <div className="flex flex-wrap gap-2">
                {VENUE_TYPES.map(type => {
                  const isSelected = selectedVenueTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => handleToggleVenueType(type)}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? "bg-[#BFF367]/15 border border-[#BFF367] text-[#BFF367]" 
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                      {type}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pro's Filter */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">Pro's</h4>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(role => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <button
                      key={role}
                      onClick={() => handleToggleRole(role)}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? "bg-[#BFF367]/15 border border-[#BFF367] text-[#BFF367]" 
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                      {role}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Join Games Filter */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">Join Games</h4>
              <div className="flex flex-wrap gap-2">
                {["JOINABLE GAMES ONLY", "LIVE GAMES"].map(type => {
                  const isSelected = selectedJoinGames.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => handleToggleJoinGame(type)}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? "bg-[#BFF367]/15 border border-[#BFF367] text-[#BFF367]" 
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                      {type}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Players Filter */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">Players</h4>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map(type => {
                  const isSelected = selectedPlayers.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => handleTogglePlayerFilter(type)}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? "bg-[#BFF367]/15 border border-[#BFF367] text-[#BFF367]" 
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                      {type}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/5 flex gap-3 bg-[#0A0A0A]">
            <button 
              onClick={() => { setSelectedRoles([]); setSelectedVenueTypes([]); setSelectedJoinGames([]); setSelectedPlayers([]); }}
              className="flex-1 py-3 rounded-lg border border-white/10 text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest"
            >
              Reset
            </button>
            <button 
              onClick={() => setIsFilterOpen(false)}
              className="flex-[2] py-3 rounded-lg bg-[#BFF367] text-black text-xs font-black uppercase tracking-widest hover:bg-[#BFF367]/90 transition-colors shadow-[0_0_15px_rgba(191,243,103,0.3)]"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}









