import { Button } from "@kridaz/ui";
import {
  X,
  UserPlus,
  Lock,
  CheckCircle2,
  HelpCircle,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
} from "lucide-react";

const GameDetailsModal = ({ game, onClose, onJoinSlot, currentUserId }) => {
  if (!game) return null;

  const isQuick = game.gameMode === "QUICK";

  const renderSlotStatus = (slot, teamKey, index) => {
    const isCurrentUser = slot.userId === currentUserId;

    if (slot.status === "JOINED") {
      return (
        <div className="flex items-center justify-between p-3 rounded-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <div className="flex items-center gap-2">
            {slot.user?.profilePicture ? (
              <img
                src={slot.user.profilePicture}
                alt={slot.user.name}
                className="h-6 w-6 rounded-full object-cover shrink-0"
              />
            ) : (
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
            )}
            <div>
              <span className="font-semibold text-sm block">
                {slot.user?.name || slot.customPlayer?.name || "Joined Player"}
              </span>
              <span className="text-[10px] text-emerald-400/80 uppercase tracking-wider">
                {slot.role}
              </span>
            </div>
          </div>
          {isCurrentUser && (
            <span className="text-[10px] font-bold uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded shadow">
              You
            </span>
          )}
        </div>
      );
    }

    if (slot.status === "HELD" || slot.status === "PENDING") {
      return (
        <div className="flex items-center justify-between p-3 rounded-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <div className="flex items-center gap-2">
            {slot.user?.profilePicture ? (
              <img
                src={slot.user.profilePicture}
                alt={slot.user.name}
                className="h-6 w-6 rounded-full object-cover shrink-0 opacity-50"
              />
            ) : (
              <Lock className="h-4.5 w-4.5 shrink-0 animate-pulse" />
            )}
            <div>
              <span className="font-semibold text-sm block">
                {slot.user?.name || slot.customPlayer?.name || "Reserved Spot"}
              </span>
              <span className="text-[10px] text-amber-400/80 uppercase tracking-wider">
                {slot.role}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase bg-gradient-to-r from-primary/20 to-primary/20 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary border border-primary/30 px-2 py-0.5 rounded">
            Pending
          </span>
        </div>
      );
    }

    // OPEN Spot
    return (
      <Button
        onClick={() => onJoinSlot({ team: teamKey, index, role: slot.role })}
        className="w-full flex items-center justify-between p-3 rounded-[8px] bg-slate-800/40 border border-white/5 text-slate-400 hover:text-violet-400 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all text-left group/slot"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4.5 w-4.5 shrink-0 group-hover/slot:text-violet-400" />
          <div>
            <span className="font-medium text-sm block group-hover/slot:text-violet-200">
              Open Roster Spot
            </span>
            <span className="text-[10px] text-slate-500 group-hover/slot:text-violet-400/80 uppercase tracking-wider">
              {slot.role}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover/slot:opacity-100 transition-opacity">
          <span className="text-xs font-semibold">Claim Slot</span>
          <UserPlus className="h-4 w-4" />
        </div>
      </Button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[8px] border border-white/10 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600" />

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 mt-1.5">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {game.gameMode} Matchup
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
              {game.ground?.name || "Venue TBD"}
            </h3>
          </div>
          <Button
            onClick={onClose}
            className="p-2 rounded-[8px] bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Match Details Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-[8px] bg-slate-850/50 border border-white/5 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-violet-500/10 text-violet-400">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">
                  Date
                </span>
                <span className="font-semibold text-slate-200">
                  {game.date
                    ? new Date(game.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Flexible"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-violet-500/10 text-violet-400">
                <Clock className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">
                  Time
                </span>
                <span className="font-semibold text-slate-200">
                  {game.time || "Flexible"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-violet-500/10 text-violet-400">
                <MapPin className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">
                  Location
                </span>
                <span className="font-semibold text-slate-200 truncate block max-w-[150px]">
                  {game.city || "Any City"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[8px] bg-emerald-500/10 text-emerald-400">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">
                  Coin Charge
                </span>
                <span className="font-bold text-emerald-400">
                  {game.perPlayerCharge || "Free"}
                </span>
              </div>
            </div>
          </div>

          {/* Roster Layout */}
          {isQuick ? (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-400" />
                Quick Match Player Roster
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {game.quickSlotsData?.map((slot, idx) => (
                  <div key={idx}>{renderSlotStatus(slot, "quick", idx)}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team A */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-[8px] bg-slate-800/40 border border-white/5">
                  <img
                    src={
                      game.teamA?.image ||
                      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80"
                    }
                    alt="Team A Logo"
                    className="h-10 w-10 rounded-[8px] object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-slate-200">
                      {game.teamA?.name || "TBD"}
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">
                      Professional Squad
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {game.teamA?.slots?.map((slot, idx) => (
                    <div key={idx}>{renderSlotStatus(slot, "teamA", idx)}</div>
                  ))}
                </div>
              </div>

              {/* Team B */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-[8px] bg-slate-800/40 border border-white/5">
                  <img
                    src={
                      game.teamB?.image ||
                      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80"
                    }
                    alt="Team B Logo"
                    className="h-10 w-10 rounded-[8px] object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-slate-200">
                      {game.teamB?.name || "TBD"}
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">
                      Professional Squad
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {game.teamB?.slots?.map((slot, idx) => (
                    <div key={idx}>{renderSlotStatus(slot, "teamB", idx)}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Grounds / Umpires / Streamers requested */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Professional Staff & Equipment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-[8px] bg-slate-800/40 border border-white/5 text-xs">
                <span className="text-slate-500 block">Assigned Pitch</span>
                <span className="font-semibold text-slate-200 block mt-0.5 truncate">
                  {game.ground?.name || "Venue TBD"}
                </span>
              </div>
              <div className="p-3 rounded-[8px] bg-slate-800/40 border border-white/5 text-xs">
                <span className="text-slate-500 block">
                  Match Referee / Umpire
                </span>
                <span className="font-semibold text-slate-200 block mt-0.5">
                  {game.umpireId
                    ? "Official Certified Referee"
                    : "Community Volunteer"}
                </span>
              </div>
              <div className="p-3 rounded-[8px] bg-slate-800/40 border border-white/5 text-xs">
                <span className="text-slate-500 block">
                  Broadcaster / Streamer
                </span>
                <span className="font-semibold text-slate-200 block mt-0.5">
                  {game.streamerId
                    ? "Live Broadcast Scheduled"
                    : "No Stream Requested"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetailsModal;
