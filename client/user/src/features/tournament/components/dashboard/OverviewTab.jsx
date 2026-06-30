import React from "react";
import { Users, AlertTriangle, Calendar, IndianRupee, Eye, HelpCircle, CheckCircle } from "lucide-react";
import { Button } from "@kridaz/ui";
import { useNavigate } from "react-router-dom";
import { useGetTournamentMatchesQuery } from "../../../../redux/api/tournamentApi";

const OverviewTab = ({ tournament }) => {
  const navigate = useNavigate();
  const { data: matchesRes } = useGetTournamentMatchesQuery(tournament.id);
  const matches = matchesRes?.data || [];

  const registeredTeams = tournament.teams || [];
  const activeTeams = registeredTeams.filter((t) => t.status !== "WITHDRAWN");
  const completedMatches = matches.filter((m) => m.status === "COMPLETED").length;

  const totalCollected = registeredTeams.reduce(
    (sum, t) => sum + Number(t.amountPaid || 0),
    0
  );

  const isCancelled = tournament.status === "CANCELLED";

  // Derive dynamic activities from matches and teams
  const activities = [];

  // Add registrations
  registeredTeams.forEach((t) => {
    activities.push({
      id: `reg-${t.id}`,
      type: "registration",
      title: `${t.team?.name || "A team"} registered`,
      time: new Date(t.createdAt).toLocaleDateString(),
      description: `Paid: ₹${Number(t.amountPaid).toLocaleString()} (${
        t.paymentStatus === "FULL" ? "Full payment" : "Advance payment"
      })`,
    });
  });

  // Add completed matches
  matches
    .filter((m) => m.status === "COMPLETED")
    .forEach((m) => {
      activities.push({
        id: `match-${m.id}`,
        type: "match",
        title: `Match Completed`,
        time: m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : "Recently",
        description: `${m.teams?.[0]?.team?.name || "Team 1"} vs ${
          m.teams?.[1]?.team?.name || "Team 2"
        }`,
      });
    });

  // Sort activities by ID or date (using simple logic)
  const sortedActivities = activities.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {isCancelled && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <XCircle className="text-red-500" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Tournament Cancelled
            </h3>
            <p className="text-xs text-white/70">
              All matches have been cancelled and team fees have been refunded to their captains.
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <Users className="text-secondary mb-3" size={20} />
          <p className="text-2xl font-black text-white">
            {activeTeams.length} / {tournament.maxTeams || 8}
          </p>
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
            Registered
          </p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFD700]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <IndianRupee className="text-[#FFD700] mb-3" size={20} />
          <p className="text-2xl font-black text-white">
            ₹{totalCollected.toLocaleString()}
          </p>
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
            Collected
          </p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <Calendar className="text-primary mb-3" size={20} />
          <p className="text-2xl font-black text-white">
            {completedMatches} / {matches.length}
          </p>
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
            Matches Done
          </p>
        </div>

        <div
          onClick={() => window.open(`/t/public/${tournament.id}`, "_blank")}
          className="bg-card p-5 rounded-2xl border border-primary/20 relative overflow-hidden flex flex-col justify-center items-center text-center cursor-pointer hover:bg-primary/10 transition-colors"
        >
          <Eye className="text-primary mb-2" size={20} />
          <p className="text-sm font-black text-primary uppercase tracking-widest mb-1">
            View Public Page
          </p>
          <p className="text-[10px] text-white/50">See what players see</p>
        </div>
      </div>

      {/* Action Alerts */}
      {!isCancelled && tournament.teams?.length === 0 && (
        <div className="bg-[#1a1300] border border-[#FFD700]/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-[#FFD700]" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Share Registration Link
            </h3>
            <p className="text-xs text-white/70 mb-3">
              No teams have registered yet. Share the public page link to invite teams to sign up!
            </p>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/t/public/${tournament.id}`
                );
                toast.success("Public link copied!");
              }}
              className="text-xs font-bold text-black bg-[#FFD700] px-4 py-2 rounded-full hover:bg-white transition-colors"
            >
              Copy Public Link
            </Button>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <section className="pt-4">
        <h3 className="text-sm font-black text-white/90 uppercase tracking-widest mb-4">
          Recent Activity
        </h3>
        <div className="bg-card border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
          {sortedActivities.map((act) => (
            <div key={act.id} className="p-4 flex justify-between items-center hover:bg-white/2 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                  {act.type === "registration" ? (
                    <CheckCircle size={14} className="text-primary" />
                  ) : (
                    <Trophy size={14} className="text-secondary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{act.title}</p>
                  <p className="text-xs text-white/50">{act.description}</p>
                </div>
              </div>
              <span className="text-xs text-white/30 font-bold">{act.time}</span>
            </div>
          ))}

          {sortedActivities.length === 0 && (
            <div className="p-8 text-center text-white/40 text-sm">
              No activity yet. Share your tournament to get teams to register!
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default OverviewTab;
