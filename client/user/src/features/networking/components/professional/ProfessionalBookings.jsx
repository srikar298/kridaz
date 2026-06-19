import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { Check, X, User, Phone, Mail, Loader2, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

/**
 * ProfessionalBookings ΓÇö Rebranded for the Scorer Portal.
 * Enforces Teal Green (#BFF367) and Inter typography.
 */

export default function ProfessionalBookings() {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#BFF367" : "#BFF367";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/professional/my-bookings");
      setBookings(res.data.bookings || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (bookingId, status) => {
    try {
      setActionLoading(bookingId);
      await axiosInstance.post("/api/professional/handle-request", {
        bookingId,
        status,
      });
      toast.success(`Booking ${status.toLowerCase()} successfully`);
      fetchBookings();
    } catch (error) {
      console.error("Error handling booking:", error);
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading)
    return (
      <div className="py-20 flex justify-center">
        <Loader2
          className="animate-spin"
          style={{ color: themeColor }}
          size={40}
        />
      </div>
    );

  return (
    <div className="space-y-8 animate-fade-in font-inter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-1.5 h-10 rounded-full"
            style={{ backgroundColor: themeColor }}
          />
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white font-inter uppercase leading-none">
              {isScorer ? "Scorer" : "Coach"}{" "}
              <span style={{ color: themeColor }}>Schedule</span>
            </h1>
            <p className="text-[#878C9F] text-[10px] font-black uppercase tracking-[0.2em] font-inter mt-1.5">
              Upcoming assignments and availability
            </p>
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[450px] bg-white/[0.03] backdrop-blur-xl rounded-[8px] border border-white/5 border-dashed p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
          <div className="w-20 h-20 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-8 relative z-10 shadow-inner">
            <Calendar size={40} className="text-neutral-600" />
          </div>
          <h3 className="text-[24px] font-black text-white uppercase tracking-[0.1em] font-inter mb-3 relative z-10">
            Schedule <span style={{ color: themeColor }}>Clear</span>
          </h3>
          <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] font-inter max-w-sm leading-relaxed relative z-10">
            No upcoming matches found in your roster.
            <br />
            Please check back later for new assignments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <div
              key={booking._id}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] overflow-hidden group hover:border-white/10 transition-all shadow-2xl"
            >
              <div className="p-8 lg:p-10">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="flex gap-6">
                    <div className="relative">
                      <img
                        src={
                          booking.user?.profilePicture ||
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80"
                        }
                        className="w-16 h-16 rounded-[8px] object-cover border border-white/5"
                        alt={booking.user?.name}
                      />
                      <div
                        className="absolute -bottom-2 -right-2 w-7 h-7 rounded-lg flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: themeColor }}
                      >
                        <User size={14} className="text-black" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight font-inter uppercase mb-1.5">
                        {booking.user?.name}
                      </h3>
                      <div className="flex flex-wrap gap-5">
                        <span className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest font-inter">
                          <Phone size={12} style={{ color: themeColor }} />{" "}
                          {booking.user?.phone}
                        </span>
                        <span className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest font-inter">
                          <Mail size={12} style={{ color: themeColor }} />{" "}
                          {booking.user?.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-3">
                    <div
                      className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border font-inter ${booking.status === "PENDING" ? "bg-orange-500/10 border-orange-500/20 text-orange-500" : booking.status === "ACCEPTED" ? "bg-[#BFF367]/10 border-[#BFF367]/20" : "bg-red-500/10 border-red-500/20 text-red-500"}`}
                      style={{
                        color:
                          booking.status === "ACCEPTED"
                            ? themeColor
                            : undefined,
                        borderColor:
                          booking.status === "ACCEPTED"
                            ? themeColor
                            : undefined,
                      }}
                    >
                      {booking.status === "ACCEPTED"
                        ? "SCHEDULED"
                        : booking.status}
                    </div>
                    <p className="text-3xl font-black text-white mt-2 font-inter tracking-tighter">
                      Γé╣{Number(booking.totalAmount).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-5">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest font-inter">
                      Match Schedule
                    </p>
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-lg bg-white/[0.05] flex flex-col items-center justify-center border border-white/10 text-center shadow-inner">
                        <span
                          className="text-[9px] font-black uppercase font-inter"
                          style={{ color: themeColor }}
                        >
                          {format(new Date(booking.date), "MMM")}
                        </span>
                        <span className="text-xl font-black text-white leading-none font-inter mt-0.5">
                          {format(new Date(booking.date), "dd")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-white font-inter tracking-tight uppercase">
                          {booking.slots.map((s) => s.startTime).join(", ")}
                        </p>
                        <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest font-inter mt-1">
                          {booking.bookingType} Portal
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 md:col-span-2">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest font-inter">
                      Match Brief
                    </p>
                    <div className="p-5 bg-white/[0.05] border border-white/10 rounded-[8px] text-[13px] text-neutral-400 italic font-inter leading-relaxed">
                      "
                      {booking.message ||
                        "Standard match scoring and management assignment."}
                      "
                    </div>
                  </div>
                </div>

                {booking.status === "PENDING" && (
                  <div className="mt-10 flex gap-4">
                    <button
                      onClick={() => handleAction(booking._id, "ACCEPTED")}
                      disabled={actionLoading === booking._id}
                      className="flex-1 h-14 text-black rounded-lg font-black uppercase text-[12px] tracking-[0.2em] transition-all transform active:scale-95 flex items-center justify-center gap-3 font-inter shadow-xl"
                      style={{
                        backgroundColor: themeColor,
                        boxShadow: `0 10px 30px ${themeColor}33`,
                      }}
                    >
                      {actionLoading === booking._id ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <Check size={20} />
                      )}{" "}
                      Confirm Slot
                    </button>
                    <button
                      onClick={() => handleAction(booking._id, "REJECTED")}
                      disabled={actionLoading === booking._id}
                      className="flex-1 h-14 bg-white/5 text-neutral-500 hover:text-white border border-white/10 rounded-[8px] font-black uppercase text-[12px] tracking-[0.2em] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-500 transition-all transform active:scale-95 flex items-center justify-center gap-3 font-inter"
                    >
                      {actionLoading === booking._id ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <X size={20} />
                      )}{" "}
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
