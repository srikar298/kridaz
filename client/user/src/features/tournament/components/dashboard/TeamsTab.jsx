import React, { useState } from "react";
import { Button, Input } from "@kridaz/ui";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from "lucide-react";

const TeamsTab = ({ tournament }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const registeredTeams = tournament.teams || [];

  const copyInviteLink = (teamId) => {
    const inviteLink = `${window.location.origin}/t/${tournament.id}?joinTeam=${teamId}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedId(teamId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTeams = registeredTeams.filter((t) => {
    const teamName = t.team?.name || "";
    return teamName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams..."
            className="w-full bg-card border border-white/5 rounded-full pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Teams List */}
      <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-card text-xs font-bold text-white/50 uppercase tracking-widest hidden md:grid">
          <div className="col-span-5">Team Name</div>
          <div className="col-span-3 text-center">Players</div>
          <div className="col-span-4 pl-4 text-right pr-4">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5">
          {filteredTeams.map((t) => {
            const team = t.team;
            if (!team) return null;
            const isPaid = t.paymentStatus === "FULL";
            const playerCount = team.members?.length || 0;

            return (
              <div
                key={t.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10">
                    <span className="font-black text-white/70">
                      {team.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">{team.name}</p>
                    <p className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                      {isPaid ? (
                        <span className="text-primary flex items-center gap-1">
                          <CheckCircle2 size={10} /> Paid Entry Fee
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <XCircle size={10} /> Partial: ₹{Number(t.amountPaid || 0).toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="col-span-3 text-center hidden md:block">
                  <span className="text-xs font-bold text-white/70 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    {playerCount} Players
                  </span>
                </div>

                <div className="col-span-4 flex items-center justify-end gap-3 pr-2">
                  <Button
                    onClick={() => copyInviteLink(t.teamId)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-black rounded-full text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    {copiedId === t.teamId ? (
                      <>
                        <Check size={12} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} /> Invite Roster
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          {filteredTeams.length === 0 && (
            <div className="text-center p-8 text-white/40">
              No registered teams found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamsTab;
