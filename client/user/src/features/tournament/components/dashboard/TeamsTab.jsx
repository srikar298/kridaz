import React, { useState } from "react";
import {
  Users,
  Search,
  ShieldAlert,
  MessageCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const TeamsTab = ({ tournament }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock teams data
  const teams = [
    {
      id: 1,
      name: "Deccan Chargers",
      captain: "Rohit S.",
      status: "Approved",
      paid: true,
      players: 15,
    },
    {
      id: 2,
      name: "Hyderabad Heroes",
      captain: "Venkat R.",
      status: "Pending",
      paid: false,
      players: 12,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-96">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            placeholder="Search teams or captains..."
            className="w-full bg-[#111] border border-white/5 rounded-full pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#BFF367] transition-colors"
          />
        </div>

        <button className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-full text-xs uppercase tracking-widest hover:bg-[#25D366]/90 transition-colors w-full sm:w-auto shadow-lg shadow-[#25D366]/20">
          <MessageCircle size={16} /> Broadcast to Captains
        </button>
      </div>

      {/* Teams List */}
      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-[#1a1a1a] text-xs font-bold text-white/50 uppercase tracking-widest hidden md:grid">
          <div className="col-span-4">Team Name</div>
          <div className="col-span-3">Captain</div>
          <div className="col-span-2 text-center">Players</div>
          <div className="col-span-3 pl-4">Status & Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5">
          {teams.map((team) => (
            <div
              key={team.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors"
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BFF367]/20 to-[#55DEE8]/20 flex items-center justify-center border border-white/10">
                  <span className="font-black text-white/70">
                    {team.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{team.name}</p>
                  <p className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                    {team.paid ? (
                      <span className="text-[#BFF367] flex items-center gap-1">
                        <CheckCircle2 size={10} /> Paid Entry Fee
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <XCircle size={10} /> Unpaid
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="col-span-3 hidden md:block">
                <p className="text-sm text-white/80">{team.captain}</p>
              </div>

              <div className="col-span-2 text-center hidden md:block">
                <button className="text-xs font-bold text-[#55DEE8] hover:underline flex items-center justify-center gap-1 mx-auto">
                  <ShieldAlert size={12} /> Verify ({team.players})
                </button>
              </div>

              <div className="col-span-3 flex items-center justify-between md:justify-start gap-3">
                {team.status === "Approved" ? (
                  <span className="px-3 py-1 bg-[#BFF367]/10 text-[#BFF367] border border-[#BFF367]/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Approved
                  </span>
                ) : (
                  <div className="flex gap-2">
                    <button className="px-4 py-1.5 bg-[#BFF367] text-black rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-white transition-colors">
                      Accept
                    </button>
                    <button className="px-4 py-1.5 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 hover:text-red-400 transition-colors">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamsTab;
