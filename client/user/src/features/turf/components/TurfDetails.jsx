import React, { useState, useEffect } from "react";
import {
  useNavigate,
  useParams,
  Link,
  useSearchParams,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import useTurfData from "../hooks/useTurfData";
import useReviews from "@hooks/useReviews";
import Reviews from "@components/reviews/Reviews";
import TurfDetailsSkeleton from "../ui/TurfDetailsSkeleton";
import useReservation from "../hooks/useReservation";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import axiosInstance from "@hooks/useAxiosInstance";
import useSimilarRecommendations from "@hooks/useSimilarRecommendations";
import TurfCard from "./TurfCard.jsx";
import { useGetSavedTurfsQuery, useToggleTurfLikeMutation } from "@redux/api/turfApi";
import toast from "react-hot-toast";
import GlobalBackButton from "@/shared/components/GlobalBackButton";import { Button } from "@kridaz/ui";

import {
  MapPin,
  Clock,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Star,
  Zap,
  Users,
  ShieldCheck,
  Car,
  Coffee,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Info,
  ExternalLink,
  Phone,
  Navigation,
  Mail,
  User,
  Check,
  Activity,
  X,
} from "lucide-react";

// Helper components for icons
const BatIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M13.5 2L2 13.5l1.5 1.5L15 3.5 13.5 2z" />
    <path d="M15 3.5L20.5 9 22 7.5 16.5 2 15 3.5z" />
    <path d="M4.5 16L3 17.5 6.5 21 8 19.5 4.5 16z" />
  </svg>
);

const RacketIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="15" cy="9" r="6" />
    <path d="M10.5 13.5L3 21" />
    <path d="M15 6L12 9l3 3" />
    <path d="M12 6l3 3-3 3" />
  </svg>
);

const TurfDetails = () => {
  const { isLoggedIn } = useSelector((/** @type {any} */ state) => state.auth);
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, turfs } = useTurfData();
  const { averageRating, reviews } = useReviews(id);
  const { gateInteraction } = useLoginOnDemand();
  const turf = turfs.find((t) => t._id === id);

  const { data: savedData } = useGetSavedTurfsQuery(undefined, {
    skip: !isLoggedIn,
  });
  const [toggleTurfLike] = useToggleTurfLikeMutation();

  const isFavorite =
    isLoggedIn && savedData?.turfs?.some((t) => (t.id || t._id) === id);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.error("Please login to save venues");
      return;
    }

    try {
      await toggleTurfLike(id).unwrap();
      toast.success(isFavorite ? "Removed from saved" : "Saved successfully");
    } catch (err) {
      console.error("Failed to toggle wishlist like:", err);
      toast.error("Failed to update saved status");
    }
  };

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Hide bottom nav when booking modal is open
  useEffect(() => {
    if (isBookingModalOpen) {
      document.body.setAttribute("data-hide-bottom-nav", "true");
    } else {
      document.body.removeAttribute("data-hide-bottom-nav");
    }
    return () => document.body.removeAttribute("data-hide-bottom-nav");
  }, [isBookingModalOpen]);

  // Similar Recommendations
  const { similarTurfs, loading: similarLoading } = useSimilarRecommendations(
    id,
    { limit: 4 }
  );

  // ── Telemetry View & Dwell Time Tracking ──
  useEffect(() => {
    if (!id) return;

    // Log the initial view page mount
    axiosInstance
      .post("/api/user/turf/user/interaction", {
        turfId: id,
        type: "VIEW",
        duration: 0,
      })
      .catch((err) =>
        console.error("[TELEMETRY] Failed to log page view:", err)
      );

    const entryTime = Date.now();

    return () => {
      // Calculate dwell time on unmount
      const dwellSeconds = Math.round((Date.now() - entryTime) / 1000);
      if (dwellSeconds > 0) {
        axiosInstance
          .post("/api/user/turf/user/interaction", {
            turfId: id,
            type: "VIEW",
            duration: dwellSeconds,
          })
          .catch((err) =>
            console.error("[TELEMETRY] Failed to log dwell time:", err)
          );
      }
    };
  }, [id]);

  const images =
    turf?.images?.length > 0 ? turf.images : [turf?.image || "/banner-1.png"];
  const video = turf?.video;

  // Helper to extract YouTube ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeId = getYouTubeId(video);

  // Combine media: video first, then images
  const mediaItems = video
    ? [
        { type: youtubeId ? "youtube" : "video", url: video, id: youtubeId },
        ...images.map((img) => ({ type: "image", url: img })),
      ]
    : images.map((img) => ({ type: "image", url: img }));

  // Auto-scroll media every 5 seconds
  useEffect(() => {
    if (mediaItems.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % mediaItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mediaItems.length]);

  const handleNext = () =>
    setActiveImageIndex((prev) => (prev + 1) % mediaItems.length);
  const handlePrev = () =>
    setActiveImageIndex(
      (prev) => (prev - 1 + mediaItems.length) % mediaItems.length
    );

  const {
    selectedDate,
    selectedStartTime,
    availableTimes,
    handleDateChange,
    handleTimeSelection,
    isTimeSlotBooked,
    totalPrice,
    loading: bookingLoading,
  } = useReservation();

  const handleBookingClick = () => {
    gateInteraction(
      () => {
        const returnTo = searchParams.get("returnTo");
        if (returnTo) {
          // Build return URL
          const returnUrl = new URL(returnTo, window.location.origin);
          returnUrl.searchParams.set("groundId", turf._id);
          returnUrl.searchParams.set("date", selectedDate.toISOString());
          returnUrl.searchParams.set("time", selectedStartTime);
          returnUrl.searchParams.set("price", totalPrice || turf.pricePerHour);
          navigate(returnUrl.pathname + returnUrl.search);
        } else {
          navigate(`/checkout/${turf._id}`, {
            state: {
              turfName: turf.name,
              selectedDate: selectedDate.toISOString(),
              startTime: selectedStartTime,
              duration: 1, // Default duration
              amount: totalPrice,
              location: turf.location,
            },
          });
        }
      },
      {
        title: "Confirm Your Slot",
        message:
          "Ready to dominate the pitch? Sign in to securely book your time slot and get instant confirmation.",
      }
    );
  };

  const handleShare = async () => {
    const shareData = {
      title: turf?.name || "Kridaz Venue",
      text: `Check out ${turf?.name} in ${turf?.location} on Kridaz!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } catch (err) {
      if (err.name !== "AbortError") console.error("Error sharing:", err);
    }
  };

  if (loading) return <TurfDetailsSkeleton />;

  if (!turf) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-card border border-[rgba(255,255,255,0.08)] p-8 rounded-[8px] text-center max-w-md w-full">
          <Info className="w-16 h-16 text-[rgba(255,255,255,0.70)] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Venue Not Found
          </h2>
          <Link
            to="/venues"
            className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-[6px] font-bold"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  const handleReservation = () => {
    if (!selectedStartTime) {
      toast.error("Please select a time slot");
      return;
    }
    handleBookingClick();
  };

  const bookingSelectorContent = (
    <div className="w-full bg-card rounded-[8px] border border-[rgba(255,255,255,0.08)] p-4 md:p-6 flex flex-col shadow-2xl overflow-hidden h-auto max-h-[600px] lg:max-h-[800px]">
      {/* Select Date */}
      <div className="space-y-4 shrink-0">
        <h3 className="text-[16px] font-medium text-white tracking-wide uppercase font-inter">
          Select Date
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 14 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split("T")[0];
            const isActive =
              selectedDate.toISOString().split("T")[0] === dateStr;
            return (
              <div
                key={dateStr}
                className={`flex-none rounded-[12px] p-[1.5px] transition-all duration-300 ${isActive ? "bg-primary shadow-[0_0_15px_rgba(191,243,103,0.2)]" : "bg-transparent"}`}
                style={{ width: "72px", height: "80px" }}
              >
                <Button
                  onClick={() => handleDateChange(date)}
                  className={`w-full h-full p-0 rounded-[10px] border-none overflow-hidden ${isActive ? "bg-[#1C1C1C]" : "bg-border hover:bg-[#333333]"}`}
                >
                  <div className="flex flex-col items-center justify-center w-full h-full gap-0.5">
                    <span
                      className={`text-[24px] font-bold leading-none tracking-tight ${isActive ? "text-white" : "text-zinc-200"}`}
                    >
                      {String(date.getDate()).padStart(2, "0")}
                    </span>
                    <span
                      className={`text-[12px] font-medium ${isActive ? "text-primary" : "text-[rgba(255,255,255,0.70)]"}`}
                    >
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                  </div>
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Select Time Slot */}
      <div className="space-y-4 mt-6 flex-1 overflow-y-auto pr-2 scrollbar-hide">
        <h3 className="text-[16px] font-medium text-white tracking-wide uppercase font-inter">
          Select Preferred Time Slot
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pb-4">
          {availableTimes.length > 0 ? (
            availableTimes.map((slot, idx) => {
              const time = slot.startTime;
              const isBooked = isTimeSlotBooked(time);
              const isSelected = selectedStartTime === time;
              const isAvailable = !isBooked;

              // Format time to look like image 2 if it's just a start time
              let displayTime = time;
              if (!time.includes("-") && time.includes(":")) {
                try {
                  let [hours, minutes] = time.split(":");
                  hours = parseInt(hours, 10);
                  let endHours = (hours + 1) % 24;
                  let endHoursStr = String(endHours).padStart(2, "0");
                  let minutesStr = minutes.replace(/[^0-9]/g, "");
                  displayTime = `${hours.toString().padStart(2, "0")}:${minutesStr} - ${endHoursStr}:${minutesStr}`;
                } catch (e) {
                  /* ignore */
                }
              }

              return (
                <div
                  key={idx}
                  className={`rounded-[8px] p-[1.5px] transition-all duration-300 ${isSelected ? "bg-primary shadow-[0_0_10px_rgba(191,243,103,0.2)]" : "bg-transparent"}`}
                >
                  <Button
                    disabled={!isAvailable}
                    onClick={() => handleTimeSelection(time)}
                    className={`w-full h-full py-[8.5px] px-2 rounded-[6.5px] text-[13px] font-[600] tracking-wide transition-all duration-300 font-inter ${isSelected ? "bg-[#1C1C1C] text-white" : isAvailable ? "bg-border text-zinc-300 hover:bg-[#333333]" : "bg-card text-[rgba(255,255,255,0.70)] cursor-not-allowed opacity-50"}`}
                  >
                    {displayTime}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 py-10 text-center bg-card rounded-[8px] border border-[rgba(255,255,255,0.08)]">
              <Clock className="w-8 h-8 text-[rgba(255,255,255,0.70)] mx-auto mb-2" />
              <p className="text-[13px] font-medium text-[rgba(255,255,255,0.70)]">
                No Slots Available
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Price & Proceed */}
      <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.08)]/80 flex items-center justify-between gap-4 shrink-0">
        <div className="space-y-0">
          <p className="text-[11px] font-medium uppercase text-[rgba(255,255,255,0.70)] mb-1">
            Price
          </p>
          <p className="text-2xl font-bold text-white leading-none">
            ₹{totalPrice || turf.pricePerHour}
          </p>
        </div>
        <Button
          onClick={handleReservation}
          disabled={bookingLoading || !selectedStartTime}
          className="w-full md:w-[340px] h-[58px] rounded-[16px] font-inter text-[18px] font-[700] leading-[28px] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:bg-[#1a1a1a] disabled:text-[rgba(255,255,255,0.3)] disabled:shadow-none disabled:pointer-events-none bg-primary text-black shadow-[0px_8px_24px_rgba(191,243,103,0.15)]"
        >
          {bookingLoading
            ? "..."
            : searchParams.get("returnTo")
              ? "Add to host game"
              : "Proceed"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-white pt-2 pb-24 font-inter">
      <AnimatePresence>
        {isPoliciesModalOpen && (
          <PoliciesModal
            isOpen={isPoliciesModalOpen}
            onClose={() => setIsPoliciesModalOpen(false)}
            rules={turf.rules}
            turfName={turf.name}
          />
        )}
      </AnimatePresence>
      <div className="max-w-[1400px] mx-auto md:px-4 px-0 mt-0 md:mt-4">
        <svg width="0" height="0" className="absolute">
          <linearGradient id="theme-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop stopColor="var(--secondary)" offset="0%" />
            <stop stopColor="var(--primary)" offset="100%" />
          </linearGradient>
        </svg>

        <main
          className="relative flex flex-col w-full max-w-5xl items-start justify-center gap-4 lg:gap-6 mx-auto"
          aria-label="Venue booking page"
        >
          {/* VenueOverviewSection */}
          <div className="w-full flex-none space-y-4 lg:space-y-6">
            {/* Back Button */}
            <GlobalBackButton />

            {/* Venue Big Heading */}
            <h1 className="text-[28px] md:text-[32px] font-[700] leading-tight text-foreground px-4 md:px-2 font-inter">
              {turf.name}
            </h1>

            {/* Quick Info Bar */}
            <div className="flex flex-wrap items-center justify-start md:justify-between gap-y-3 gap-x-4 text-[12px] font-[400] leading-[16px] text-[rgba(255,255,255,0.70)] px-4 md:px-2 font-inter w-full">
              <div className="flex items-center gap-2 shrink-0">
                <Star
                  className="w-4 h-4"
                  style={{
                    stroke: "url(#theme-gradient)",
                    fill: "url(#theme-gradient)",
                  }}
                />
                <span className="text-primary font-[700]">
                  {averageRating ? averageRating.toFixed(1) : "5.0"}
                </span>
                <span>({reviews?.length || 0} REVIEWS)</span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-2 shrink-0">
                <MapPin
                  className="w-4 h-4"
                  style={{ stroke: "url(#theme-gradient)" }}
                />
                <span className="text-[rgba(255,255,255,0.70)] font-medium">
                  {turf.city || turf.location?.split(",")[0]} ,{" "}
                  {turf.state || "DODA"}
                </span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div
                onClick={() => setIsPoliciesModalOpen(true)}
                className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors group shrink-0"
              >
                <ShieldCheck
                  className="w-4 h-4"
                  style={{ stroke: "url(#theme-gradient)" }}
                />
                <span className="text-[rgba(255,255,255,0.70)] group-hover:text-primary transition-colors font-medium">
                  View Policies
                </span>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full items-start">
              {/* Left Column: Media */}
              <div className="space-y-6 w-full">
                {/* Hero Image */}
                <div className="relative w-full aspect-[16/9] overflow-hidden border-y border-x-0 md:border-x border-[rgba(255,255,255,0.08)] shadow-2xl bg-card group md:rounded-[15px] rounded-none">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="w-full h-full"
                    >
                      {mediaItems[activeImageIndex].type === "youtube" ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${mediaItems[activeImageIndex].id}?autoplay=1&mute=1&loop=1&playlist=${mediaItems[activeImageIndex].id}&controls=0&showinfo=0&rel=0`}
                          title="Venue Video"
                          className="w-full h-full object-cover border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : mediaItems[activeImageIndex].type === "video" ? (
                        <video
                          src={mediaItems[activeImageIndex].url}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={mediaItems[activeImageIndex].url}
                          alt={turf.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = "none";
                            e.target.parentElement.classList.add("flex", "items-center", "justify-center", "bg-gradient-to-br", "from-[#1a1a2e]", "to-[#0a0a0a]");
                            const placeholder = document.createElement("div");
                            placeholder.className = "flex flex-col items-center justify-center gap-2 text-[rgba(255,255,255,0.15)]";
                            placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                            e.target.parentElement.appendChild(placeholder);
                          }}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  {mediaItems.length > 1 && (
                    <>
                      <Button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-black z-30"
                      >
                        <ChevronLeft size={20} />
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-black z-30"
                      >
                        <ChevronRight size={20} />
                      </Button>
                    </>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                  {/* Like and Share Actions */}
                  <div className="absolute top-4 right-4 z-40 flex items-center gap-3">
                    <Button
                      onClick={toggleFavorite}
                      className={`p-3 rounded-[8px] bg-black/40 backdrop-blur-md border ${isFavorite ? "border-primary text-primary" : "border-white/10 text-white"} hover:bg-primary hover:text-black hover:border-transparent transition-all shadow-lg`}
                    >
                      <Heart
                        className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                      />
                    </Button>
                    <Button
                      onClick={handleShare}
                      className="p-3 rounded-[8px] bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-primary hover:text-black hover:border-transparent transition-all shadow-lg"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Image Thumbnails */}
                {mediaItems.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x px-4 md:px-0">
                    {mediaItems.map((item, idx) => (
                      <Button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative flex-none w-20 h-14 md:w-24 md:h-16 rounded-[8px] overflow-hidden border-[2px] transition-all snap-start ${activeImageIndex === idx ? "border-primary" : "border-transparent opacity-50 hover:opacity-100"}`}
                      >
                        {item.type === "youtube" ? (
                          <img
                            src={`https://img.youtube.com/vi/${item.id}/hqdefault.jpg`}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = "none";
                              e.target.parentElement.classList.add("flex", "items-center", "justify-center", "bg-[#0a0a0a]");
                            }}
                          />
                        ) : item.type === "video" ? (
                          <video
                            src={item.url}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = "none";
                              e.target.parentElement.classList.add("flex", "items-center", "justify-center", "bg-[#0a0a0a]");
                            }}
                          />
                        )}
                      </Button>
                    ))}
                  </div>
                )}
                {/* Desktop Map Section */}
                <div className="hidden lg:block pt-4 w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[16px] font-[600] leading-[24px] text-foreground font-inter">
                      Location & Directions
                    </h2>
                    <div className="flex items-center gap-2 font-black text-[rgba(255,255,255,0.70)]">
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm md:text-base font-inter">
                        Get there
                      </span>
                    </div>
                  </div>
                  <div className="rounded-[8px] overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-2xl h-[350px] relative group w-full">
                    <VenueMap turf={turf} />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Right Column: Venue Details */}
              <div className="bg-card rounded-none md:rounded-[8px] border-y md:border border-[rgba(255,255,255,0.08)] p-6 md:p-8 space-y-8 font-inter h-full">
                <div className="flex flex-wrap items-start gap-10">
                  {/* Sports Available */}
                  <div className="space-y-4">
                    <h2 className="text-[14px] font-[700] tracking-widest uppercase leading-[24px] text-foreground font-inter">
                      SPORTS AVAILABLE
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {turf.sportTypes?.map((sport, i) => (
                        <div
                          key={i}
                          className="px-4 py-1.5 rounded-[6px] bg-card/50 border border-[rgba(255,255,255,0.08)] flex items-center gap-2 text-white group hover:border-primary transition-all duration-300"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-wider font-inter">
                            {sport}
                          </span>
                        </div>
                      ))}
                      {!turf.sportTypes?.length && (
                        <div className="px-4 py-1.5 rounded-[6px] bg-card/50 border border-[rgba(255,255,255,0.08)] flex items-center gap-2 text-[rgba(255,255,255,0.70)]">
                          <Activity className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-wider font-inter">
                            Multisport
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ground Composition */}
                  <div className="space-y-4">
                    <h2 className="text-[14px] font-[700] tracking-widest uppercase leading-[24px] text-foreground font-inter">
                      GROUND COMPOSITION
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      <div className="px-4 py-1.5 rounded-[6px] bg-card border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white font-inter">
                          {turf.turfType || "Natural Grass"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personnel & Support Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-5 bg-gradient-to-b from-primary to-primary rounded-full" />
                    <h2 className="text-[14px] font-[700] tracking-widest uppercase leading-[24px] text-foreground font-inter">
                      PERSONNEL & SUPPORT
                    </h2>
                  </div>

                  {/* Venue Managers */}
                  <div className="w-full max-w-sm">
                    <div className="bg-card border border-[rgba(255,255,255,0.08)] border-dashed rounded-[12px] p-3.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[12px] font-black text-white uppercase font-inter">
                          {turf.name?.split(" ")[0] || "Princess"}
                        </p>
                        <p className="text-[10px] font-bold text-[rgba(255,255,255,0.70)] font-inter tracking-tight">
                          7896541230
                        </p>
                      </div>
                      <Button className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-primary to-primary flex items-center justify-center text-black hover:brightness-110 transition-all shadow-[0_0_15px_rgba(85,222,232,0.2)]">
                        <Phone size={16} fill="currentColor" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Facilities */}
                <div className="space-y-4">
                  <h2 className="text-[14px] font-[700] tracking-widest uppercase leading-[24px] text-foreground font-inter">
                    FACILITIES
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {turf.facilities?.map((facility, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-primary to-primary flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(85,222,232,0.3)]">
                          <Check
                            className="w-3 h-3 text-black"
                            strokeWidth={4}
                          />
                        </div>
                        <span className="text-xs font-inter font-bold text-[rgba(255,255,255,0.70)] uppercase tracking-tight group-hover:text-white transition-colors">
                          {facility}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* About Venue */}
                <div className="space-y-4">
                  <h2 className="text-[14px] font-[700] tracking-widest uppercase leading-[24px] text-foreground font-inter">
                    ABOUT VENUE
                  </h2>
                  <div
                    className={`text-[rgba(255,255,255,0.70)] text-sm font-inter leading-relaxed whitespace-pre-line font-medium break-all ${!isDescExpanded ? "line-clamp-4" : ""}`}
                  >
                    {turf.description ||
                      "No description available for this venue."}
                  </div>
                  {turf.description && turf.description.length > 150 && (
                    <Button
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                      className="text-primary hover:brightness-110 text-xs font-bold uppercase tracking-widest transition-colors mt-2"
                    >
                      {isDescExpanded ? "Read Less" : "Read More"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Map Section Before Reviews */}
            <div className="lg:hidden pt-8 px-4 md:px-0 border-t border-[rgba(255,255,255,0.08)] mt-8 w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[16px] font-[600] leading-[24px] text-foreground font-inter">
                  Location & Directions
                </h2>
                <div className="flex items-center gap-2 font-black text-[rgba(255,255,255,0.70)]">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm md:text-base font-inter">
                    Get there
                  </span>
                </div>
              </div>
              <div className="rounded-[8px] overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-2xl h-[350px] relative group w-full">
                <VenueMap turf={turf} />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors pointer-events-none" />
              </div>
            </div>

            {/* Similar Arenas Nearby Section */}
            {(similarLoading || (similarTurfs && similarTurfs.length > 0)) && (
              <div className="pt-8 px-4 md:px-0 border-t border-[rgba(255,255,255,0.08)] animate-fade-in">
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="relative">
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-full shadow-[0_0_20px_rgba(179,220,38,0.4)] hidden md:block"></div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-none font-inter">
                      SIMILAR{" "}
                      <span className="text-primary">ARENAS NEARBY</span>
                    </h3>
                    <p className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-[0.3em] mt-2 font-inter">
                      ML Proximity Recommendations • Similar Surface & Sports
                    </p>
                  </div>
                </div>

                {similarLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className="rounded-[8px] border border-white/5 bg-background animate-pulse h-[300px] relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent h-[60%]" />
                        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                          <div className="h-6 bg-white/10 rounded-lg w-[70%]" />
                          <div className="h-4 bg-white/5 rounded-lg w-[40%]" />
                          <div className="pt-3 border-t border-white/5 flex justify-between">
                            <div className="h-8 bg-white/10 rounded-lg w-[40%]" />
                            <div className="h-8 bg-white/10 rounded-lg w-[30%]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {similarTurfs.slice(0, 4).map((t) => (
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

            {/* Reviews Section */}
            <div className="pt-8 border-t border-[rgba(255,255,255,0.08)] mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[16px] font-[600] leading-[24px] text-foreground font-inter">
                  Athlete Reviews
                </h2>
                <div className="flex items-center gap-2 font-black">
                  <Star
                    className="w-5 h-5"
                    style={{
                      stroke: "url(#theme-gradient)",
                      fill: "url(#theme-gradient)",
                    }}
                  />
                  <span className="bg-gradient-to-r from-primary to-primary inline-block text-transparent bg-clip-text text-xl md:text-2xl">
                    {averageRating ? averageRating.toFixed(1) : "5.0"}
                  </span>
                  <span className="text-[rgba(255,255,255,0.70)] text-base md:text-lg">
                    / 5.0
                  </span>
                </div>
              </div>
              <Reviews turfId={id} />
            </div>
          </div>
        </main>
      </div>

      {/* Sticky Book Button for Mobile & Desktop */}
      <div className="fixed bottom-20 lg:bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-50 pointer-events-none flex justify-center pb-6">
        <Button
          onClick={() => setIsBookingModalOpen(true)}
          className="pointer-events-auto bg-primary text-black w-full max-w-md h-[56px] rounded-[16px] font-inter text-[18px] font-[700] leading-[28px] shadow-[0px_8px_24px_rgba(191,243,103,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
        >
          Book Venue
        </Button>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md lg:max-w-xl z-10"
            >
              <div className="relative bg-card rounded-t-[20px] md:rounded-[8px] shadow-2xl w-full flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.08)] shrink-0">
                  <h2 className="text-[18px] font-[700] text-white">
                    Book Slot
                  </h2>
                  <Button
                    onClick={() => setIsBookingModalOpen(false)}
                    className="text-[rgba(255,255,255,0.70)] hover:text-white bg-white/5 rounded-full p-2 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                  {bookingSelectorContent}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const VenueMap = ({ turf }) => {
  const hasCoords =
    turf?.locationData?.coordinates?.length === 2 &&
    turf.locationData.coordinates[0] !== 0;

  const lat = hasCoords ? turf.locationData.coordinates[1] : null;
  const lng = hasCoords ? turf.locationData.coordinates[0] : null;

  const addressQuery = encodeURIComponent(
    [turf.name, turf.location, turf.city, turf.state].filter(Boolean).join(", ")
  );

  const embedSrc = hasCoords
    ? `https://maps.google.com/maps?q=${lat},${lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${addressQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const openDirections = () => {
    const directionsUrl = hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`;
    window.open(directionsUrl, "_blank");
  };

  return (
    <div
      onClick={openDirections}
      className="relative w-full h-full cursor-pointer group/map"
    >
      <iframe
        title="Venue Location"
        src={embedSrc}
        width="100%"
        height="100%"
        style={{
          border: 0,
          filter:
            "invert(90%) hue-rotate(180deg) saturate(0.5) brightness(0.7)",
        }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="pointer-events-none"
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary flex items-center justify-center shadow-[0_0_30px_rgba(85,222,232,0.6)] animate-bounce">
          <MapPin className="w-6 h-6 text-black" />
        </div>
      </div>

      {/* Click for Directions Overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover/map:bg-black/40 transition-all flex items-end justify-center pb-4 opacity-0 group-hover/map:opacity-100">
        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-[6px] border border-white/10 flex items-center gap-2">
          <Navigation size={14} className="text-primary" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">
            Get Directions
          </span>
        </div>
      </div>
    </div>
  );
};

// Simple Policies Modal Component
const PoliciesModal = ({ isOpen, onClose, rules, turfName }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-card border border-[rgba(255,255,255,0.08)] rounded-[8px] p-8 shadow-2xl z-10"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-[16px] font-[600] leading-[24px] text-foreground font-inter">
                  Venue Policies
                </h2>
              </div>
              <Button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-card border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(255,255,255,0.70)] hover:text-white transition-colors"
              >
                <Check className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-card/50 rounded-[12px] border border-[rgba(255,255,255,0.08)]">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">
                  Venue
                </p>
                <p className="text-sm font-bold text-white uppercase">
                  {turfName}
                </p>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-[rgba(255,255,255,0.70)] text-sm font-inter leading-relaxed whitespace-pre-line">
                  {rules ||
                    "Players are requested to maintain discipline and sportsmanship inside the venue premises. Booking cancellations must be made at least 24 hours before the scheduled slot to be eligible for rescheduling or refund consideration. Any damage caused to the facility or equipment will be the responsibility of the booking party. Outside alcohol, smoking, illegal activities, and abusive behavior are strictly prohibited within the venue. Players must arrive on time for their booked slots, and management reserves the right to cancel bookings due to weather conditions, maintenance, or safety concerns. Proper sports shoes and appropriate sportswear are recommended while using the facility."}
                </div>
              </div>

              <Button
                onClick={onClose}
                className="bg-primary text-black w-full h-[58px] rounded-[16px] font-inter text-[18px] font-[700] leading-[28px] shadow-[0px_8px_24px_rgba(191,243,103,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border-none cursor-pointer"
              >
                I Understand
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TurfDetails;
