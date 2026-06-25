import {
  Clock,
  MapPin,
  Calendar,
  QrCode,
  ShieldCheck,
  Zap,
  Activity,
  Wallet,
  CreditCard,
  FileText,
  Ticket,
  AlertOctagon,
  IndianRupee,
  Loader2,
  User,
  Star,
  ShieldAlert,
  X,
  RefreshCw,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import useBookingHistory from "../hooks/useBookingHistory";
import useWriteReview from "@hooks/useWriteReview";
import TurfBookingHistorySkeleton from "@components/ui/TurfBookingHistorySkeleton";
import WriteReview from "@components/reviews/WriteReview";
import ReportIssueFlowModal from "@components/dispute/ReportIssueFlowModal";
import useSimilarRecommendations from "@hooks/useSimilarRecommendations";
import useRecommendations from "@hooks/useRecommendations";
import { TurfCard } from "@features/turf";
import axiosInstance from "@hooks/useAxiosInstance";
import { useGetMyJoinedGamesQuery } from "@redux/api/gamesApi";
import {
  useGetUserOnDemandBookingsQuery,
  useCreateMatchRequestMutation,
} from "@redux/api/professionalApi";
import toast from "react-hot-toast";
import { Button, Textarea } from "@kridaz/ui";


// ── Design tokens (exact match to OwnerDashboard) ──────────────────────────
const BG = "var(--background)";
const CARD = "var(--background)";
const BORDER = "var(--border)";
const ACCENT = "var(--primary)";
const MUTED = "var(--muted-foreground)";
const MUTED2 = "var(--muted-foreground)";

// ── Status badge config ────────────────────────────────────────────────────
const STATUS_META = {
  CONFIRMED: {
    label: "Confirmed",
    color: ACCENT,
    bg: `${ACCENT}15`,
    border: `${ACCENT}30`,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "var(--destructive)",
    bg: "var(--destructive)15",
    border: "var(--destructive)30",
  },
  COMPLETED: {
    label: "Completed",
    color: "var(--success)",
    bg: "var(--success)15",
    border: "var(--success)30",
  },
  DISPUTED: {
    label: "Under Review",
    color: ACCENT,
    bg: `${ACCENT}15`,
    border: `${ACCENT}30`,
  },
  PLAYING: {
    label: "In Progress",
    color: "#3B82F6",
    bg: "#3B82F615",
    border: "#3B82F630",
  },
};

// ── Helper: hours until slot ───────────────────────────────────────────────
const hoursUntil = (dateStr) =>
  (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60);

const TurfBookingHistory = () => {
  const { loading, bookings, cancelBooking } = useBookingHistory();
  const {
    isReviewModalOpen,
    rating,
    review,
    isSubmitting,
    openReviewModal,
    closeReviewModal,
    handleRatingChange,
    handleReviewChange,
    submitReview,
  } = useWriteReview();

  const [selectedDisputeBooking, setSelectedDisputeBooking] = useState(null);

  // ── Professional Review & Dispute State ──────────────────────────────────
  const [proReviewModal, setProReviewModal] = useState({
    open: false,
    professionalId: null,
    professionalName: "",
  });
  const [proReviewRating, setProReviewRating] = useState(0);
  const [proReviewContent, setProReviewContent] = useState("");
  const [proReviewSubmitting, setProReviewSubmitting] = useState(false);
  const [proDisputeBooking, setProDisputeBooking] = useState(null);

  const openProReviewModal = (professionalId, professionalName) => {
    setProReviewModal({ open: true, professionalId, professionalName });
    setProReviewRating(0);
    setProReviewContent("");
  };

  const closeProReviewModal = () => {
    setProReviewModal({
      open: false,
      professionalId: null,
      professionalName: "",
    });
    setProReviewRating(0);
    setProReviewContent("");
  };

  const submitProReview = async () => {
    if (!proReviewModal.professionalId || proReviewRating === 0) return;
    setProReviewSubmitting(true);
    try {
      await axiosInstance.post("/api/professional/review", {
        professionalId: proReviewModal.professionalId,
        rating: proReviewRating,
        content: proReviewContent,
      });
      toast.success("Review submitted successfully!");
      closeProReviewModal();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setProReviewSubmitting(false);
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get("subTab") || "venues";
  const validTabs = ["venues", "games", "professionals"];
  const subTabParam = validTabs.includes(rawTab) ? rawTab : "venues";
  const [bookingSubTab, setBookingSubTabState] = useState(subTabParam);

  const setBookingSubTab = (subTabName) => {
    setBookingSubTabState(subTabName);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("subTab", subTabName);
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    if (subTabParam && subTabParam !== bookingSubTab) {
      setBookingSubTabState(subTabParam);
    }
  }, [subTabParam]);

  // Load Joined Games
  const { data: joinedGamesData, isLoading: loadingJoinedGames } =
    useGetMyJoinedGamesQuery();
  const joinedGames = joinedGamesData?.games || [];

  // Load On-Demand Match Requests & Bookings
  const {
    data: onDemandData,
    isLoading: loadingOnDemand,
    refetch: refetchOnDemand,
  } = useGetUserOnDemandBookingsQuery();
  const activeRequests = onDemandData?.activeRequests || [];
  const onDemandBookings = onDemandData?.bookings || [];
  const failedRequests = onDemandData?.failedRequests || [];

  const [createMatchRequest] = useCreateMatchRequestMutation();

  const handleRetryMatch = async (req) => {
    try {
      const expiresAt = new Date(Date.now() + 120000).toISOString();
      await createMatchRequest({
        groundId: req.groundId,
        customLocation: req.customLocation,
        roles: req.roles,
        minBudget: Number(req.minBudget),
        maxBudget: Number(req.maxBudget),
        expiresAt,
      }).unwrap();
      toast.success("Match request re-created successfully!");
      if (refetchOnDemand) refetchOnDemand();
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to retry match request.");
    }
  };

  // Load Hired Professionals Bookings
  const [professionalBookings, setProfessionalBookings] = useState([]);
  const [loadingProBookings, setLoadingProBookings] = useState(false);

  useEffect(() => {
    const fetchProBookings = async () => {
      setLoadingProBookings(true);
      try {
        const res = await axiosInstance.get("/api/professional/user-bookings");
        if (res.data.success) {
          setProfessionalBookings(res.data.bookings || []);
        }
      } catch (error) {
        console.error("Failed to load professional bookings:", error);
      } finally {
        setLoadingProBookings(false);
      }
    };
    fetchProBookings();
  }, []);

  // Proximity recommendations near user's latest booked turf
  const latestTurfId = bookings?.[0]?.turf?.id || bookings?.[0]?.turf?._id;
  const { similarTurfs, loading: similarLoading } = useSimilarRecommendations(
    latestTurfId,
    { limit: 4 }
  );

  // General proximity recommendations for empty booking states
  const { recommendations, loading: recsLoading } = useRecommendations({
    limit: 4,
  });

  const fetchBookingsRefresh = () => window.location.reload();

  if (loading) return <TurfBookingHistorySkeleton />;

  return (
    <div
      className="max-w-7xl mx-auto px-3 md:px-0 pt-2 pb-8 booking-history-container"
      style={{ fontFamily: "'Open Sans'" }}
    >
      <style>{`
        .booking-history-container h1,
        .booking-history-container h2,
        .booking-history-container h3,
        .booking-history-container h4,
        .booking-history-container h5,
        .booking-history-container h6,
        .booking-history-container p,
        .booking-history-container span,
        .booking-history-container div,
        .booking-history-container button,
        .booking-history-container a {
          font-family: 'Open Sans' !important;
        }
      `}</style>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header and Sub-Tabs */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 pb-4 border-b border-white/10 gap-4 px-0">
          <div className="min-w-0">
            <h2
              className="text-sm sm:text-lg md:text-xl lg:text-2xl font-black uppercase tracking-tighter text-white whitespace-nowrap"
              style={{ fontFamily: "'Open Sans'" }}
            >
              Booking & Game History
            </h2>
          </div>

          <div className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-2 pb-1 max-w-full shrink-0">
            <Button
              onClick={() => setBookingSubTab("venues")}
              className={`px-3 py-2 shrink-0 rounded-[6px] font-black uppercase tracking-wider text-[9px] sm:text-[10px] border transition-all ${bookingSubTab === "venues" ? "bg-primary text-black border-primary shadow-[0_4px_12px_rgba(204,255,0,0.2)]" : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"}`}
            >
              Venue Bookings
            </Button>
            <Button
              onClick={() => setBookingSubTab("games")}
              className={`px-3 py-2 shrink-0 rounded-[6px] font-black uppercase tracking-wider text-[9px] sm:text-[10px] border transition-all ${bookingSubTab === "games" ? "bg-primary text-black border-primary shadow-[0_4px_12px_rgba(204,255,0,0.2)]" : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"}`}
            >
              Joined Games
            </Button>
            <Button
              onClick={() => setBookingSubTab("professionals")}
              className={`px-3 py-2 shrink-0 rounded-[6px] font-black uppercase tracking-wider text-[9px] sm:text-[10px] border transition-all ${bookingSubTab === "professionals" ? "bg-primary text-black border-primary shadow-[0_4px_12px_rgba(204,255,0,0.2)]" : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"}`}
            >
              Hired Professionals
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {bookingSubTab === "venues" && (
            <div>
              {/* ── Bookings Feed ───────────────────────────────────────────── */}
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="bg-card p-20 rounded-[8px] border border-white/5 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 mx-auto rounded-full bg-card flex items-center justify-center text-gray-500 mb-4">
                      <Calendar size={24} />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">
                      No Bookings Yet
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">
                      Explore local arenas and book your first game!
                    </p>
                    <Link
                      to="/"
                      className="mt-6 px-6 py-3 rounded-[6px] bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:bg-[#b3ff00] transition-colors"
                    >
                      Explore Venues
                    </Link>
                  </div>
                ) : (
                  bookings.map((booking) => {
                    const sm =
                      STATUS_META[booking.status] || STATUS_META.CONFIRMED;
                    const hrs = hoursUntil(booking.playStartTime);
                    const slotOver = new Date() > new Date(booking.playEndTime);

                    return (
                      <div
                        key={booking.id || booking._id}
                        className="bg-card border border-[rgba(255,255,255,0.08)] rounded-[16px] p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 hover:shadow-[0px_8px_24px_rgba(179,220,38,0.15)] transition-all font-inter"
                      >
                        {/* 1. Venue & Header */}
                        <div className="flex flex-col gap-1.5 md:w-[35%]">
                          <div className="flex items-center justify-between md:justify-start gap-2">
                            <span className="px-1.5 py-0.5 bg-primary text-background rounded-[4px] text-[8px] font-black uppercase tracking-widest">
                              {booking.turf?.sportType || "FOOTBALL"}
                            </span>
                            <span className="text-[9px] font-bold text-[rgba(255,255,255,0.40)] uppercase tracking-widest">
                              ID: #
                              {(booking.id || booking._id)
                                ?.slice(-5)
                                .toUpperCase() || "B7402"}
                            </span>
                          </div>
                          <div>
                            <h2 className="text-[14px] font-black text-foreground uppercase tracking-tight truncate">
                              {booking.turf?.name || "Decathlon Sports Arena"}
                            </h2>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-[rgba(255,255,255,0.70)] uppercase tracking-widest mt-0.5">
                              <MapPin size={10} className="text-primary" />
                              <span className="truncate">
                                {booking.turf?.city || "Location"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:block w-[1px] h-10 bg-white/10 shrink-0"></div>
                        <div className="md:hidden h-[1px] w-full bg-white/5 my-0.5"></div>

                        {/* 2. Middle: Date/Time & Price/Status container */}
                        <div className="flex justify-between items-end md:items-center md:flex-1">
                          {/* Date & Time */}
                          <div className="flex flex-col justify-center gap-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground uppercase tracking-widest">
                              <Calendar
                                size={12}
                                className="text-[rgba(255,255,255,0.70)]"
                              />
                              {booking.timeSlot?.date || "12 Oct 2026"}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[rgba(255,255,255,0.70)] uppercase tracking-widest">
                              <Clock
                                size={12}
                                className="text-[rgba(255,255,255,0.70)]"
                              />
                              {booking.timeSlot?.formattedStartTime || "18:00"}{" "}
                              - {booking.timeSlot?.formattedEndTime || "19:30"}
                            </div>
                          </div>

                          {/* Price & Status */}
                          <div className="flex flex-col justify-center items-end gap-1 md:pr-4">
                            <div className="text-[14px] font-black text-primary">
                              ₹
                              {Number(booking.advanceAmount) ||
                                Number(booking.totalPrice) ||
                                Number(booking.turf?.pricePerHour) ||
                                "1,500"}
                            </div>
                            <div
                              className="px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest"
                              style={{
                                color: sm.color,
                                backgroundColor: sm.bg,
                                border: `1px solid ${sm.border}`,
                              }}
                            >
                              {sm.label}
                            </div>
                          </div>
                        </div>

                        {/* 3. Action */}
                        <div className="mt-1 pt-3 border-t border-white/5 md:border-t-0 md:pt-0 md:mt-0 shrink-0 flex flex-col md:flex-row gap-2">
                          {(booking.status === "confirmed" ||
                            booking.status === "completed") && (
                            <Button
                              onClick={() => setSelectedDisputeBooking(booking)}
                              className="w-full md:w-auto h-[36px] px-4 rounded-[8px] border border-red-500/50 text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                            >
                              <AlertOctagon size={14} /> Report Issue
                            </Button>
                          )}
                          <Link
                            to={`/booking-pass/${booking.id || booking._id}`}
                            className="w-full md:w-auto h-[36px] px-6 rounded-[8px] bg-primary text-background text-[11px] font-black uppercase tracking-widest hover:bg-[#a2c921] transition-all flex items-center justify-center gap-2"
                          >
                            <Ticket size={14} /> View Pass
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Case A: Bookings exist -> Render Proximity Recommendations near latest venue */}
              {bookings.length > 0 &&
                (similarLoading ||
                  (similarTurfs && similarTurfs.length > 0)) && (
                  <div className="mt-16 pt-10 border-t border-white/5 space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black uppercase text-primary tracking-tight flex items-center gap-2">
                        Recommended Arenas Near You
                      </h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-inter">
                        Handpicked grounds matching your recent game history
                      </p>
                    </div>

                    {similarLoading ? (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="h-[280px] rounded-[8px] bg-card border border-white/5 animate-pulse relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-[50%]" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                              <div className="h-4 bg-white/10 rounded w-[80%]" />
                              <div className="h-3 bg-white/5 rounded w-[50%]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {similarTurfs.map((t) => (
                          <TurfCard
                            key={t.id || t._id}
                            turf={t}
                            distance={
                              t.distance
                                ? `${(t.distance / 1000).toFixed(1)} km Away`
                                : "Nearby"
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

              {/* Case B: Bookings is empty -> Render general trending proximity feeds */}
              {bookings.length === 0 &&
                (recsLoading ||
                  (recommendations && recommendations.length > 0)) && (
                  <div className="mt-16 pt-10 border-t border-white/5 space-y-6">
                    <div className="space-y-1 text-center md:text-left">
                      <h3 className="text-lg font-black uppercase text-primary tracking-tight flex items-center gap-2 justify-center md:justify-start">
                        Trending Arenas Near You
                      </h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-inter">
                        Highly frequented grounds & elite hubs active in your
                        city
                      </p>
                    </div>

                    {recsLoading ? (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="h-[280px] rounded-[8px] bg-card border border-white/5 animate-pulse relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-[50%]" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                              <div className="h-4 bg-white/10 rounded w-[80%]" />
                              <div className="h-3 bg-white/5 rounded w-[50%]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {recommendations.map((t) => (
                          <TurfCard
                            key={t.id || t._id}
                            turf={t}
                            distance={
                              t.distance
                                ? `${(t.distance / 1000).toFixed(1)} km Away`
                                : "Nearby"
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {bookingSubTab === "games" && (
            <div className="space-y-4">
              {loadingJoinedGames ? (
                <div className="text-center py-12 bg-background rounded-[8px] border border-white/5">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Loading Joined Games...
                  </p>
                </div>
              ) : joinedGames.length === 0 ? (
                <div className="bg-card p-16 rounded-[8px] border border-white/5 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center text-gray-500 mb-4">
                    <Zap size={24} />
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">
                    No Joined Games
                  </h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">
                    You haven&apos;t joined any match lobbies or training games
                    yet.
                  </p>
                </div>
              ) : (
                joinedGames.map((game) => {
                  const statusColors = {
                    JOINED:
                      "text-primary bg-primary/10 border-primary/20",
                    PENDING:
                      "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
                    CANCELLED: "text-red-500 bg-red-500/10 border-red-500/20",
                  };
                  const statusText = game.mySlotStatus || "JOINED";
                  const statusClass =
                    statusColors[statusText] ||
                    "text-gray-400 bg-white/5 border-white/10";

                  return (
                    <div
                      key={game._id}
                      className="group relative rounded-[8px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[8px]" />
                      <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[8px]" />

                      <div className="relative bg-background rounded-[8px] p-4 flex flex-col md:flex-row gap-6 w-full">
                        <div className="w-full md:w-48 h-32 shrink-0 rounded-[8px] overflow-hidden bg-white/5 flex items-center justify-center relative">
                          {game.turf?.images?.[0] ? (
                            <img
                              src={game.turf.images[0]}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              alt=""
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Zap className="w-8 h-8 text-primary" />
                              <span className="text-[8px] font-black uppercase text-gray-600 tracking-widest">
                                {game.gameType || "CRICKET"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-black uppercase tracking-widest border border-primary/20">
                                {game.gameType || "CRICKET"}
                              </span>
                              {game.format && (
                                <span className="px-1.5 py-0.5 bg-white/5 text-white rounded text-[8px] font-black uppercase tracking-widest border border-white/10">
                                  {game.format}
                                </span>
                              )}
                              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                                ID: #{game._id?.slice(-5).toUpperCase()}
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                              {game.name || `${game.gameType} Practice Match`}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                              <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-primary" />{" "}
                                {game.time}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar
                                  size={12}
                                  className="text-primary"
                                />{" "}
                                {new Date(game.date).toLocaleDateString(
                                  "en-GB"
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin size={12} className="text-primary" />{" "}
                                {game.turf?.name ||
                                  game.customVenue ||
                                  "Local Ground"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                              Role:{" "}
                              <span className="text-white font-black">
                                {game.myRole || "Player"}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-end py-1 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                          <div className="text-right">
                            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">
                              Entry Fee
                            </p>
                            <p className="text-xl font-black text-white">
                              {Number(game.perPlayerCharge) > 0
                                ? `₹${game.perPlayerCharge}`
                                : "Free"}
                            </p>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-[8px] text-[8px] font-black uppercase tracking-widest border ${statusClass}`}
                          >
                            {statusText}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {bookingSubTab === "professionals" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {loadingProBookings || loadingOnDemand ? (
                <div className="text-center py-12 bg-background rounded-[8px] border border-white/5">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Loading Hired Professionals...
                  </p>
                </div>
              ) : activeRequests.length === 0 &&
                onDemandBookings.length === 0 &&
                professionalBookings.length === 0 &&
                failedRequests.length === 0 ? (
                <div className="bg-card p-16 rounded-[8px] border border-white/5 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center text-gray-500 mb-4">
                    <User size={24} />
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-tight">
                    No Hired Professionals
                  </h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">
                    Book certified coaches, umpires, scorers, or commentators to
                    elevate your game!
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Section 1: Active Match Requests */}
                  {activeRequests.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Live Match Search ({activeRequests.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeRequests.map((req) => (
                          <div
                            key={req.id}
                            className="bg-card border border-primary/20 rounded-lg p-5 relative overflow-hidden"
                          >
                            <div className="space-y-3 font-sans">
                              <div>
                                <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                                  Target Roles
                                </span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {req.roles.map((r) => (
                                    <span
                                      key={r}
                                      className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-bold text-white uppercase"
                                    >
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-1.5">
                                <div>
                                  <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                                    Venue/Location
                                  </span>
                                  <span className="text-xs font-bold text-white block truncate">
                                    {req.ground?.name ||
                                      req.customLocation?.address ||
                                      "Custom Coords"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                                    Budget Scope
                                  </span>
                                  <span className="text-xs font-bold text-primary">
                                    ₹{req.minBudget} - ₹{req.maxBudget}
                                  </span>
                                </div>
                              </div>
                              <div className="pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 mt-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                                  <Calendar
                                    size={10}
                                    className="text-primary"
                                  />{" "}
                                  {req.matchDate || "Flexible"}
                                  <Clock
                                    size={10}
                                    className="text-primary ml-2"
                                  />{" "}
                                  {req.matchStartTime || "TBD"} -{" "}
                                  {req.matchEndTime || "TBD"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 1.5: Failed/Expired Search Requests */}
                  {failedRequests.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center gap-2">
                        <AlertOctagon size={12} />
                        Failed / Expired Search Requests (
                        {failedRequests.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {failedRequests.map((req) => (
                          <div
                            key={req.id}
                            className="bg-card border border-red-500/20 rounded-lg p-5 relative overflow-hidden transition-all duration-300 hover:border-red-500/40"
                          >
                            {/* Subtle overlay accent */}
                            <div className="absolute top-0 right-0 bg-red-500/10 text-red-500 px-3 py-1 rounded-bl-lg text-[8px] font-black uppercase tracking-wider border-l border-b border-red-500/20">
                              {req.status}
                            </div>

                            <div className="space-y-3 font-sans">
                              <div>
                                <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                                  Target Roles
                                </span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {req.roles.map((r) => (
                                    <span
                                      key={r}
                                      className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-bold text-white uppercase"
                                    >
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-1.5">
                                <div>
                                  <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                                    Venue/Location
                                  </span>
                                  <span className="text-xs font-bold text-white block truncate">
                                    {req.ground?.name ||
                                      req.customLocation?.address ||
                                      "Custom Coords"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[8px] uppercase tracking-wider text-white/40 block">
                                    Budget Scope
                                  </span>
                                  <span className="text-xs font-bold text-red-400">
                                    ₹{req.minBudget} - ₹{req.maxBudget}
                                  </span>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-white/5 flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                                  <Calendar
                                    size={10}
                                    className="text-red-400"
                                  />{" "}
                                  {req.matchDate || "Flexible"}
                                  <Clock
                                    size={10}
                                    className="text-red-400 ml-2"
                                  />{" "}
                                  {req.matchStartTime || "TBD"} -{" "}
                                  {req.matchEndTime || "TBD"}
                                </div>
                              </div>

                              <div className="pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 mt-2">
                                <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">
                                  Requested:{" "}
                                  {new Date(req.createdAt).toLocaleDateString(
                                    "en-GB"
                                  )}{" "}
                                  at{" "}
                                  {new Date(req.createdAt).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </span>

                                <Button
                                  onClick={() => handleRetryMatch(req)}
                                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary hover:text-black border border-primary/20 text-primary text-[8px] font-black uppercase tracking-widest rounded-[6px] transition-all flex items-center gap-1.5 active:scale-95"
                                >
                                  <RefreshCw size={10} /> Retry Search
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 2: On-Demand Matches (Verified/Assigned) */}
                  {onDemandBookings.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                        <Zap size={12} />
                        On-Demand Matching ({onDemandBookings.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {onDemandBookings.map((booking) => {
                          const pro = booking.professional?.user;
                          const plainOtp = null; // localStorage OTP removed per security audit
                          const getInitials = (name) =>
                            name
                              ?.split(" ")
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2) || "??";

                          return (
                            <div
                              key={booking.id}
                              className="bg-card border border-white/5 rounded-lg p-5"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  {pro?.profilePicture ? (
                                    <img
                                      src={pro.profilePicture}
                                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-white/40 text-xs font-bold">
                                      {getInitials(
                                        booking.professional?.name ||
                                          "Matched Pro"
                                      )}
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="text-xs font-bold text-white capitalize">
                                      {booking.professional?.name?.toLowerCase()}
                                    </h3>
                                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[8px] font-black uppercase tracking-wider block mt-1 w-max">
                                      {booking.role}
                                    </span>
                                  </div>
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                    booking.status === "ASSIGNED"
                                      ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                      : booking.status === "IN_PROGRESS"
                                        ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                        : booking.status === "COMPLETED"
                                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                          : "bg-red-500/10 text-red-500 border border-red-500/20"
                                  }`}
                                >
                                  {booking.status}
                                </span>
                              </div>

                              <div className="space-y-2.5 font-sans text-xs">
                                <div className="flex justify-between">
                                  <span className="text-white/40">Venue:</span>
                                  <span className="text-white font-bold max-w-[180px] truncate">
                                    {booking.ground?.name ||
                                      booking.customLocation?.address ||
                                      "Custom location"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/40">
                                    Allocated Budget:
                                  </span>
                                  <span className="text-primary font-black">
                                    ₹{booking.hourlyRate}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/40">
                                    Matched On:
                                  </span>
                                  <span className="text-white/80">
                                    {new Date(
                                      booking.createdAt
                                    ).toLocaleDateString("en-GB")}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/40">
                                    Scheduled Time:
                                  </span>
                                  <span className="text-white/80">
                                    {booking.matchDate || "N/A"} |{" "}
                                    {booking.matchStartTime || "TBD"} -{" "}
                                    {booking.matchEndTime || "TBD"}
                                  </span>
                                </div>
                              </div>

                              {booking.status === "ASSIGNED" && (
                                <div className="bg-[#050505] border border-primary/30 text-primary rounded-lg p-3 text-center mt-4">
                                  <span className="text-[9px] uppercase tracking-wider block text-white/50 mb-0.5">
                                    Check-In OTP Code
                                  </span>
                                  {plainOtp ? (
                                    <span className="text-xl font-black tracking-[0.25em]">
                                      {plainOtp}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-white/40 italic block font-sans">
                                      OTP cached on matching device
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Action Buttons: Rate & Dispute */}
                              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/5">
                                {booking.status === "COMPLETED" && (
                                  <Button
                                    onClick={() =>
                                      openProReviewModal(
                                        booking.professional?.id ||
                                          booking.professionalId,
                                        booking.professional?.name ||
                                          pro?.name ||
                                          "Professional"
                                      )
                                    }
                                    className="px-4 py-2 rounded-[6px] bg-primary/10 border border-primary/20 hover:bg-primary hover:text-black text-primary text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95"
                                  >
                                    <Star size={12} /> Rate Professional
                                  </Button>
                                )}
                                {booking.status !== "CANCELLED" &&
                                  booking.status !== "DISPUTED" && (
                                    <Button
                                      onClick={() =>
                                        setProDisputeBooking({
                                          ...booking,
                                          turf: {
                                            name:
                                              booking.professional?.name ||
                                              booking.ground?.name ||
                                              "Professional Service",
                                          },
                                        })
                                      }
                                      className="px-4 py-2 rounded-[6px] bg-white/5 border border-white/10 hover:border-red-500/50 hover:text-red-500 text-gray-400 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95"
                                    >
                                      <ShieldAlert size={12} /> Raise Dispute
                                    </Button>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Section 3: Scheduled Hourly Bookings (Legacy) */}
                  {professionalBookings.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                        <Clock size={12} />
                        Scheduled Bookings ({professionalBookings.length})
                      </h4>
                      <div className="space-y-4">
                        {professionalBookings.map((booking) => {
                          const statusColors = {
                            APPROVED:
                              "text-primary bg-primary/10 border-primary/20",
                            PENDING:
                              "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
                            REJECTED:
                              "text-red-500 bg-red-500/10 border-red-500/20",
                            COMPLETED:
                              "text-primary bg-primary/10 border-primary/20",
                          };
                          const statusClass =
                            statusColors[booking.status] ||
                            "text-gray-400 bg-white/5 border-white/10";
                          const profName =
                            booking.professional?.user?.name ||
                            booking.professional?.businessName ||
                            "Professional";
                          const profPic =
                            booking.professional?.user?.profilePicture;

                          let slotsStr = "N/A";
                          try {
                            if (Array.isArray(booking.slots)) {
                              slotsStr = booking.slots
                                .map((s) => `${s.startTime} - ${s.endTime}`)
                                .join(", ");
                            } else if (typeof booking.slots === "string") {
                              slotsStr = booking.slots;
                            }
                          } catch (e) {
                            console.error(e);
                          }

                          return (
                            <div
                              key={booking.id}
                              className="group relative rounded-[8px] p-[1px] transition-all duration-300 cursor-pointer overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[8px]" />
                              <div className="absolute inset-0 border border-white/10 group-hover:opacity-0 transition-opacity duration-300 rounded-[8px]" />

                              <div className="relative bg-background rounded-[8px] p-4 flex flex-col md:flex-row gap-6 w-full">
                                <div className="w-full md:w-32 h-32 shrink-0 rounded-[8px] overflow-hidden bg-white/5 flex items-center justify-center border border-white/5 relative">
                                  {profPic ? (
                                    <img
                                      src={profPic}
                                      className="w-full h-full object-cover transition-all duration-500"
                                      alt=""
                                    />
                                  ) : (
                                    <User className="w-12 h-12 text-gray-600" />
                                  )}
                                </div>

                                <div className="flex-1 flex flex-col justify-between py-1">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-black uppercase tracking-widest border border-primary/20">
                                        {booking.bookingType || "PROFESSIONAL"}
                                      </span>
                                      <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                                        ID: #
                                        {booking.id?.slice(-5).toUpperCase()}
                                      </span>
                                    </div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                                      {profName}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                      <div className="flex items-center gap-1.5">
                                        <Clock
                                          size={12}
                                          className="text-primary"
                                        />{" "}
                                        {slotsStr}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Calendar
                                          size={12}
                                          className="text-primary"
                                        />{" "}
                                        {booking.date}
                                      </div>
                                    </div>
                                    {booking.message && (
                                      <p className="text-[10px] text-gray-500 italic mt-3 border-l-2 border-white/10 pl-2 leading-relaxed">
                                        &quot;{booking.message}&quot;
                                      </p>
                                    )}
                                  </div>

                                  {/* Action Buttons: Rate & Dispute */}
                                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/5">
                                    {booking.status === "COMPLETED" && (
                                      <Button
                                        onClick={() =>
                                          openProReviewModal(
                                            booking.professional?.id ||
                                              booking.professionalId,
                                            profName
                                          )
                                        }
                                        className="px-4 py-2 rounded-[6px] bg-primary/10 border border-primary/20 hover:bg-primary hover:text-black text-primary text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95"
                                      >
                                        <Star size={12} /> Rate Professional
                                      </Button>
                                    )}
                                    {booking.status !== "CANCELLED" &&
                                      booking.status !== "DISPUTED" &&
                                      booking.status !== "REJECTED" && (
                                        <Button
                                          onClick={() =>
                                            setProDisputeBooking({
                                              ...booking,
                                              turf: { name: profName },
                                            })
                                          }
                                          className="px-4 py-2 rounded-[6px] bg-white/5 border border-white/10 hover:border-red-500/50 hover:text-red-500 text-gray-400 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95"
                                        >
                                          <ShieldAlert size={12} /> Raise
                                          Dispute
                                        </Button>
                                      )}
                                  </div>
                                </div>

                                <div className="flex flex-col justify-between items-end py-1 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                                  <div className="text-right">
                                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">
                                      Total Paid
                                    </p>
                                    <p className="text-xl font-black text-white">
                                      ₹{booking.totalAmount}
                                    </p>
                                  </div>
                                  <div
                                    className={`px-3 py-1 rounded-[8px] text-[8px] font-black uppercase tracking-widest border ${statusClass}`}
                                  >
                                    {booking.status}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Modals ──────────────────────────────────────────────────────── */}
        {isReviewModalOpen && (
          <WriteReview
            rating={rating}
            review={review}
            isSubmitting={isSubmitting}
            onClose={closeReviewModal}
            onRatingChange={handleRatingChange}
            onReviewChange={handleReviewChange}
            onSubmit={submitReview}
          />
        )}

        {selectedDisputeBooking && (
          <ReportIssueFlowModal
            booking={selectedDisputeBooking}
            onClose={() => setSelectedDisputeBooking(null)}
            onSuccess={fetchBookingsRefresh}
          />
        )}

        {/* Professional-specific Dispute Modal */}
        {proDisputeBooking && (
          <ReportIssueFlowModal
            booking={proDisputeBooking}
            onClose={() => setProDisputeBooking(null)}
            onSuccess={fetchBookingsRefresh}
          />
        )}

        {/* Professional Review Modal */}
        {proReviewModal.open && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-950 border border-border rounded-[8px] p-8 w-full max-w-md shadow-2xl relative">
              <Button
                onClick={closeProReviewModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </Button>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-1">
                Rate Professional
              </h2>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-6">
                {proReviewModal.professionalName}
              </p>
              <div className="mb-6">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 cursor-pointer transition-all duration-200 hover:scale-110 ${
                        star <= proReviewRating
                          ? "text-primary fill-primary"
                          : "text-zinc-800 hover:text-zinc-600"
                      }`}
                      onClick={() => setProReviewRating(star)}
                    />
                  ))}
                </div>
                {proReviewRating === 0 && (
                  <p className="text-[9px] text-zinc-600 mt-2 uppercase tracking-wider">
                    Tap a star to rate
                  </p>
                )}
              </div>
              <div className="mb-8">
                <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">
                  Your Review
                </label>
                <Textarea
                  rows="4"
                  className="w-full bg-background border border-border rounded-[8px] p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 transition-colors resize-none text-sm"
                  value={proReviewContent}
                  onChange={(e) => setProReviewContent(e.target.value)}
                  placeholder="Share your experience working with this professional..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  className="px-6 py-3 rounded-[8px] font-black uppercase text-xs tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                  onClick={closeProReviewModal}
                  disabled={proReviewSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitProReview}
                  disabled={proReviewSubmitting || proReviewRating === 0}
                  className="px-6 py-3 rounded-[8px] bg-primary text-black font-black uppercase text-xs tracking-widest hover:bg-[#b3e600] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(204,255,0,0.15)]"
                >
                  {proReviewSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurfBookingHistory;
