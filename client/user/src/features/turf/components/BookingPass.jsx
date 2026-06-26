import React, { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  Download,
  Share2,
  Navigation,
  Info,
  ShieldCheck,
  Zap,
  User as UserIcon,
  ExternalLink,
  AlertOctagon,
  FileText,
  Trophy,
} from "lucide-react";
import useBookingPass from "../hooks/useBookingPass";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import useSimilarRecommendations from "@hooks/useSimilarRecommendations";
import { TurfCard } from "@features/turf";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";
import ReportIssueFlowModal from "@components/dispute/ReportIssueFlowModal";
import axiosInstance from "@hooks/useAxiosInstance";
import { Button } from "@kridaz/ui";


const BookingPass = () => {
  const { id } = useParams();
  const { booking, loading } = useBookingPass(id);
  const passRef = useRef(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleDownload = async () => {
    if (!passRef.current) return;
    try {
      const toastId = toast.loading("Generating PDF pass...");
      const dataUrl = await toPng(passRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "var(--background)",
      });

      const width = passRef.current.offsetWidth;
      const height = passRef.current.offsetHeight;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [width, height],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      pdf.save(
        `Booking_Pass_${booking?.turf?.name?.replace(/\s+/g, "_") || "Kridaz"}.pdf`
      );

      toast.success("Pass downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("Error generating pass:", error);
      toast.dismiss();
      toast.error("Failed to download pass.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Kridaz Booking Pass: ${booking?.turf?.name}`,
          text: `Check out my booking at ${booking?.turf?.name} on ${booking?.timeSlot?.date} at ${booking?.timeSlot?.formattedStartTime}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    const playTime = new Date(
      booking.playStartTime || booking.timeSlot?.startTime
    );
    const now = new Date();
    const hoursRemaining = (playTime - now) / (1000 * 60 * 60);

    let confirmMsg =
      "Are you sure you want to cancel this booking? No refund will be issued as it's within 72 hours of the slot.";
    if (hoursRemaining >= 72) {
      confirmMsg =
        "Are you sure you want to cancel? Since you are cancelling more than 72 hours before the slot, you will receive a 30% refund in your wallet. The remaining 70% is non-refundable.";
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      setIsCancelling(true);
      await axiosInstance.post(`/api/booking/user/cancel/${id}`);
      toast.success("Booking cancelled successfully!");
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const turfId = booking?.turf?.id || booking?.turf?._id;
  const { similarTurfs, loading: similarLoading } = useSimilarRecommendations(
    turfId,
    { limit: 3 }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
            Verifying Entry Pass...
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[8px] text-center max-w-md w-full">
          <Info className="w-16 h-16 text-zinc-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2 uppercase">
            Pass Not Found
          </h2>
          <p className="text-zinc-400 mb-8 text-sm">
            We couldn't find the booking pass you're looking for. It might have
            expired or doesn't exist.
          </p>
          <Link
            to="/booking-history"
            className="inline-flex items-center gap-2 bg-primary text-black px-8 py-4 rounded-[8px] font-bold uppercase text-xs hover:scale-105 transition-transform"
          >
            <ChevronLeft className="w-4 h-4" />
            My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const { turf, timeSlot, user, totalPrice, qrCode, status } = booking;
  const hoursUntilSlot =
    (new Date(booking.playStartTime || timeSlot?.startTime) - new Date()) /
    (1000 * 60 * 60);
  const isSlotOver =
    new Date(booking.playEndTime || timeSlot?.endTime) < new Date();

  return (
    <div className="bg-background text-white pt-1 pb-10 px-0.5 font-inter">
      <div className="max-w-6xl mx-auto">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-4 px-1">
          <Link
            to="/booking-history"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors uppercase text-[10px] font-bold tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to={`/booking-invoice/${booking.id || booking._id}`}
              className="flex items-center justify-center h-[30px] px-3 bg-card border border-[rgba(255,255,255,0.08)] rounded-[8px] text-zinc-400 hover:text-primary transition-all text-[9px] font-black uppercase tracking-widest gap-1.5"
            >
              <FileText size={12} /> Invoice
            </Link>
            <Button
              onClick={handleDownload}
              className="flex items-center justify-center w-[30px] h-[30px] bg-card border border-[rgba(255,255,255,0.08)] rounded-[8px] text-zinc-400 hover:text-primary transition-all"
             aria-label="Download">
              <Download size={14} />
            </Button>
            <Button
              onClick={handleShare}
              className="flex items-center justify-center w-[30px] h-[30px] bg-card border border-[rgba(255,255,255,0.08)] rounded-[8px] text-zinc-400 hover:text-primary transition-all"
            >
              <Share2 size={14} />
            </Button>
          </div>
        </div>

        {/* The Digital Pass */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Background Glow */}
          <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-[8px] pointer-events-none" />

          {/* Pass Body */}
          <div
            ref={passRef}
            className="relative bg-card border border-[rgba(255,255,255,0.08)] rounded-[12px] overflow-hidden shadow-2xl"
          >
            {/* Top Section: Venue Image & Basic Info */}
            <div className="relative h-[80px]">
              <img
                src={turf.images?.[0] || turf.image || "/banner-1.webp"}
                className="w-full h-full object-cover"
                alt={turf.name}
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <div className="flex items-center gap-2 text-primary font-bold text-[8px] uppercase tracking-widest mb-1">
                  <ShieldCheck size={10} />
                  <span>Verified Entry Pass</span>
                </div>
                <h1 className="text-[18px] font-black uppercase tracking-tight leading-none text-white">
                  {turf.name}
                </h1>
              </div>
            </div>

            {/* Content Grid */}
            <div className="px-2 py-3 space-y-3">
              {/* Primary Info Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    Scheduled For
                  </p>
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <Calendar size={12} className="text-primary" />
                    <span className="text-[11px]">{timeSlot.date}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    Time Window
                  </p>
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <Clock size={12} className="text-primary" />
                    <span className="text-[11px]">
                      {timeSlot.formattedStartTime} -{" "}
                      {timeSlot.formattedEndTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-1.5">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  Venue Location
                </p>
                <div className="flex items-start gap-2 bg-card p-2 rounded-[8px] border border-[rgba(255,255,255,0.08)]">
                  <div className="p-1.5 bg-primary/10 text-primary rounded-[6px] shrink-0">
                    <MapPin size={12} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-white mb-0.5 leading-tight">
                      {turf.location}
                    </p>
                    <a
                      href={
                        turf.mapUrl ||
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(turf.location)}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary text-[9px] font-black uppercase tracking-wider hover:underline"
                    >
                      <Navigation size={8} />
                      Start Navigation
                    </a>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Section */}
              <div className="p-2 bg-card border border-[rgba(255,255,255,0.08)] rounded-[8px] space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-tight">
                      Total
                    </p>
                    <p className="text-[11px] font-black text-white">
                      ₹{totalPrice}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-0.5 text-[7px] font-bold text-primary uppercase tracking-tighter">
                      <ShieldCheck size={8} />
                      <span>Advance</span>
                    </div>
                    <p className="text-[11px] font-black text-white leading-none">
                      ₹{booking.advanceAmount || totalPrice}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-0.5 text-[7px] font-bold text-orange-400 uppercase tracking-tighter">
                      <Clock size={8} />
                      <span>Balance</span>
                    </div>
                    <p className="text-[11px] font-black text-white leading-none">
                      ₹{booking.balanceAmount || 0}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-tight">
                      Status
                    </p>
                    <p
                      className={`text-[9px] font-black uppercase ${booking.paymentType === "PARTIAL" ? "text-orange-400" : "text-primary"}`}
                    >
                      {booking.paymentType === "PARTIAL" ? "Partial" : "Paid"}
                    </p>
                  </div>
                </div>

                {booking.paymentType === "PARTIAL" && (
                  <div className="flex items-center gap-1.5 p-1.5 bg-orange-400/10 rounded-[6px]">
                    <Info size={10} className="text-orange-400" />
                    <p className="text-[8px] font-bold text-orange-400 uppercase leading-none">
                      Please pay balance at venue before playing
                    </p>
                  </div>
                )}
              </div>

              {/* QR and Info Row */}
              <div className="flex gap-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                {/* Left: QR Code */}
                <div className="w-[160px] shrink-0 bg-white rounded-[8px] p-2 flex flex-col items-center justify-center gap-1">
                  <img
                    src={qrCode}
                    alt="Entry QR"
                    className="w-full aspect-square"
                    crossOrigin="anonymous"
                  />
                  <div className="text-center w-full mt-1">
                    <p className="text-[9px] font-black text-black uppercase tracking-widest leading-none">
                      Scan at Entrance
                    </p>
                    <p className="text-[7px] font-bold text-zinc-500 uppercase mt-1">
                      1 Match Entry
                    </p>
                  </div>
                </div>

                {/* Right: Info */}
                <div className="flex-1 flex flex-col justify-between space-y-1 bg-card border border-[rgba(255,255,255,0.08)] rounded-[8px] p-2">
                  <div className="space-y-1.5">
                    {/* Contacts */}
                    <div className="space-y-0.5">
                      <p className="text-[6px] font-bold text-zinc-500 uppercase tracking-widest">
                        On-Ground Support
                      </p>
                      {turf.managerContacts &&
                      turf.managerContacts.length > 0 ? (
                        turf.managerContacts.slice(0, 1).map((manager, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-card p-1 rounded-[4px]"
                          >
                            <span className="text-[8px] font-bold text-white truncate pr-1">
                              {manager.phone}
                            </span>
                            <a
                              href={`tel:${manager.phone}`}
                              className="text-primary shrink-0"
                            >
                              <Phone size={8} fill="currentColor" />
                            </a>
                          </div>
                        ))
                      ) : (
                        <p className="text-[7px] text-zinc-600 uppercase">
                          Not provided
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-0.5">
                      <p className="text-[6px] font-bold text-zinc-500 uppercase tracking-widest">
                        Correspondence
                      </p>
                      <div className="flex items-center justify-between bg-card p-1 rounded-[4px]">
                        <span className="text-[7px] font-bold text-white truncate pr-1">
                          {turf.owner?.email || "contact@kridaz.com"}
                        </span>
                        <a
                          href={`mailto:${turf.owner?.email || "contact@kridaz.com"}`}
                          className="text-primary shrink-0"
                        >
                          <Mail size={8} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="mt-auto bg-gradient-to-r from-secondary/10 to-primary/10 p-1.5 rounded-[4px] border border-primary/20">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-[6px] font-bold text-zinc-400 uppercase">
                        Paid Via
                      </span>
                      <span className="text-[7px] font-black text-white uppercase">
                        {booking.paymentMethod}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[6px] font-bold text-zinc-400 uppercase">
                        Total Paid
                      </span>
                      <span className="text-[10px] font-black text-primary">
                        ₹{totalPrice}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Cancellation and Dispute Actions */}
        <div className="mt-3 space-y-2 px-1">
          {/* 72-hr policy notice */}
          {status === "CONFIRMED" && hoursUntilSlot < 72 && !isSlotOver && (
            <div className="w-full flex items-center gap-2 px-3 py-2 rounded-[12px] text-[10px] font-[700] uppercase tracking-widest text-destructive bg-destructive/10 border border-destructive/20">
              <AlertOctagon size={14} />
              Can't cancel within 72hrs
            </div>
          )}

          {/* Cancel button */}
          {status === "CONFIRMED" && hoursUntilSlot >= 72 && !isSlotOver && (
            <Button
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full flex items-center justify-center gap-2 h-[42px] rounded-[12px] text-[10px] font-[700] uppercase tracking-widest transition-all disabled:opacity-50 text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20"
            >
              <AlertOctagon size={14} />
              {isCancelling ? "Cancelling..." : "Cancel Booking"}
            </Button>
          )}

          {/* Raise dispute */}
          {status !== "CANCELLED" && status !== "DISPUTED" && (
            <Button
              onClick={() => setShowDisputeModal(true)}
              className="w-full flex items-center justify-center gap-2 h-[42px] rounded-[12px] text-[10px] font-[700] uppercase tracking-widest transition-all text-zinc-400 bg-card border border-[rgba(255,255,255,0.08)] hover:text-white"
            >
              <AlertOctagon size={14} />
              Report Issue / Request Help
            </Button>
          )}

          {/* Find Opponent (GBNO) */}
          {status === "CONFIRMED" && !isSlotOver && (
            <Link
              to={`/host-game?requestType=GBNO&bookingId=${booking.id || booking._id}&turfId=${turfId}`}
              className="w-full flex items-center justify-center gap-2 h-[42px] rounded-[12px] text-[10px] font-[700] uppercase tracking-widest transition-all text-background bg-gradient-to-r from-secondary to-primary hover:scale-[1.02]"
            >
              <Trophy size={14} />
              Find Opponent / Players
            </Link>
          )}

          {/* Dispute review state */}
          {status === "DISPUTED" && (
            <div className="w-full flex items-center justify-center gap-2 h-[42px] rounded-[12px] text-[10px] font-[700] uppercase tracking-widest text-background bg-gradient-to-r from-secondary to-primary">
              <ShieldCheck size={14} />
              Dispute Under Review
            </div>
          )}
        </div>

        {/* Recommendation Section: Keep Playing Next Week */}
        {(similarLoading || (similarTurfs && similarTurfs.length > 0)) && (
          <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.08)] space-y-4 px-1">
            <div className="space-y-0.5">
              <h3 className="text-[12px] font-black uppercase text-primary tracking-[0.1em] flex items-center gap-1.5">
                <Zap size={12} className="fill-current animate-pulse" /> Keep
                Playing
              </h3>
              <p className="text-[9px] text-zinc-500 font-[700] uppercase tracking-wider">
                Recommended hubs near {turf?.name || "this venue"}
              </p>
            </div>

            {similarLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[280px] rounded-[8px] bg-zinc-900/40 border border-white/5 animate-pulse relative overflow-hidden"
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
      </div>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <ReportIssueFlowModal
          booking={booking}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};

export default BookingPass;
