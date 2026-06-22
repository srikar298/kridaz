import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  CalendarDays,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { format, addDays, startOfToday, parse } from "date-fns";
import ClockPicker from "@components/common/ClockPicker";import { Button } from "@kridaz/ui";


/**
 * ProfessionalAvailability ΓÇö Role-aware schedule management.
 * Fully rebranded for Scorer users with Teal Green (var(--primary)) and Inter typography.
 */

export default function ProfessionalAvailability() {
  const { user, role } = useSelector((state) => state.auth);

  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "var(--primary)" : "var(--primary)";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({
    startTime: "09:00",
    endTime: "10:00",
  });
  const [hasAvailability, setHasAvailability] = useState({}); // To track which dates have slots
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const timeToDate = (timeStr) => {
    if (!timeStr) return new Date();
    return parse(timeStr, "HH:mm", new Date());
  };

  const dateToTime = (date) => {
    return format(date, "HH:mm");
  };

  const dates = Array.from({ length: 28 }, (_, i) =>
    addDays(startOfToday(), i)
  );

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate]);

  const fetchAvailability = async () => {
    try {
      setFetching(true);
      const professionalId = user?._id || user?.id || user?.user;
      if (!professionalId) return;
      const res = await axiosInstance.get(
        `/api/professional/details/${professionalId}?date=${selectedDate}`
      );
      if (res.data.availability) {
        setSlots(res.data.availability.slots);
      } else {
        setSlots([]);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      setSlots([]);
    } finally {
      setFetching(false);
    }
  };

  const handleAddSlot = async () => {
    if (slots.some((s) => s.startTime === newSlot.startTime)) {
      toast.error("Slot already exists", {
        style: {
          background: "#000",
          color: "#fff",
          border: `1px solid ${themeColor}`,
          fontSize: "10px",
          fontWeight: "black",
        },
      });
      return;
    }
    const updatedSlots = [...slots, { ...newSlot, isAvailable: true }].sort(
      (a, b) => a.startTime.localeCompare(b.startTime)
    );
    setSlots(updatedSlots);

    try {
      setLoading(true);
      const promises = [];
      for (let i = 0; i < 28; i++) {
        const targetDate = format(addDays(startOfToday(), i), "yyyy-MM-dd");
        promises.push(
          axiosInstance.put("/api/professional/availability", {
            date: targetDate,
            slots: updatedSlots,
          })
        );
      }
      await Promise.all(promises);

      const newHasAvailability = {};
      for (let i = 0; i < 28; i++) {
        const d = format(addDays(startOfToday(), i), "yyyy-MM-dd");
        newHasAvailability[d] = true;
      }
      setHasAvailability((prev) => ({ ...prev, ...newHasAvailability }));

      toast.success("Batch update complete: 28 days synchronized", {
        style: {
          background: "#000",
          color: "#fff",
          border: `1px solid ${themeColor}`,
          fontSize: "10px",
          fontWeight: "black",
        },
      });
    } catch (error) {
      toast.error("Batch synchronization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSlot = async (startTime) => {
    const updatedSlots = slots.filter((s) => s.startTime !== startTime);
    setSlots(updatedSlots);
    await handleSave(updatedSlots, selectedDate);
  };

  const handleSave = async (customSlots = null, customDate = null) => {
    try {
      setLoading(true);
      const targetDate =
        typeof customDate === "string" ? customDate : selectedDate;
      const targetSlots = Array.isArray(customSlots) ? customSlots : slots;

      await axiosInstance.put("/api/professional/availability", {
        date: targetDate,
        slots: targetSlots,
      });

      if (!customDate) {
        toast.success("Schedule synchronized", {
          style: {
            background: "#000",
            color: "#fff",
            border: `1px solid ${themeColor}`,
            fontSize: "10px",
            fontWeight: "black",
          },
        });
      }

      setHasAvailability((prev) => ({
        ...prev,
        [targetDate]: targetSlots.length > 0,
      }));
    } catch (error) {
      toast.error("Synchronization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full custom-scrollbar bg-background">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative font-inter">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div
              className="w-1.5 h-10 rounded-full"
              style={{ backgroundColor: themeColor }}
            />
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white font-inter uppercase leading-none">
                {role || "Node"}{" "}
                <span style={{ color: themeColor }}>Availability</span>
              </h1>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] font-inter mt-1.5">
                {getTimeGreeting()}, {user?.name || "Professional"} |
                Professional Schedule Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-6 py-4 rounded-[6px] backdrop-blur-xl">
              <div
                className="w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${themeColor}1a`,
                  color: themeColor,
                }}
              >
                <Calendar size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-white text-lg font-bold leading-none font-inter">
                  {currentTime.toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p
                  className="text-[10px] font-semibold uppercase tracking-widest opacity-80"
                  style={{ color: themeColor }}
                >
                  {currentTime.toLocaleDateString("en-US", { weekday: "long" })}{" "}
                  ΓÇó{" "}
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-4 rounded-[6px] text-black font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-3 transition-all disabled:opacity-50 font-inter shadow-2xl active:scale-95 hover:brightness-110"
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 10px 30px ${themeColor}66`,
              }}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}{" "}
              Save Schedule
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-[8px] p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="p-2 bg-opacity-10 rounded-lg"
                  style={{
                    backgroundColor: `${themeColor}1a`,
                    color: themeColor,
                  }}
                >
                  <CalendarDays size={18} />
                </div>
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-white font-inter">
                  Select Date
                </h3>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {dates.map((date) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const isSelected = selectedDate === dateStr;
                  const hasSlots = hasAvailability[dateStr];
                  return (
                    <Button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-[8px] border transition-all duration-300 ${isSelected ? "text-black shadow-lg" : "bg-border/30 border-border text-muted-foreground hover:border-primary/30 hover:bg-border/50"}`}
                      style={{
                        backgroundColor: isSelected ? themeColor : undefined,
                        borderColor: isSelected ? themeColor : undefined,
                        boxShadow: isSelected
                          ? `0 0 15px ${themeColor}4d`
                          : undefined,
                      }}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-widest mb-1 font-inter">
                        {format(date, "EEE")}
                      </span>
                      <span className="text-[18px] font-bold leading-none font-inter">
                        {format(date, "dd")}
                      </span>
                      {hasSlots && !isSelected && (
                        <div
                          className="absolute top-1 right-1 w-1 h-1 rounded-full animate-pulse"
                          style={{ backgroundColor: themeColor }}
                        ></div>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div
              className="bg-opacity-5 border rounded-[8px] p-6 lg:p-8 relative overflow-hidden group"
              style={{
                backgroundColor: `${themeColor}0d`,
                borderColor: `${themeColor}1a`,
              }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={60} style={{ color: themeColor }} />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Zap style={{ color: themeColor }} size={20} />
                <h4
                  className="text-[11px] font-bold uppercase tracking-wider font-inter"
                  style={{ color: themeColor }}
                >
                  Operational Tips
                </h4>
              </div>
              <ul className="space-y-3 text-[11px] font-medium text-muted-foreground uppercase tracking-widest leading-relaxed font-inter relative z-10">
                <li className="flex items-start gap-2">
                  <span style={{ color: themeColor }}>ΓÇó</span>
                  <span>Define specific slots for different session types</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: themeColor }}>ΓÇó</span>
                  <span>System prevents removal of assigned slots</span>
                </li>
                <li className="flex items-start gap-2">
                  <span style={{ color: themeColor }}>ΓÇó</span>
                  <span>Maintaining consistency improves booking rates</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-[8px] p-6 lg:p-8 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div
                  className="p-2 bg-opacity-10 rounded-lg"
                  style={{
                    backgroundColor: `${themeColor}1a`,
                    color: themeColor,
                  }}
                >
                  <Clock size={18} />
                </div>
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-white font-inter">
                  Time Slot Configuration
                </h3>
              </div>

              <div className="flex flex-col md:flex-row items-end gap-4 mb-10 pb-10 border-b border-white/5">
                <div className="flex-1 space-y-3">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest font-inter flex items-center gap-2">
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />{" "}
                    Start Time
                  </label>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg overflow-hidden transition-all hover:border-white/10 focus-within:border-white/20">
                    <ClockPicker
                      value={timeToDate(newSlot.startTime)}
                      onChange={(date) =>
                        setNewSlot({ ...newSlot, startTime: dateToTime(date) })
                      }
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest font-inter flex items-center gap-2">
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />{" "}
                    End Time
                  </label>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg overflow-hidden transition-all hover:border-white/10 focus-within:border-white/20">
                    <ClockPicker
                      value={timeToDate(newSlot.endTime)}
                      onChange={(date) =>
                        setNewSlot({ ...newSlot, endTime: dateToTime(date) })
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddSlot}
                  className="h-[54px] px-8 bg-transparent text-white hover:text-black rounded-[8px] font-bold uppercase text-[11px] tracking-[2px] transition-all flex items-center gap-3 font-inter group shadow-lg border border-white/10"
                  style={{ "--hover-bg": themeColor }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = themeColor;
                    e.target.style.borderColor = themeColor;
                    e.target.style.boxShadow = `0 10px 30px ${themeColor}66`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <Plus
                    size={16}
                    className="group-hover:rotate-90 transition-transform"
                  />{" "}
                  Add Slot
                </Button>
              </div>

              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-bold uppercase tracking-[3px] text-muted-foreground font-inter">
                  Active Schedule |{" "}
                  <span className="text-white">
                    {format(new Date(selectedDate), "MMMM dd, yyyy")}
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: themeColor }}
                  />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    Real-time Feed
                  </span>
                </div>
              </div>

              {fetching ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <Loader2
                    className="animate-spin"
                    style={{ color: themeColor }}
                    size={40}
                  />
                  <p className="text-[10px] font-black uppercase tracking-[4px] text-neutral-500">
                    Fetching Schedule
                  </p>
                </div>
              ) : slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[450px] bg-white/[0.03] backdrop-blur-xl rounded-[8px] border border-white/5 border-dashed p-12 text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
                  <div className="w-20 h-20 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-8 relative z-10 shadow-inner">
                    <Calendar size={40} className="text-neutral-600" />
                  </div>
                  <h3 className="text-[24px] font-black text-white uppercase tracking-[0.1em] font-inter mb-3 relative z-10">
                    Schedule <span style={{ color: themeColor }}>Clear</span>
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] font-inter max-w-sm leading-relaxed relative z-10">
                    Define your availability above to sync your professional
                    calendar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {slots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-5 bg-white/[0.03] border border-white/5 rounded-[8px] group hover:border-white/10 transition-all shadow-md relative overflow-hidden"
                    >
                      <div
                        className="absolute top-0 left-0 w-1 h-full"
                        style={{
                          backgroundColor: slot.isAvailable
                            ? themeColor
                            : "var(--destructive)",
                        }}
                      />
                      <div className="flex items-center gap-5">
                        <div
                          className="w-12 h-12 rounded-lg bg-opacity-5 border flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: `${themeColor}0d`,
                            borderColor: `${themeColor}1a`,
                          }}
                        >
                          <Clock size={18} style={{ color: themeColor }} />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-white font-inter tracking-tight">
                            {slot.startTime} - {slot.endTime}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: slot.isAvailable
                                  ? themeColor
                                  : "var(--destructive)",
                              }}
                            />
                            <p
                              className="text-[9px] font-bold uppercase tracking-[2px] font-inter"
                              style={{
                                color: slot.isAvailable
                                  ? themeColor
                                  : "var(--destructive)",
                              }}
                            >
                              {slot.isAvailable ? "Available" : "Assigned"}
                            </p>
                          </div>
                        </div>
                      </div>
                      {slot.isAvailable && (
                        <Button
                          onClick={() => handleRemoveSlot(slot.startTime)}
                          className="p-3 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-[8px] transition-all border border-transparent hover:border-red-500/20"
                        >
                          <Trash2 size={18} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
