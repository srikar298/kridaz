import React from "react";
import {
  X,
  MapPin,
  Clock,
  Calendar,
  Check,
  X as XIcon,
  Shield,
  Info,
  Phone,
  User,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";import { Button } from "@kridaz/ui";


const VenueDetailsModal = ({ isOpen, onClose, turf, onApprove, onReject }) => {
  if (!isOpen || !turf) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-10">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full h-full max-w-6xl bg-background border-x md:border border-border md:rounded-[8px] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header / Hero Section */}
            <div className="relative h-[40vh] min-h-[300px] shrink-0">
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

              <Button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md border border-white/10 text-white rounded-[8px] hover:bg-white/10 transition-all z-20"
              >
                <X size={24} />
              </Button>

              <div className="absolute bottom-0 left-0 w-full p-8 lg:p-12 space-y-4">
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
                <h2 className="text-4xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                  {turf.name}
                </h2>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-12">
                  {/* Description */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.2em]">
                      <Info size={14} />
                      <span>The Proposition</span>
                    </div>
                    <p className="text-gray-400 text-lg leading-relaxed">
                      {turf.description ||
                        "No description provided for this venue."}
                    </p>
                  </section>

                  {/* Visuals Grid */}
                  {turf.images && turf.images.length > 0 && (
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.2em]">
                        <Globe size={14} />
                        <span>Venue Gallery</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {turf.images.map((img, i) => (
                          <div
                            key={i}
                            className="aspect-video rounded-[8px] overflow-hidden border border-border"
                          >
                            <img
                              src={img}
                              className="w-full h-full object-cover"
                              alt={`Gallery ${i}`}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Facilities */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-[0.2em]">
                      <Shield size={14} />
                      <span>Amenities & Hardware</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {turf.facilities?.map((facility, i) => (
                        <div
                          key={i}
                          className="p-4 bg-white/5 border border-white/5 rounded-[8px] flex flex-col items-center gap-3 text-center group hover:border-primary/30 transition-all"
                        >
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {facility}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column: Metadata & Operations */}
                <div className="space-y-8">
                  {/* Pricing Card */}
                  <div className="p-8 bg-primary rounded-[8px] space-y-1 shadow-2xl shadow-[var(--primary)]/10">
                    <p className="text-black/60 text-[10px] font-black uppercase tracking-widest">
                      Base Hourly Rate
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-black">
                        Rs {turf.pricePerHour}
                      </span>
                      <span className="text-black/60 font-bold text-sm">
                        /HR
                      </span>
                    </div>
                  </div>

                  {/* Meta Details */}
                  <div className="space-y-6 p-8 bg-white/[0.02] border border-white/5 rounded-[8px]">
                    <MetaItem
                      icon={MapPin}
                      label="LOCATION"
                      val={turf.location}
                    />
                    <MetaItem
                      icon={Clock}
                      label="OPERATING HOURS"
                      val={`${turf.openTime} - ${turf.closeTime}`}
                    />
                    <MetaItem
                      icon={Calendar}
                      label="LISTING DATE"
                      val={
                        turf.createdAt
                          ? format(new Date(turf.createdAt), "PPP")
                          : "N/A"
                      }
                    />
                    <MetaItem
                      icon={User}
                      label="OWNER IDENTIFIER"
                      val={
                        turf.owner?.name || turf.owner || "Anonymous Partner"
                      }
                    />
                  </div>

                  {/* Contact Info */}
                  {turf.managerContacts && turf.managerContacts.length > 0 && (
                    <div className="space-y-6 p-8 bg-white/[0.02] border border-white/5 rounded-[8px]">
                      <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                        On-Site Managers
                      </div>
                      {turf.managerContacts.map((contact, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm">
                              {contact.name}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {contact.phone}
                            </span>
                          </div>
                          <a
                            href={`tel:${contact.phone}`}
                            className="p-2 bg-primary/10 text-primary rounded-full"
                          >
                            <Phone size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            {turf.status === "pending" && (
              <div className="p-8 lg:p-12 bg-black border-t border-border shrink-0 relative z-10">
                <div className="flex gap-6">
                  <Button
                    onClick={() => onReject(turf._id)}
                    className="flex-1 py-5 border border-red-500/50 text-red-500 font-black uppercase tracking-widest text-xs rounded-[8px] hover:bg-red-500/10 transition-all flex items-center justify-center gap-3"
                  >
                    <XIcon size={16} />
                    Decline Venue
                  </Button>
                  <Button
                    onClick={() => onApprove(turf._id)}
                    className="flex-1 py-5 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-[8px] hover:bg-primary/80 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[var(--primary)]/20"
                  >
                    <Check size={16} />
                    Verify & Approve
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const MetaItem = ({ icon: Icon, label, val }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-gray-500">
      <Icon size={12} className="text-primary" />
      <span className="text-[10px] font-black uppercase tracking-widest">
        {label}
      </span>
    </div>
    <p className="text-white font-bold text-sm leading-tight">{val}</p>
  </div>
);

export default VenueDetailsModal;
