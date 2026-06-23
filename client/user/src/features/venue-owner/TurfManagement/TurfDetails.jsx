import React, { useState } from "react";
import { format } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Star,
  Zap,
  X,
  Activity,
  ChevronLeft,
  ChevronRight,
  FileText,
  Navigation,
  User,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import useTurfDetails from "@hooks/venue-owner/useTurfDetails";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";
import toast from "react-hot-toast";
import GlobalBackButton from "@/shared/components/GlobalBackButton";import { Button } from "@kridaz/ui";


// Booking Information Popup
const BookingModal = ({ slot, onClose }) => {
  if (!slot) return null;
  const { bookingDetails, startTime, endTime, isBooked } = slot;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative bg-background border border-white/10 rounded-[10px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-5 pb-4 flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-[3px] mb-2">
              Slot Telemetry
            </p>
            <h3 className="text-base font-bold text-white uppercase tracking-tight font-['Open_Sans']">
              {startTime} - {endTime}
            </h3>
          </div>
          <Button
            onClick={onClose}
            className="p-2 hover:bg-card rounded-[10px] transition-colors border border-transparent hover:border-white/10"
          >
            <X size={18} className="text-white/70" />
          </Button>
        </div>

        <div className="p-5 pt-0 space-y-8">
          {isBooked ? (
            <>
              <div className="flex items-center gap-3 p-4 bg-card border border-white/10 rounded-[10px]">
                <div className="w-10 h-10 rounded-[10px] bg-card border border-[#404040] flex items-center justify-center overflow-hidden shrink-0">
                  {bookingDetails.user?.profileImage ? (
                    <img
                      src={bookingDetails.user.profileImage}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users size={24} className="text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-white uppercase tracking-tight truncate font-['Open_Sans']">
                    {bookingDetails.user?.name ||
                      bookingDetails.guestDetails?.name ||
                      "Guest Player"}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`px-2 py-0.5 text-black text-[10px] font-bold uppercase rounded-[10px] ${bookingDetails.user?.isGuest || bookingDetails.guestDetails ? "bg-muted-foreground" : "bg-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none"}`}
                    >
                      {bookingDetails.user?.isGuest ||
                      bookingDetails.guestDetails
                        ? "Manual"
                        : "Verified"}
                    </div>
                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                      {bookingDetails.user?.isGuest ||
                      bookingDetails.guestDetails
                        ? "Offline Record"
                        : "Athlete Profile"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px] px-1">
                  Contact Intelligence
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <a
                    href={
                      bookingDetails.user?.email ||
                      bookingDetails.guestDetails?.email
                        ? `mailto:${bookingDetails.user?.email || bookingDetails.guestDetails?.email}`
                        : "#"
                    }
                    className="flex items-center justify-between p-4 bg-card hover:bg-card rounded-[10px] border border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-card rounded-[10px] flex items-center justify-center text-white/70 group-hover:text-primary">
                        <Mail size={12} />
                      </div>
                      <span className="text-sm text-white/70 font-medium">
                        {bookingDetails.user?.email ||
                          bookingDetails.guestDetails?.email ||
                          "No Email Provided"}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-border" />
                  </a>
                  <a
                    href={
                      bookingDetails.user?.phoneNumber ||
                      bookingDetails.guestDetails?.phone
                        ? `tel:${bookingDetails.user?.phoneNumber || bookingDetails.guestDetails?.phone}`
                        : "#"
                    }
                    className="flex items-center justify-between p-4 bg-card hover:bg-card rounded-[10px] border border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-card rounded-[10px] flex items-center justify-center text-white/70 group-hover:text-primary">
                        <Phone size={12} />
                      </div>
                      <span className="text-sm text-white/70 font-medium">
                        {bookingDetails.user?.phoneNumber ||
                          bookingDetails.guestDetails?.phone ||
                          "No Phone Provided"}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-border" />
                  </a>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-card rounded-[10px] border border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    Revenue Impact
                  </span>
                  <span className="text-[10px] text-[#444] font-bold uppercase">
                    Settled via Platform
                  </span>
                </div>
                <span className="text-xl font-bold text-primary font-['Open_Sans'] tracking-tighter">
                  Rs {bookingDetails.totalPrice}
                </span>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-4 bg-card rounded-[10px] border border-dashed border-white/10">
              <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center mx-auto">
                <Zap size={24} className="var(--border)" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white uppercase tracking-tight">
                  Available Unit
                </h4>
                <p className="text-white/70 text-sm max-w-[200px] mx-auto mt-2 opacity-60">
                  No bookings detected for this sequence. Slot is open for
                  athlete deployment.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 pt-0">
          <Button
            onClick={onClose}
            className="w-full py-4 bg-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none hover:opacity-90 rounded-[10px] text-[11px] font-bold text-black uppercase tracking-[2px] transition-all"
          >
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function TurfDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { turfData, isLoading, error, toggleVisibility, deleteArena } =
    useTurfDetails(id);
  // Use local date string (YYYY-MM-DD) so it matches date-fns format() which also uses local timezone
  const toLocalDateString = (d) => format(d, "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(
    toLocalDateString(new Date())
  );
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(false);

  const handleToggleVisibility = async () => {
    const success = await toggleVisibility();
    if (success) toast.success("Visibility updated");
    else toast.error("Failed to update visibility");
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to decommission this arena? This will permanently delete all associated data."
      )
    ) {
      const success = await deleteArena();
      if (success) {
        toast.success("Arena decommissioned");
        navigate("/venue-owner/turfs");
      } else {
        toast.error("Failed to decommission arena");
      }
    }
  };

  React.useEffect(() => {
    setSelectedDate(toLocalDateString(new Date()));
  }, []);

  if (isLoading) return <DashboardSkeleton />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-5 bg-background">
        <AlertCircle className="text-red-500 mb-6" size={48} />
        <h2 className="text-base font-bold text-white mb-2 uppercase tracking-tight font-['Open_Sans']">
          Error Synchronizing Data
        </h2>
        <p className="text-white/70 mb-8 max-w-md">
          {error || "Connection failure to server intelligence roster."}
        </p>
        <GlobalBackButton />
      </div>
    );

  if (!turfData || !turfData.turf)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-5 bg-background">
        <Zap size={48} className="text-border mb-6" />
        <h2 className="text-base font-bold text-white mb-2 uppercase tracking-tight font-['Open_Sans']">
          Arena Missing
        </h2>
        <p className="text-white/70 mb-8">
          We couldn't retrieve the operational metrics for this facility.
        </p>
        <GlobalBackButton />
      </div>
    );

  const { turf, slots = [] } = turfData;
  const pending = turf.pendingUpdates || {};

  const PendingBadge = ({ label = "Pending Update" }) => (
    <span className="ml-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded-[10px] animate-pulse">
      {label}
    </span>
  );

  const filteredBookings = slots.filter((slot) => {
    try {
      const slotDate = format(new Date(slot.startTime), "yyyy-MM-dd");
      return slotDate === selectedDate;
    } catch (e) {
      return false;
    }
  });

  const displaySlots = slots
    .filter((slot) => {
      try {
        return format(new Date(slot.startTime), "yyyy-MM-dd") === selectedDate;
      } catch (e) {
        return false;
      }
    })
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .map((slot) => ({
      ...slot,
      // Map startTime/endTime to human readable format for UI
      startTime: format(new Date(slot.startTime), "hh:mm a"),
      endTime: format(new Date(slot.endTime), "hh:mm a"),
      isActive: slot.isActive !== false, // Default to true if not specified
    }));

  const uniqueDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return format(d, "yyyy-MM-dd");
  });

  return (
    <div className="space-y-8 animate-fade-in pb-20 bg-background min-h-screen">
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      {/* ── Modern Hero Header ── */}
      <div className="flex flex-col gap-0 rounded-[16px] overflow-hidden border border-white/10 shadow-2xl">
        {/* Banner Image with overlay */}
        <div className="relative w-full h-[180px] md:h-[220px] overflow-hidden">
          <img
            src={pending.image || turf.image}
            alt={turf.name}
            className="w-full h-full object-cover"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          {/* Pending image badge */}
          {pending.image && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500 rounded-[6px] text-[9px] font-bold text-black uppercase tracking-widest animate-pulse">
              New Image Pending
            </div>
          )}

          {/* Status + Rating chips — float top-left */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div
              className={`px-2.5 py-1 rounded-[8px] border flex items-center gap-1.5 backdrop-blur-sm ${
                turf.status === "approved"
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : turf.status === "rejected"
                    ? "bg-red-500/15 border-red-500/30 text-red-400"
                    : "bg-amber-500/15 border-amber-500/30 text-amber-400"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  turf.status === "approved"
                    ? "bg-primary"
                    : turf.status === "rejected"
                      ? "bg-red-400"
                      : "bg-amber-400"
                }`}
              />
              <span className="text-[10px] font-semibold capitalize">
                {turf.status}
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-[8px] bg-black/40 border border-white/15 backdrop-blur-sm flex items-center gap-1.5">
              <Star size={10} className="text-primary fill-primary" />
              <span className="text-[10px] font-bold text-white">
                {turf.avgRating?.toFixed(1) || "NEW"}
              </span>
            </div>
          </div>

          {/* Venue name overlaid at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <h2
              className={`text-xl md:text-2xl font-black tracking-tight leading-tight font-['Open_Sans'] drop-shadow-lg ${
                turf.status === "pending"
                  ? "text-amber-400"
                  : turf.status === "rejected"
                    ? "text-red-400"
                    : "text-white"
              }`}
            >
              {turf.name}
            </h2>
            {pending.name && (
              <p className="text-amber-400 text-[10px] font-bold flex items-center gap-1.5 mt-1">
                <span className="opacity-50">→</span> {pending.name}{" "}
                <PendingBadge />
              </p>
            )}
          </div>
        </div>

        {/* Info strip — dark card below the banner */}
        <div className="bg-black px-4 py-3 flex flex-col gap-3">
          {/* Location / Time / Price row */}
          <div className="flex flex-wrap gap-2">
            {/* Location */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/5 border border-white/8 min-w-0">
              <MapPin
                size={11}
                className={
                  turf.status === "rejected"
                    ? "text-red-400 shrink-0"
                    : "text-primary shrink-0"
                }
              />
              <span className="text-[11px] text-white/60 font-medium truncate max-w-[200px]">
                {turf.location}
              </span>
            </div>
            {/* Time */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/5 border border-white/8">
              <Clock
                size={11}
                className={
                  turf.status === "rejected"
                    ? "text-red-400 shrink-0"
                    : "text-primary shrink-0"
                }
              />
              <span className="text-[11px] text-white/60 font-medium whitespace-nowrap">
                {turf.openTime} – {turf.closeTime}
              </span>
            </div>
            {/* Price */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-white/5 border border-white/8">
              <span
                className={`text-[10px] font-bold ${turf.status === "rejected" ? "text-red-400" : "text-primary"}`}
              >
                Rs
              </span>
              <span className="text-[11px] text-white/60 font-medium whitespace-nowrap">
                {turf.pricePerHour}/hr
              </span>
            </div>
          </div>

          {/* Pending updates for location / time / price */}
          {(pending.location ||
            pending.openTime ||
            pending.closeTime ||
            pending.pricePerHour) && (
            <div className="flex flex-wrap gap-2">
              {pending.location && (
                <span className="text-amber-400/80 text-[9px] font-bold flex items-center gap-1">
                  <PendingBadge label="Loc" /> {pending.location}
                </span>
              )}
              {(pending.openTime || pending.closeTime) && (
                <span className="text-amber-400/80 text-[9px] font-bold flex items-center gap-1">
                  <PendingBadge label="Time" />{" "}
                  {pending.openTime || turf.openTime} –{" "}
                  {pending.closeTime || turf.closeTime}
                </span>
              )}
              {pending.pricePerHour && (
                <span className="text-amber-400/80 text-[9px] font-bold flex items-center gap-1">
                  <PendingBadge label="Price" /> Rs {pending.pricePerHour}/hr
                </span>
              )}
            </div>
          )}

          {/* Status alert banner */}
          {turf.status !== "approved" && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-[8px] border ${
                turf.status === "rejected"
                  ? "bg-red-500/5 border-red-500/15 text-red-400/80"
                  : "bg-amber-500/5 border-amber-500/15 text-amber-400/80"
              }`}
            >
              <AlertCircle size={11} className="shrink-0" />
              <span className="text-[10px] font-medium">
                {turf.status === "rejected"
                  ? "Critical: Corrections required for deployment"
                  : "Verification in progress — under admin review"}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={() => navigate(`/venue-owner/edit-turf/${id}`)}
              className={`w-full !py-1 !h-8 !min-h-0 rounded-[10px] border text-[11px] font-semibold transition-all ${
                turf.status === "rejected"
                  ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                  : "bg-black border-white/10 text-white/60 hover:text-white"
              }`}
            >
              <div className="flex flex-row items-center justify-center gap-1.5 w-full">
                <Edit2 size={13} className="text-primary" />
                <span>{turf.status === "rejected" ? "Review & Re-apply" : "Edit Arena"}</span>
              </div>
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleToggleVisibility}
                className={`flex-1 !py-1 !h-8 !min-h-0 rounded-[10px] border text-[11px] font-semibold transition-all ${
                  turf.isActive
                    ? "bg-black border-primary/25 text-primary hover:border-primary"
                    : "bg-black border-white/10 text-[#555] hover:text-white"
                }`}
              >
                <div className="flex flex-row items-center justify-center gap-1.5 w-full">
                  <Zap
                    size={13}
                    className={`text-primary ${turf.isActive ? "fill-primary" : ""}`}
                  />
                  <span>{turf.isActive ? "Visible" : "Hidden"}</span>
                </div>
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 !py-1 !h-8 !min-h-0 bg-black border border-red-500/20 rounded-[10px] text-red-500 text-[11px] font-semibold hover:border-red-500 transition-all"
              >
                <div className="flex flex-row items-center justify-center gap-1.5 w-full">
                  <Trash2 size={13} className="text-red-500" />
                  <span>Decommission</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Media Intelligence & Operational Footage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Gallery Scroller */}
        <div
          className={`bg-card border border-white/10 rounded-[10px] p-4 space-y-6 overflow-hidden ${pending.youtubeUrl || turf.youtubeUrl ? "lg:col-span-7" : "lg:col-span-12"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-primary rounded-full" />
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                Arena Visual Assets
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const el = document.getElementById("gallery-scroll");
                  el.scrollBy({ left: -300, behavior: "smooth" });
                }}
                className="w-8 h-8 flex items-center justify-center bg-card border border-white/10 rounded-full text-white/70 hover:text-primary hover:border-primary/40 transition-all"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                onClick={() => {
                  const el = document.getElementById("gallery-scroll");
                  el.scrollBy({ left: 300, behavior: "smooth" });
                }}
                className="w-8 h-8 flex items-center justify-center bg-card border border-white/10 rounded-full text-white/70 hover:text-primary hover:border-primary/40 transition-all"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div
            id="gallery-scroll"
            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x"
          >
            {(turf.images || [turf.image]).map((img, i) => (
              <div
                key={i}
                className="min-w-[180px] h-[120px] rounded-[10px] border border-white/10 overflow-hidden relative group/img snap-start"
              >
                <img
                  src={img}
                  className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            ))}
            {pending.images &&
              Array.from(pending.images).map((img, i) => (
                <div
                  key={`p-${i}`}
                  className="min-w-[180px] h-[120px] rounded-[10px] border-2 border-amber-500/40 overflow-hidden relative group/img snap-start"
                >
                  <div className="absolute top-3 left-3 z-10">
                    <PendingBadge label="New Upload" />
                  </div>
                  <img
                    src={
                      typeof img === "string" ? img : URL.createObjectURL(img)
                    }
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent" />
                </div>
              ))}
          </div>
        </div>

        {/* Video Intelligence */}
        {(pending.youtubeUrl || turf.youtubeUrl) && (
          <div className="lg:col-span-5 bg-card border border-white/10 rounded-[10px] p-4 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-red-600 rounded-full animate-pulse" />
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                Operational Footage (YouTube)
              </p>
            </div>

            <div
              className={`relative aspect-video rounded-[10px] overflow-hidden border ${pending.youtubeUrl ? "border-amber-500/40" : "border-white/10"}`}
            >
              {pending.youtubeUrl && (
                <div className="absolute top-3 right-3 z-10">
                  <PendingBadge label="Stream Update" />
                </div>
              )}
              <iframe
                width="100%"
                height="100%"
                src={(pending.youtubeUrl || turf.youtubeUrl).replace(
                  "watch?v=",
                  "embed/"
                )}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="opacity-90"
              ></iframe>
            </div>
          </div>
        )}
      </div>

      {/* Operational Pulse & Intelligence */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Live Stats */}
        <div className="xl:col-span-4 flex flex-col gap-5 h-fit">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-card border border-white/10 rounded-[10px] flex flex-col justify-between aspect-square relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-primary group-hover:opacity-20 transition-opacity">
                <Activity size={40} />
              </div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-[3px]">
                Today's Load
              </p>
              <div>
                <h4 className="text-xl font-bold text-white font-['Open_Sans'] uppercase">
                  {Math.round(
                    (filteredBookings.filter((s) => s.isBooked).length /
                      (filteredBookings.length || 1)) *
                      100
                  )}
                  %
                </h4>
                <p className="text-[11px] text-primary font-semibold tracking-wide mt-1">
                  Live Occupancy
                </p>
              </div>
            </div>
            <div className="p-4 bg-card border border-white/10 rounded-[10px] flex flex-col justify-between aspect-square relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-primary group-hover:opacity-20 transition-opacity">
                <Zap size={40} />
              </div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[3px]">
                Revenue
              </p>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-white font-['Open_Sans'] flex items-baseline gap-2">
                  Rs{" "}
                  {filteredBookings
                    .filter((s) => s.isBooked)
                    .reduce(
                      (acc, b) => acc + (b.bookingDetails?.totalPrice || 0),
                      0
                    )}
                  {pending.pricePerHour && (
                    <span className="text-amber-500 text-sm font-bold opacity-80">
                      Rs {pending.pricePerHour}/hr <PendingBadge label="Rate" />
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-primary font-semibold tracking-wide mt-1">
                  Daily Yield
                </p>
              </div>
            </div>
          </div>

          {/* Support Network: Owner, Managers */}
          <div className="grid grid-cols-1 gap-5">
            <div className="p-4 bg-card border border-white/10 rounded-[10px] space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-primary rounded-full" />
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                    Personnel & Support
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Owner Record */}
                {turf.owner && (
                  <div className="flex gap-3 items-center p-3 rounded-[10px] bg-card border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <User size={14} className="text-white/70" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-white uppercase">
                        {turf.owner.name}
                      </span>
                      <span className="text-[10px] text-primary font-medium tracking-wide uppercase">
                        Platform Owner
                      </span>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <a
                        href={`tel:${turf.owner.phone}`}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <Phone size={12} className="text-white/70" />
                      </a>
                      <a
                        href={`mailto:${turf.owner.email}`}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <Mail size={12} className="text-white/70" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Manager Records */}
                {turf.managerContacts?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-2 pl-1">
                      Venue Managers
                    </h4>
                    {turf.managerContacts.map((manager, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 pl-3 rounded-[10px] border border-dashed border-white/10 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-white uppercase">
                            {manager.name}
                          </span>
                          <span className="text-[11px] text-white/50 font-mono">
                            {manager.phone}
                          </span>
                        </div>
                        <a
                          href={`tel:${manager.phone}`}
                          className="p-2 bg-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none rounded-[10px] transition-all"
                        >
                          <Phone size={12} className="text-black" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Consolidated Intelligence */}
        <div className="xl:col-span-8 space-y-8">
          <div className="p-4 bg-card border border-white/10 rounded-[10px] flex flex-col md:flex-row gap-5">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-primary rounded-full" />
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                  Facility DNA
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    Ground Composition
                    {pending.groundTypes && <PendingBadge />}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(pending.groundTypes || turf.groundTypes || []).map(
                      (ground, i) => (
                        <span
                          key={i}
                          className={`px-2 py-1 border rounded-[10px] text-[12px] font-medium uppercase snap-start ${pending.groundTypes ? "bg-amber-500/5 border-amber-500/20 text-amber-500" : "bg-card border-white/10 text-white"}`}
                        >
                          {ground}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    Capabilities
                    {pending.facilities && <PendingBadge />}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(pending.facilities || turf.facilities || []).map(
                      (facility, i) => (
                        <span
                          key={i}
                          className={`px-2 py-1 rounded-[10px] text-[12px] font-medium uppercase snap-start ${pending.facilities ? "bg-amber-500/10 text-amber-500" : "bg-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none text-black"}`}
                        >
                          {facility}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-px bg-card hidden md:block" />

            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-primary rounded-full" />
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                  Sport Arsenal
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(pending.sportTypes || turf.sportTypes || []).map(
                  (sport, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 border p-3 rounded-[10px] w-full group/sport transition-colors ${pending.sportTypes ? "bg-amber-500/5 border-amber-500/20" : "bg-card border-white/10 hover:border-primary/40"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full transition-colors ${pending.sportTypes ? "bg-amber-500 animate-pulse" : "bg-primary"}`}
                      />
                      <span
                        className={`text-[13px] font-medium uppercase ${pending.sportTypes ? "text-amber-500" : "text-white"}`}
                      >
                        {sport}
                      </span>
                      {pending.sportTypes && (
                        <div className="ml-auto">
                          <PendingBadge label="Add" />
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Description & Policies */}
          <div className="p-4 bg-card border border-white/10 rounded-[10px] space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-primary rounded-full" />
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                Documentation & Policies
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText size={12} className="text-primary" />
                  Facility Description
                  {pending.description && <PendingBadge />}
                </h4>
                <div className="relative">
                  <p
                    className={`text-[15px] text-white/80 leading-relaxed font-inter break-words break-all ${!isDescExpanded ? "line-clamp-2" : ""}`}
                  >
                    {pending.description || turf.description}
                  </p>
                  {(pending.description || turf.description)?.length > 150 && (
                    <Button
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                      className="text-primary text-[10px] font-bold uppercase tracking-wider mt-2 hover:underline !bg-transparent !border-none !p-0 !h-auto !min-h-0 shadow-none w-fit block"
                    >
                      {isDescExpanded ? "Show Less" : "Read More"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-card">
                <h4 className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertCircle size={12} className="text-primary" />
                  Venue Rules & Policies
                  {pending.policies && <PendingBadge />}
                </h4>
                <div className="relative">
                  <p
                    className={`text-[10px] text-white/70 leading-relaxed font-inter italic border-l-2 border-white/10 pl-4 break-words break-all ${!isPolicyExpanded ? "line-clamp-2" : ""}`}
                  >
                    {pending.policies ||
                      turf.policies ||
                      "No specific policies documented."}
                  </p>
                  {(
                    pending.policies ||
                    turf.policies ||
                    "No specific policies documented."
                  )?.length > 150 && (
                    <Button
                      onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
                      className="text-primary text-[10px] font-bold uppercase tracking-wider mt-2 hover:underline"
                    >
                      {isPolicyExpanded ? "Show Less" : "Read More"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Legal Documents */}
          <div className="p-4 bg-card border border-white/10 rounded-[10px] space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-primary rounded-full" />
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                Legal Document Vault
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "gstRegistration", label: "GST Registration" },
                { key: "saleDeed", label: "Sale Deed" },
                { key: "electricityBill", label: "Electricity Bill" },
                { key: "rentalAgreement", label: "Rental Agreement" },
                { key: "ownershipAgreement", label: "Ownership Agreement" },
                {
                  key: "googleProfileScreenshot",
                  label: "Google Profile Screenshot",
                },
              ].map(({ key, label }) => {
                const url = turf.verificationData?.[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-2 rounded-[8px] border transition-all ${
                      url
                        ? "bg-primary/5 border-primary/20"
                        : "bg-background border-dashed border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0 ${
                          url ? "bg-primary/10" : "bg-white/5"
                        }`}
                      >
                        <ShieldCheck
                          size={11}
                          className={url ? "text-primary" : "text-[#444]"}
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`text-[9px] font-bold leading-tight truncate ${
                            url ? "text-white" : "text-[#444]"
                          }`}
                        >
                          {label}
                        </span>
                        <span
                          className={`text-[8px] font-bold mt-0.5 ${
                            url ? "text-primary" : "text-[#333]"
                          }`}
                        >
                          {url ? "Submitted" : "Pending"}
                        </span>
                      </div>
                    </div>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-[6px] bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all shrink-0 ml-1"
                        title="View Document"
                      >
                        <ExternalLink size={9} className="text-primary" />
                      </a>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-dashed border-border flex items-center justify-center shrink-0 ml-1">
                        <X size={8} className="text-border" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest pt-1">
              Missing documents can be submitted via the Edit Arena flow.
            </p>
          </div>
        </div>
      </div>

      {/* Booking Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Date Selector */}
        <div className="lg:col-span-3 space-y-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[3px] text-white/70 flex items-center gap-3">
            <Calendar size={14} className="text-primary" />
            Timeline Control
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {uniqueDates.length > 0 ? (
              uniqueDates.map((date) => (
                <Button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`w-full p-3 md:p-4 rounded-[10px] text-left transition-all duration-300 flex justify-between items-center border ${selectedDate === date ? "bg-primary border-primary text-black shadow-[0_8px_24px_rgba(204,255,0,0.15)]" : "bg-background border-white/10 text-white/70 hover:border-primary/40"}`}
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[1px] truncate">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                      })}
                    </span>
                    <span
                      className={`text-[9px] md:text-[10px] font-medium uppercase mt-0.5 truncate ${selectedDate === date ? "text-black/60" : "text-[#444]"}`}
                    >
                      {new Date(date).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </Button>
              ))
            ) : (
              <div className="p-5 text-center bg-card border border-dashed border-white/10 rounded-[10px]">
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">
                  No Active Slots
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Slots Grid */}
        <div className="lg:col-span-9 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[3px] text-white/70 flex items-center gap-3">
              <Clock size={14} className="text-primary" />
              Slot Manifest{" "}
              <span className="ml-4 px-3 py-1 bg-card rounded-[10px] border border-white/10 text-[10px] text-primary">
                {displaySlots.filter((s) => s.isActive).length} Active Units
              </span>
            </h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-card border border-white/10" />
                <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">
                  Inactive
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-white/10" />
                <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">
                  Available
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">
                  Booked
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {displaySlots.length > 0 ? (
              displaySlots.map((slot) => (
                <Button
                  key={slot._id}
                  onClick={() => slot.isBooked && setSelectedSlot(slot)}
                  disabled={!slot.isActive}
                  className={`relative overflow-hidden p-4 rounded-[10px] border transition-all duration-500 group text-left flex flex-col justify-between min-h-[120px] ${!slot.isActive ? "bg-[#050505] border-card opacity-40 cursor-not-allowed" : slot.isBooked ? "bg-primary/5 border-primary/30 shadow-[0_0_20px_rgba(204,255,0,0.05)] cursor-pointer hover:border-primary/60" : "bg-background border-white/10 hover:border-primary/40 cursor-default"}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p
                        className={`text-[11px] font-bold uppercase tracking-widest ${slot.isBooked ? "text-primary/60" : "text-[#444]"}`}
                      >
                        Time Sequence
                      </p>
                      <h4 className="text-base font-bold text-white font-['Open_Sans'] uppercase tracking-tight">
                        {slot.startTime} - {slot.endTime}
                      </h4>
                      <p className="text-[10px] text-primary font-bold tracking-widest mt-1">
                        Rs {slot.price || turf.pricePerHour}{" "}
                        <span className="text-white/70 text-[10px]">
                          / slot
                        </span>
                      </p>
                    </div>
                    {slot.isActive && (
                      <div
                        className={`px-2 py-0.5 rounded-[10px] text-[10px] font-bold uppercase tracking-widest  ${slot.isBooked ? "bg-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none -[var(--primary)] text-black" : "bg-card -white/10 text-white/70"}`}
                      >
                        {slot.isBooked ? "Booked" : "Open"}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10">
                    {slot.isBooked ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[10px] bg-card border border-white/10 flex items-center justify-center overflow-hidden">
                          {slot.bookingDetails.user?.profileImage ? (
                            <img
                              src={slot.bookingDetails.user.profileImage}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users size={16} className="text-primary/60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-[15px] font-bold text-white truncate uppercase tracking-tight font-['Open_Sans']">
                            {slot.bookingDetails.user?.name || "Guest Player"}
                          </h5>
                          <p className="text-[11px] text-primary font-bold uppercase tracking-[2px] mt-1">
                            View Details
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 opacity-20 group-hover:opacity-60 transition-opacity">
                        <div className="p-1.5 bg-card rounded-full">
                          <CheckCircle2 size={12} className="text-white/70" />
                        </div>
                        <p className="text-[11px] font-bold text-white/70 uppercase tracking-[2px]">
                          Available Sequence
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Hint */}
                  {slot.isActive && slot.isBooked && (
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Zap size={12} className="text-primary" />
                    </div>
                  )}
                </Button>
              ))
            ) : (
              <div className="col-span-full py-32 bg-background border border-dashed border-white/10 rounded-[10px] flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <Zap size={24} className="text-border" />
                </div>
                <h4 className="text-xl font-bold text-white uppercase tracking-tight mb-2 font-['Open_Sans']">
                  Zero Operational Data
                </h4>
                <p className="text-white/70 text-sm max-w-xs mx-auto opacity-60">
                  No slots are configured for the selected timeline. Adjust your
                  arena settings to deploy new sessions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
