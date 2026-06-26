import React from "react";
import { Button } from "@kridaz/ui";
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Briefcase,
  UserCheck,
  MessageCircle,
  Phone,
} from "lucide-react";
import { toast } from "react-hot-toast";

const LookingForDetailModal = ({ post, onClose, currentUserId }) => {
  if (!post) return null;

  const handleContact = () => {
    const pref = post.matchPreferences?.contactPreference || "KRIDAZ_DM";
    
    if (pref === "WHATSAPP" || pref === "CALL") {
      const phone = post.host?.phone || post.creator?.phone || "No number provided";
      if (phone === "No number provided") {
        toast.error("User hasn't provided a phone number.");
        return;
      }
      
      if (pref === "WHATSAPP") {
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, "_blank");
      } else {
        window.location.href = `tel:${phone}`;
      }
    } else {
      // Default to Kridaz DM
      const url = `/messages?userId=${post.hostId}`;
      window.location.href = url;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-t-[24px] sm:rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-secondary via-primary to-primary" />

        {/* Drag handle for mobile */}
        <div className="w-full flex justify-center pt-3 sm:hidden">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex justify-between items-start px-6 py-5 border-b border-white/5">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              {post.sport || "Looking For"}
            </span>
            <h3 className="text-xl font-bold text-white mt-2 leading-tight">
              {post.name || "Looking for Players"}
            </h3>
            <p className="text-sm text-white/50 mt-1">
              Posted by {post.host?.name || "Player"}
            </p>
          </div>
          <Button
            onClick={onClose}
            className="p-2 rounded-[8px] bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all shrink-0"
           aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-[8px] bg-slate-850/50 border border-white/5 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-primary/10 text-primary">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">
                  Date
                </span>
                <span className="font-semibold text-slate-200">
                  {post.date
                    ? new Date(post.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBD"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-primary/10 text-primary">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">
                  Time
                </span>
                <span className="font-semibold text-slate-200">
                  {post.time || "TBD"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-primary/10 text-primary">
                <MapPin className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">
                  Location
                </span>
                <span className="font-semibold text-slate-200 truncate block max-w-[100px]">
                  {post.city || "Any City"}
                </span>
              </div>
            </div>

            {post.perPlayerCharge && post.perPlayerCharge !== "Free" && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[8px] bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">
                    Budget
                  </span>
                  <span className="font-bold text-emerald-400">
                    {post.perPlayerCharge}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Description & Roles */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
              Roles Needed
            </h4>
            <div className="flex flex-wrap gap-2">
              {post.descriptionTags?.split(",").map((role, idx) => (
                <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/80">
                  {role.trim()}
                </span>
              )) || (
                <span className="text-xs text-white/50 italic">Any Role</span>
              )}
            </div>

            {post.description && (
              <>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 mt-6">
                  Description
                </h4>
                <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
                  {post.description}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 bg-slate-900 shrink-0">
          <Button
            onClick={handleContact}
            className="w-full py-4 flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-primary text-black rounded-[12px] text-sm font-bold shadow-[0_0_20px_rgba(191,243,103,0.15)] hover:shadow-[0_0_30px_rgba(191,243,103,0.25)] transition-all"
          >
            {post.matchPreferences?.contactPreference === "WHATSAPP" ? (
              <>
                <MessageCircle size={18} /> WhatsApp Contact
              </>
            ) : post.matchPreferences?.contactPreference === "CALL" ? (
              <>
                <Phone size={18} /> Reveal Phone Number
              </>
            ) : (
              <>
                <MessageCircle size={18} /> Chat via Kridaz
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LookingForDetailModal;
