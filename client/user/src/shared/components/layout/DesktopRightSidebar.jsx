import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Clock,
  Calendar,
  MapPin,
  Star,
  UserPlus,
  UserMinus,
  Trophy,
  ArrowRight,
  Ticket,
  IndianRupee,
  Sparkles,
  Info,
  Plus,
  Users,
  Zap,
  Share2,
  DollarSign,
  Activity,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  Search,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { followUser, unfollowUser } from "@redux/slices/authSlice";
import { setFilters } from "@redux/slices/turfSlice";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import { Liquid } from "../ui/button-1";
import SearchTurf from "@components/search/SearchTurf.jsx";
import {
  useGetSuggestedPlayersQuery,
  useGetUserBookingsQuery,
  useGetUserWalletQuery,
  useGetPlayerDetailsQuery,
  useFollowPlayerMutation,
  useUnfollowPlayerMutation,
} from "@redux/api/userApi";
import { useGetTurfsQuery, useGetTurfDetailsQuery } from "@redux/api/turfApi";
import { useGetMyScoringGamesQuery } from "@redux/api/scoringApi";
import { useGetMarketingContentQuery } from "@redux/api/featuresApi";
import { Button, Input } from "@kridaz/ui";

const LIQUID_COLORS = {
  color1: "var(--foreground)",
  color2: "#1E10C5",
  color3: "#9089E2",
  color4: "#FCFCFE",
  color5: "#F9F9FD",
  color6: "#B2B8E7",
  color7: "#0E2DCB",
  color8: "#0017E9",
  color9: "#4743EF",
  color10: "#7D7BF4",
  color11: "#0B06FC",
  color12: "#C5C1EA",
  color13: "#1403DE",
  color14: "#B6BAF6",
  color15: "#C1BEEB",
  color16: "#290ECB",
  color17: "#3F4CC0",
};

export default function DesktopRightSidebar({
  isRightDrawerOpen,
  setIsRightDrawerOpen,
}) {
  const location = useLocation();
  const dispatch = useDispatch();
  const searchFilters = useSelector((state) => state.turf?.filters || {});
  const { gateInteraction } = useLoginOnDemand();
  const {
    isLoggedIn,
    user,
    followingIds = [],
  } = useSelector((state) => state.auth);

  const nearbyScrollRef = useRef(null);
  const liveMatchesScrollRef = useRef(null);

  const scrollNearby = (direction) => {
    if (nearbyScrollRef.current) {
      const scrollAmount = 145 + 12; // card width (145px) + gap (12px = gap-3)
      nearbyScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollLiveMatches = (direction) => {
    if (liveMatchesScrollRef.current) {
      const scrollAmount = liveMatchesScrollRef.current.clientWidth;
      liveMatchesScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Parse path context
  const isHome =
    location.pathname === "/" || location.pathname === "/community";
  const isVenuePage =
    location.pathname.startsWith("/venues") ||
    location.pathname.startsWith("/venue/");
  const isPlayerPage =
    location.pathname.startsWith("/players") ||
    location.pathname.startsWith("/profile");
  const isTournamentPage =
    location.pathname.startsWith("/leaderboard") ||
    location.pathname.startsWith("/match");
  const isMessagesPage = location.pathname.startsWith("/messages");
  const isProfessionalPage =
    location.pathname.startsWith("/professionals") ||
    location.pathname.startsWith("/professional");
  const isJoinGamesPage = location.pathname.startsWith("/join-games");

  const showHomeWidgets = isHome;

  // Dynamic greetings
  const [greeting, setGreeting] = useState("Welcome");
  const [isInviteHovered, setIsInviteHovered] = useState(false);
  const [currentLiveMatchIndex, setCurrentLiveMatchIndex] = useState(0);

  const turfId = location.pathname.startsWith("/venue/")
    ? location.pathname.split("/venue/")[1]
    : null;
  const profileId = location.pathname.startsWith("/profile")
    ? location.pathname.split("/profile/")[1]
    : null;

  // Set time-based greeting
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting("Good Morning");
    else if (hrs < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // 1. Suggested Players (RTK Query)
  const { data: playersData, isLoading: loadingPlayers } =
    useGetSuggestedPlayersQuery(
      { limit: 3, sortBy: "newest" },
      { skip: !showHomeWidgets }
    );
  const suggestedPlayers = playersData?.players || [];

  const { data: marketingContent } = useGetMarketingContentQuery(undefined, { skip: !showHomeWidgets });

  // 2. Nearby Venues (RTK Query)
  const { data: turfsData, isLoading: loadingVenues } = useGetTurfsQuery(
    { limit: 3 },
    { skip: !showHomeWidgets }
  );
  const nearbyVenues = turfsData?.turfs || [];

  // 3. User Bookings (RTK Query)
  const { data: bookingsData, isLoading: loadingBookings } =
    useGetUserBookingsQuery(undefined, {
      skip: !showHomeWidgets || !isLoggedIn,
    });

  const upcomingBookingsList = (bookingsData || []).filter((booking) => {
    const bookingDate = new Date(
      booking.date || booking.timeSlot?.date || booking.createdAt
    );
    bookingDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  });

  // Live Matches (RTK Query)
  const { data: scoringGamesData, isLoading: loadingScoringGames } =
    useGetMyScoringGamesQuery(undefined, {
      skip: !showHomeWidgets || !isLoggedIn,
    });

  const scoringGames =
    scoringGamesData?.games ||
    (Array.isArray(scoringGamesData) ? scoringGamesData : []);
  const liveNetworkMatches = scoringGames.filter(
    (game) =>
      game.status === "LIVE" ||
      game.status === "ONGOING" ||
      game.status === "live"
  );

  // 4. Wallet Balance (RTK Query)
  const { data: walletData, isLoading: loadingWallet } = useGetUserWalletQuery(
    undefined,
    { skip: !showHomeWidgets || !isLoggedIn }
  );
  const walletBalance = walletData?.balance || 0;

  // 5. Active Venue Detail (RTK Query)
  const { data: activeTurfData } = useGetTurfDetailsQuery(turfId, {
    skip: !turfId,
  });
  const activeTurf = activeTurfData?.turf || null;

  // 6. Active Player Detail (RTK Query)
  const { data: activePlayerData } = useGetPlayerDetailsQuery(profileId, {
    skip: !profileId || profileId === "undefined",
  });
  const activePlayer = activePlayerData?.player || null;

  const [followPlayerMutation] = useFollowPlayerMutation();
  const [unfollowPlayerMutation] = useUnfollowPlayerMutation();

  // Handle Follow Toggle with Redux & Kridaz Login Gate
  const handleFollowToggleLocal = async (player) => {
    gateInteraction(
      async () => {
        const playerId = player._id || player.id;
        const isFollowing = followingIds.includes(playerId);

        // Optimistic Update
        dispatch(isFollowing ? unfollowUser(playerId) : followUser(playerId));

        try {
          if (isFollowing) {
            await unfollowPlayerMutation(playerId).unwrap();
            toast.success("Unfollowed player");
          } else {
            await followPlayerMutation(playerId).unwrap();
            toast.success("Following player");
          }
        } catch (err) {
          // Revert on error
          dispatch(isFollowing ? followUser(playerId) : unfollowUser(playerId));
          toast.error("Failed to update follow status");
        }
      },
      {
        title: "Follow Player",
        message: `Sign in to follow ${player.name} and stay updated.`,
      }
    );
  };

  if (isMessagesPage) return null;

  const greetingName =
    isLoggedIn && user?.name ? user.name.split(" ")[0] : "Champion";

  return (
    <>
      {/* Tablet Drawer Backdrop Overlay */}
      {isRightDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-[72] xl:hidden"
          onClick={() => setIsRightDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed xl:sticky top-[77px] xl:top-[96px] right-0 bottom-0 xl:bottom-auto w-[440px] xl:w-[350px] sidebar-glass xl:bg-transparent border-l border-white/5 xl:border-l-0 p-6 xl:p-0 xl:pl-6 overflow-y-auto xl:overflow-y-auto no-scrollbar transition-transform duration-300 z-[74] xl:z-[50] h-auto xl:h-[calc(100vh-120px)] shrink-0 ${isRightDrawerOpen ? "translate-x-0" : "translate-x-full xl:translate-x-0"}`}
      >
        <div className="space-y-4">
          {/* ── HOME & GENERAL PORTAL VIEW WIDGETS ── */}
          {showHomeWidgets && (
            <>
              {/* Promotions & Host Your Venues CTA */}
              <div className="space-y-4">
                {/* Dynamic Promotions */}
                {(marketingContent?.banners || [])
                  .filter((b) => b.type === "PROMOTION" && b.isActive)
                  .sort((a, b) => a.order - b.order)
                  .map((promo) => {
                    const Wrapper = promo.targetUrl ? "a" : "div";
                    const wrapperProps = promo.targetUrl
                      ? {
                          href: promo.targetUrl,
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }
                      : {};

                    return (
                      <Wrapper
                        key={promo._id || promo.id}
                        {...wrapperProps}
                        className="relative block overflow-hidden rounded-2xl w-full aspect-video shadow-[0_4px_20px_rgba(0,0,0,0.5)] group border border-white/[0.05] hover:border-primary/50 transition-all duration-300 my-0 cursor-pointer"
                      >
                        {promo.videoUrl ? (
                          <video
                            src={promo.videoUrl}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        ) : (
                          <div
                            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                            style={{
                              backgroundImage: `url('${promo.imageUrl || ""}')`,
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 w-[70%] h-full p-4 flex flex-col justify-center gap-1.5 pl-5">
                          <h3 className="text-[16px] leading-tight font-black text-white uppercase drop-shadow-lg">
                            {promo.title}
                          </h3>
                          {promo.description && (
                            <p className="text-[10px] font-medium text-white/90 leading-snug drop-shadow-md">
                              {promo.description}
                            </p>
                          )}
                        </div>
                      </Wrapper>
                    );
                  })}

              </div>

              {/* Live Now */}
              {isLoggedIn &&
                (loadingScoringGames || liveNetworkMatches.length > 0) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">
                        Live Now
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <Button
                          onClick={() => scrollLiveMatches("left")}
                          className="p-1 rounded-full bg-white/5 border border-white/5 hover:bg-[#E83441]/20 hover:border-[#E83441]/50 text-white hover:text-[#E83441] transition-all"
                        >
                          <ChevronLeft size={14} />
                        </Button>
                        <Button
                          onClick={() => scrollLiveMatches("right")}
                          className="p-1 rounded-full bg-white/5 border border-white/5 hover:bg-[#E83441]/20 hover:border-[#E83441]/50 text-white hover:text-[#E83441] transition-all"
                        >
                          <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>

                    <div
                      ref={liveMatchesScrollRef}
                      className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
                    >
                      {loadingScoringGames ? (
                        <div className="w-full py-4 flex justify-center items-center">
                          <div className="w-4 h-4 border-2 border-[#E83441] border-t-transparent rounded-full animate-spin"></div>
                        </div>
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
                              className="min-w-full shrink-0 snap-start block bg-gradient-to-br from-[#E83441]/20 via-[#0B0B0C] to-[#0B0B0C] border border-[#E83441]/20 rounded-xl p-4 hover:border-[#E83441]/40 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm group relative"
                            >
                              {/* Top section: Status & Info */}
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-3 items-center">
                                  <div className="bg-[#E83441] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-[4px] tracking-widest shadow-[0_0_10px_rgba(232,52,65,0.4)]">
                                    LIVE
                                  </div>
                                  <div>
                                    <h5 className="text-[12px] font-bold text-white leading-none">
                                      {match.venue || "Kridaz Arena"}
                                    </h5>
                                    <p className="text-[10px] text-white/50 mt-1 font-medium">
                                      {match.sportType ||
                                        match.gameType ||
                                        "Match"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-[10px] font-medium text-right leading-tight">
                                  <span className="text-primary">
                                    Overs: {match.overs || 0}
                                  </span>
                                  <br />
                                  {match.target && (
                                    <span className="text-white/40 text-[9px]">
                                      Target: {match.target}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Bottom section: Scoreboard */}
                              <div className="flex flex-col gap-2.5 relative pr-6">
                                {/* Team 1 */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-6 h-6 rounded bg-card border border-white/10 flex items-center justify-center shrink-0`}
                                    >
                                      {teamA.logo ? (
                                        <img
                                          src={teamA.logo}
                                          alt="A"
                                          className="w-full h-full object-cover rounded"
                                        />
                                      ) : (
                                        <span
                                          className={`text-[10px] font-black text-white`}
                                        >
                                          {(teamA.name || "A").substring(0, 2)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-bold text-white/60">
                                      {teamA.name || "Team A"}
                                    </span>
                                  </div>
                                  <div className="text-[14px] font-black text-white/60 font-mono tracking-tight">
                                    {teamA.score || "0"}{" "}
                                    <span className="text-[9px] font-medium text-white/40 ml-0.5">
                                      ({teamA.oversPlayed || "0.0"})
                                    </span>
                                  </div>
                                </div>

                                {/* Team 2 (Batting) */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-6 h-6 rounded bg-yellow-500/20 border border-white/10 flex items-center justify-center shrink-0`}
                                    >
                                      {teamB.logo ? (
                                        <img
                                          src={teamB.logo}
                                          alt="B"
                                          className="w-full h-full object-cover rounded"
                                        />
                                      ) : (
                                        <span
                                          className={`text-[10px] font-black text-yellow-500`}
                                        >
                                          {(teamB.name || "B").substring(0, 2)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] font-bold text-white">
                                      {teamB.name || "Team B"}
                                    </span>
                                  </div>
                                  <div className="text-[14px] font-black text-white font-mono tracking-tight shadow-[var(--primary)]">
                                    {teamB.score || "0"}{" "}
                                    <span className="text-[9px] font-medium text-white/60 ml-0.5">
                                      ({teamB.oversPlayed || "0.0"})
                                    </span>
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

              {/* 8. Upcoming Bookings (Moved Above Players) */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">
                    Upcoming Bookings
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <Button
                      onClick={() => scrollNearby("left")}
                      className="p-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/50 text-white hover:text-primary transition-all"
                    >
                      <ChevronLeft size={14} />
                    </Button>
                    <Button
                      onClick={() => scrollNearby("right")}
                      className="p-1 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/50 text-white hover:text-primary transition-all"
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
                <div
                  ref={nearbyScrollRef}
                  className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
                >
                  {loadingBookings ? (
                    <div className="w-full py-4 flex justify-center items-center">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : isLoggedIn && upcomingBookingsList.length > 0 ? (
                    upcomingBookingsList.map((booking, idx) => {
                      const dateObj = new Date(
                        booking.date ||
                          booking.bookingDate ||
                          booking.timeSlot?.date ||
                          Date.now()
                      );
                      const dayStr = dateObj
                        .getDate()
                        .toString()
                        .padStart(2, "0");
                      const monthStr = dateObj
                        .toLocaleString("en-US", { month: "short" })
                        .toUpperCase();

                      let startTime =
                        booking.timeSlot?.formattedStartTime ||
                        booking.startTime ||
                        "Slot";
                      if (
                        booking.startTime &&
                        booking.startTime.includes("T")
                      ) {
                        startTime = new Date(
                          booking.startTime
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      } else if (booking.playStartTime) {
                        startTime = new Date(
                          booking.playStartTime
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      }

                      const turfName =
                        booking.turf?.name ||
                        booking.turfName ||
                        booking.customVenue ||
                        "Confirmed Venue";
                      const turfAddress =
                        booking.turf?.address ||
                        booking.turf?.city ||
                        booking.turfCity ||
                        booking.city ||
                        booking.location ||
                        "View Details";
                      const turfImage =
                        booking.turf?.images?.[0] ||
                        booking.turfImage ||
                        "/default-turf.jpg";

                      return (
                        <Link
                          key={booking._id || booking.id}
                          to={`/booking-pass/${booking.id || booking._id}`}
                          className="min-w-[145px] w-[145px] flex flex-col rounded-xl border border-gray-600/60 bg-[#070708] overflow-hidden group shrink-0 shadow-sm transition-all hover:border-primary/50"
                        >
                          {/* Image Section */}
                          <div className="relative w-full aspect-[4/5] overflow-hidden bg-white/5">
                            <img
                              src={turfImage}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80";
                              }}
                              alt={turfName}
                            />
                            {/* Banner */}
                            <div className="absolute bottom-0 left-0 right-0 bg-[#E81E73] p-1 px-2">
                              <p className="text-[9px] font-bold text-white text-center">
                                Booked • {startTime}
                              </p>
                            </div>
                          </div>

                          {/* Text Section */}
                          <div className="flex gap-2 p-2">
                            {/* Date Box */}
                            <div className="bg-[#2A2D34] rounded-lg p-1 w-[36px] h-[40px] flex flex-col items-center justify-center shrink-0 border border-white/5">
                              <span className="text-[11px] font-black text-white leading-none">
                                {dayStr}
                              </span>
                              <span className="text-[7px] font-bold text-primary leading-none mt-1 uppercase">
                                {monthStr}
                              </span>
                            </div>

                            {/* Text Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h5 className="text-[10px] font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                {turfName}
                              </h5>
                              <p className="text-[8px] text-white/50 truncate mt-0.5 font-medium">
                                {turfAddress}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-[11px] font-medium text-white/30 italic text-center w-full py-2">
                      {isLoggedIn
                        ? "No upcoming matches booked"
                        : "Please log in to view your bookings"}
                    </div>
                  )}
                </div>
              </div>

              {/* Invite & Earn Strip (Moved to Bottom) */}
              <div className="w-full mt-4 flex justify-center">
                <Link
                  to="/wallet"
                  className="relative inline-block w-full h-[3.5em] group dark:bg-black bg-white dark:border-white border-black border rounded-xl overflow-visible"
                >
                  {/* Inner container */}
                  <div className="relative w-full h-full overflow-hidden rounded-xl">
                    <span className="absolute inset-0 rounded-xl bg-[#d9d9d9]"></span>
                    <span className="absolute inset-0 rounded-xl bg-black"></span>
                    <Liquid
                      isHovered={isInviteHovered}
                      colors={LIQUID_COLORS}
                    />

                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className={`absolute inset-0 rounded-xl border-solid border-[3px] border-gradient-to-b from-transparent to-white mix-blend-overlay filter ${i <= 2 ? "blur-[3px]" : i === 3 ? "blur-[5px]" : "blur-[4px]"}`}
                      ></span>
                    ))}
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[70.8%] h-[42.85%] rounded-xl filter blur-[15px] bg-[#006]"></span>
                  </div>

                  <div
                    className="absolute inset-0 rounded-xl bg-transparent cursor-pointer flex items-center justify-center gap-3 px-5"
                    onMouseEnter={() => setIsInviteHovered(true)}
                    onMouseLeave={() => setIsInviteHovered(false)}
                  >
                    <Share2
                      size={18}
                      className="group-hover:text-yellow-400 text-white flex-shrink-0 transition-colors"
                    />
                    <span className="group-hover:text-yellow-400 text-white text-[14px] font-black tracking-wide whitespace-nowrap transition-colors uppercase">
                      Invite & Earn
                    </span>
                  </div>
                </Link>
              </div>
            </>
          )}

          {/* ── VENUE-SPECIFIC WIDGETS ── */}
          {isVenuePage && (
            <>
              {activeTurf ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Venue Summary Widget */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">
                      Venue Summary
                    </h4>
                    <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 space-y-3 shadow-md">
                      <h3 className="text-[14px] font-black text-white uppercase tracking-tight leading-tight">
                        {activeTurf.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-primary font-bold">
                        <Star
                          size={12}
                          fill="currentColor"
                          className="text-yellow-500"
                        />{" "}
                        {activeTurf.averageRating || activeTurf.rating || "4.8"}{" "}
                        ({activeTurf.totalReviews || 12} reviews)
                      </div>
                      <div className="text-[10px] text-white/50 leading-relaxed font-sans">
                        {activeTurf.description ||
                          "Premium sports arena with top tier grass fields, floodlights, and professional training facilities."}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Card */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">
                      Pricing & Status
                    </h4>
                    <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 flex justify-between items-center shadow-md">
                      <div>
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                          Hourly Price
                        </span>
                        <div className="text-xl font-black text-white mt-1.5 flex items-center leading-none">
                          <IndianRupee size={15} />
                          {activeTurf.pricePerHour || 1500}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-0.5 bg-green-500/10 text-green-500 rounded text-[8px] font-black uppercase tracking-wider border border-green-500/20">
                          AVAILABLE
                        </span>
                        <p className="text-[8px] text-white/45 mt-1.5 uppercase font-bold tracking-widest">
                          Instant Booking
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Booking card */}
                  <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-xl p-4 space-y-3.5 shadow-lg">
                    <div className="flex items-center gap-1.5 text-[11px] text-primary font-black uppercase tracking-wider">
                      <Sparkles size={12} className="animate-pulse" />
                      <span>Ready to play?</span>
                    </div>
                    <p className="text-[10px] text-white/60 leading-normal font-sans">
                      Reserve your preferred slot now. Secure payments and
                      instant passes via wallet or online payment.
                    </p>
                    <Link
                      to={`/checkout/${activeTurf._id || activeTurf.id}`}
                      className="block w-full text-center py-3 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-lg hover:scale-102 transition-transform shadow-[0_4px_15px_rgba(191,243,103,0.15)]"
                    >
                      Quick Book Now
                    </Link>
                  </div>

                  {/* Location Details */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">
                      Location Info
                    </h4>
                    <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 space-y-3 shadow-md">
                      <div className="flex gap-2.5 text-[11px] text-white/70 font-sans">
                        <MapPin
                          size={14}
                          className="text-primary shrink-0 mt-0.5"
                        />
                        <div>
                          <p className="font-bold text-white uppercase">
                            {activeTurf.city}, {activeTurf.state}
                          </p>
                          <p className="text-[9px] text-white/40 mt-1 leading-normal uppercase">
                            {activeTurf.address || "Main Sports Hub Area"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-5 shadow-md">
                  <SearchTurf
                    onSearch={(filters) => dispatch(setFilters(filters))}
                  />

                  {/* Advanced Filters */}
                  <div className="mt-8 space-y-8 border-t border-white/[0.05] pt-6">
                    {/* Slot Availability */}
                    <div className="space-y-4">
                      <h5 className="text-[13px] font-black uppercase text-white tracking-wider">
                        Slot Availability
                      </h5>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Input
                            type="checkbox"
                            checked={searchFilters.onlyAvailable || false}
                            onChange={(e) =>
                              dispatch(
                                setFilters({ onlyAvailable: e.target.checked })
                              )
                            }
                            className="accent-[var(--primary)] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer"
                          />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">
                            Show Only Available Venues
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Input
                            type="checkbox"
                            checked={searchFilters.onlyFavorites || false}
                            onChange={(e) =>
                              dispatch(
                                setFilters({ onlyFavorites: e.target.checked })
                              )
                            }
                            className="accent-[var(--primary)] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer"
                          />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">
                            Show Only Favorites
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Slot Timings */}
                    <div className="space-y-4">
                      <h5 className="text-[13px] font-black uppercase text-white tracking-wider">
                        Slot Timings
                      </h5>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Input
                            type="checkbox"
                            checked={searchFilters.timingMorning || false}
                            onChange={(e) =>
                              dispatch(
                                setFilters({ timingMorning: e.target.checked })
                              )
                            }
                            className="accent-[var(--primary)] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer"
                          />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">
                            Morning (6:00 AM - 11:00 AM)
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Input
                            type="checkbox"
                            checked={searchFilters.timingAfternoon || false}
                            onChange={(e) =>
                              dispatch(
                                setFilters({
                                  timingAfternoon: e.target.checked,
                                })
                              )
                            }
                            className="accent-[var(--primary)] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer"
                          />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">
                            Afternoon (11:00 AM - 5:00 PM)
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Input
                            type="checkbox"
                            checked={searchFilters.timingEvening || false}
                            onChange={(e) =>
                              dispatch(
                                setFilters({ timingEvening: e.target.checked })
                              )
                            }
                            className="accent-[var(--primary)] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer"
                          />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">
                            Evening (5:00 PM - 10:00 PM)
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Input
                            type="checkbox"
                            checked={searchFilters.timingLateNight || false}
                            onChange={(e) =>
                              dispatch(
                                setFilters({
                                  timingLateNight: e.target.checked,
                                })
                              )
                            }
                            className="accent-[var(--primary)] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer"
                          />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">
                            Late Night (After 10 PM)
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="space-y-4">
                      <h5 className="text-[13px] font-black uppercase text-white tracking-wider">
                        Star Rating: {(searchFilters.minRating || 0).toFixed(1)}{" "}
                        - 5.0
                      </h5>
                      <div className="space-y-5 px-1 pt-1">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            <span>
                              Min Rating:{" "}
                              {(searchFilters.minRating || 0).toFixed(1)}
                            </span>
                          </div>
                          <Input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={searchFilters.minRating || 0}
                            onChange={(e) =>
                              dispatch(
                                setFilters({
                                  minRating: parseFloat(e.target.value),
                                })
                              )
                            }
                            style={{
                              background: `linear-gradient(to right, var(--primary) ${((searchFilters.minRating || 0) / 5) * 100}%, #1F1F1F ${((searchFilters.minRating || 0) / 5) * 100}%)`,
                            }}
                            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-4">
                      <h5 className="text-[13px] font-black uppercase text-white tracking-wider">
                        Price
                      </h5>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Input
                            type="checkbox"
                            className="accent-[var(--primary)] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer"
                          />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">
                            Less than ₹5000
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <Input
                            type="checkbox"
                            defaultChecked
                            className="accent-[var(--primary)] w-4 h-4 rounded border-[#333] bg-transparent cursor-pointer"
                          />
                          <span className="text-[13px] font-medium text-gray-400 group-hover:text-white transition-colors">
                            ₹5000 and above
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── TOURNAMENT-SPECIFIC WIDGETS ── */}
          {isTournamentPage && (
            <div className="space-y-6 animate-fade-in">
              {/* Tournament Information */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">
                  Active Tournament Info
                </h4>
                <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 space-y-3 shadow-md">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-black uppercase tracking-wider border border-primary/20">
                    BOX CRICKET
                  </span>
                  <h3 className="text-[14px] font-black text-white uppercase tracking-tight">
                    Kridaz Super Sixes 2026
                  </h3>
                  <div className="flex flex-col gap-2 text-[10px] text-white/60 font-bold uppercase tracking-wider pt-1">
                    <span className="flex items-center gap-1.5">
                      🏆 Prize Pool:{" "}
                      <span className="text-white font-black">₹50,000</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      📍 Venue:{" "}
                      <span className="text-white font-black">
                        PlayArena Gachibowli
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      📅 Dates:{" "}
                      <span className="text-white font-black">
                        15 - 20 June 2026
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration status */}
              <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/25 rounded-xl p-4 space-y-3 shadow-lg">
                <h5 className="text-[11px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={12} className="animate-pulse" /> REGISTRATIONS
                  CLOSING SOON
                </h5>
                <p className="text-[10px] text-white/60 leading-normal font-sans">
                  Only 3 team slots remaining. Connect with your team players
                  and register to secure entry in the tournament grid.
                </p>
                <Link
                  to="/my-teams"
                  className="block w-full text-center py-2.5 bg-yellow-505 text-black bg-yellow-500 font-black uppercase text-[10px] tracking-widest rounded-lg hover:scale-102 transition-transform shadow-[0_4px_12px_rgba(234,179,8,0.15)]"
                >
                  Register Your Team
                </Link>
              </div>

              {/* Upcoming Matches */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">
                  Upcoming Matchup
                </h4>
                <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 space-y-3 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase text-white/40">
                      15 Jun | 18:00
                    </span>
                    <span className="text-[8px] font-black uppercase text-primary">
                      Match 01
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black uppercase">
                    <span className="truncate max-w-[120px] text-white">
                      Secunderabad Strikers
                    </span>
                    <span className="text-white/40 font-normal shrink-0 text-[10px]">
                      VS
                    </span>
                    <span className="truncate max-w-[120px] text-right text-white">
                      Cyberabad Titans
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PLAYER-SPECIFIC WIDGETS ── */}
          {isPlayerPage && (
            <>
              {activePlayer ? (
                <div className="space-y-6 animate-fade-in">
                  {/* Profile Summary */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">
                      Player Profile
                    </h4>
                    <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-5 text-center space-y-3.5 shadow-md">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 border border-primary/25 mx-auto">
                        <img
                          src={
                            activePlayer.profilePicture ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${activePlayer.name}`
                          }
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-black text-white truncate uppercase tracking-tight">
                          {activePlayer.name}
                        </h3>
                        <p className="text-[10px] text-white/40 uppercase font-bold mt-1 leading-none">
                          @
                          {activePlayer.username ||
                            activePlayer.name
                              ?.toLowerCase()
                              .replace(/\s+/g, "")}
                        </p>
                      </div>
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        {activePlayer.interests?.slice(0, 3).map((item) => (
                          <span
                            key={item}
                            className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-bold text-white/60 uppercase"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Player Statistics */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">
                      Statistics
                    </h4>
                    <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 grid grid-cols-3 gap-2.5 text-center shadow-md">
                      <div>
                        <span className="text-[8px] font-bold text-white/45 uppercase tracking-widest block">
                          Matches
                        </span>
                        <div className="text-[15px] font-black text-white mt-1.5 leading-none">
                          {activePlayer.matchesPlayed || 14}
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-white/45 uppercase tracking-widest block">
                          Rating
                        </span>
                        <div className="text-[15px] font-black text-primary mt-1.5 leading-none">
                          {activePlayer.rating || "4.9"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-white/45 uppercase tracking-widest block">
                          Followers
                        </span>
                        <div className="text-[15px] font-black text-white mt-1.5 leading-none">
                          {activePlayer.followersCount || 120}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connect/Invite actions */}
                  <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-4 space-y-3 shadow-md">
                    <h5 className="text-[11px] font-black text-white uppercase tracking-widest">
                      Player Actions
                    </h5>
                    <div className="space-y-2">
                      <Link
                        to="/messages"
                        className="block w-full text-center py-3 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-lg hover:scale-102 transition-transform shadow-[0_4px_12px_rgba(191,243,103,0.15)]"
                      >
                        Send Message
                      </Link>
                      <Button className="w-full py-3 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-lg hover:bg-white/10 transition-colors">
                        Invite to Match
                      </Button>
                    </div>
                  </div>
                </div>
              ) : location.pathname === "/players" ? null : (
                <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-5 text-center space-y-2.5 shadow-md">
                  <h4 className="text-[12px] font-black text-white uppercase tracking-wider">
                    Player Profiles
                  </h4>
                  <p className="text-[10px] text-white/40 leading-relaxed font-sans uppercase font-bold tracking-wide">
                    Select a profile from the directory to review their matchup
                    statistics, ratings, and send games invites.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── DEFAULT WIDGETS (Fallback for other general pages) ── */}
          {!isHome &&
            !isVenuePage &&
            !isPlayerPage &&
            !isTournamentPage &&
            !isProfessionalPage &&
            !isJoinGamesPage && (
              <>
                {/* Quick Info */}
                <div className="bg-gradient-to-br from-primary/5 to-transparent border border-white/5 rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-primary font-black uppercase tracking-wider">
                    <Info size={12} />
                    <span>Kridaz Arena</span>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed font-sans">
                    Welcome to India's ultimate sports-tech platform. Score
                    matches, secure venue bookings, hire professionals, and
                    match-make in real-time.
                  </p>
                </div>

                {/* Trending matches list */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-black uppercase text-white/40 tracking-widest">
                    Trending Leagues
                  </h4>
                  <div className="bg-[#0B0B0C] border border-white/[0.05] rounded-xl p-3.5 space-y-3 shadow-md">
                    <div className="border-b border-white/5 pb-2.5">
                      <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded text-[7px] font-black uppercase tracking-wider">
                        LIVE
                      </span>
                      <h5 className="text-[11px] font-bold text-white mt-1.5 truncate">
                        Hyderabad Super Sixes
                      </h5>
                    </div>
                    <div>
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[7px] font-black uppercase tracking-wider">
                        ACTIVE
                      </span>
                      <h5 className="text-[11px] font-bold text-white mt-1.5 truncate">
                        Telangana Corporate Cup
                      </h5>
                    </div>
                  </div>
                </div>
              </>
            )}
        </div>
      </aside>
    </>
  );
}
