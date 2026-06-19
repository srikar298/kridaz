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
} from "lucide-react";
import useTurfDetails from "@hooks/venue-owner/useTurfDetails";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";
import toast from "react-hot-toast";
import GlobalBackButton from "@/shared/components/GlobalBackButton";

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
      <div className="relative bg-[#000000] border border-white/10 rounded-[16px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-[3px] mb-2">
              Slot Telemetry
            </p>
            <h3 className="text-2xl font-bold text-white uppercase tracking-tight font-['Open_Sans']">
              {startTime} - {endTime}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#111] rounded-[16px] transition-colors border border-transparent hover:border-white/10"
          >
            <X size={18} className="text-white/70" />
          </button>
        </div>

        <div className="p-8 pt-0 space-y-8">
          {isBooked ? (
            <>
              <div className="flex items-center gap-4 p-6 bg-[#121212] border border-white/10 rounded-[16px]">
                <div className="w-14 h-14 rounded-[16px] bg-[#1B1B1B] border border-[#404040] flex items-center justify-center overflow-hidden shrink-0">
                  {bookingDetails.user?.profileImage ? (
                    <img
                      src={bookingDetails.user.profileImage}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users size={24} className="text-[#B3DC26]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg font-bold text-white uppercase tracking-tight truncate font-['Open_Sans']">
                    {bookingDetails.user?.name ||
                      bookingDetails.guestDetails?.name ||
                      "Guest Player"}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`px-2 py-0.5 text-black text-[8px] font-bold uppercase rounded-[16px] ${bookingDetails.user?.isGuest || bookingDetails.guestDetails ? "bg-[#878C9F]" : "bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none"}`}
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
                    className="flex items-center justify-between p-4 bg-[#121212] hover:bg-[#1B1B1B] rounded-[16px] border border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1B1B1B] rounded-[16px] flex items-center justify-center text-white/70 group-hover:text-[#B3DC26]">
                        <Mail size={12} />
                      </div>
                      <span className="text-xs text-white/70 font-medium">
                        {bookingDetails.user?.email ||
                          bookingDetails.guestDetails?.email ||
                          "No Email Provided"}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-[#2D2D2D]" />
                  </a>
                  <a
                    href={
                      bookingDetails.user?.phoneNumber ||
                      bookingDetails.guestDetails?.phone
                        ? `tel:${bookingDetails.user?.phoneNumber || bookingDetails.guestDetails?.phone}`
                        : "#"
                    }
                    className="flex items-center justify-between p-4 bg-[#121212] hover:bg-[#1B1B1B] rounded-[16px] border border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1B1B1B] rounded-[16px] flex items-center justify-center text-white/70 group-hover:text-[#B3DC26]">
                        <Phone size={12} />
                      </div>
                      <span className="text-xs text-white/70 font-medium">
                        {bookingDetails.user?.phoneNumber ||
                          bookingDetails.guestDetails?.phone ||
                          "No Phone Provided"}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-[#2D2D2D]" />
                  </a>
                </div>
              </div>

              <div className="flex justify-between items-center p-6 bg-[#121212] rounded-[16px] border border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    Revenue Impact
                  </span>
                  <span className="text-[8px] text-[#444] font-bold uppercase">
                    Settled via Platform
                  </span>
                </div>
                <span className="text-3xl font-bold text-[#B3DC26] font-['Open_Sans'] tracking-tighter">
                  Rs {bookingDetails.totalPrice}
                </span>
              </div>
            </>
          ) : (
            <div className="py-12 text-center space-y-4 bg-[#111] rounded-[16px] border border-dashed border-white/10">
              <div className="w-16 h-16 bg-[#1B1B1B] rounded-full flex items-center justify-center mx-auto">
                <Zap size={24} className="#2D2D2D" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white uppercase tracking-tight">
                  Available Unit
                </h4>
                <p className="text-white/70 text-xs max-w-[200px] mx-auto mt-2 opacity-60">
                  No bookings detected for this sequence. Slot is open for
                  athlete deployment.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 pt-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none hover:opacity-90 rounded-[16px] text-[11px] font-bold text-black uppercase tracking-[2px] transition-all"
          >
            Acknowledge & Close
          </button>
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-[#000000]">
        <AlertCircle className="text-red-500 mb-6" size={48} />
        <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight font-['Open_Sans']">
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-[#000000]">
        <Zap size={48} className="text-[#2D2D2D] mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight font-['Open_Sans']">
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
    <span className="ml-2 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase tracking-widest rounded-[16px] animate-pulse">
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
    <div className="space-y-8 animate-fade-in pb-20 bg-[#000000] min-h-screen">
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      {/* Navigation & Header */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <GlobalBackButton />
          <div className="h-px flex-1 bg-[#1B1B1B]/50" />
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pb-8 border-b border-white/10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-32 h-32 rounded-[16px] overflow-hidden border border-white/10 shrink-0 shadow-2xl relative">
              <img
                src={pending.image || turf.image}
                alt={turf.name}
                className="w-full h-full object-cover opacity-80"
              />
              {pending.image && (
                <div
                  className="absolute top-2 right-2 p-1 bg-amber-500 rounded-full animate-pulse"
                  title="New Image Pending"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-1">
                  <h1
                    className={`text-4xl font-bold uppercase tracking-tight font-['Open_Sans'] ${turf.status === "pending" ? "text-amber-500" : turf.status === "rejected" ? "text-red-500" : "text-white"}`}
                  >
                    {turf.name}
                  </h1>
                  {pending.name && (
                    <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <span className="opacity-40">Update to:</span>{" "}
                      {pending.name} <PendingBadge />
                    </p>
                  )}
                </div>
                <div
                  className={`px-3 py-1 border rounded-[16px] flex items-center gap-1 ${turf.status === "approved" ? "bg-[#B3DC26]/10 border-[#B3DC26]/20 text-[#B3DC26]" : turf.status === "rejected" ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full animate-pulse ${turf.status === "approved" ? "bg-[#B3DC26]" : turf.status === "rejected" ? "bg-red-500" : "bg-amber-500"}`}
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest">
                    {turf.status}
                  </span>
                </div>
                <div className="px-3 py-1 bg-[#111] border border-white/10 rounded-[16px] flex items-center gap-2">
                  <Star size={12} className="text-[#B3DC26] fill-[#BFF367]" />
                  <span className="text-[10px] font-bold text-white font-['Open_Sans']">
                    {turf.avgRating?.toFixed(1) || "NEW"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-white/70 text-[10px] font-bold uppercase tracking-[2px]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin
                      size={14}
                      className={
                        turf.status === "rejected"
                          ? "text-red-500/60"
                          : "text-[#B3DC26]/60"
                      }
                    />
                    {turf.location}
                    {turf.city ? `, ${turf.city}` : ""}
                    {turf.state ? `, ${turf.state}` : ""}
                  </div>
                  {pending.location && (
                    <p className="text-amber-500/80 text-[8px] font-bold lowercase tracking-widest flex items-center gap-2 pl-5">
                      G�� {pending.location} <PendingBadge label="Loc" />
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock
                      size={14}
                      className={
                        turf.status === "rejected"
                          ? "text-red-500/60"
                          : "text-[#B3DC26]/60"
                      }
                    />
                    {turf.openTime} - {turf.closeTime}
                  </div>
                  {(pending.openTime || pending.closeTime) && (
                    <p className="text-amber-500/80 text-[8px] font-bold lowercase tracking-widest flex items-center gap-2 pl-5">
                      G�� {pending.openTime || turf.openTime} -{" "}
                      {pending.closeTime || turf.closeTime}{" "}
                      <PendingBadge label="Time" />
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${turf.status === "rejected" ? "text-red-500/60" : "text-[#B3DC26]/60"}`}
                    >
                      Rs
                    </span>
                    {turf.pricePerHour}/hr base
                  </div>
                  {pending.pricePerHour && (
                    <p className="text-amber-500/80 text-[8px] font-bold lowercase tracking-widest flex items-center gap-2 pl-5">
                      G�� Rs {pending.pricePerHour}/hr{" "}
                      <PendingBadge label="Price" />
                    </p>
                  )}
                </div>
              </div>
              {turf.status !== "approved" && (
                <div
                  className={`flex items-center gap-2 p-2 px-3 rounded-[16px] border w-fit mt-2 ${turf.status === "rejected" ? "bg-red-500/5 border-red-500/10 text-red-500/80" : "bg-amber-500/5 border-amber-500/10 text-amber-500/80"}`}
                >
                  <AlertCircle size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">
                    {turf.status === "rejected"
                      ? "Critical: Corrections Required for Deployment"
                      : "Intelligence Audit: Verification in Progress"}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleToggleVisibility}
              className={`px-6 py-2.5 border rounded-[16px] font-bold uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${turf.isActive ? "bg-[#B3DC26]/5 border-[#B3DC26]/20 text-[#B3DC26] hover:bg-[#B3DC26]/10" : "bg-black border-white/10 text-[#444] hover:text-white"}`}
            >
              <Zap
                size={14}
                className={turf.isActive ? "fill-[#BFF367]" : ""}
              />
              {turf.isActive ? "Visible" : "Hidden"}
            </button>
            <button
              onClick={() => navigate(`/venue-owner/edit-turf/${id}`)}
              className={`px-6 py-2.5 border rounded-[16px] font-bold uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${turf.status === "rejected" ? "bg-red-500 text-white border-red-500 hover:bg-red-600 shadow-[0_5px_15px_rgba(239,68,68,0.2)]" : "bg-[#121212] border-white/10 text-white/70 hover:text-white"}`}
            >
              <Edit2 size={14} />
              {turf.status === "rejected" ? "Review & Re-apply" : "Edit Arena"}
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 rounded-[16px] text-red-500 font-bold uppercase text-[10px] tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
            >
              <Trash2 size={14} />
              Decommission
            </button>
          </div>
        </div>
      </div>

      {/* Media Intelligence & Operational Footage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Gallery Scroller */}
        <div className="lg:col-span-7 bg-[#121212] border border-white/10 rounded-[16px] p-6 space-y-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-[#B3DC26] rounded-full" />
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                Arena Visual Assets
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const el = document.getElementById("gallery-scroll");
                  el.scrollBy({ left: -300, behavior: "smooth" });
                }}
                className="w-8 h-8 flex items-center justify-center bg-[#111] border border-white/10 rounded-full text-white/70 hover:text-[#B3DC26] hover:border-[#B3DC26]/40 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("gallery-scroll");
                  el.scrollBy({ left: 300, behavior: "smooth" });
                }}
                className="w-8 h-8 flex items-center justify-center bg-[#111] border border-white/10 rounded-full text-white/70 hover:text-[#B3DC26] hover:border-[#B3DC26]/40 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div
            id="gallery-scroll"
            className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 snap-x"
          >
            {(turf.images || [turf.image]).map((img, i) => (
              <div
                key={i}
                className="min-w-[280px] h-[180px] rounded-[16px] border border-white/10 overflow-hidden relative group/img snap-start"
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
                  className="min-w-[280px] h-[180px] rounded-[16px] border-2 border-amber-500/40 overflow-hidden relative group/img snap-start"
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
        <div className="lg:col-span-5 bg-[#121212] border border-white/10 rounded-[16px] p-6 space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-red-600 rounded-full animate-pulse" />
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
              Operational Footage (YouTube)
            </p>
          </div>

          {pending.youtubeUrl || turf.youtubeUrl ? (
            <div
              className={`relative aspect-video rounded-[16px] overflow-hidden border ${pending.youtubeUrl ? "border-amber-500/40" : "border-white/10"}`}
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
          ) : (
            <div className="aspect-video bg-[#050505] rounded-[16px] border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-8">
              <Activity size={32} className="text-[#2D2D2D] mb-4" />
              <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest leading-relaxed">
                No telemetry broadcast configured for this facility.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Operational Pulse & Intelligence */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Live Stats */}
        <div className="xl:col-span-4 grid grid-cols-2 gap-4">
          <div className="p-6 bg-[#121212] border border-white/10 rounded-[16px] flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-[#B3DC26] group-hover:opacity-20 transition-opacity">
              <Activity size={40} />
            </div>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-[3px]">
              Today's Load
            </p>
            <div>
              <h4 className="text-3xl font-bold text-white font-['Open_Sans'] uppercase">
                {Math.round(
                  (filteredBookings.filter((s) => s.isBooked).length /
                    (filteredBookings.length || 1)) *
                    100
                )}
                %
              </h4>
              <p className="text-[9px] text-[#B3DC26] font-bold uppercase tracking-widest mt-1">
                Live Occupancy
              </p>
            </div>
          </div>
          <div className="p-6 bg-[#121212] border border-white/10 rounded-[16px] flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-[#B3DC26] group-hover:opacity-20 transition-opacity">
              <Zap size={40} />
            </div>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-[3px]">
              Revenue
            </p>
            <div className="space-y-1">
              <h4 className="text-3xl font-bold text-white font-['Open_Sans'] uppercase flex items-baseline gap-2">
                Rs{" "}
                {filteredBookings
                  .filter((s) => s.isBooked)
                  .reduce(
                    (acc, b) => acc + (b.bookingDetails?.totalPrice || 0),
                    0
                  )}
                {pending.pricePerHour && (
                  <span className="text-amber-500 text-sm font-bold opacity-80">
                    G�� Rs {pending.pricePerHour}/hr{" "}
                    <PendingBadge label="Rate" />
                  </span>
                )}
              </h4>
              <p className="text-[9px] text-[#B3DC26] font-bold uppercase tracking-widest mt-1">
                Daily Yield
              </p>
            </div>
          </div>
        </div>

        {/* Consolidated Intelligence */}
        <div className="xl:col-span-8 space-y-8">
          <div className="p-6 bg-[#121212] border border-white/10 rounded-[16px] flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-[#B3DC26] rounded-full" />
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                  Facility DNA
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    Ground Composition
                    {pending.groundTypes && <PendingBadge />}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(pending.groundTypes || turf.groundTypes || []).map(
                      (ground, i) => (
                        <span
                          key={i}
                          className={`px-2 py-1 border rounded-[16px] text-[9px] font-bold uppercase tracking-wider snap-start ${pending.groundTypes ? "bg-amber-500/5 border-amber-500/20 text-amber-500" : "bg-[#111] border-white/10 text-white"}`}
                        >
                          {ground}
                        </span>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-[#444] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    Capabilities
                    {pending.facilities && <PendingBadge />}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(pending.facilities || turf.facilities || []).map(
                      (facility, i) => (
                        <span
                          key={i}
                          className={`px-2 py-1  rounded-[16px] text-[9px] font-bold uppercase tracking-wider snap-start ${pending.facilities ? "bg-amber-500/10 -amber-500/20 text-amber-500" : "bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none -[#B3DC26] text-black"}`}
                        >
                          {facility}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-px bg-[#1B1B1B] hidden md:block" />

            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-[#B3DC26] rounded-full" />
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                  Sport Arsenal
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(pending.sportTypes || turf.sportTypes || []).map(
                  (sport, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 border p-3 rounded-[16px] w-full group/sport transition-colors ${pending.sportTypes ? "bg-amber-500/5 border-amber-500/20" : "bg-[#111] border-white/10 hover:border-[#B3DC26]/40"}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full transition-colors ${pending.sportTypes ? "bg-amber-500 animate-pulse" : "bg-[#B3DC26]/20 group-hover/sport:bg-[#B3DC26]"}`}
                      />
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider ${pending.sportTypes ? "text-amber-500" : "text-white"}`}
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
          <div className="p-6 bg-[#121212] border border-white/10 rounded-[16px] space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-[#B3DC26] rounded-full" />
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                Documentation & Policies
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText size={12} className="text-[#B3DC26]" />
                  Facility Description
                  {pending.description && <PendingBadge />}
                </h4>
                <div className="relative">
                  <p
                    className={`text-[13px] text-white/80 leading-relaxed font-inter ${!isDescExpanded ? "line-clamp-2" : ""}`}
                  >
                    {pending.description || turf.description}
                  </p>
                  {(pending.description || turf.description)?.length > 150 && (
                    <button
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                      className="text-[#B3DC26] text-[10px] font-bold uppercase tracking-wider mt-2 hover:underline"
                    >
                      {isDescExpanded ? "Show Less" : "Read More"}
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#1A1A1A]">
                <h4 className="text-[10px] font-bold text-[#444] uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertCircle size={12} className="text-[#B3DC26]" />
                  Venue Rules & Policies
                  {pending.policies && <PendingBadge />}
                </h4>
                <div className="relative">
                  <p
                    className={`text-[12px] text-white/70 leading-relaxed font-inter italic border-l-2 border-white/10 pl-4 ${!isPolicyExpanded ? "line-clamp-2" : ""}`}
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
                    <button
                      onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
                      className="text-[#B3DC26] text-[10px] font-bold uppercase tracking-wider mt-2 hover:underline"
                    >
                      {isPolicyExpanded ? "Show Less" : "Read More"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Support Network: Location, Owner, Managers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-[#121212] border border-white/10 rounded-[16px] space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-[#B3DC26] rounded-full" />
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                  Location Data
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <MapPin
                    size={16}
                    className="text-[#B3DC26] shrink-0 mt-0.5"
                  />
                  <div className="space-y-1">
                    <p className="text-[12px] text-white font-medium">
                      {pending.location || turf.location}
                    </p>
                    <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                      {pending.city || turf.city || "City Not Set"},{" "}
                      {pending.state || turf.state || "State Not Set"}
                    </p>
                  </div>
                </div>

                {turf.mapUrl && (
                  <a
                    href={turf.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#121212] hover:bg-[#B3DC26]/10 text-[#B3DC26] border border-white/10 hover:border-[#B3DC26]/30 rounded-[16px] text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    <Navigation size={14} /> Get Directions
                  </a>
                )}
              </div>
            </div>

            <div className="p-6 bg-[#121212] border border-white/10 rounded-[16px] space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-[#B3DC26] rounded-full" />
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-[2px]">
                    Personnel & Support
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Owner Record */}
                {turf.owner && (
                  <div className="flex gap-3 items-center p-3 rounded-[16px] bg-[#121212] border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <User size={14} className="text-white/70" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-white tracking-tight">
                        {turf.owner.name}
                      </span>
                      <span className="text-[9px] text-[#B3DC26] uppercase font-bold tracking-widest">
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
                    <h4 className="text-[9px] font-bold text-[#444] uppercase tracking-widest mb-2 pl-1">
                      Venue Managers
                    </h4>
                    {turf.managerContacts.map((manager, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 pl-3 rounded-[16px] border border-dashed border-white/10 hover:border-[#B3DC26]/30 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-white uppercase">
                            {manager.name}
                          </span>
                          <span className="text-[10px] text-white/70 font-mono">
                            {manager.phone}
                          </span>
                        </div>
                        <a
                          href={`tel:${manager.phone}`}
                          className="p-2 bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none text-[#B3DC26] rounded-[16px] hover:bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none  transition-all"
                        >
                          <Phone size={12} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Date Selector */}
        <div className="lg:col-span-3 space-y-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[3px] text-white/70 flex items-center gap-3">
            <Calendar size={14} className="text-[#B3DC26]" />
            Timeline Control
          </h3>
          <div className="flex flex-col gap-2">
            {uniqueDates.length > 0 ? (
              uniqueDates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`w-full p-5 rounded-[16px]  text-left transition-all duration-300 flex justify-between items-center ${selectedDate === date ? "bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none -[#B3DC26] text-black shadow-[0_10px_20px_rgba(204,255,0,0.15)]" : "bg-[#000000] -white/10 text-white/70 hover:-[#B3DC26]/40"}`}
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-[1px]">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                      })}
                    </span>
                    <span
                      className={`text-[10px] font-medium uppercase mt-0.5 ${selectedDate === date ? "text-black/60" : "text-[#444]"}`}
                    >
                      {new Date(date).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  {selectedDate === date && (
                    <Zap size={14} fill="currentColor" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-8 text-center bg-[#111] border border-dashed border-white/10 rounded-[16px]">
                <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">
                  No Active Slots
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Slots Grid */}
        <div className="lg:col-span-9 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[3px] text-white/70 flex items-center gap-3">
              <Clock size={14} className="text-[#B3DC26]" />
              Slot Manifest{" "}
              <span className="ml-4 px-3 py-1 bg-[#121212] rounded-[16px] border border-white/10 text-[10px] text-[#B3DC26]">
                {displaySlots.filter((s) => s.isActive).length} Active Units
              </span>
            </h3>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#111] border border-white/10" />
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
                <div className="w-2 h-2 rounded-full bg-[#B3DC26]" />
                <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">
                  Booked
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displaySlots.length > 0 ? (
              displaySlots.map((slot) => (
                <button
                  key={slot._id}
                  onClick={() => slot.isBooked && setSelectedSlot(slot)}
                  disabled={!slot.isActive}
                  className={`relative overflow-hidden p-6 rounded-[16px] border transition-all duration-500 group text-left flex flex-col justify-between min-h-[160px] ${!slot.isActive ? "bg-[#050505] border-[#1A1A1A] opacity-40 cursor-not-allowed" : slot.isBooked ? "bg-[#B3DC26]/5 border-[#B3DC26]/30 shadow-[0_0_20px_rgba(204,255,0,0.05)] cursor-pointer hover:border-[#B3DC26]/60" : "bg-[#000000] border-white/10 hover:border-[#B3DC26]/40 cursor-default"}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p
                        className={`text-[9px] font-bold uppercase tracking-widest ${slot.isBooked ? "text-[#B3DC26]/60" : "text-[#444]"}`}
                      >
                        Time Sequence
                      </p>
                      <h4 className="text-lg font-bold text-white font-['Open_Sans'] uppercase tracking-tight">
                        {slot.startTime} - {slot.endTime}
                      </h4>
                      <p className="text-[10px] text-[#B3DC26] font-bold tracking-widest mt-1">
                        Rs {slot.price || turf.pricePerHour}{" "}
                        <span className="text-white/70 text-[8px]">/ slot</span>
                      </p>
                    </div>
                    {slot.isActive && (
                      <div
                        className={`px-2 py-0.5 rounded-[16px] text-[8px] font-bold uppercase tracking-widest  ${slot.isBooked ? "bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none -[#B3DC26] text-black" : "bg-[#111] -white/10 text-white/70"}`}
                      >
                        {slot.isBooked ? "Booked" : "Open"}
                      </div>
                    )}
                  </div>

                  <div className="relative z-10">
                    {slot.isBooked ? (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[16px] bg-[#111] border border-white/10 flex items-center justify-center overflow-hidden">
                          {slot.bookingDetails.user?.profileImage ? (
                            <img
                              src={slot.bookingDetails.user.profileImage}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users size={16} className="text-[#B3DC26]/60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-[13px] font-bold text-white truncate uppercase tracking-tight font-['Open_Sans']">
                            {slot.bookingDetails.user?.name || "Guest Player"}
                          </h5>
                          <p className="text-[9px] text-[#B3DC26] font-bold uppercase tracking-[2px] mt-1">
                            View Details
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 opacity-20 group-hover:opacity-60 transition-opacity">
                        <div className="p-1.5 bg-[#111] rounded-full">
                          <CheckCircle2 size={12} className="text-white/70" />
                        </div>
                        <p className="text-[9px] font-bold text-white/70 uppercase tracking-[2px]">
                          Available Sequence
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Hint */}
                  {slot.isActive && slot.isBooked && (
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Zap size={12} className="text-[#B3DC26]" />
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="col-span-full py-32 bg-[#000000] border border-dashed border-white/10 rounded-[16px] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <Zap size={24} className="text-[#2D2D2D]" />
                </div>
                <h4 className="text-xl font-bold text-white uppercase tracking-tight mb-2 font-['Open_Sans']">
                  Zero Operational Data
                </h4>
                <p className="text-white/70 text-xs max-w-xs mx-auto opacity-60">
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
