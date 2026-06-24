import { useState, useEffect } from "react";
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
import { GameCard } from "../features/games";import { Button, Input } from "@kridaz/ui";


const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // States for dynamic search
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // Filters State
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState("All");

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
  const loadedPosts = feedData?.posts || [];

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

  const renderPost = (post) => {
    const authorId =
      post.adminId?.id ||
      post.adminId?._id ||
      post.author?.id ||
      post.author?._id ||
      post.authorId;
    const authorName = post.adminId?.name || post.author?.name || "Player";
    const authorPic =
      post.adminId?.profilePicture ||
      post.author?.profilePicture ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName}`;
    const postImage =
      post.image ||
      post.imageUrl ||
      post.mediaUrl ||
      post.thumbnailUrl ||
      (post.media?.length > 0 ? post.media[0].url : null);
    const mediaType =
      post.mediaType || (post.media?.length > 0 ? post.media[0].type : null);

    return (
      <div
        key={post._id || post.id}
        className="bg-transparent p-0 space-y-4"
      >
        {/* Post Header */}
        <div className="flex items-center justify-between">
          <Link
            to={`/profile/${authorId}`}
            className="flex items-center gap-3 group"
          >
            <img
              src={authorPic}
              className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-primary/50 transition-colors"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-white transition-colors">
                  {authorName}
                </span>
                <ShieldCheck size={14} className="text-primary" />
              </div>
              <div className="text-[11px] font-bold text-white/40 mt-0.5">
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Link>
          <Button className="text-white/40 hover:text-white transition-colors p-1 bg-transparent border-none shadow-none hover:bg-transparent">
            <MoreVertical size={18} />
          </Button>
        </div>

        {/* Caption */}
        {(post.title || post.content) && (
          <div className="text-[12px] font-medium leading-relaxed">
            {post.title && <span className="font-bold mr-2">{post.title}</span>}
            <span className="text-white/90 whitespace-pre-wrap">
              {post.content}
            </span>
          </div>
        )}

        {/* Media */}
        {postImage && (
          <div className="relative rounded-[8px] overflow-hidden group border border-white/5 bg-card">
            {mediaType === "video" ? (
              <video
                src={postImage}
                className="w-full object-cover max-h-[500px]"
                controls
              />
            ) : (
              <img
                src={postImage}
                className="w-full object-cover max-h-[500px]"
              />
            )}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-5">
            <Button className="flex items-center gap-2 group bg-transparent border-none p-0 hover:bg-transparent shadow-none">
              <ThumbsUp
                size={20}
                className="text-white/70 group-hover:text-primary transition-colors"
              />
              <span className="text-[12px] font-bold text-white">
                {post.likes?.length || 0}
              </span>
            </Button>
            <Button className="flex items-center gap-2 group bg-transparent border-none p-0 hover:bg-transparent shadow-none">
              <MessageCircle
                size={20}
                className="text-white/70 group-hover:text-primary transition-colors"
              />
              <span className="text-[12px] font-bold text-white">
                {post.comments?.length || post.totalComments || 0}
              </span>
            </Button>
            <Button className="flex items-center gap-2 group bg-transparent border-none p-0 hover:bg-transparent shadow-none">
              <Send
                size={18}
                className="text-white/70 group-hover:text-primary transition-colors"
              />
              <span className="text-[12px] font-bold text-white">Share</span>
            </Button>
          </div>
        </div>
      </div>
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

        {/* Quick Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {QUICK_FILTERS.map((filter) => (
              <Button
                key={filter}
                onClick={() => setActiveQuickFilter(filter)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-[6px] text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeQuickFilter === filter
                    ? "bg-primary/10 text-primary border-primary/30 shadow-[0_0_15px_rgba(191,243,103,0.15)]"
                    : "bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white/80"
                }`}
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Sub Filters for Roles */}
          {activeQuickFilter === "Roles" && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 animate-fade-in">
              {ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <Button
                    key={role}
                    onClick={() => handleToggleRole(role)}
                    className={`whitespace-nowrap px-3.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-primary/15 border-primary text-primary"
                        : "bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    {isSelected && <Check size={10} strokeWidth={3} />}
                    {role}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Sub Filters for Venue */}
          {activeQuickFilter === "Venue" && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 animate-fade-in">
              {VENUE_TYPES.map((type) => {
                const isSelected = selectedVenueTypes.includes(type);
                return (
                  <Button
                    key={type}
                    onClick={() => handleToggleVenueType(type)}
                    className={`whitespace-nowrap px-3.5 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-primary/15 border-primary text-primary"
                        : "bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    {isSelected && <Check size={10} strokeWidth={3} />}
                    {type}
                  </Button>
                );
              })}
            </div>
          )}
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
                    className="text-xs font-black uppercase tracking-widest text-primary"
                    style={HEADING_STYLE}
                  >
                    PLAYERS MATCHING &quot;{debouncedQuery}&quot;
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
                    className="text-xs font-black uppercase tracking-widest text-primary"
                    style={HEADING_STYLE}
                  >
                    VENUES MATCHING &quot;{debouncedQuery}&quot;
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
                    className="text-xs font-black uppercase tracking-widest text-primary"
                    style={HEADING_STYLE}
                  >
                    GAMES MATCHING &quot;{debouncedQuery}&quot;
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
                    className="text-xs font-black uppercase tracking-widest text-primary"
                    style={HEADING_STYLE}
                  >
                    POSTS MATCHING &quot;{debouncedQuery}&quot;
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
                    {loadedPosts.map((post) => renderPost(post))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // === DEFAULT EXPLORE VIEW ===
          <div className="space-y-8 animate-fade-in">
            {/* Popular Near You */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3
                  className="text-lg font-bold text-white"
                  style={HEADING_STYLE}
                >
                  Popular Near You
                </h3>
                <Button className="text-xs font-bold text-primary hover:underline bg-transparent border-none shadow-none p-0 hover:bg-transparent">
                  View All
                </Button>
              </div>

              {groundsLoading ? (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="min-w-[240px] w-[240px] h-[320px] rounded-2xl bg-white/5 animate-pulse shrink-0 border border-white/5"
                    />
                  ))}
                </div>
              ) : popularGrounds.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
                  {popularGrounds.map((ground) => (
                    <div
                      key={ground._id}
                      className="min-w-[240px] w-[240px] h-[320px] shrink-0 snap-start"
                    >
                      <VenueCard
                        t={ground}
                        onClick={() =>
                          navigate(`/venue/${ground._id || ground.id}`)
                        }
                      />
                    </div>
                  ))}
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
                  className="text-lg font-bold text-white"
                  style={HEADING_STYLE}
                >
                  Latest Posts
                </h3>
                <Button className="text-xs font-bold text-primary hover:underline bg-transparent border-none shadow-none p-0 hover:bg-transparent">
                  View All
                </Button>
              </div>

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
                  {latestPosts.map((post) => renderPost(post))}
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
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsFilterOpen(false)}
        ></div>
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#050505] border-l border-white/10 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out ${isFilterOpen ? "translate-x-0" : "translate-x-full"}`}
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
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            {/* Roles Filter */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">
                Roles
              </h4>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => {
                  const isSelected = selectedRoles.includes(role);
                  return (
                    <Button
                      key={role}
                      onClick={() => handleToggleRole(role)}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        isSelected
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

            {/* Venue Types Filter */}
            <div>
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-3">
                Venue Type
              </h4>
              <div className="flex flex-wrap gap-2">
                {VENUE_TYPES.map((type) => {
                  const isSelected = selectedVenueTypes.includes(type);
                  return (
                    <Button
                      key={type}
                      onClick={() => handleToggleVenueType(type)}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        isSelected
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

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  Joinable Games Only
                </span>
                <Input
                  type="checkbox"
                  className="w-4 h-4 accent-[var(--primary)] rounded bg-black border-white/20"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  Live Games
                </span>
                <Input
                  type="checkbox"
                  className="w-4 h-4 accent-[var(--primary)] rounded bg-black border-white/20"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  Has Posts
                </span>
                <Input
                  type="checkbox"
                  className="w-4 h-4 accent-[var(--primary)] rounded bg-black border-white/20"
                />
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/5 flex gap-3 bg-background">
            <Button
              onClick={() => {
                setSelectedRoles([]);
                setSelectedVenueTypes([]);
              }}
              className="flex-1 py-3 rounded-lg border border-white/10 text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest"
            >
              Reset
            </Button>
            <Button
              onClick={() => setIsFilterOpen(false)}
              className="flex-[2] py-3 rounded-lg bg-primary text-black text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(191,243,103,0.3)]"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
