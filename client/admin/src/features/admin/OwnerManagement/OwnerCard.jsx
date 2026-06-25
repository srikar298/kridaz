import React from "react";
import {
  Mail,
  Phone,
  Trash2,
  Ban,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@kridaz/ui";


const OwnerCard = ({
  owner,
  isSelected,
  onSelect,
  onDelete,
  onToggleStatus,
}) => {
  const navigate = useNavigate();
  const ownerId = owner._id?.slice(-8).toUpperCase() || "N/A";
  const isBlocked = owner.status === "blocked";

  const handleRowClick = (e) => {
    if (
      e.target.closest("button") ||
      e.target.closest('input[type="checkbox"]')
    )
      return;
    navigate(`/admin/owners/${owner._id}/turf`);
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group relative bg-background border transition-all duration-500 rounded-[12px] p-4 lg:px-8 lg:py-5 shadow-xl overflow-hidden cursor-pointer ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
    >
      {/* Interaction Highlight */}
      <div
        className={`absolute inset-y-0 left-0 w-1 bg-primary transition-transform duration-500 shadow-[0_0_15px_var(--primary)] ${isSelected ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Checkbox */}
        <div className="lg:col-span-1 flex items-center justify-center">
          <Input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(owner._id);
            }}
            className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-primary/50"
          />
        </div>

        {/* Partner Profile */}
        <div className="lg:col-span-3 flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-primary/5 blur-lg rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-11 h-11 rounded-[10px] bg-primary/10 flex items-center justify-center text-[18px] font-black text-primary uppercase border border-primary/20">
              {owner.name?.[0] || "U"}
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors truncate">
              {owner.name}
            </h3>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5">
              PARTNER ID: <span className="text-white/40">{ownerId}</span>
            </p>
          </div>
        </div>

        {/* Operational Email */}
        <div className="lg:col-span-3 flex items-center gap-3">
          <Mail size={14} className="text-white/20" />
          <span className="text-[12px] font-bold text-white/60 truncate">
            {owner.email}
          </span>
        </div>

        {/* Contact Number */}
        <div className="lg:col-span-2 flex items-center gap-3">
          <Phone size={14} className="text-white/20" />
          <span className="text-[12px] font-bold text-white/60 uppercase tracking-tight">
            {owner.phone || "UNPUBLISHED"}
          </span>
        </div>

        {/* Status */}
        <div className="lg:col-span-1 flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1 border rounded-[6px] ${isBlocked ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-green-500/5 border-green-500/20 text-green-400"}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${isBlocked ? "bg-red-400" : "bg-green-400 shadow-[0_0_8px_#4ade80]"}`}
            />
            <span className="text-[9px] font-black uppercase tracking-widest">
              {isBlocked ? "Blocked" : "Active"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="lg:col-span-2 flex justify-end gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus([owner._id], isBlocked ? "active" : "blocked");
            }}
            title={isBlocked ? "Activate Record" : "Block Record"}
            className={`p-2 rounded-[8px] border transition-all ${isBlocked ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20" : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"}`}
          >
            {isBlocked ? <CheckCircle size={16} /> : <Ban size={16} />}
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(owner);
            }}
            className="p-2 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <Trash2 size={16} />
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/owners/${owner._id}/turf`);
            }}
            className="p-2 rounded-[8px] bg-white/5 border border-white/10 text-white/40 hover:bg-primary hover:text-black transition-all"
          >
            <ExternalLink size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OwnerCard;
