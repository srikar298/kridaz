import React from "react";
import { Calendar, Clock, AlertOctagon, RefreshCw, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import Button from "@components/ui/Button";

const LiveMatchSearchCard = ({ req, onRetry, isFailed = false }) => {
  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  return (
    <div
      className={`bg-card border rounded-lg p-5 relative overflow-hidden transition-all duration-300 ${
        isFailed
          ? "border-red-500/20 hover:border-red-500/40"
          : "border-primary/20"
      }`}
    >
      {/* Subtle overlay accent for failed */}
      {isFailed && (
        <div className="absolute top-0 right-0 bg-red-500/10 text-red-500 px-3 py-1 rounded-bl-lg text-[8px] font-black uppercase tracking-wider border-l border-b border-red-500/20">
          {req.status}
        </div>
      )}

      <div className="space-y-3 font-sans">
        <div>
          <span className="text-[8px] uppercase tracking-wider text-white/40 block">
            Target Roles
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {req.roles?.map((r) => (
              <span
                key={r}
                className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-bold text-white uppercase"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1.5">
          <div>
            <span className="text-[8px] uppercase tracking-wider text-white/40 block">
              Venue/Location
            </span>
            <span className="text-xs font-bold text-white block truncate">
              {req.ground?.name ||
                req.customLocation?.address ||
                "Custom Coords"}
            </span>
          </div>
          <div>
            <span className="text-[8px] uppercase tracking-wider text-white/40 block">
              Budget Scope
            </span>
            <span
              className={`text-xs font-bold ${
                isFailed ? "text-red-400" : "text-primary"
              }`}
            >
              ₹{req.minBudget} - ₹{req.maxBudget}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
            <Calendar
              size={10}
              className={isFailed ? "text-red-400" : "text-primary"}
            />{" "}
            {req.matchDate || "Flexible"}
            <Clock
              size={10}
              className={`ml-2 ${isFailed ? "text-red-400" : "text-primary"}`}
            />{" "}
            {req.matchStartTime || "TBD"} - {req.matchEndTime || "TBD"}
          </div>
        </div>

        {/* Offers Section */}
        {req.offers && req.offers.length > 0 && (
          <div className="pt-3 border-t border-white/5 mt-3 space-y-2">
            <span className="text-[8px] uppercase tracking-wider text-white/40 block">
              Professionals Notified
            </span>
            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto scrollbar-hide">
              {req.offers.map((offer) => {
                const proName =
                  offer.professional?.user?.name || "Professional";
                const profilePic = offer.professional?.user?.profilePicture;

                let statusColor = "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
                let StatusIcon = HelpCircle;
                let statusText = "Waiting";

                if (offer.status === "ACCEPTED") {
                  statusColor = "text-green-500 bg-green-500/10 border-green-500/20";
                  StatusIcon = CheckCircle;
                  statusText = "Accepted";
                } else if (offer.status === "REJECTED") {
                  statusColor = "text-red-500 bg-red-500/10 border-red-500/20";
                  StatusIcon = XCircle;
                  statusText = "Declined";
                } else if (offer.status === "EXPIRED") {
                  statusColor = "text-gray-500 bg-gray-500/10 border-gray-500/20";
                  StatusIcon = AlertOctagon;
                  statusText = "Missed";
                }

                return (
                  <div
                    key={offer.id}
                    className="flex items-center justify-between bg-black/20 p-2 rounded-md border border-white/5"
                  >
                    <div className="flex items-center gap-2">
                      {profilePic ? (
                        <img
                          src={profilePic}
                          alt={proName}
                          className="w-6 h-6 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-white/40 text-[10px] font-bold">
                          {getInitials(proName)}
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-white capitalize truncate max-w-[120px]">
                        {proName.toLowerCase()}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${statusColor}`}
                    >
                      <StatusIcon size={8} />
                      <span className="text-[8px] font-black uppercase tracking-widest">
                        {statusText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Retry Actions for Failed */}
        {isFailed && onRetry && (
          <div className="pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 mt-2">
            <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">
              Requested:{" "}
              {new Date(req.createdAt).toLocaleDateString("en-GB")} at{" "}
              {new Date(req.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            <Button
              onClick={() => onRetry(req)}
              className="px-3 py-1.5 bg-primary/10 hover:bg-primary hover:text-black border border-primary/20 text-primary text-[8px] font-black uppercase tracking-widest rounded-[6px] transition-all flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw size={10} /> Retry Search
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMatchSearchCard;
