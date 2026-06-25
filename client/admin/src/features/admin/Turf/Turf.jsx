import React from "react";
import { MapPin, Clock, Star, Calendar, Check, X } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "@kridaz/ui";


const Turf = ({
  turf,
  onApprove,
  onReject,
  onDecommission,
  onDelete,
  onViewDetails,
}) => {
  const navigate = useNavigate();

  const getStatusConfig = (status) => {
    switch (status) {
      case "approved":
        return {
          color: "green",
          icon: "bg-green-500",
          border: "border-green-500/20",
          bg: "bg-green-500/10",
        };
      case "rejected":
        return {
          color: "red",
          icon: "bg-red-500",
          border: "border-red-500/20",
          bg: "bg-red-500/10",
        };
      case "decommissioned":
        return {
          color: "orange",
          icon: "bg-orange-500",
          border: "border-orange-500/20",
          bg: "bg-orange-500/10",
        };
      case "deleted":
        return {
          color: "gray",
          icon: "bg-gray-500",
          border: "border-gray-500/20",
          bg: "bg-gray-500/10",
        };
      default:
        return {
          color: "yellow",
          icon: "bg-yellow-500",
          border: "border-yellow-500/20",
          bg: "bg-yellow-500/10",
        };
    }
  };

  const config = getStatusConfig(turf.status);

  return (
    <div
      onClick={() => navigate(`/admin/turfs/${turf._id}`)}
      className="bms-card group flex flex-col relative cursor-pointer hover:border-primary/40 transition-all duration-500 overflow-hidden"
    >
      {/* ── Image ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: "220px" }}>
        <img
          src={turf.image}
          alt={turf.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            const target = /** @type {any} */ (e.target);
            target.onerror = null;
            target.src = "/banner-2.png";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

        {/* Price badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-primary text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
            Rs {turf.pricePerHour}/hr
          </span>
        </div>

        {/* Status badge */}
        <div
          className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-[9px] font-black uppercase tracking-widest border ${config.bg} text-${config.color}-500 ${config.border}`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${config.icon}`} />
          <span>{turf.status}</span>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-6 gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
            Arena
          </span>
          <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-[6px] border border-white/5">
            <Star size={10} className="text-primary fill-primary" />
            <span className="text-white text-[10px] font-bold tracking-tighter">
              {turf.avgRating || "NEW"}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="font-display text-xl uppercase tracking-tighter text-white group-hover:text-primary transition-colors leading-none line-clamp-2">
            {turf.name}
          </h3>
          <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
            <MapPin size={10} className="text-primary" />
            <span className="truncate">{turf.location}</span>
          </div>
        </div>

        {turf.createdAt && (
          <div className="flex items-center gap-2 text-gray-600 text-[9px] font-black uppercase tracking-widest">
            <Calendar size={10} />
            <span>
              Operational since{" "}
              {format(new Date(turf.createdAt), "dd MMM yyyy")}
            </span>
          </div>
        )}

        {/* Admin Actions */}
        <div className="grid grid-cols-2 gap-3 mt-2 pt-5 border-t border-white/5">
          {turf.status === "pending" ? (
            <>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(turf._id);
                }}
                className="flex items-center justify-center gap-2 py-3 bg-green-500/5 hover:bg-green-500/10 text-green-500 border border-green-500/10 rounded-[8px] text-[9px] font-black uppercase tracking-[0.1em] transition-all"
              >
                <Check size={12} />
                Approve
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(turf._id);
                }}
                className="flex items-center justify-center gap-2 py-3 bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/10 rounded-[8px] text-[9px] font-black uppercase tracking-[0.1em] transition-all"
              >
                <X size={12} />
                Reject
              </Button>
            </>
          ) : turf.status !== "deleted" ? (
            <>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDecommission(turf._id);
                }}
                className="flex items-center justify-center gap-2 py-3 bg-orange-500/5 hover:bg-orange-500/10 text-orange-500 border border-orange-500/10 rounded-[8px] text-[9px] font-black uppercase tracking-[0.1em] transition-all"
              >
                <Clock size={12} />
                Decommission
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(turf._id);
                }}
                className="flex items-center justify-center gap-2 py-3 bg-gray-500/5 hover:bg-gray-500/10 text-gray-400 border border-white/10 rounded-[8px] text-[9px] font-black uppercase tracking-[0.1em] transition-all"
              >
                <X size={12} />
                Soft Delete
              </Button>
            </>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(turf._id, true); // True for hard delete
              }}
              className="col-span-2 flex items-center justify-center gap-2 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-[8px] text-[9px] font-black uppercase tracking-[0.1em] transition-all"
            >
              <X size={12} />
              Permanently Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Turf;
