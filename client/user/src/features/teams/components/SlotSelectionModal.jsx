import React, { useState } from "react";
import {
  X,
  UserPlus,
  Users,
  Sparkles,
  User,
  Mail,
  ChevronRight,
} from "lucide-react";
import { useGetMyTeamsQuery } from "@redux/api/teamApi";import { Button, Input } from "@kridaz/ui";


const SlotSelectionModal = ({ isOpen, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState("squad"); // 'squad' or 'guest'
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const { data: teamsData, isLoading } = useGetMyTeamsQuery();
  const myTeams = teamsData?.teams || [];

  if (!isOpen) return null;

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    onSelect({
      isCustom: true,
      name: guestName.trim(),
      email: guestEmail.trim() || undefined,
    });

    // Clear inputs
    setGuestName("");
    setGuestEmail("");
  };

  const handleSquadMemberSelect = (member) => {
    if (member.user) {
      onSelect({
        isCustom: false,
        _id: member.user._id,
        name: member.user.name,
        email: member.user.email,
      });
    } else {
      onSelect({
        isCustom: true,
        name: member.name,
        email: member.email,
      });
    }
  };

  // Collect unique members from all my teams
  const allUniqueMembers = [];
  const addedUserIds = new Set();

  myTeams.forEach((team) => {
    team.members?.forEach((member) => {
      const uniqueKey = member.user?._id || member.email || member.name;
      if (!addedUserIds.has(uniqueKey)) {
        addedUserIds.add(uniqueKey);
        allUniqueMembers.push(member);
      }
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[8px] border border-white/10 bg-slate-900 shadow-2xl">
        {/* Glow decoration */}
        <div className="absolute -top-[30%] -right-[30%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="relative flex justify-between items-center px-6 py-5 border-b border-white/5 bg-slate-900/40">
          <div>
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-violet-400" />
              Assign Roster Slot
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a club member or add a guest player
            </p>
          </div>
          <Button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 transition-all"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tab Controls */}
        <div className="relative flex border-b border-white/5 bg-slate-950/30 p-1.5 m-4 rounded-[8px]">
          <Button
            type="button"
            onClick={() => setActiveTab("squad")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "squad" ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Users className="h-4 w-4" />
            Club Squad Members
          </Button>
          <Button
            type="button"
            onClick={() => setActiveTab("guest")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "guest" ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
          >
            <UserPlus className="h-4 w-4" />
            Guest Player
          </Button>
        </div>

        {/* Content */}
        <div className="relative p-6 max-h-[350px] overflow-y-auto custom-scrollbar">
          {activeTab === "squad" && (
            <div className="space-y-2">
              {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
                  Loading your club rosters...
                </div>
              ) : allUniqueMembers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No squad members found. Switch to Guest Player to add slot
                  details manually!
                </div>
              ) : (
                allUniqueMembers.map((member, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    onClick={() => handleSquadMemberSelect(member)}
                    className="w-full p-3.5 rounded-[8px] border border-white/5 bg-slate-950/40 hover:bg-violet-600/10 hover:border-violet-500/30 text-left flex justify-between items-center transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold group-hover:scale-105 transition-transform">
                        {member.user?.name
                          ? member.user.name.charAt(0).toUpperCase()
                          : member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-200 block text-xs group-hover:text-violet-400 transition-colors">
                          {member.user?.name || member.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {member.role || "Member"} •{" "}
                          {member.user?.email || member.email || "No email"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ))
              )}
            </div>
          )}

          {activeTab === "guest" && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">
                  Player Full Name
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    size={16}
                  />
                  <Input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Michael Jordan"
                    className="w-full bg-slate-950 border border-white/10 rounded-[8px] py-3 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50 transition-all font-inter"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    size={16}
                  />
                  <Input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="e.g. jordan@gmail.com"
                    className="w-full bg-slate-950 border border-white/10 rounded-[8px] py-3 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50 transition-all font-inter"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={!guestName.trim()}
                className="w-full mt-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-[8px] text-xs font-bold transition-all shadow-[0_4px_12px_rgba(109,40,217,0.2)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                Assign Guest Player to Slot
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SlotSelectionModal;
