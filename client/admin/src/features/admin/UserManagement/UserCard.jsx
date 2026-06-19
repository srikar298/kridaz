import React from "react";
import {
  Mail,
  Calendar,
  Trash2,
  Ban,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import Avatar from "react-avatar";
import { useNavigate } from "react-router-dom";

const UserCard = ({ user, onToggleStatus, onDelete, isSelected, onSelect }) => {
  const navigate = useNavigate();
  const joinDate = user.createdAt
    ? format(new Date(user.createdAt), "dd MMM yyyy")
    : "N/A";
  const userId = user._id?.slice(-8).toUpperCase() || "N/A";
  const isBlocked = user.status === "blocked";

  const handleRowClick = (e) => {
    // Don't navigate if clicking an action button or checkbox
    if (
      e.target.closest("button") ||
      e.target.closest('input[type="checkbox"]')
    )
      return;
    navigate(`/profile/${user._id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(user); // Pass full user object to parent for modal
  };

  const handleToggleStatus = async (e) => {
    e.stopPropagation();
    await onToggleStatus(user._id, user.status || "active");
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onSelect(user._id);
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group relative bg-[#000000] border transition-all duration-500 rounded-[12px] p-4 lg:px-8 lg:py-5 shadow-xl overflow-hidden cursor-pointer ${isSelected ? "border-[#CCFF00] bg-[#CCFF00]/5" : "border-[#2D2D2D] hover:border-[#CCFF00]/40"}`}
    >
      {/* Interaction Highlight */}
      <div
        className={`absolute inset-y-0 left-0 w-1 bg-[#CCFF00] transition-transform duration-500 shadow-[0_0_15px_#CCFF00] ${isSelected ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Multiselect Checkbox */}
        <div className="lg:col-span-1 flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="w-5 h-5 rounded border-[#2D2D2D] bg-[#0d0d0d] text-[#CCFF00] focus:ring-[#CCFF00]/50 cursor-pointer"
          />
        </div>

        {/* User Profile Info */}
        <div className="lg:col-span-3 flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-[#CCFF00]/5 blur-lg rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative border border-white/10 rounded-[8px] p-0.5 group-hover:border-[#CCFF00]/30 transition-colors bg-[#0d0d0d]">
              <Avatar
                name={user.name}
                size={42}
                round={true}
                color="#000"
                fgColor="#CCFF00"
                className="font-black text-xs"
              />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-black text-white uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors truncate font-open-sans">
              {user.name}
            </h3>
            <p className="text-[9px] font-black text-[#878C9F] uppercase tracking-[0.2em] mt-0.5">
              ID: <span className="text-white/40">{userId}</span>
            </p>
          </div>
        </div>

        {/* User Role */}
        <div className="lg:col-span-1">
          <div className="inline-flex items-center px-2 py-1 bg-white/5 border border-white/10 rounded-[6px]">
            <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter">
              {user.role || "user"}
            </span>
          </div>
        </div>

        {/* Contact Email */}
        <div className="lg:col-span-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#CCFF00] transition-colors border border-white/5 group-hover:border-[#CCFF00]/20">
            <Mail size={14} />
          </div>
          <span className="text-[11px] font-bold text-white/60 truncate group-hover:text-white transition-colors">
            {user.email}
          </span>
        </div>

        {/* Registration Date */}
        <div className="lg:col-span-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#CCFF00] transition-colors border border-white/5 group-hover:border-[#CCFF00]/20">
            <Calendar size={14} />
          </div>
          <span className="text-[11px] font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-tight">
            {joinDate}
          </span>
        </div>

        {/* Account Status */}
        <div className="lg:col-span-1 flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1 border rounded-[6px] transition-colors ${isBlocked ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-green-500/5 border-green-500/20 text-green-400"}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${isBlocked ? "bg-red-400 shadow-[0_0_8px_#f87171]" : "bg-green-400 shadow-[0_0_8px_#4ade80]"}`}
            />
            <span className="text-[9px] font-black uppercase tracking-widest">
              {isBlocked ? "Blocked" : "Active"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="lg:col-span-2 flex justify-end items-center gap-2">
          <button
            onClick={handleToggleStatus}
            title={isBlocked ? "Unblock User" : "Block User"}
            className={`p-2 rounded-[8px] border transition-all ${isBlocked ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20" : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"}`}
          >
            {isBlocked ? <CheckCircle size={16} /> : <Ban size={16} />}
          </button>

          <button
            onClick={handleDelete}
            title="Permanently Delete User"
            className="p-2 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={() => navigate(`/profile/${user._id}`)}
            title="View Full Profile"
            className="p-2 rounded-[8px] bg-white/5 border border-white/10 text-white/40 hover:bg-[#CCFF00] hover:text-black hover:border-[#CCFF00] transition-all"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
