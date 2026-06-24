import * as Sentry from "@sentry/react";
import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Calendar as CalendarIcon,
  Activity,
  Zap,
  Loader2,
} from "lucide-react";
import useAxiosInstance from "@hooks/useAxiosInstance";
import { format, addDays, subDays } from "date-fns";
import { Button } from "@kridaz/ui";


const VenueOwnerCalendar = () => {
  const axiosInstance = useAxiosInstance;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCalendarData = async (date) => {
    setLoading(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const response = await axiosInstance.get(
        `/api/owner/dashboard/calendar?date=${formattedDate}`
      );
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      Sentry.captureException(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(selectedDate);
  }, [selectedDate]);

  const handlePrevDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate((prev) => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  // Hours range for the header
  const hours = Array.from({ length: 16 }, (_, i) => {
    const h = i + 6; // Start from 06:00 to 21:00
    return `${h.toString().padStart(2, "0")}:00`;
  });

  return (
    <div className="h-full custom-scrollbar bg-background text-white font-inter">
      <div className="p-6 lg:px-10 lg:pt-10 space-y-10 pb-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-12">
            <div className="space-y-1">
              <p className="text-primary text-[12px] font-black uppercase tracking-[4px]">
                {format(selectedDate, "EEEE")}
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-white tracking-tighter">
                  {format(selectedDate, "dd")}
                </span>
                <span className="text-4xl font-bold text-[#444] tracking-tighter uppercase">
                  {format(selectedDate, "MMM yyyy")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrevDay}
                className="w-10 h-10 flex items-center justify-center bg-card hover:bg-[#252525] rounded-[16px] border border-white/10 transition-all"
              >
                <ChevronLeft size={20} className="text-muted-foreground" />
              </Button>
              <Button
                onClick={handleNextDay}
                className="w-10 h-10 flex items-center justify-center bg-card hover:bg-[#252525] rounded-[16px] border border-white/10 transition-all"
              >
                <ChevronRight size={20} className="text-muted-foreground" />
              </Button>
              <Button
                onClick={handleToday}
                className="ml-4 px-6 py-2 bg-card border border-white/10 rounded-[16px] text-[12px] font-black uppercase tracking-[3px] hover:text-primary transition-all"
              >
                Today
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-12">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">
                  Confirmed
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">
                  Internal
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">
                  Restricted
                </span>
              </div>
            </div>

            <div className="px-5 py-2 bg-card border border-white/10 rounded-[16px] flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-black text-white uppercase tracking-[2px]">
                {data?.stats?.averageLoad || 0}% Load
              </span>
            </div>
          </div>
        </div>

        {/* Matrix Container */}
        <div className="bg-card border border-white/10 rounded-[16px] overflow-hidden flex flex-col shadow-2xl relative min-h-[600px]">
          {loading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {/* Grid Header */}
          <div className="flex border-b border-white/10 bg-card">
            <div className="w-[320px] p-8 border-r border-white/10 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#555] uppercase tracking-[3px]">
                  Facilities
                </span>
                <Filter size={14} className="text-[#555]" />
              </div>
            </div>
            <div className="flex-1 flex overflow-x-auto no-scrollbar">
              {hours.map((time) => (
                <div
                  key={time}
                  className="min-w-[150px] py-6 text-center border-r border-white/10/50 text-[11px] font-bold text-[#555] tracking-widest"
                >
                  {time}
                </div>
              ))}
            </div>
          </div>

          {/* Grid Rows */}
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
            {data?.facilities?.map((facility) => (
              <div
                key={facility.id}
                className="flex border-b border-white/10/50 last:border-b-0 min-h-[180px] hover:bg-white/[0.01] transition-colors"
              >
                {/* Facility Column */}
                <div className="w-[320px] p-8 border-r border-white/10 shrink-0 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-black text-white tracking-tight uppercase">
                      {facility.name}
                    </h3>
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-card text-[9px] font-black text-muted-foreground uppercase tracking-[2px] rounded-[16px] border border-white/10">
                      {facility.category}
                    </span>
                    <span className="text-[9px] font-medium text-[#444] uppercase tracking-wider">
                      HD Quality Turf
                    </span>
                  </div>
                </div>

                {/* Slots Column */}
                <div className="flex-1 flex overflow-x-auto no-scrollbar relative bg-background/50">
                  {hours.map((time) => {
                    const slot = facility.slots.find(
                      (s) => s.startTime === time
                    );
                    const isBooked = slot?.isBooked;
                    const source = slot?.bookingDetails?.bookingSource;

                    const getStatusColor = () => {
                      if (source === "PARTNER_MANUAL")
                        return "border-destructive"; // Using Red for manual as per "Restricted" visual
                      return "border-primary";
                    };

                    return (
                      <div
                        key={time}
                        className="min-w-[150px] border-r border-white/10/30 flex items-center justify-center p-4"
                      >
                        {isBooked ? (
                          <div
                            className={`w-full h-full bg-card border-l-4 ${getStatusColor()} rounded-r-[12px] p-4 flex flex-col justify-between group cursor-pointer hover:bg-card transition-all`}
                          >
                            <div className="space-y-1">
                              <h4 className="text-[13px] font-black text-white uppercase tracking-tight truncate">
                                {slot.bookingDetails?.userName?.split(" ")[0]}{" "}
                                ...
                              </h4>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                {source === "PARTNER_MANUAL"
                                  ? "Direct Entry"
                                  : "Premium Member"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-[#555] group-hover:text-primary transition-colors">
                              <Clock size={12} />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                1 hr
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-[16px] border border-dashed border-white/10/50 flex items-center justify-center group cursor-pointer hover:border-primary/30 transition-all">
                            <div className="w-2 h-2 rounded-full bg-card group-hover:bg-primary/20" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {(!data?.facilities || data.facilities.length === 0) &&
              !loading && (
                <div className="flex-1 flex flex-col items-center justify-center py-40">
                  <CalendarIcon size={48} className="text-card mb-6" />
                  <p className="text-[11px] font-black text-[#444] uppercase tracking-[8px]">
                    No Facilities Registered
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              label: "Confirmed Slots",
              value: data?.stats?.confirmedSlots || 0,
              trend: "+12%",
              icon: Activity,
              color: "var(--primary)",
            },
            {
              label: "Utilized Revenue",
              value: `Rs ${(data?.stats?.totalRevenue || 0).toLocaleString()}`,
              trend: "+Rs 1.2k",
              icon: Zap,
              color: "#3B82F6",
            },
            {
              label: "Average Load",
              value: `${data?.stats?.averageLoad || 0}%`,
              trend: "Stable",
              icon: Clock,
              color: "var(--primary)",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-card border border-white/10 p-8 rounded-[16px] flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 transition-all"
            >
              <div className="relative z-10">
                <p className="text-[11px] font-black text-[#555] uppercase tracking-[3px] mb-4">
                  {stat.label}
                </p>
                <h3 className="text-4xl font-black text-white tracking-tighter">
                  {stat.value}
                </h3>
              </div>
              <div className="mt-8 flex items-center justify-between relative z-10">
                <div
                  className={`px-3 py-1 bg-card border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-[${stat.color}]`}
                >
                  {stat.trend}
                </div>
                <stat.icon
                  className="text-card group-hover:text-primary/20 transition-colors"
                  size={32}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VenueOwnerCalendar;
