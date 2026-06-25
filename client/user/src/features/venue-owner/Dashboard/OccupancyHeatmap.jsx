import * as Sentry from "@sentry/react";
import React, { useState, useEffect } from "react";
import { Clock, Phone, Mail, X } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { Button, Select } from "@kridaz/ui";


const OccupancyHeatmap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [turfs, setTurfs] = useState([]);
  const [selectedTurf, setSelectedTurf] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    fetchTurfs();
  }, []);

  const fetchTurfs = async () => {
    try {
      const res = await axiosInstance.get("/api/owner/turf/owner/all");
      const data = Array.isArray(res.data) ? res.data : [];
      setTurfs(data);
      if (data.length > 0) {
        setSelectedTurf(data[0]._id);
      }
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  useEffect(() => {
    if (selectedTurf) {
      fetchData();
    }
  }, [selectedTurf]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/api/owner/dashboard/occupancy?turfId=${selectedTurf}`
      );
      if (res.data.success) {
        setData(res.data.heatmap);
      }
    } catch (error) {
      Sentry.captureException(error);
    } finally {
      setLoading(false);
    }
  };

  const getSlotColor = (count) => {
    if (count === 0) return "rgba(45, 45, 45, 0.3)";
    const intensity = Math.min(1, count / 5); // Assuming 5+ is "peak"
    return `rgba(204, 255, 0, ${0.2 + intensity * 0.8})`;
  };

  return (
    <div className="bg-card p-6 rounded-[16px] border border-white/10 hover:shadow-[0px_8px_24px_rgba(85,222,232,0.10)] transition-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-[14px] lg:text-[16px] font-bold text-white tracking-tighter font-inter">
            Weekly Occupancy Calendar
          </h2>
          <p className="text-[11px] font-normal text-white/70 tracking-wide mt-1 font-inter">
            Real-time weekly booking density
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Select
            value={selectedTurf}
            onChange={(e) => setSelectedTurf(e.target.value)}
            className="bg-card border border-white/10 text-white text-[10px] font-bold tracking-widest rounded-[8px] px-2 py-1 focus:outline-none focus:border-secondary transition-all cursor-pointer max-w-full"
          >
            <option value="" disabled>
              Select Facility
            </option>
            {turfs.map((turf) => (
              <option key={turf._id} value={turf._id}>
                {turf.name}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[4px] bg-card" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Empty
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[4px] bg-primary" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Booked
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar pt-4">
        <div className="min-w-[700px] space-y-2">
          {/* Hours Header */}
          <div className="flex gap-1 mb-4 ml-10">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 text-center text-[7px] font-medium text-muted-foreground uppercase tracking-tighter"
              >
                {i === 0
                  ? "12 AM"
                  : i < 12
                    ? `${i} AM`
                    : i === 12
                      ? "12 PM"
                      : `${i - 12} PM`}
              </div>
            ))}
          </div>

          {/* Days Rows */}
          {days.map((day, dIdx) => (
            <div key={day} className="flex items-center gap-1">
              <div className="w-10 text-[10px] font-medium text-white/70 uppercase tracking-wider">
                {day}
              </div>
              <div className="flex-1 flex gap-1">
                {Array.from({ length: 24 }).map((_, hour) => {
                  const slot = data.find(
                    (s) => s.day === dIdx && s.hour === hour
                  );
                  const count = slot?.count || 0;
                  return (
                    <div
                      key={hour}
                      onClick={() => setSelectedSlot(slot)}
                      className="flex-1 h-8 rounded-[16px] transition-all duration-300 hover:scale-110 cursor-pointer border border-white/10"
                      style={{
                        backgroundColor: getSlotColor(count),
                        boxShadow:
                          count > 0
                            ? "0 0 10px rgba(204, 255, 0, 0.1)"
                            : "none",
                      }}
                      title={`${day}, ${hour}:00 - ${count} Bookings`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-white/10 rounded-[16px] w-full max-w-lg overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.4)]">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold font-inter text-white tracking-tight">
                  {days[selectedSlot.day]} @{" "}
                  {selectedSlot.hour === 0
                    ? "12 AM"
                    : selectedSlot.hour < 12
                      ? `${selectedSlot.hour} AM`
                      : selectedSlot.hour === 12
                        ? "12 PM"
                        : `${selectedSlot.hour - 12} PM`}
                </h3>
                <p className="text-sm text-primary font-medium tracking-widest mt-1">
                  {selectedSlot.count} ACTIVE BOOKINGS
                </p>
              </div>
              <Button
                onClick={() => setSelectedSlot(null)}
                className="p-2 hover:bg-card rounded-full text-white/70 hover:text-white transition-all"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4 no-scrollbar">
              {selectedSlot.details.length > 0 ? (
                selectedSlot.details.map((b, idx) => (
                  <div
                    key={idx}
                    className="bg-card p-5 rounded-[16px] border border-white/10 hover:border-secondary/50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[16px] bg-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none flex items-center justify-center text-black font-bold text-lg">
                          {b.user?.[0] || "G"}
                        </div>
                        <div>
                          <h4 className="text-white font-bold tracking-tight group-hover:text-secondary transition-colors">
                            {b.user || "Guest"}
                          </h4>
                          <p className="text-[12px] text-white/70 tracking-widest">
                            {b.turf}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] text-white/70 font-medium tracking-widest">
                          Amount
                        </p>
                        <p className="text-white font-bold">Rs {b.amount}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone size={12} className="text-primary" />
                          <span className="text-[11px] font-medium">
                            {b.phone || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail size={12} className="text-primary" />
                          <span className="text-[11px] font-medium truncate">
                            {b.email || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock size={12} className="text-primary" />
                          <span className="text-[11px] font-medium">
                            {b.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center text-muted-foreground">
                    <Clock size={32} />
                  </div>
                  <div>
                    <p className="text-white font-bold uppercase tracking-widest">
                      No Bookings
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This slot is currently available for booking.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-black/60 border-t border-white/10">
              <p className="text-[12px] text-white/70 text-center tracking-[0.2em] font-medium font-inter">
                Vault Secure Booking Intelligence
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OccupancyHeatmap;
