import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Loader2,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Trash2,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { format, addDays, subDays } from "date-fns";
import { Button, Input, Select, Textarea } from "@kridaz/ui";


export default function PracticeScheduling() {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "var(--primary)" : "var(--primary)";

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [workingHours, setWorkingHours] = useState({
    startTime: "10:00",
    endTime: "18:00",
  });
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showSettings, setShowSettings] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [newTask, setNewTask] = useState({
    customerId: "",
    title: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [selectedDate]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const [hoursRes, tasksRes, custRes] = await Promise.all([
        axiosInstance.get("/api/professional/working-hours"),
        axiosInstance.get(`/api/professional/tasks?date=${dateStr}`),
        axiosInstance.get("/api/professional/customers"),
      ]);
      if (hoursRes.data.workingHours) {
        setWorkingHours(hoursRes.data.workingHours);
      }
      setTasks(tasksRes.data.tasks || []);
      setCustomers(custRes.data.customers || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  };

  const updateWorkingHours = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axiosInstance.post("/api/professional/working-hours", {
        workingHours,
      });
      toast.success("Working hours updated");
      setShowSettings(false);
    } catch (error) {
      toast.error("Failed to update working hours");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) {
      return toast.error("Title is required");
    }
    try {
      setSaving(true);
      const payload = {
        ...newTask,
        date: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        reminderMinutes: 30,
      };
      await axiosInstance.post("/api/professional/tasks", payload);
      toast.success("Task added to calendar");
      setShowTaskModal(false);
      setNewTask({ customerId: "", title: "", description: "" });
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add task");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await axiosInstance.delete(`/api/professional/tasks/${taskId}`);
      toast.success("Task deleted");
      fetchInitialData();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  // Generate slots
  const generateSlots = () => {
    const slots = [];
    let start = parseInt(workingHours.startTime.split(":")[0]);
    let end = parseInt(workingHours.endTime.split(":")[0]);

    // Ensure 2-hour increments
    for (let i = start; i < end; i += 2) {
      let slotEnd = i + 2;
      if (slotEnd > end) slotEnd = end; // Clamp to end time

      const formatTime = (hr) => {
        const h = hr % 12 || 12;
        const ampm = hr < 12 || hr === 24 ? "AM" : "PM";
        return `${h.toString().padStart(2, "0")}:00 ${ampm}`;
      };

      slots.push({
        startTime: `${i.toString().padStart(2, "0")}:00`,
        endTime: `${slotEnd.toString().padStart(2, "0")}:00`,
        label: `${formatTime(i)} - ${formatTime(slotEnd)}`,
      });
    }
    return slots;
  };

  const slots = generateSlots();

  return (
    <div className="space-y-8 animate-fade-in font-inter pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-1.5 h-10 rounded-full"
            style={{ backgroundColor: themeColor }}
          />
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white font-inter uppercase leading-none">
              Dedicated <span style={{ color: themeColor }}>Calendar</span>
            </h1>
            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] font-inter mt-1.5">
              Manage your practice scheduling
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowSettings(true)}
          className="h-12 px-6 rounded-[8px] font-black uppercase text-[12px] tracking-[0.2em] transition-all transform active:scale-95 flex items-center gap-2 shadow-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20"
        >
          <Settings size={18} /> Settings
        </Button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-[8px] backdrop-blur-xl">
        <Button
          onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-[8px] transition-colors border border-white/10"
        >
          <ChevronLeft size={20} className="text-white" />
        </Button>
        <div className="text-center flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
            {format(selectedDate, "EEEE")}
          </span>
          <span className="text-xl font-black text-white tracking-tight flex items-center gap-3">
            <CalendarIcon size={20} style={{ color: themeColor }} />
            {format(selectedDate, "MMM dd, yyyy")}
          </span>
        </div>
        <Button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-[8px] transition-colors border border-white/10"
        >
          <ChevronRight size={20} className="text-white" />
        </Button>
      </div>

      {/* Loading overlay for day switch */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <Loader2
            className="animate-spin"
            style={{ color: themeColor }}
            size={48}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {slots.map((slot, index) => {
            const slotTasks = tasks.filter(
              (t) => t.startTime === slot.startTime
            );
            const canAddTask = slotTasks.length < 2;

            return (
              <div
                key={index}
                className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] overflow-hidden shadow-2xl relative"
              >
                {/* Slot Header */}
                <div className="bg-card p-4 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: themeColor }}
                  />
                  <div className="flex items-center gap-3 pl-2">
                    <Clock size={16} className="text-neutral-500" />
                    <span className="text-sm font-black text-white tracking-widest">
                      {slot.label}
                    </span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {slotTasks.length} / 2 Tasks
                  </div>
                </div>

                {/* Slot Tasks Area */}
                <div className="p-6">
                  {slotTasks.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-[11px] font-black text-neutral-600 uppercase tracking-widest">
                        Available Slot
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {slotTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-card border border-white/10 rounded-[8px] p-5 relative group"
                        >
                          <Button
                            onClick={() => handleDeleteTask(task.id)}
                            className="absolute top-4 right-4 text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </Button>
                          <h4 className="text-white font-black uppercase tracking-tight text-sm pr-6">
                            {task.title}
                          </h4>

                          {task.customer && (
                            <div className="flex items-center gap-2 mt-3 text-neutral-400">
                              <User size={14} style={{ color: themeColor }} />
                              <span className="text-xs font-semibold">
                                {task.customer.name}
                              </span>
                            </div>
                          )}

                          {task.description && (
                            <p className="text-xs text-neutral-500 mt-3 italic line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {canAddTask && (
                    <Button
                      onClick={() => {
                        setSelectedSlot(slot);
                        setShowTaskModal(true);
                      }}
                      className="mt-6 w-full h-12 border border-white/10 border-dashed rounded-[8px] flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
                    >
                      <Plus size={16} /> Add Task
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-[8px] w-full max-w-md overflow-hidden shadow-2xl font-inter animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                Calendar <span style={{ color: themeColor }}>Settings</span>
              </h3>
            </div>
            <form onSubmit={updateWorkingHours} className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-neutral-500 uppercase tracking-widest">
                  Working Hours
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      value={workingHours.startTime}
                      onChange={(e) =>
                        setWorkingHours({
                          ...workingHours,
                          startTime: e.target.value,
                        })
                      }
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:outline-none focus:border-white/20 transition-colors cursor-pointer"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                      End Time
                    </label>
                    <Input
                      type="time"
                      value={workingHours.endTime}
                      onChange={(e) =>
                        setWorkingHours({
                          ...workingHours,
                          endTime: e.target.value,
                        })
                      }
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:outline-none focus:border-white/20 transition-colors cursor-pointer"
                      required
                    />
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 italic mt-2">
                  The calendar uses 2-hour increment slots between your start
                  and end times.
                </p>
              </div>

              <div className="pt-4 flex gap-4">
                <Button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-black uppercase text-[12px] tracking-[0.2em] text-white transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-12 text-black rounded-lg font-black uppercase text-[12px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: themeColor }}
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-[8px] w-full max-w-md overflow-hidden shadow-2xl font-inter animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                Add <span style={{ color: themeColor }}>Task</span>
              </h3>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">
                Slot: {selectedSlot?.label}
              </p>
            </div>
            <form onSubmit={handleAddTask} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Select Customer (Optional)
                </label>
                <Select
                  value={newTask.customerId}
                  onChange={(e) =>
                    setNewTask({ ...newTask, customerId: e.target.value })
                  }
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-lg px-4 text-white focus:outline-none focus:border-white/20 transition-colors cursor-pointer appearance-none"
                >
                  <option value="" className="bg-card">
                    -- No Customer --
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card">
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Task Title *
                </label>
                <Input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="e.g. Practice Session"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-lg px-4 text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Description / Notes
                </label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Additional details..."
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-[8px] p-4 text-white placeholder-neutral-600 focus:outline-none focus:border-white/20 transition-colors resize-none"
                />
              </div>

              <div className="pt-4 flex gap-4">
                <Button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-black uppercase text-[12px] tracking-[0.2em] text-white transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-12 text-black rounded-lg font-black uppercase text-[12px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: themeColor }}
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Save Task"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
