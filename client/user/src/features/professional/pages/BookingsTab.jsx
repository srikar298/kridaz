import React, { useState } from "react";
import { Calendar, MapPin, User, Trophy, Clock, Info } from "lucide-react";
import { useGetMyOnDemandBookingsQuery } from "../../../redux/api/professionalApi";
import { Button } from "@kridaz/ui";


const BookingsTab = ({ role }) => {
  const {
    data: bookingsData,
    isLoading,
    refetch,
  } = useGetMyOnDemandBookingsQuery();
  const [activeSubTab, setActiveSubTab] = useState("active");

  const bookings = bookingsData?.bookings || [];
  const pendingBookings = bookingsData?.pendingBookings || [];
  const nonAcceptedBookings = bookingsData?.nonAcceptedBookings || [];
  const skippedBookings = bookingsData?.skippedBookings || [];

  // Active tab: confirmed active bookings + pending offers
  const activeBookings = [
    ...bookings.filter(
      (b) => b.status === "ASSIGNED" || b.status === "IN_PROGRESS"
    ),
    ...pendingBookings,
  ];

  const completedBookings = bookings.filter(
    (b) =>
      b.status === "COMPLETED" ||
      b.status === "CANCELLED" ||
      b.status === "NO_SHOW"
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.05)]";
      case "IN_PROGRESS":
        return "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_12px_rgba(191,243,103,0.05)]";
      case "COMPLETED":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "NO_SHOW":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_12px_rgba(234,179,8,0.05)]";
      case "NOT_ACCEPTED":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "SKIPPED":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_12px_rgba(249,115,22,0.05)]";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "ASSIGNED":
        return "Assigned";
      case "IN_PROGRESS":
        return "In Progress";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      case "NO_SHOW":
        return "No Show";
      case "NOT_ACCEPTED":
        return "Not Accepted";
      case "SKIPPED":
        return "Skipped";
      default:
        return status;
    }
  };

  const currentList =
    activeSubTab === "active"
      ? activeBookings
      : activeSubTab === "history"
        ? completedBookings
        : activeSubTab === "nonAccepted"
          ? nonAcceptedBookings
          : skippedBookings;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 text-white font-inter">
      {/* Tab Selectors */}
      <div className="border-b border-card pb-1 overflow-x-auto no-scrollbar">
        <div className="flex w-full min-w-max sm:min-w-0 sm:grid sm:grid-cols-4 text-center">
          <Button
            onClick={() => setActiveSubTab("active")}
            className={`flex-1 whitespace-nowrap px-4 pb-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeSubTab === "active" ? "text-primary border-primary" : "text-gray-500 border-transparent hover:text-white"}`}
          >
            Active ({activeBookings.length})
          </Button>
          <Button
            onClick={() => setActiveSubTab("history")}
            className={`flex-1 whitespace-nowrap px-4 pb-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeSubTab === "history" ? "text-primary border-primary" : "text-gray-500 border-transparent hover:text-white"}`}
          >
            History ({completedBookings.length})
          </Button>
          <Button
            onClick={() => setActiveSubTab("nonAccepted")}
            className={`flex-1 whitespace-nowrap px-4 pb-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeSubTab === "nonAccepted" ? "text-primary border-primary" : "text-gray-500 border-transparent hover:text-white"}`}
          >
            Rejected ({nonAcceptedBookings.length})
          </Button>
          <Button
            onClick={() => setActiveSubTab("skipped")}
            className={`flex-1 whitespace-nowrap px-4 pb-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeSubTab === "skipped" ? "text-primary border-primary" : "text-gray-500 border-transparent hover:text-white"}`}
          >
            Skipped ({skippedBookings.length})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-primary animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Syncing assignments...
          </p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="p-16 text-center bg-background border border-card rounded-2xl space-y-4">
          <div className="mx-auto w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-600">
            <Info size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm sm:text-base text-white">
              No Bookings Found
            </h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              {activeSubTab === "active"
                ? "You do not have any active or pending match assignments right now."
                : activeSubTab === "history"
                  ? "No completed or historical matching records found on this account."
                  : activeSubTab === "nonAccepted"
                    ? "No rejected matching requests found."
                    : "No skipped matching requests found."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {currentList.map((booking) => (
            <div
              key={booking.id}
              className={`p-5 rounded-2xl bg-background border transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden ${
                booking.status === "PENDING"
                  ? "border-yellow-500/20 hover:border-yellow-500/40"
                  : "border-card hover:border-primary/30"
              }`}
            >
              {/* Background gradient card glow */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 blur-3xl pointer-events-none rounded-full ${
                  booking.status === "PENDING"
                    ? "bg-yellow-500/5"
                    : "bg-primary/5"
                }`}
              />

              {/* Pending indicator pulse */}
              {booking.status === "PENDING" && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400" />
                  </span>
                  <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">
                    Awaiting Response
                  </span>
                </div>
              )}

              <div className="space-y-4">
                {/* Header: Status & Price */}
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span
                      className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusStyle(booking.status)}`}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                    {booking.role && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider bg-white/5 text-gray-300 border border-white/5">
                        <Trophy size={10} />
                        {booking.role}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">
                      Hourly rate
                    </span>
                    <span className="text-primary font-black text-base sm:text-lg block mt-1">
                      ₹{booking.hourlyRate}
                    </span>
                  </div>
                </div>

                {/* Match timing block */}
                <div className="p-3 bg-card border border-card rounded-xl grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={10} /> Match Date
                    </span>
                    <span className="text-xs font-bold text-white block">
                      {booking.matchDate || formatDate(booking.createdAt)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> Shift Timings
                    </span>
                    <span className="text-xs font-bold text-white block">
                      {booking.matchStartTime && booking.matchEndTime
                        ? `${booking.matchStartTime} - ${booking.matchEndTime}`
                        : "Flexible Shift"}
                    </span>
                  </div>
                </div>

                {/* Venue / Location Details */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block leading-none mb-1.5">
                      Venue Location
                    </span>
                    <h5 className="text-xs font-bold text-white truncate">
                      {booking.enue?.name || "Custom enue / Court"}
                    </h5>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">
                      {booking.enue?.location ||
                        booking.customLocation?.address ||
                        "Location Address not available"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Details Section — no email/phone */}
              <div className="p-3 bg-card border border-card rounded-xl flex items-center gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {booking.user?.profilePicture ? (
                    <img
                      src={booking.user.profilePicture}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-primary/20 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {booking.user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h6 className="text-xs font-black text-white truncate leading-none">
                      {booking.user?.name || "Client Name"}
                    </h6>
                    <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-1 flex items-center gap-1">
                      <User size={10} /> Requester
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsTab;
