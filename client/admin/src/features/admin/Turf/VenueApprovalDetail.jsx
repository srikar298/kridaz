import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Calendar,
  Check,
  X,
  Info,
  Phone,
  User,
  Globe,
  Shield,
  Activity,
  Mail,
  ExternalLink,
  Star,
  Navigation,
  FileText,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import useTurfData from "@hooks/admin/useTurf";
import ConfirmationPopup from "./ConfirmationPopup";
import TurfSkeleton from "./TurfSkeleton";import { Button } from "@kridaz/ui";


const VenueApprovalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { turfData, loading, approveTurf, rejectTurf } = useTurfData();
  const [turf, setTurf] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "" });
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(false);

  useEffect(() => {
    if (turfData && id) {
      const found = turfData.find((t) => t._id === id);
      setTurf(found);
    }
  }, [turfData, id]);

  const handleApprove = async (adminData) => {
    const success = await approveTurf(id, adminData);
    if (success) {
      toast.success(`Venue Approved by ${adminData.name}`);
      navigate("/admin/turfs");
    }
  };

  const handleReject = async (adminData) => {
    const success = await rejectTurf(id, adminData);
    if (success) {
      toast.success(`Venue Rejected by ${adminData.name}`);
      navigate("/admin/turfs");
    }
  };

  if (loading || !turf) {
    return (
      <div className="min-h-screen bg-background p-10">
        <TurfSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
        <Button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest"
        >
          <ArrowLeft size={16} />
          Return to Queue
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-[6px] border border-primary/20">
            <Activity size={12} className="text-primary animate-pulse" />
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">
              Active Verification Session
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-12 space-y-12">
        {/* Hero Section */}
        <div className="relative h-[50vh] rounded-[8px] overflow-hidden border border-border shadow-2xl">
          <img
            src={turf.image}
            alt={turf.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/banner-2.png";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          <div className="absolute bottom-0 left-0 w-full p-10 lg:p-16 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                Venue Verification
              </span>
              <span
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${turf.status === "approved" ? "bg-green-500/10 text-green-500 border-green-500/20" : turf.status === "rejected" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"}`}
              >
                {turf.status}
              </span>
            </div>
            <h1 className="text-5xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-none">
              {turf.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400 font-bold">
                <MapPin size={18} className="text-primary" />
                <span className="text-lg">
                  {[turf.location, turf.city, turf.state]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
              <a
                href={
                  turf.mapUrl ||
                  (turf.locationData?.coordinates?.length === 2
                    ? `https://maps.google.com/?q=${turf.locationData.coordinates[1]},${turf.locationData.coordinates[0]}`
                    : `https://maps.google.com/maps/search/?api=1&query=${encodeURIComponent([turf.location, turf.city, turf.state].filter(Boolean).join(", "))}`)
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest rounded-[6px] hover:bg-primary/20 transition-all"
              >
                <Navigation size={10} />
                Get Directions
              </a>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Left Column: Extensive Details */}
          <div className="lg:col-span-2 space-y-16">
            {/* Description Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Info size={16} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em]">
                  The Mission Brief
                </h2>
              </div>
              <div className="relative">
                <p
                  className={`text-gray-400 text-xl leading-relaxed font-medium italic ${!isDescExpanded ? "line-clamp-2" : ""}`}
                >
                  &quot;
                  {turf.description ||
                    "No description provided for this venue."}
                  &quot;
                </p>
                {(turf.description || "No description provided for this venue.")
                  ?.length > 150 && (
                  <Button
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-primary text-xs font-bold uppercase tracking-wider mt-3 hover:underline"
                  >
                    {isDescExpanded ? "Show Less" : "Read More"}
                  </Button>
                )}
              </div>
            </section>

            {/* Gallery Section */}
            {turf.images && turf.images.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Globe size={16} />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em]">
                    Visual Telemetry
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {turf.images.map((img, i) => (
                    <div
                      key={i}
                      className="group relative aspect-video rounded-[8px] overflow-hidden border border-border hover:border-primary/50 transition-all cursor-zoom-in"
                    >
                      <img
                        src={img}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        alt={`Gallery ${i}`}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-primary text-black rounded-full">
                          Expand Intelligence
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hardware Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Shield size={16} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em]">
                  On-Site Amenities
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {turf.facilities?.map((facility, i) => (
                  <div
                    key={i}
                    className="p-6 bg-white/[0.02] border border-white/5 rounded-[8px] flex flex-col items-center gap-4 text-center group hover:bg-primary/5 hover:border-primary/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-[8px] bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Activity size={20} />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">
                      {facility}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Venue Policy Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <FileText size={16} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em]">
                  Venue Policies
                </h2>
              </div>
              {turf.policies ? (
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[8px] space-y-3 relative">
                  <p
                    className={`text-gray-400 text-sm leading-relaxed whitespace-pre-wrap ${!isPolicyExpanded ? "line-clamp-2" : ""}`}
                  >
                    {turf.policies}
                  </p>
                  {turf.policies?.length > 150 && (
                    <Button
                      onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
                      className="text-primary text-xs font-bold uppercase tracking-wider mt-2 hover:underline"
                    >
                      {isPolicyExpanded ? "Show Less" : "Read More"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-white/[0.02] border border-dashed border-white/10 rounded-[8px] flex items-center gap-3">
                  <Shield size={16} className="text-gray-600 shrink-0" />
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">
                    No specific policies defined — standard facility rules
                    apply.
                  </p>
                </div>
              )}
            </section>

            {/* Per-Slot Pricing Section */}
            {turf.generatedSlots && turf.generatedSlots.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                    <DollarSign size={16} />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em]">
                    Per-Slot Rate Schedule
                  </h2>
                  <span className="ml-auto px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-gray-500 uppercase">
                    {turf.generatedSlots.length} Slots
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {turf.generatedSlots.map((slot, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-[8px] border flex flex-col gap-1 ${slot.isActive !== false ? "bg-white/[0.02] border-white/5 hover:border-primary/20" : "bg-transparent border-dashed border-white/5 opacity-40"} transition-colors`}
                    >
                      <span className="text-white text-[10px] font-black">
                        {slot.startTime}
                      </span>
                      <span className="text-gray-600 text-[9px] font-bold">
                        → {slot.endTime}
                      </span>
                      <span className="text-primary text-sm font-black mt-1">
                        Rs {slot.price ?? turf.pricePerHour}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Operations & Verification */}
          <div className="space-y-10">
            {/* Action Center */}
            {turf.status === "pending" && (
              <div className="p-8 bg-background border border-primary/30 rounded-[8px] space-y-6 shadow-2xl shadow-[var(--primary)]/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] pointer-events-none" />
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-tighter">
                      Verification Required
                    </h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                      Execute platform governance action
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <Button
                      onClick={() =>
                        setConfirmModal({ isOpen: true, type: "approve" })
                      }
                      className="w-full py-5 bg-primary text-black font-black uppercase tracking-[0.2em] text-xs rounded-[8px] hover:bg-primary/80 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[var(--primary)]/20"
                    >
                      <Check size={18} />
                      Authorize Venue
                    </Button>
                    <Button
                      onClick={() =>
                        setConfirmModal({ isOpen: true, type: "reject" })
                      }
                      className="w-full py-5 bg-white/5 border border-red-500/30 text-red-500 font-black uppercase tracking-[0.2em] text-xs rounded-[8px] hover:bg-red-500/10 transition-all flex items-center justify-center gap-3"
                    >
                      <X size={18} />
                      Decline Request
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Summary */}
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[8px] space-y-8">
              <div className="pb-8 border-b border-white/5">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">
                  Base Operations Cost
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    Rs {turf.pricePerHour}
                  </span>
                  <span className="text-primary font-black text-sm uppercase">
                    / Hour
                  </span>
                </div>
              </div>

              <div className="space-y-8">
                <DetailRow
                  icon={Clock}
                  label="OPERATING WINDOW"
                  val={`${turf.openTime} - ${turf.closeTime}`}
                />
                <DetailRow
                  icon={Calendar}
                  label="LISTING TIMESTAMP"
                  val={
                    turf.createdAt
                      ? format(new Date(turf.createdAt), "PPP")
                      : "N/A"
                  }
                />
                {turf.city && (
                  <DetailRow icon={MapPin} label="CITY" val={turf.city} />
                )}
                {turf.state && (
                  <DetailRow icon={Globe} label="STATE" val={turf.state} />
                )}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Navigation size={14} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      DIRECTIONS
                    </span>
                  </div>
                  <a
                    href={
                      turf.mapUrl ||
                      (turf.locationData?.coordinates?.length === 2
                        ? `https://maps.google.com/?q=${turf.locationData.coordinates[1]},${turf.locationData.coordinates[0]}`
                        : `https://maps.google.com/maps/search/?api=1&query=${encodeURIComponent([turf.location, turf.city, turf.state].filter(Boolean).join(", "))}`)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-[8px] text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all group"
                  >
                    <Navigation
                      size={12}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                    Open in Google Maps
                    <ExternalLink size={10} className="ml-auto opacity-50" />
                  </a>
                </div>
              </div>

              {/* Slot Duration & Break */}
              {(turf.slotDuration || turf.breakTime !== undefined) && (
                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                  {turf.slotDuration && (
                    <div className="p-3 bg-white/[0.02] rounded-[8px] border border-white/5">
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">
                        Slot Duration
                      </p>
                      <p className="text-white font-black text-sm">
                        {turf.slotDuration} min
                      </p>
                    </div>
                  )}
                  {turf.breakTime !== undefined && (
                    <div className="p-3 bg-white/[0.02] rounded-[8px] border border-white/5">
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">
                        Break Time
                      </p>
                      <p className="text-white font-black text-sm">
                        {turf.breakTime} min
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Manager Contacts */}
              {turf.managerContacts && turf.managerContacts.length > 0 && (
                <div className="pt-8 border-t border-white/5 space-y-6">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Ground Intelligence
                  </p>
                  {turf.managerContacts.map((contact, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between group p-3 hover:bg-white/5 rounded-[8px] transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-white font-black text-sm uppercase tracking-tight">
                          {contact.name}
                        </span>
                        <span className="text-gray-500 text-xs font-bold">
                          {contact.phone}
                        </span>
                      </div>
                      <a
                        href={`tel:${contact.phone}`}
                        className="p-3 bg-primary/10 text-primary rounded-[8px] group-hover:bg-primary group-hover:text-black transition-all"
                      >
                        <Phone size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Owner Intelligence Card */}
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[8px] space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                  <User size={16} className="text-primary" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                  Owner Intelligence
                </h2>
              </div>

              {/* Avatar + name row */}
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[8px] bg-card border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {turf.owner?.profileImage ? (
                    <img
                      src={turf.owner.profileImage}
                      alt={turf.owner?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-primary/40" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-black text-xl uppercase tracking-tight truncate">
                    {turf.owner?.name || "Unknown Owner"}
                  </p>
                  <span className="text-[9px] font-black px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full uppercase tracking-widest">
                    {turf.owner?.role?.replace(/_/g, " ") || "Venue Owner"}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/5">
                {/* Email */}
                {turf.owner?.email && (
                  <a
                    href={`mailto:${turf.owner.email}`}
                    className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-[8px] border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-[8px] bg-white/5 flex items-center justify-center shrink-0">
                      <Mail size={14} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                        Email
                      </p>
                      <p className="text-white text-xs font-bold truncate">
                        {turf.owner.email}
                      </p>
                    </div>
                    <ExternalLink
                      size={12}
                      className="text-gray-600 group-hover:text-primary shrink-0"
                    />
                  </a>
                )}

                {/* Phone */}
                {turf.owner?.phoneNumber && (
                  <a
                    href={`tel:${turf.owner.phoneNumber}`}
                    className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-[8px] border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-[8px] bg-white/5 flex items-center justify-center shrink-0">
                      <Phone size={14} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                        Phone
                      </p>
                      <p className="text-white text-xs font-bold">
                        {turf.owner.phoneNumber}
                      </p>
                    </div>
                    <ExternalLink
                      size={12}
                      className="text-gray-600 group-hover:text-primary shrink-0"
                    />
                  </a>
                )}

                {/* Joined */}
                {turf.owner?.createdAt && (
                  <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-[8px] border border-white/5">
                    <div className="w-8 h-8 rounded-[8px] bg-white/5 flex items-center justify-center shrink-0">
                      <Calendar size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                        Member Since
                      </p>
                      <p className="text-white text-xs font-bold">
                        {new Date(turf.owner.createdAt).toLocaleDateString(
                          "en-US",
                          { day: "numeric", month: "long", year: "numeric" }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Rating */}
                {turf.owner?.rating !== undefined && (
                  <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-[8px] border border-white/5">
                    <div className="w-8 h-8 rounded-[8px] bg-white/5 flex items-center justify-center shrink-0">
                      <Star size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                        Owner Rating
                      </p>
                      <p className="text-white text-xs font-bold">
                        {turf.owner.rating?.toFixed(1) || "New"} / 5.0
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Venue count badge */}
              {turf.owner?.totalVenues !== undefined && (
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    Total Venues Owned
                  </span>
                  <span className="text-2xl font-black text-primary">
                    {turf.owner.totalVenues}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationPopup
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={
          confirmModal.type === "approve" ? handleApprove : handleReject
        }
        title={
          confirmModal.type === "approve"
            ? "Finalize Authorization"
            : "Reject Intelligence"
        }
        message={`Executing ${confirmModal.type} protocol for ${turf.name}. Please provide governance credentials.`}
        type={confirmModal.type === "approve" ? "success" : "danger"}
        confirmText={
          confirmModal.type === "approve"
            ? "Confirm Authorization"
            : "Confirm Rejection"
        }
        showGovernanceForm={true}
      />
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, val }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3 text-gray-500">
      <Icon size={14} className="text-primary" />
      <span className="text-[10px] font-black uppercase tracking-widest">
        {label}
      </span>
    </div>
    <p className="text-white font-bold text-lg leading-tight tracking-tight">
      {val}
    </p>
  </div>
);

export default VenueApprovalDetail;
