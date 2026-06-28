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
import SportsCategoriesSection from "./HomeSections/SportsCategoriesSection";
import PromotionsSection from "./HomeSections/PromotionsSection";
import Community from "../features/networking/pages/Community";
import SocialArenaSection from "./HomeSections/SocialArenaSection";
import { AdBannerSection } from "../shared/components/Marketing/AdBannerSection";
import InterestsModal from "../shared/components/modals/InterestsModal";
import toast from "react-hot-toast";
import { updateUser, followUser, unfollowUser } from "@redux/slices/authSlice";
import { useGetReelsFeedQuery } from "@redux/api/reelsApi";
import {
  useGetFeaturesFlagsQuery,
  useGetMarketingContentQuery,
} from "@redux/api/featuresApi";
import {
  useGetStatesListQuery,
  useGetCitiesListQuery,
} from "@redux/api/locationApi";
import { useListGamesQuery } from "@redux/api/gamesApi";
import { useGetProfessionalsListQuery } from "@redux/api/professionalApi";
import { useGetUserBookingsQuery } from "@redux/api/userApi";
import { useGetMyScoringGamesQuery } from "@redux/api/scoringApi";
import { Button } from "@kridaz/ui";
import SEO from "../shared/components/common/SEO";

import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  User,
  X,
  Check,
  Menu,
  MessageCircle,
  Plus,
  MapPin,
} from "lucide-react";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const VENUE_TYPES = ["TURF", "GROUND", "INDOOR"];
const ROLES = ["COACH", "UMPIRE", "SCORER", "STREAMER", "CHEERLEADER"];
const SPORTS = [
  "CRICKET",
  "FOOTBALL",
  "BASKETBALL",
  "TENNIS",
  "SWIMMING",
  "TABLE TENNIS",
];


export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, followingIds = [] } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const activeReel = searchParams.get("reel");
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const bookingsScrollRef = useRef(null);
  const liveMatchesScrollRef = useRef(null);
  const { isLoggedIn } = useSelector((state) => state.auth);
  const { userLocation } = useSelector((state) => state.ui);

  useEffect(() => {
    if (activeReel) {
      navigate(`/community?reel=${activeReel}`);
    }
  }, [activeReel, navigate]);

  useEffect(() => {
    if (
      user &&
      user.isNewUser &&
      (!user.interests || user.interests.length === 0)
    ) {
      setShowInterestsModal(true);
    }
  }, [user]);

  const { data: featureFlags = {} } = useGetFeaturesFlagsQuery();
  const { data: marketingContent, isLoading: marketingLoading } = useGetMarketingContentQuery();

  const [selectedHomeState, setSelectedHomeState] = useState("");
  const [selectedHomeCity, setSelectedHomeCity] = useState("");
  const [selectedGameSport, setSelectedGameSport] = useState("all");
  const [currentLiveMatchSlide, setCurrentLiveMatchSlide] = useState(0);

  const { data: states = [], isLoading: loadingStates } =
    useGetStatesListQuery();
  const { data: cities = [], isLoading: loadingCities } = useGetCitiesListQuery(
    selectedHomeState,
    { skip: !selectedHomeState }
  );

  // Resolve effective city/state: prefer user-selected dropdown, fallback to auto-detected location
  const effectiveGameCity = selectedHomeCity || userLocation?.city || "";
  const effectiveGameState = selectedHomeState || userLocation?.state || "";

  const { data: hostedGamesResp, isLoading: hostedGamesLoading } =
    useListGamesQuery({
      state: effectiveGameState,
      city: effectiveGameCity,
      gameType: selectedGameSport === "all" ? undefined : selectedGameSport,
    }, { skip: !effectiveGameCity && !effectiveGameState });
  const hostedGames = hostedGamesResp?.games || hostedGamesResp?.data || [];

  const { data: professionalsResp, isLoading: professionalsLoading } =
    useGetProfessionalsListQuery({
      state: selectedHomeState,
      city: selectedHomeCity,
      limit: 6,
    });
  const professionals = professionalsResp?.professionals || professionalsResp?.data?.professionals || professionalsResp?.data || [];

  const { data: reelsFeedResp } = useGetReelsFeedQuery();
  const reelsFeed = reelsFeedResp?.reels || [];

  // Upcoming Bookings
  const { data: bookingsData, isLoading: loadingBookings } =
    useGetUserBookingsQuery(undefined, { skip: !isLoggedIn });
  const upcomingBookingsList = (bookingsData || []).filter((booking) => {
    const bookingDate = new Date(
      booking.date || booking.timeSlot?.date || booking.createdAt
    );
    bookingDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  });

  const scrollBookings = (direction) => {
    if (bookingsScrollRef.current) {
      const scrollAmount = 180;
      bookingsScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Live Matches
  const { data: scoringGamesData, isLoading: loadingScoringGames } =
    useGetMyScoringGamesQuery(undefined, { skip: !isLoggedIn });

  const scoringGames =
    scoringGamesData?.games ||
    (Array.isArray(scoringGamesData) ? scoringGamesData : []);
  const liveNetworkMatches = scoringGames.filter(
    (game) =>
      game.status === "LIVE" ||
      game.status === "ONGOING" ||
      game.status === "live"
  );

  const scrollLiveMatches = (direction) => {
    if (liveMatchesScrollRef.current) {
      const scrollAmount = liveMatchesScrollRef.current.clientWidth;
      liveMatchesScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };


  const locationStatus = useSelector((state) => state.ui.locationStatus);

  const [playerFilters, setPlayerFilters] = useState({});
  const [turfFilters, setTurfFilters] = useState({});

  const combinedTurfFilters = useMemo(() => {
    const base = { ...turfFilters };
    if (locationStatus === "granted" && userLocation) {
      base.lat = userLocation.lat;
      base.lng = userLocation.lng;
      base.city = userLocation.city || "";
      base.state = userLocation.state || "";
    } else if (locationStatus === "denied") {
      base.city = "Hyderabad";
      base.state = "Telangana";
    } else {
      // Skip query while location status is detecting
      base._skip = true;
    }
    return base;
  }, [
    turfFilters,
    userLocation?.lat,
    userLocation?.lng,
    userLocation?.city,
    userLocation?.state,
    locationStatus,
  ]);

  const {
    turfs,
    loading: turfLoading,
    error,
  } = useTurfData(combinedTurfFilters);

  const displayTurfs = useMemo(() => {
    if (!turfs || turfs.length === 0) return [];

    // 1. Filter by available slots
    let availableTurfs = [...turfs].filter((t) => (t.slotsLeft || 0) > 0);

    // 2. Apply local sport filter from VenueSection if present
    if (turfFilters.sport && turfFilters.sport !== "all") {
      availableTurfs = availableTurfs.filter(
        (t) =>
          t.sports?.includes(turfFilters.sport) ||
          t.sportTypes?.includes(turfFilters.sport)
      );
    }

    // 3. Always sort by highest rating first
    return availableTurfs.sort((a, b) => {
      const ratingA = a.avgRating ?? a.averageRating ?? a.rating ?? 0;
      const ratingB = b.avgRating ?? b.averageRating ?? b.rating ?? 0;
      return ratingB - ratingA;
    });
  }, [turfs, turfFilters.sport]);

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Avoid double fetching while location is still detecting
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
  }, [playerFilters, userLocation?.lat, userLocation?.lng, locationStatus]);

  const handleFollowToggle = async (eOrId, p) => {
    let playerId;
    if (typeof eOrId === "string") {
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
      toast.error(
        err.response?.data?.message ||
        err.message ||
        "Failed to update follow status"
      );
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

  const handleToggleRole = (role) =>
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  const handleToggleVenueType = (type) =>
    setSelectedVenueTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  const handleToggleJoinGame = (type) =>
    setSelectedJoinGames((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  const handleTogglePlayerFilter = (type) =>
    setSelectedPlayers((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );

  const filteredTurfs = useMemo(() => {
    if (!displayTurfs) return [];
    let result = displayTurfs;
    if (selectedVenueTypes.length > 0) {
      result = result.filter((t) =>
        selectedVenueTypes.some(
          (type) =>
            t.venueType?.toUpperCase() === type ||
            t.type?.toUpperCase() === type
        )
      );
    }
    if (normalizedSearchQuery) {
      result = result.filter(
        (t) =>
          t.name?.toLowerCase().includes(normalizedSearchQuery) ||
          t.city?.toLowerCase().includes(normalizedSearchQuery) ||
          t.sports?.some((s) =>
            s.toLowerCase().includes(normalizedSearchQuery)
          ) ||
          t.sportTypes?.some((s) =>
            s.toLowerCase().includes(normalizedSearchQuery)
          )
      );
    }
    return result;
  }, [displayTurfs, normalizedSearchQuery, selectedVenueTypes]);

  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    let result = players;
    if (selectedPlayers.length > 0) {
      result = result.filter((p) =>
        selectedPlayers.some((sport) =>
          p.sports?.map((s) => s.toUpperCase()).includes(sport)
        )
      );
    }
    if (selectedRoles.length > 0) {
      result = result.filter((p) =>
        selectedRoles.some(
          (role) =>
            p.roles?.map((r) => r.toUpperCase()).includes(role) ||
            p.role?.toUpperCase() === role
        )
      );
    }
    if (normalizedSearchQuery) {
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(normalizedSearchQuery) ||
          p.username?.toLowerCase().includes(normalizedSearchQuery) ||
          p.sports?.some((s) =>
            s.toLowerCase().includes(normalizedSearchQuery)
          ) ||
          p.roles?.some((r) => r.toLowerCase().includes(normalizedSearchQuery))
      );
    }
    return result;
  }, [players, normalizedSearchQuery, selectedPlayers, selectedRoles]);

  const filteredHostedGames = useMemo(() => {
    if (!hostedGames) return [];
    let result = hostedGames;
    if (selectedJoinGames.length > 0) {
      if (
        selectedJoinGames.includes("LIVE GAMES") &&
        !selectedJoinGames.includes("JOINABLE GAMES ONLY")
      ) {
        result = result.filter(
          (g) => g.status === "LIVE" || g.status === "ONGOING"
        );
      } else if (
        selectedJoinGames.includes("JOINABLE GAMES ONLY") &&
        !selectedJoinGames.includes("LIVE GAMES")
      ) {
        result = result.filter(
          (g) => g.status === "OPEN" || g.status === "open"
        );
      } else if (
        selectedJoinGames.includes("LIVE GAMES") &&
        selectedJoinGames.includes("JOINABLE GAMES ONLY")
      ) {
        result = result.filter(
          (g) =>
            g.status === "LIVE" ||
            g.status === "ONGOING" ||
            g.status === "OPEN" ||
            g.status === "open"
        );
      }
    }
    if (normalizedSearchQuery) {
      result = result.filter(
        (g) =>
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
    return professionals.filter(
      (p) =>
        p.name?.toLowerCase().includes(normalizedSearchQuery) ||
        p.role?.toLowerCase().includes(normalizedSearchQuery) ||
        p.city?.toLowerCase().includes(normalizedSearchQuery) ||
        p.expertise?.some((e) =>
          e.toLowerCase().includes(normalizedSearchQuery)
        )
    );
  }, [professionals, normalizedSearchQuery]);

  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans w-full max-w-[100vw] overflow-x-clip pt-0 pb-16 lg:pb-0 relative">
      <SEO title="Kridaz | Sports Networking" description="Kridaz is the ultimate sports community platform for players and venue owners to book turfs, find games, and connect with other players." />
      <h1 className="sr-only">Kridaz - Sports Community & Venue Booking</h1>
      
      {/* Ambient Top Glow (Curved Shape) */}
      <div 
        className="fixed top-[-100px] right-[-80px] pointer-events-none z-[80]"
        style={{
          width: '555px',
          height: '250px',
          background: 'rgba(191, 243, 103, 0.20)',
          filter: 'blur(90px)',
          borderRadius: '100% 0% 100% 0% / 100% 100% 0% 0%'
        }}
      />

      <div className="md:px-0 w-full mt-0 mb-4 relative z-10">
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

          {/* -- AD BANNERS -- */}
          <div className="!mt-8 mb-1 px-2">
            <AdBannerSection
              banners={(marketingContent?.banners || []).filter(
                (b) => b.type === "HOME" || !b.type
              )}
              loading={marketingLoading}
            />
          </div>

          {/* -- UPCOMING BOOKINGS -- */}
          {isLoggedIn && (loadingBookings || upcomingBookingsList?.length > 0) && (
            <div className="!mt-6 pl-4">
              <div className="flex items-center justify-between px-1 pr-5 mb-3">
                <h2 className="text-[16px] font-semibold text-white tracking-wide" style={HEADING_STYLE}>
                  Upcoming Booking
                </h2>
                <Link to="/profile?tab=bookings" className="text-[12px] font-medium text-[#bbf455]">
                  View More &gt;
                </Link>
              </div>

              <div
                ref={bookingsScrollRef}
                className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth gap-3 pb-2"
              >
                {loadingBookings ? (
                  <div className="min-w-[190px] w-[190px] h-[84px] bg-[#161616] border border-white/5 rounded-[12px] animate-pulse shrink-0" />
                ) : (
                  upcomingBookingsList.map((booking) => {
                    const dateObj = new Date(booking.date || booking.timeSlot?.date || booking.createdAt);
                    const dayNum = dateObj.getDate();
                    const monthStr = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                    const dayStr = dateObj.toLocaleString('en-US', { weekday: 'short' });
                    
                    // Fallback time parsing
                    let timeStr = "12:00 PM";
                    try {
                      if (booking.startTime || booking.timeSlot?.startTime) {
                        const timeString = booking.startTime || booking.timeSlot?.startTime;
                        // Time might be in HH:mm format
                        if (typeof timeString === 'string' && timeString.includes(':')) {
                          const [hours, minutes] = timeString.split(':');
                          const h = parseInt(hours);
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          const h12 = h % 12 || 12;
                          timeStr = `${h12}:${minutes} ${ampm}`;
                        } else {
                          timeStr = new Date(timeString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                        }
                      }
                    } catch (e) {
                      console.error("Error parsing time", e);
                    }

                    return (
                      <Link
                        key={booking._id || booking.id}
                        to={`/venue/${booking.turfId?._id || booking.turfId}`}
                        className="min-w-[190px] w-[190px] h-[84px] shrink-0 snap-start bg-[#161616] border border-white/10 rounded-[12px] p-[14px] flex items-center gap-3 hover:bg-[#202020] transition-colors"
                      >
                        {/* Date Box */}
                        <div className="w-[56px] h-[56px] rounded-[8px] border border-white/20 bg-white/10 backdrop-blur-sm flex flex-col justify-center items-center py-1 px-3 shrink-0">
                          <span className="text-[18px] font-bold text-white leading-none">{dayNum}</span>
                          <span className="text-[10px] text-white/50 uppercase mt-1 leading-none">{monthStr}</span>
                        </div>

                        {/* Info */}
                        <div className="flex flex-col justify-center w-[calc(100%-68px)] gap-[2px]">
                          <div className="text-[10px] text-white/50 truncate">
                            {dayStr} • {timeStr}
                          </div>
                          <div className="text-[12px] font-bold text-white truncate w-full">
                            {booking.turfId?.name || "Play Arena"}
                          </div>
                          <div className="text-[10px] text-white/50 flex items-center truncate w-full">
                            <MapPin size={10} className="inline mr-1 shrink-0" />
                            <span className="truncate">{booking.turfId?.city || booking.turfId?.location?.city || "Unknown Location"}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* -- LIVE MATCHES -- */}
          {isLoggedIn && (loadingScoringGames || liveNetworkMatches?.length > 0) && (
              <div className="!mt-8 pl-4">
                <div className="flex items-center justify-between px-1 pr-5 mb-4">
                  <h2 className="text-[16px] font-semibold text-white tracking-wide" style={HEADING_STYLE}>
                    Live Matches
                  </h2>
                  <Link to="/matches" className="text-[12px] font-medium text-[#bbf455]">
                    View More &gt;
                  </Link>
                </div>

                <div
                  ref={liveMatchesScrollRef}
                  onScroll={(e) => {
                    const scrollLeft = e.target.scrollLeft;
                    const cardWidth = 285 + 12; // w-[285px] + gap-3
                    const newSlide = Math.round(scrollLeft / cardWidth);
                    if (newSlide !== currentLiveMatchSlide) {
                      setCurrentLiveMatchSlide(newSlide);
                    }
                  }}
                  className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth gap-3 pb-2"
                >
                  {loadingScoringGames ? (
                    <div className="min-w-[285px] w-[285px] h-[161px] bg-[#161616] border border-white/5 rounded-[12px] animate-pulse shrink-0" />
                  ) : (
                    liveNetworkMatches.map((match) => {
                      const teamA =
                        match.teamA ||
                        (Array.isArray(match.teams)
                          ? match.teams.find((t) => t.teamKey === "teamA")
                          : match.teams?.teamA) ||
                        {};
                      const teamB =
                        match.teamB ||
                        (Array.isArray(match.teams)
                          ? match.teams.find((t) => t.teamKey === "teamB")
                          : match.teams?.teamB) ||
                        {};
                      return (
                        <Link
                          key={match._id || match.id}
                          to={`/match/live/${match._id || match.id}`}
                          className="min-w-[285px] w-[285px] h-[161px] shrink-0 snap-start bg-[#161616] border border-white/10 rounded-[12px] p-[14px] flex flex-col justify-between hover:bg-[#202020] transition-colors relative"
                        >
                          {/* Top row: LIVE tag + Arena Info */}
                          <div className="absolute top-[14px] left-[14px] bg-[#E80000] text-white text-[10px] font-bold px-2 py-1 rounded z-10">
                            LIVE
                          </div>
                          
                          <div className="w-full flex flex-col items-center justify-center text-center mt-1">
                            <div className="text-[14px] font-[600] text-white leading-[1.2]" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {match.venue || "Green Park Arena"}
                            </div>
                            <div className="text-[11px] text-white/50 mt-[2px]" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {match.sportType || match.gameType || "Cricket"} • {match.overs || 12} Overs
                            </div>
                          </div>

                          {/* Teams section */}
                          <div className="flex items-center justify-between mt-auto">
                            {/* Team A Box */}
                            <div className="w-[96px] h-[86px] rounded-[8px] border border-white/20 bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center gap-[6px] text-center shrink-0">
                              <span className="text-[12px] font-normal text-white leading-[1.2] font-inter truncate w-full px-1">{teamA.name || "Warriors"}</span>
                              <span className="text-[18px] font-bold text-white leading-[1.2] font-inter">{teamA.score || "0/0"}</span>
                              <span className="text-[12px] font-normal text-[#A5A5A5] leading-[1.2] font-inter">{teamA.oversPlayed || "0.0"} Overs</span>
                            </div>

                            <div className="text-[11px] font-bold text-white/40">VS</div>

                            {/* Team B Box */}
                            <div className="w-[96px] h-[86px] rounded-[8px] border border-white/20 bg-white/10 backdrop-blur-sm flex flex-col items-center justify-center gap-[6px] text-center shrink-0">
                              <span className="text-[12px] font-normal text-white leading-[1.2] font-inter truncate w-full px-1">{teamB.name || "Titans"}</span>
                              <span className="text-[18px] font-bold text-white leading-[1.2] font-inter">{teamB.score || "0/0"}</span>
                              <span className="text-[12px] font-normal text-[#A5A5A5] leading-[1.2] font-inter">{teamB.oversPlayed || "0.0"} Overs</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>

                {/* Dot Slider */}
                <div className="flex justify-center items-center gap-1.5 mt-3 mb-1 pr-4">
                  {Array.from({ length: liveNetworkMatches.length > 0 ? liveNetworkMatches.length : 2 }).map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${currentLiveMatchSlide === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/20'}`}
                    ></div>
                  ))}
                </div>
              </div>
            )}

          {/* -- JOIN GAMES NEARBY (NEW UI) -- */}
          {(hostedGamesLoading || hostedGames?.length > 0) && (
            <div className="!mt-8 px-4">
            <div className="flex items-center justify-between px-1 mb-4">
              <h2 className="text-[16px] font-semibold text-white tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
                JOIN GAMES NEARBY
              </h2>
              <Link to="/join-games" className="text-[12px] font-medium text-[#bbf455]">
                View More &gt;
              </Link>
            </div>
            
            <div className="flex flex-col gap-[14px]">
              {hostedGamesLoading ? (
                // Skeleton loading cards
                [1, 2, 3].map((i) => (
                  <div key={i} className="w-full max-w-[361px] mx-auto h-[158px] rounded-[12px] border border-[#434242] bg-[#1B1B1B] animate-pulse" />
                ))
              ) : (
                hostedGames.slice(0, 4).map((game) => {
                  // Calculate slots
                  const isQuick = game.gameMode === "QUICK";
                  const allSlots = isQuick
                    ? (game.quickSlots || [])
                    : [
                        ...(game.teams?.teamA?.slots || []),
                        ...(game.teams?.teamB?.slots || []),
                      ];
                  const totalSlots = allSlots.length || game.maxMembers || 11;
                  const joinedSlots = allSlots.filter(
                    (s) => s.status === "JOINED" || s.status === "HELD" || s.status === "APPROVED" || s.userId || s.user
                  );
                  const joinedCount = joinedSlots.length;

                  // Player avatars (from joined players)
                  const playerAvatars = joinedSlots
                    .map((s) => s.user?.profilePicture)
                    .filter(Boolean)
                    .slice(0, 7);

                  // Venue info
                  const venueName = game.turf?.name || game.ground?.name || game.customVenue || "Self-Arranged";
                  const venueCity = game.turf?.city || game.city || userLocation?.city || "";
                  const venueType = game.turf ? "Turf" : game.ground ? "Ground" : "Custom";

                  // Date & Time
                  const gameDate = game.date ? new Date(game.date) : null;
                  const today = new Date();
                  const isToday = gameDate && gameDate.toDateString() === today.toDateString();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const isTomorrow = gameDate && gameDate.toDateString() === tomorrow.toDateString();
                  
                  let dateLabel = "—";
                  if (isToday) dateLabel = "Today";
                  else if (isTomorrow) dateLabel = "Tomorrow";
                  else if (gameDate) dateLabel = gameDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

                  const timeLabel = game.time || "—";

                  return (
                    <Link
                      key={game._id || game.id}
                      to="/join-games"
                      className="block w-full max-w-[361px] mx-auto h-[158px] rounded-[12px] border border-[#434242] bg-[#1B1B1B] p-[14px] flex flex-col justify-between hover:border-[#BBF455]/30 transition-colors"
                    >
                      {/* Top Half */}
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-white text-[20px] font-bold leading-none capitalize" style={{ fontFamily: "'Inter', sans-serif" }}>
                              {game.gameType || "Game"}
                            </span>
                            <span className="bg-[#1C361C] text-[#BBF455] text-[10px] px-2.5 py-0.5 rounded-full font-medium tracking-wide">
                              {venueType}
                            </span>
                          </div>
                          <div className="flex -space-x-1.5">
                            {(playerAvatars.length > 0 ? playerAvatars : Array(Math.min(joinedCount || 1, 5)).fill(null)).map((avatar, i) => (
                              <div key={i} className="w-[22px] h-[22px] rounded-full border border-[#1B1B1B] bg-gray-600 overflow-hidden shrink-0">
                                {avatar ? (
                                  <img src={avatar} alt="player" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#BBF455]/30 to-gray-700 flex items-center justify-center text-[8px] text-white/60 font-bold">
                                    {i + 1}
                                  </div>
                                )}
                              </div>
                            ))}
                            {joinedCount > 7 && (
                              <div className="w-[22px] h-[22px] rounded-full border border-[#1B1B1B] bg-gray-700 flex items-center justify-center text-[8px] text-white/50 font-bold shrink-0">
                                +{joinedCount - 7}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="text-white font-bold text-[14px] leading-none mb-1">
                            {joinedCount} <span className="text-white/60 text-[11px] font-semibold">/ {totalSlots}</span>
                          </div>
                          <div className="text-white/40 text-[10px] font-medium">Joined</div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="w-full h-[1px] bg-white/5 my-1"></div>

                      {/* Bottom Half */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-white font-bold text-[13px] leading-none" style={{ fontFamily: "'Inter', sans-serif" }}>
                            {dateLabel}, {timeLabel}
                          </span>
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-white/40 shrink-0" />
                            <span className="text-white/40 text-[11px] truncate max-w-[180px]">
                              {venueName}{venueCity ? `, ${venueCity}` : ""}
                            </span>
                          </div>
                        </div>
                        <span className="bg-[#BBF455] text-black font-bold text-[12px] px-4 py-2 rounded-full shrink-0">
                          Join Now
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
          )}


          {/* -- FIND YOUR ARENA -- */}
          <div className="!mt-8 px-2">
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
          <div className="!mt-8 px-2">
            <PlayersSection
              loading={loading}
              players={players}
              followingIds={followingIds}
              handleFollowToggle={handleFollowToggle}
            />
          </div>

          {/* -- PROFESSIONALS (NEW UI) -- */}
          <div className="!mt-8 px-4">
            <div className="flex items-center justify-between px-1 mb-4">
              <div
                className="text-[16px] font-semibold text-white tracking-wide"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Professionals
              </div>
              <Link
                to="/professionals"
                className="flex items-center gap-1 text-[12px] font-medium text-[#bbf455] whitespace-nowrap"
              >
                View More &gt;
              </Link>
            </div>
            
            <div className="flex gap-[14px] overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
              {professionalsLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="shrink-0 w-[188px] h-[234px] snap-start rounded-[12px] bg-[#161616] animate-pulse" />
                ))
              ) : professionals.length === 0 ? (
                <div className="text-white/50 text-[13px] py-4 w-full text-center" style={{ fontFamily: "'Inter', sans-serif" }}>No professionals available in your area.</div>
              ) : (
                professionals.map((p) => (
                  <div
                    key={p.id || p._id}
                    onClick={() => navigate(`/profile/${p.userId || p.id || p._id}`)}
                    className="shrink-0 w-[188px] h-[234px] snap-start relative rounded-[12px] overflow-hidden group cursor-pointer border border-[#434242]"
                  >
                    <img 
                      src={p.profilePicture || p.profileImage || p.image || "/default-avatar.png"} 
                      alt={p.name || "Professional"} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-transparent"></div>
                    
                    {p.rating !== undefined && p.rating !== null && (
                      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-[6px] flex items-center gap-1 border border-white/10">
                        <span className="text-white text-[10px]">★</span>
                        <span className="text-white text-[11px] font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {Number(p.rating).toFixed(1)}
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div className="flex flex-col max-w-[100px]">
                        <span className="text-white font-bold text-[14px] leading-tight truncate capitalize" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {p.name || "Professional"}
                        </span>
                        <span className="text-white/80 text-[12px] mt-0.5 uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {p.role || p.primaryRole || "PRO"}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${p.userId || p.id || p._id}`);
                        }}
                        className="bg-white text-black font-bold text-[12px] px-3.5 py-1.5 rounded-[8px] shrink-0 active:scale-95 transition-transform" 
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* -- SPORTS CATEGORIES -- */}
          <SportsCategoriesSection />

          {/* -- PROMOTIONS & HOST YOUR VENUE CTA -- */}
          <PromotionsSection marketingContent={marketingContent} />

          {/* -- SOCIAL ARENA -- */}
          <div className="!mt-8 px-2">
            <SocialArenaSection reelsFeed={reelsFeed} />
          </div>

        </Community>
      </div>

      <InterestsModal
        isOpen={showInterestsModal}
        onClose={() => setShowInterestsModal(false)}
        onSave={async (selectedInterests) => {
          try {
            await dispatch(
              updateUser({ interests: selectedInterests })
            ).unwrap();
            setShowInterestsModal(false);
          } catch (err) {
            console.error("Failed to update interests:", err);
          }
        }}
      />

      {/* Filter Sidebar Overlay */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 z-[1005] bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsFilterOpen(false)}
        ></div>
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#050505] border-l border-white/10 shadow-2xl z-[1010] transform transition-transform duration-300 ease-in-out ${isFilterOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2
              className="text-lg font-bold uppercase tracking-widest text-primary"
              style={HEADING_STYLE}
            >
              Filters
            </h2>
            <Button
              onClick={() => setIsFilterOpen(false)}
              className="w-8 h-8 min-h-0 p-0 flex items-center justify-center bg-transparent hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            {/* Venue Filter */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">
                Venue
              </h4>
              <div className="flex flex-wrap gap-2">
                {VENUE_TYPES.map((type) => {
                  const isSelected = selectedVenueTypes.includes(type);
                  return (
                    <Button
                      key={type}
                      onClick={() => handleToggleVenueType(type)}
                      className={`whitespace-nowrap px-3 h-7 min-h-0 py-0 rounded-[8px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${isSelected
                          ? "bg-primary/15 border border-primary text-primary"
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                        }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                      {type}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Pro's Filter */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">
                Pro's
              </h4>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <Button
                      key={role}
                      onClick={() => handleToggleRole(role)}
                      className={`whitespace-nowrap px-3 h-7 min-h-0 py-0 rounded-[8px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${isSelected
                          ? "bg-primary/15 border border-primary text-primary"
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                        }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                      {role}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Join Games Filter */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">
                Join Games
              </h4>
              <div className="flex flex-wrap gap-2">
                {["JOINABLE GAMES ONLY", "LIVE GAMES"].map((type) => {
                  const isSelected = selectedJoinGames.includes(type);
                  return (
                    <Button
                      key={type}
                      onClick={() => handleToggleJoinGame(type)}
                      className={`whitespace-nowrap px-3 h-7 min-h-0 py-0 rounded-[8px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${isSelected
                          ? "bg-primary/15 border border-primary text-primary"
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                        }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                      {type}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Players Filter */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">
                Players
              </h4>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((type) => {
                  const isSelected = selectedPlayers.includes(type);
                  return (
                    <Button
                      key={type}
                      onClick={() => handleTogglePlayerFilter(type)}
                      className={`whitespace-nowrap px-3 h-7 min-h-0 py-0 rounded-[8px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${isSelected
                          ? "bg-primary/15 border border-primary text-primary"
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                        }`}
                    >
                      {isSelected && <Check size={10} strokeWidth={3} />}
                      {type}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/5 flex gap-3 bg-background">
            <Button
              onClick={() => {
                setSelectedRoles([]);
                setSelectedVenueTypes([]);
                setSelectedJoinGames([]);
                setSelectedPlayers([]);
              }}
              className="flex-1 py-2.5 rounded-[8px] border border-white/10 text-[11px] font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest"
            >
              Reset
            </Button>
            <Button
              onClick={() => setIsFilterOpen(false)}
              className="flex-[2] py-2.5 rounded-[8px] bg-primary text-black text-[11px] font-black uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(191,243,103,0.3)]"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
