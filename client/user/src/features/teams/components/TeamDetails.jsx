import React from "react";
import {
  Users,
  UserPlus,
  Trophy,
  Calendar,
  Phone,
  Shield,
  ChevronRight,
  Check,
  X,
  Search,
  Copy,
} from "lucide-react";
import {
  useHandleOpponentRequestMutation,
  useHandleJoinRequestMutation,
} from "@redux/api/teamApi";
import toast from "react-hot-toast";
import { Button } from "@kridaz/ui";


const TeamDetails = ({ team, onInviteClick, onCreateClick, onBack }) => {
  const [handleRequest, { isLoading: isHandling }] =
    useHandleOpponentRequestMutation();
  const [handleJoinRequest, { isLoading: isHandlingJoin }] =
    useHandleJoinRequestMutation();

  if (!team) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-[rgba(255,255,255,0.40)] p-12">
        <div className="w-24 h-24 rounded-[16px] bg-card border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Users className="text-[rgba(255,255,255,0.20)] text-4xl group-hover:text-primary/50 transition-colors duration-500 relative z-10" />
        </div>
        <h2
          className="text-3xl font-bold text-white mb-3 tracking-tight"
          style={{ fontFamily: "'Open Sans', sans-serif" }}
        >
          Select a Team
        </h2>
        <p
          className="text-[rgba(255,255,255,0.40)] max-w-sm text-center text-sm font-medium leading-relaxed mb-10"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Choose a team from the sidebar to manage members, view stats, and
          organize your squad for upcoming matches.
        </p>

        <Button
          onClick={onCreateClick}
          className="group relative px-8 py-4 bg-primary text-background font-[800] rounded-[16px] flex items-center gap-3 shadow-md shadow-primary/20 hover:brightness-[1.04] transition-all hover:-translate-y-0.5 active:translate-y-0 overflow-hidden duration-300"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[30deg]" />
          <UserPlus className="text-lg" />
          <span
            className="uppercase tracking-widest text-xs"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Create New Team
          </span>
        </Button>
      </div>
    );
  }

  const members =
    team.members?.filter(
      (m) => m.status === "JOINED" || m.status === undefined
    ) || [];
  const pendingMembers =
    team.members?.filter((m) => m.status === "PENDING") || [];
  const customMembers =
    team.customMembers?.filter((m) => m.status === "PENDING") || [];
  const opponents = team.opponents || [];
  const pendingRequests =
    team.opponentRequests?.filter((r) => r.status === "PENDING") || [];

  const onHandleJoin = async (userId, action) => {
    try {
      await handleJoinRequest({ teamId: team._id, userId, action }).unwrap();
      toast.success(`Join request ${action.toLowerCase()}ed`);
    } catch (err) {
      toast.error(err.data?.message || "Failed to handle join request");
    }
  };

  const onHandleOpponent = async (requestId, action) => {
    try {
      await handleRequest({ teamId: team._id, requestId, action }).unwrap();
      toast.success(`Opponent request ${action.toLowerCase()}ed`);
    } catch (err) {
      toast.error(err.data?.message || "Failed to handle request");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(team.teamCode);
    toast.success("Team ID copied to clipboard!");
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto relative pb-20 custom-scrollbar">
      {/* Mobile Back Button */}
      <Button
        onClick={onBack}
        className="md:hidden absolute top-4 left-4 z-20 p-2.5 bg-black/40 backdrop-blur-md rounded-[16px] text-white border border-[rgba(255,255,255,0.08)] shadow-lg"
      >
        <ChevronRight className="rotate-180" />
      </Button>

      {/* Team Header Banner */}
      <div className="relative shrink-0 overflow-hidden pt-16 md:pt-20 px-4 md:px-6 pb-6 min-h-[14rem] md:min-h-[16rem]">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-background" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />

        <div
          className="absolute top-4 md:top-6 right-4 md:right-6 z-10 flex items-center gap-2 px-3 md:px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] group cursor-pointer hover:border-primary/50 transition-all"
          onClick={copyToClipboard}
        >
          <div className="flex flex-col items-end">
            <span
              className="text-[8px] font-black text-white/40 uppercase tracking-widest"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Unique Team ID
            </span>
            <span className="text-sm font-black text-primary tracking-[0.2em]">
              {team.teamCode}
            </span>
          </div>
          <Copy
            size={16}
            className="text-white/20 group-hover:text-primary transition-colors"
          />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 mt-14 md:mt-12">
          <div className="w-20 h-20 md:w-32 md:h-32 rounded-[16px] bg-black border-4 border-background shadow-2xl flex items-center justify-center text-primary text-3xl md:text-4xl font-bold overflow-hidden shrink-0">
            {team.image ? (
              <img
                src={team.image}
                alt={team.name}
                className="w-full h-full object-cover"
              />
            ) : (
              team.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center flex-wrap gap-3 mb-1">
              <h1
                className="text-2xl md:text-4xl font-bold text-white tracking-tight break-all"
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                {team.name}
              </h1>
              <span
                className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-primary/10 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest shrink-0"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {team.sportType}
              </span>
            </div>
            <p
              className="text-white/60 text-sm md:text-base max-w-2xl line-clamp-2"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {team.description || "No description provided."}
            </p>
          </div>
          <div className="w-full md:w-auto mt-2 md:mt-0 pb-1">
            <Button
              onClick={onInviteClick}
              className="w-full md:w-auto px-6 py-3 bg-primary hover:brightness-[1.04] text-background font-[800] rounded-[16px] flex items-center justify-center gap-2 shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 duration-300 uppercase tracking-widest text-xs"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <UserPlus size={16} /> Add Members
            </Button>
          </div>
        </div>
      </div>

      {/* Team Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 shrink-0">
        <div className="bg-card p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] shrink-0 bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Shield size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[rgba(255,255,255,0.40)] text-[9px] uppercase font-[800] tracking-wider truncate">
              Captain
            </p>
            <p className="text-white font-black truncate text-sm uppercase">
              {team.captainName || "Not set"}
            </p>
          </div>
        </div>
        <div className="bg-card p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-[rgba(255,255,255,0.40)] text-[9px] uppercase font-[800] tracking-wider">
              Members
            </p>
            <p className="text-white font-black text-sm">
              {members.length + customMembers.length}
            </p>
          </div>
        </div>
        <div className="bg-card p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-red-500/10 flex items-center justify-center text-red-500">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[rgba(255,255,255,0.40)] text-[9px] uppercase font-[800] tracking-wider">
              Opponents
            </p>
            <p className="text-white font-black text-sm">{opponents.length}</p>
          </div>
        </div>
        <div className="bg-card p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-[12px] shrink-0 bg-green-500/10 flex items-center justify-center text-green-500">
            <Calendar size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[rgba(255,255,255,0.40)] text-[9px] uppercase font-[800] tracking-wider truncate">
              Created
            </p>
            <p className="text-white font-black truncate text-sm">
              {new Date(team.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 md:px-6 pb-6 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members List (Left Column) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending Opponent Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-4">
                <h3
                  className="text-white font-bold text-lg tracking-tight flex items-center gap-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <span className="w-1 h-5 bg-orange-500 rounded-full" />
                  Opponent Requests ({pendingRequests.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingRequests.map((req) => (
                    <div
                      key={req._id}
                      className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-[16px] flex items-center gap-4"
                    >
                      <div className="flex-1 overflow-hidden">
                        <p className="text-white font-bold text-sm truncate uppercase italic">
                          {req.fromTeam?.name}
                        </p>
                        <p className="text-orange-500/60 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                          Wants to be opponents
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          disabled={isHandling}
                          onClick={() => onHandleOpponent(req._id, "ACCEPT")}
                          className="w-8 h-8 bg-orange-500 text-black rounded-[12px] flex items-center justify-center hover:bg-orange-400 transition-colors"
                        >
                          <Check size={12} />
                        </Button>
                        <Button
                          disabled={isHandling}
                          onClick={() => onHandleOpponent(req._id, "REJECT")}
                          className="w-8 h-8 bg-card text-[rgba(255,255,255,0.40)] rounded-[12px] flex items-center justify-center hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Member Requests */}
            {pendingMembers.length > 0 && (
              <div className="space-y-4">
                <h3
                  className="text-white font-bold text-lg tracking-tight flex items-center gap-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  <span className="w-1 h-5 bg-primary rounded-full" />
                  Join Requests ({pendingMembers.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingMembers.map((req) => (
                    <div
                      key={req._id}
                      className="bg-primary/5 border border-primary/20 p-4 rounded-[16px] flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-[12px] bg-card overflow-hidden border border-[rgba(255,255,255,0.08)] shrink-0">
                        <img
                          src={
                            req.profilePic ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.username}`
                          }
                          alt={req.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate uppercase tracking-tight">
                          {req.username}
                        </p>
                        <p className="text-primary/60 text-[9px] font-bold uppercase tracking-widest mt-0.5">
                          Wants to join
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          disabled={isHandlingJoin}
                          onClick={() =>
                            onHandleJoin(req.user?._id || req.userId, "ACCEPT")
                          }
                          className="w-8 h-8 bg-primary text-background rounded-[12px] flex items-center justify-center hover:brightness-110 transition-colors"
                        >
                          <Check size={12} />
                        </Button>
                        <Button
                          disabled={isHandlingJoin}
                          onClick={() =>
                            onHandleJoin(req.user?._id || req.userId, "REJECT")
                          }
                          className="w-8 h-8 bg-card text-[rgba(255,255,255,0.40)] rounded-[12px] flex items-center justify-center hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Members */}
            <div>
              <h3
                className="text-white font-bold text-lg tracking-tight mb-4 flex items-center gap-2"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <span className="w-1 h-5 bg-gradient-to-b from-primary to-primary rounded-full" />
                Platform Members ({members.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {members.map((member) => (
                  <div
                    key={member._id}
                    className="bg-card p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] hover:border-primary/20 transition-all flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-[12px] bg-card overflow-hidden border border-[rgba(255,255,255,0.08)]">
                      <img
                        src={
                          member.profilePic ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`
                        }
                        alt={member.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="text-white font-black text-sm truncate uppercase tracking-tight"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        @{member.username}
                      </h4>
                      <p
                        className="text-primary text-[9px] font-black uppercase tracking-widest mt-0.5"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Invites */}
            <div>
              <h3
                className="text-white font-bold text-lg tracking-tight mb-4 flex items-center gap-2"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <span className="w-1 h-5 bg-yellow-500 rounded-full" />
                Pending Invites ({customMembers.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customMembers.map((member, index) => (
                  <div
                    key={index}
                    className="bg-card p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] border-l-2 border-l-yellow-500/50 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-[12px] bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <span className="text-lg font-black uppercase">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="text-white font-black text-sm truncate uppercase"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {member.name}
                      </h4>
                      <div className="flex items-center gap-3 text-[9px] text-white/40 font-bold mt-1">
                        {member.phone && (
                          <span className="flex items-center gap-1 uppercase">
                            <Phone size={10} /> {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Opponents List (Right Column) */}
          <div className="space-y-6">
            <h3
              className="text-white font-bold text-lg tracking-tight flex items-center gap-2"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span className="w-1 h-5 bg-red-500 rounded-full" />
              Opponents ({opponents.length})
            </h3>
            <div className="space-y-3">
              {opponents.map((opp) => (
                <div
                  key={opp._id}
                  className="bg-white/[0.02] p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] flex items-center gap-4 hover:bg-white/[0.04] transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-[12px] bg-background border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-red-500 overflow-hidden shrink-0">
                    {opp.image ? (
                      <img
                        src={opp.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users size={16} />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-white font-black text-sm truncate uppercase italic tracking-tight">
                      {opp.name}
                    </p>
                    <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest">
                      {opp.city}
                    </p>
                  </div>
                  <ChevronRight
                    size={12}
                    className="text-white/10 group-hover:text-red-500 transition-colors"
                  />
                </div>
              ))}
              {opponents.length === 0 && (
                <div className="py-12 border border-dashed border-[rgba(255,255,255,0.08)] rounded-[16px] flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 bg-card rounded-[16px] flex items-center justify-center mb-3">
                    <Search className="text-[rgba(255,255,255,0.20)]" />
                  </div>
                  <p className="text-[rgba(255,255,255,0.40)] text-[10px] font-black uppercase tracking-widest">
                    No Opponents Linked
                  </p>
                  <p className="text-[rgba(255,255,255,0.30)] text-[9px] mt-1">
                    Use the "Add Opponent" search to find rivals
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetails;
