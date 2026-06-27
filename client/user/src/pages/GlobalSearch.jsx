import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Loader2,
  X,
  SlidersHorizontal,
  Check,
  ShieldCheck,
  MoreVertical,
  ThumbsUp,
  MessageCircle,
  Send,
} from "lucide-react";
import { useLazySearchPlayersQuery } from "@redux/api/teamApi";
import {
  useLazyGetCommunityFeedQuery,
  useGetCommunityFeedQuery,
} from "@redux/api/communityApi";
import { useGetGroundsQuery } from "@redux/api/gamesApi";
import axiosInstance from "@hooks/useAxiosInstance";
import { VenueCard } from "../features/turf";
import { GameCard } from "../features/games";
import { Button, Input } from "@kridaz/ui";
import { useSelector } from "react-redux";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import PostItem from "../features/networking/components/PostItem";
import { useGetReelsFeedQuery } from "@redux/api/reelsApi";
import SocialArenaSection from "./HomeSections/SocialArenaSection";


const HEADING_STYLE = { fontFamily: "'Inter', sans-serif" };

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const auth = useSelector((state) => state.auth) || {};
  const user = auth.user;
  const isAdmin = auth.role === "admin" || auth.role === "BMSP_ADMIN";
  const { gateInteraction } = useLoginOnDemand();

  // States for dynamic search
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // Filters State
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState("All");
  
  const [joinableGamesOnly, setJoinableGamesOnly] = useState(false);
  const [liveGamesOnly, setLiveGamesOnly] = useState(true);
  const [hasPostsOnly, setHasPostsOnly] = useState(false);

  const [activeVenueIndex, setActiveVenueIndex] = useState(0);
  const scrollRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const containerWidth = scrollRef.current.clientWidth;

    let closestIndex = 0;
    let minDiff = Infinity;

    Array.from(scrollRef.current.children).forEach((child, index) => {
      const childCenter = child.offsetLeft + child.clientWidth / 2 - scrollRef.current.offsetLeft;
      const scrollCenter = scrollLeft + containerWidth / 2;
      const diff = Math.abs(childCenter - scrollCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeVenueIndex) {
      setActiveVenueIndex(closestIndex);
    }
  }, [activeVenueIndex]);

  const [
    triggerSearchPlayers,
    { data: playersData, isFetching: playersLoading },
  ] = useLazySearchPlayersQuery();
  const [triggerGetFeed, { data: feedData, isFetching: postsLoading }] =
    useLazyGetCommunityFeedQuery();

  // Popular grounds query
  const { data: popularGroundsData, isLoading: groundsLoading } =
    useGetGroundsQuery({});
  const popularGrounds = popularGroundsData?.grounds?.slice(0, 5) || [];

  // Default Latest Posts query (when not searching)
  const { data: defaultFeedData, isLoading: defaultPostsLoading } =
    useGetCommunityFeedQuery({ page: 1, limit: 5 });

  const { data: reelsFeedResp } = useGetReelsFeedQuery();
  const reelsFeed = reelsFeedResp?.reels || [];
  const latestPosts = defaultFeedData?.posts || [];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim() !== "") {
      const isAll = activeQuickFilter === "All";

      if (isAll || activeQuickFilter === "Roles") {
        triggerSearchPlayers({
          query: debouncedQuery,
          roles: selectedRoles.join(","),
          page: 1,
          limit: 10,
        });
      }

      if (
        isAll ||
        activeQuickFilter === "Posts" ||
        activeQuickFilter === "Live"
      ) {
        triggerGetFeed({
          searchTerm: debouncedQuery,
          page: 1,
          limit: 10,
          roles: selectedRoles.join(","),
        });
      }

      if (isAll || activeQuickFilter === "Venue") {
        setLoadingVenues(true);
        axiosInstance
          .get("/api/user/turf/all", {
            params: {
              searchTerm: debouncedQuery,
              venueTypes: selectedVenueTypes.join(","),
            },
          })
          .then((res) => setVenues(res.data.turfs || []))
          .catch(console.error)
          .finally(() => setLoadingVenues(false));
      }

      if (isAll || activeQuickFilter === "Join Games") {
        setLoadingGames(true);
        axiosInstance
          .get("/api/hosted-game/list", {
            params: { query: debouncedQuery },
          })
          .then((res) => setGames(res.data.games || []))
          .catch(console.error)
          .finally(() => setLoadingGames(false));
      }
    }
  }, [
    debouncedQuery,
    triggerSearchPlayers,
    triggerGetFeed,
    selectedRoles,
    selectedVenueTypes,
    activeQuickFilter,
  ]);

  const loadedPlayers = playersData?.players || [];
  const [loadedPosts, setLoadedPosts] = useState([]);
  const [defaultLoadedPosts, setDefaultLoadedPosts] = useState([]);

  useEffect(() => {
    if (feedData?.posts) setLoadedPosts(feedData.posts);
  }, [feedData]);

  useEffect(() => {
    if (defaultFeedData?.posts) setDefaultLoadedPosts(defaultFeedData.posts);
  }, [defaultFeedData]);

  const handleUpdatePost = (postId, updater) => {
    setLoadedPosts((prev) =>
      prev.map((p) => (p.id === postId || p._id === postId ? updater(p) : p))
    );
    setDefaultLoadedPosts((prev) =>
      prev.map((p) => (p.id === postId || p._id === postId ? updater(p) : p))
    );
  };

  const handleToggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleToggleVenueType = (type) => {
    setSelectedVenueTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Quick Filters
  const QUICK_FILTERS = [
    "All",
    "Roles",
    "Venue",
    "Join Games",
    "Live",
    "Posts",
  ];
  const ROLES = ["COACH", "UMPIRE", "SCORER", "STREAMER", "CHEERLEADER"];
  const VENUE_TYPES = ["TURF", "GROUND", "INDOOR"];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-0 px-4 md:px-6 font-inter relative overflow-hidden">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        {/* Search Bar */}
        <div className="relative flex items-center w-full bg-card rounded-xl overflow-hidden shadow-lg border border-white/5 group focus-within:border-primary/30 transition-colors">
          <Search
            size={20}
            className="absolute left-4 text-white/40 group-focus-within:text-primary transition-colors"
          />
          <Input
            type="text"
            placeholder="Search venues, games, players..."
            className="w-full bg-transparent py-4 pl-12 pr-14 text-sm font-bold text-white outline-none placeholder:text-white/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery("")}
              className="absolute right-12 text-white/40 hover:text-white transition-colors p-1"
            >
              <X size={16} />
            </Button>
          )}
          <Button
            onClick={() => setIsFilterOpen(true)}
            className="absolute right-3 p-2 text-primary transition-colors bg-transparent hover:scale-110"
          >
            <SlidersHorizontal size={18} />
          </Button>
        </div>


        {/* Search Results vs Default View */}
        {debouncedQuery.trim() !== "" ? (
          // === SEARCH RESULTS ===
          <div className="space-y-6 animate-fade-in">
            {/* Players Search Results */}
            {((activeQuickFilter === "All" &&
              (loadedPlayers.length > 0 || playersLoading)) ||
              activeQuickFilter === "Roles") && (
                <div className="flex flex-col gap-3 bg-background border border-white/5 rounded-[8px] p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className="text-[18px] font-semibold text-white tracking-[0px] leading-[1.2] normal-case"
                      style={HEADING_STYLE}
                    >
                      Players matching &quot;{debouncedQuery}&quot;
                    </h3>
                    {playersLoading && (
                      <Loader2
                        size={16}
                        className="text-primary animate-spin"
                      />
                    )}
                  </div>

                  {loadedPlayers.length === 0 && !playersLoading ? (
                    <div className="text-center py-6 text-white/30 font-bold text-[12px] uppercase tracking-wider">
                      No players found
                    </div>
                  ) : (
                    <div
                      className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 scroll-smooth"
                      style={{
                        maxHeight: "240px",
                        minHeight: loadedPlayers.length > 1 ? "180px" : "90px",
                      }}
                    >
                      {loadedPlayers.map((player) => (
                        <div
                          key={player.id || player._id}
                          onClick={() =>
                            navigate(`/profile/${player.id || player._id}`)
                          }
                          className="flex items-center gap-3 bg-neutral-900/50 hover:bg-neutral-900 border border-white/5 hover:border-primary/30 p-3 rounded-[8px] cursor-pointer transition-all min-w-[220px] max-w-[280px] group shrink-0"
                        >
                          <div className="w-[42px] h-[42px] rounded-full bg-card border border-white/10 overflow-hidden shrink-0">
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
                            <div className="text-[13px] font-bold text-white group-hover:text-primary transition-colors truncate">
                              {player.name}
                            </div>
                            <div className="text-[11px] font-medium text-white/40 truncate">
                              @
                              {player.username ||
                                player.name.toLowerCase().replace(/\s+/g, "")}
                            </div>
                            {(player.city || player.state) && (
                              <div className="text-[9px] font-semibold text-primary mt-0.5 uppercase tracking-wider truncate">
                                {player.city}
                                {player.city && player.state ? ", " : ""}
                                {player.state}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Venues Search Results */}
            {((activeQuickFilter === "All" &&
              (venues.length > 0 || loadingVenues)) ||
              activeQuickFilter === "Venue") && (
                <div className="flex flex-col gap-3 bg-background border border-white/5 rounded-[8px] p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className="text-[18px] font-semibold text-white tracking-[0px] leading-[1.2] normal-case"
                      style={HEADING_STYLE}
                    >
                      Venues matching &quot;{debouncedQuery}&quot;
                    </h3>
                    {loadingVenues && (
                      <Loader2
                        size={16}
                        className="text-primary animate-spin"
                      />
                    )}
                  </div>

                  {venues.length === 0 && !loadingVenues ? (
                    <div className="text-center py-6 text-white/30 font-bold text-[12px] uppercase tracking-wider">
                      No venues found
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {venues.map((t) => (
                        <div key={t._id} className="aspect-[3/4]">
                          <VenueCard
                            t={t}
                            onClick={() => navigate(`/venue/${t._id || t.id}`)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Join Games Search Results */}
            {((activeQuickFilter === "All" &&
              (games.length > 0 || loadingGames)) ||
              activeQuickFilter === "Join Games") && (
                <div className="flex flex-col gap-3 bg-background border border-white/5 rounded-[8px] p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className="text-[18px] font-semibold text-white tracking-[0px] leading-[1.2] normal-case"
                      style={HEADING_STYLE}
                    >
                      Games matching &quot;{debouncedQuery}&quot;
                    </h3>
                    {loadingGames && (
                      <Loader2
                        size={16}
                        className="text-primary animate-spin"
                      />
                    )}
                  </div>

                  {games.length === 0 && !loadingGames ? (
                    <div className="text-center py-6 text-white/30 font-bold text-[12px] uppercase tracking-wider">
                      No games found
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {games.map((g) => (
                        <GameCard key={g.id || g._id} game={g} />
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Posts Search Results */}
            {((activeQuickFilter === "All" &&
              (loadedPosts.length > 0 || postsLoading)) ||
              activeQuickFilter === "Posts" ||
              activeQuickFilter === "Live") && (
                <div className="flex flex-col gap-3 bg-background border border-white/5 rounded-[8px] p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className="text-[18px] font-semibold text-white tracking-[0px] leading-[1.2] normal-case"
                      style={HEADING_STYLE}
                    >
                      Posts matching &quot;{debouncedQuery}&quot;
                    </h3>
                    {postsLoading && (
                      <Loader2
                        size={16}
                        className="text-primary animate-spin"
                      />
                    )}
                  </div>

                  {loadedPosts.length === 0 && !postsLoading ? (
                    <div className="text-center py-6 text-white/30 font-bold text-[12px] uppercase tracking-wider">
                      No posts found
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {loadedPosts.map((post) => (
                        <PostItem
                          key={post._id || post.id}
                          post={post}
                          user={user}
                          isAdmin={isAdmin}
                          gateInteraction={gateInteraction}
                          onUpdatePost={handleUpdatePost}
                          onDeletePost={() => { }}
                          onSharePost={() => { }}
                          onReportPost={() => { }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
          </div>
        ) : (
          // === DEFAULT EXPLORE VIEW ===
          <div className="space-y-4 animate-fade-in">
            {/* Popular Near You */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3
                  className="text-[18px] font-semibold text-white tracking-[0px] leading-[1.2] normal-case"
                  style={HEADING_STYLE}
                >
                  Popular Near You
                </h3>
                <Button className="text-xs font-bold text-primary hover:underline bg-transparent border-none shadow-none p-0 hover:bg-transparent">
                  View All
                </Button>
              </div>

              {groundsLoading ? (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-4 snap-x">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="min-w-[200px] w-[200px] h-[280px] rounded-[12px] bg-white/5 animate-pulse shrink-0 border border-white/5 snap-start"
                    />
                  ))}
                </div>
              ) : popularGrounds.length > 0 ? (
                <div className="relative group/scroll -mx-4 px-4">
                  <div
                    ref={scrollRef}
                    className="flex items-center gap-[6px] overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 px-[calc(50%-130px)] scroll-smooth min-h-[380px]"
                    onScroll={handleScroll}
                  >
                    {popularGrounds.map((ground, idx) => (
                      <div
                        key={ground._id}
                        className={`shrink-0 snap-center w-[260px] h-[360px] flex justify-center items-center relative transition-all duration-300 ${idx === activeVenueIndex ? 'z-10' : 'z-0'}`}
                      >
                        <VenueCard
                          t={ground}
                          onClick={() =>
                            navigate(`/venue/${ground._id || ground.id}`)
                          }
                          isActive={idx === activeVenueIndex}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Carousel Dots */}
                  <div className="flex justify-center gap-1.5 mt-2">
                    {popularGrounds.map((_, idx) => (
                      <div
                        key={idx}
                        className={`rounded-full transition-all duration-300 ${idx === activeVenueIndex ? "w-[18px] h-1.5 bg-white" : "w-1.5 h-1.5 bg-[#434242]"}`}
                      ></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-white/30 italic">
                  No popular venues found.
                </div>
              )}
            </div>

            {/* Latest Posts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3
                  className="text-[18px] font-semibold text-white tracking-[0px] leading-[1.2] normal-case"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Your Social Arena
                </h3>
                <Button className="text-xs font-bold text-primary hover:underline bg-transparent border-none shadow-none p-0 hover:bg-transparent">
                  View All
                </Button>
              </div>

              <SocialArenaSection reelsFeed={reelsFeed} />

              {defaultPostsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-white/5 animate-pulse"
                    />
                  ))}
                </div>
              ) : latestPosts.length > 0 ? (
                <div className="space-y-6">
                  {defaultLoadedPosts.map((post) => (
                    <PostItem
                      key={post._id || post.id}
                      post={post}
                      user={user}
                      isAdmin={isAdmin}
                      gateInteraction={gateInteraction}
                      onUpdatePost={handleUpdatePost}
                      onDeletePost={() => { }}
                      onSharePost={() => { }}
                      onReportPost={() => { }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-white/30 italic">
                  No posts found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter Sidebar Overlay */}
      {/* Backdrop */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 z-[1005] bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsFilterOpen(false)}
        ></div>
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[400px] max-w-full bg-[#050505] shadow-2xl z-[1010] transform transition-transform duration-300 ease-in-out ${isFilterOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
            <Button
              onClick={() => setIsFilterOpen(false)}
              className="w-8 h-8 p-0 flex items-center justify-center bg-transparent hover:bg-white/10 rounded-full text-white transition-colors"
            >
              <X size={18} />
            </Button>
            <h2
              className="text-[16px] font-semibold text-[#bbf455] tracking-[0px] leading-[1.2] normal-case"
              style={HEADING_STYLE}
            >
              Filters
            </h2>
            <Button
              onClick={() => {
                setSelectedRoles([]);
                setSelectedVenueTypes([]);
                setJoinableGamesOnly(false);
                setLiveGamesOnly(false);
                setHasPostsOnly(false);
              }}
              className="bg-transparent border-none text-white/70 hover:text-white text-[12px] font-semibold p-0 h-auto"
            >
              Reset
            </Button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
            {/* Roles */}
            <div>
              <h4 className="text-[10px] font-bold uppercase text-white/50 tracking-widest mb-3">
                Roles
              </h4>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <Button
                      key={role}
                      onClick={() => handleToggleRole(role)}
                      className={`whitespace-nowrap px-3 py-1 h-auto rounded-[6px] text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${isSelected
                          ? "bg-[#2a2a2a] border border-[#bbf455] text-white"
                          : "bg-[#1b1b1b] border border-[#323232] text-white/50 hover:bg-[#202020]"
                        }`}
                    >
                      {role}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="w-full h-px bg-white/10" />

            {/* Venue Type */}
            <div>
              <h4 className="text-[10px] font-bold uppercase text-white/50 tracking-widest mb-3">
                Venue Type
              </h4>
              <div className="flex flex-wrap gap-2">
                {VENUE_TYPES.map((type) => {
                  const isSelected = selectedVenueTypes.includes(type);
                  return (
                    <Button
                      key={type}
                      onClick={() => handleToggleVenueType(type)}
                      className={`whitespace-nowrap px-3 py-1 h-auto rounded-[6px] text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${isSelected
                          ? "bg-[#2a2a2a] border border-[#bbf455] text-white"
                          : "bg-[#1b1b1b] border border-[#323232] text-white/50 hover:bg-[#202020]"
                        }`}
                    >
                      {type}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="w-full h-px bg-white/10" />

            {/* Game Status */}
            <div>
              <h4 className="text-[10px] font-bold uppercase text-white/50 tracking-widest mb-3">
                Game Status
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-white/80">Joinable Games Only</span>
                  <div
                    onClick={() => setJoinableGamesOnly(!joinableGamesOnly)}
                    className={`w-9 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors duration-300 ${joinableGamesOnly ? 'bg-[#bbf455]' : 'bg-[#333]'}`}
                  >
                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${joinableGamesOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-white/80">Live Games</span>
                  <div
                    onClick={() => setLiveGamesOnly(!liveGamesOnly)}
                    className={`w-9 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors duration-300 ${liveGamesOnly ? 'bg-[#bbf455]' : 'bg-[#333]'}`}
                  >
                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${liveGamesOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-white/80">Has Posts</span>
                  <div
                    onClick={() => setHasPostsOnly(!hasPostsOnly)}
                    className={`w-9 h-5 rounded-full flex items-center px-1 cursor-pointer transition-colors duration-300 ${hasPostsOnly ? 'bg-[#bbf455]' : 'bg-[#333]'}`}
                  >
                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${hasPostsOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-white/10" />

            {/* Booking Fee Mock */}
            <div>
              <h4 className="text-[10px] font-bold uppercase text-white/50 tracking-widest mb-2">
                Booking Fee (Price Range)
              </h4>
              <p className="text-[11px] text-white/40 mb-3">Average booking fee per hour is $45</p>

              {/* Mock Histogram */}
              <div className="flex items-end gap-[2px] h-[40px] w-full px-2">
                {[10, 20, 35, 55, 80, 95, 100, 80, 55, 40, 25, 15, 10].map((val, i) => (
                  <div key={i} className={`flex-1 rounded-t-[2px] ${i >= 3 && i <= 8 ? 'bg-[#d9d9d9]' : 'bg-[#333]'}`} style={{ height: `${val}%` }} />
                ))}
              </div>

              {/* Slider Track */}
              <div className="relative w-full h-1 bg-[#333] mt-2 rounded-full mb-5">
                <div className="absolute left-[25%] right-[35%] top-0 bottom-0 bg-[#d9d9d9] rounded-full"></div>
                <div className="absolute left-[25%] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"></div>
              </div>

              {/* Min/Max Inputs */}
              <div className="flex gap-3">
                <div className="flex-1 bg-[#161616] rounded-[6px] p-2 px-3">
                  <div className="text-[9px] text-white/40 mb-0.5">Minimum</div>
                  <div className="text-[12px] font-semibold text-white">Rs 10</div>
                </div>
                <div className="flex-1 bg-[#161616] rounded-[6px] p-2 px-3">
                  <div className="text-[9px] text-white/40 mb-0.5">Maximum</div>
                  <div className="text-[12px] font-semibold text-white">Rs 500+</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 px-5 border-t border-white/10 flex gap-3 bg-[#050505]">
            <Button
              onClick={() => {
                setSelectedRoles([]);
                setSelectedVenueTypes([]);
              }}
              className="flex-1 py-2.5 h-auto rounded-[8px] bg-[#2a2a2a] text-white text-[12px] font-semibold hover:bg-[#333] transition-colors border-none"
            >
              Clear All
            </Button>
            <Button
              onClick={() => setIsFilterOpen(false)}
              className="flex-[1.5] py-2.5 h-auto rounded-[8px] bg-gradient-to-r from-[#6af0c8] to-[#bbf455] text-[#050505] text-[13px] font-bold hover:opacity-90 transition-opacity border-none shadow-none"
            >
              Show Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
