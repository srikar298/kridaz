import { useState, useEffect, useRef } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";import { Button, Input, Select, Textarea } from "@kridaz/ui";

import {
  Send,
  Users,
  User,
  Search,
  Bell,
  Smartphone,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export const PushComposer = () => {
  const [targetType, setTargetType] = useState("ALL"); // "ALL" or "SINGLE"
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "SYSTEM",
    link: "",
  });

  // Debounced user search
  useEffect(() => {
    if (targetType !== "SINGLE" || searchQuery.trim().length < 2) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingUsers(true);
        const res = await axiosInstance.get(
          `/api/admin/users/all?search=${searchQuery}&limit=10`
        );
        setUsers(res.data.users || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Error searching users:", err);
      } finally {
        setLoadingUsers(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, targetType]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.name);
    setShowDropdown(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error("Please fill in both the title and message fields.");
      return;
    }

    if (targetType === "SINGLE" && !selectedUser) {
      toast.error("Please select a target user.");
      return;
    }

    try {
      setSending(true);
      const payload = {
        recipientId: targetType === "ALL" ? "ALL" : selectedUser.id,
        title: formData.title,
        message: formData.message,
        type: formData.type,
        link: formData.link,
        metadata: {
          sentViaAdmin: "true",
          timestamp: new Date().toISOString(),
        },
      };

      const res = await axiosInstance.post(
        "/api/admin/notifications/send",
        payload
      );
      const summary = res.data.summary;
      const successMessage =
        res.data.message || "Push notification sent successfully!";

      if (summary?.tokens > 0 && !summary.mock && summary.success === 0) {
        toast.error(successMessage);
      } else if (summary?.failure > 0) {
        toast(successMessage);
      } else {
        toast.success(successMessage);
      }

      // Reset form
      setFormData({
        title: "",
        message: "",
        type: "SYSTEM",
        link: "",
      });
      setSelectedUser(null);
      setSearchQuery("");
    } catch (err) {
      console.error("Error sending push notification:", err);
      toast.error(
        err.response?.data?.message || "Failed to dispatch push notification."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 items-start">
      {/* Composer Form - Left */}
      <div className="lg:col-span-7 bg-card border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="p-2 bg-lime-500/10 rounded-lg text-lime-500">
            <Bell size={20} className="animate-bounce" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-bebas tracking-wider text-white">
              PUSH COMPOSER
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Broadcast alerts or target individual players directly on their
              devices.
            </p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-5">
          {/* Target Audience Select */}
          <div className="space-y-3">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Target Audience
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => {
                  setTargetType("ALL");
                  setSelectedUser(null);
                  setSearchQuery("");
                }}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-semibold text-xs uppercase tracking-wider ${
                  targetType === "ALL"
                    ? "border-lime-500 bg-lime-500/10 text-lime-400 font-bold shadow-[0_0_15px_rgba(132,204,22,0.15)]"
                    : "border-white/5 bg-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                }`}
              >
                <Users size={16} />
                All Users (Broadcast)
              </Button>
              <Button
                type="button"
                onClick={() => setTargetType("SINGLE")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-semibold text-xs uppercase tracking-wider ${
                  targetType === "SINGLE"
                    ? "border-lime-500 bg-lime-500/10 text-lime-400 font-bold shadow-[0_0_15px_rgba(132,204,22,0.15)]"
                    : "border-white/5 bg-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                }`}
              >
                <User size={16} />
                Specific User
              </Button>
            </div>
          </div>

          {/* Individual User Selection Dropdown */}
          {targetType === "SINGLE" && (
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Search User
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedUser && e.target.value !== selectedUser.name) {
                      setSelectedUser(null);
                    }
                  }}
                  placeholder="Type name or email to search..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all text-sm"
                />
                {selectedUser && (
                  <CheckCircle2
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lime-500"
                    size={18}
                  />
                )}
              </div>

              {/* Autocomplete dropdown */}
              {showDropdown && users.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1.5 bg-[#161616] border border-white/10 rounded-xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto custom-scrollbar">
                  {users.map((user) => (
                    <Button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full text-left px-4 py-3 hover:bg-lime-500/10 border-b border-white/5 last:border-b-0 flex flex-col gap-0.5 transition-colors"
                    >
                      <span className="text-white text-sm font-semibold">
                        {user.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user.email} • {user.phone || "No phone"}
                      </span>
                    </Button>
                  ))}
                </div>
              )}

              {loadingUsers && (
                <div className="absolute right-3.5 top-9.5">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Notification Title
              </label>
              <Input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Mega Discount this Sunday! ⚡"
                maxLength={45}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all text-sm placeholder-gray-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Notification Message
              </label>
              <Textarea
                required
                rows={3}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Write the background push message here..."
                maxLength={180}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all text-sm placeholder-gray-600 resize-none custom-scrollbar"
              />
              <div className="text-right text-[10px] text-gray-600 mt-1 font-mono">
                {formData.message.length}/180 chars
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Notification Type
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full bg-[#161616] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition-all text-sm"
                >
                  <option value="SYSTEM">System Alert</option>
                  <option value="BOOKING">Booking Announcement</option>
                  <option value="PAYMENT">Cashback / Offer</option>
                  <option value="SUPPORT">Support Ticket</option>
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Deep Link / Navigation Path
                </label>
                <Input
                  type="text"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  placeholder="e.g. /reels or /booking/details"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all text-sm placeholder-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={sending}
              className="w-full py-3.5 rounded-xl bg-lime-500 text-black font-bold hover:bg-lime-400 transition-all shadow-[0_0_25px_rgba(132,204,22,0.25)] flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {sending ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  DISPATCHING NOTIFICATION...
                </>
              ) : (
                <>
                  <Send size={16} />
                  SEND PUSH NOTIFICATION
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Device Mockup Preview - Right */}
      <div className="lg:col-span-5 flex justify-center lg:sticky lg:top-24">
        <div className="w-[280px] h-[560px] bg-black border-[6px] border-card rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col">
          {/* Speaker & camera slot */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-card rounded-full mr-2" />
            <div className="w-12 h-1 bg-card rounded-full" />
          </div>

          {/* High Fidelity Wallpaper */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-950 via-slate-900 to-[#0e1726] opacity-90 z-0" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent z-0 animate-pulse" />

          {/* Mock Status Bar */}
          <div className="h-10 px-6 pt-4 flex items-center justify-between text-[10px] text-white/80 font-semibold z-10 font-mono">
            <span>22:45</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <Smartphone size={10} />
            </div>
          </div>

          {/* Lockscreen date and time */}
          <div className="flex flex-col items-center justify-center mt-6 z-10 text-white select-none">
            <span className="text-4xl font-extralight tracking-tight">
              22:45
            </span>
            <span className="text-[10px] tracking-widest font-bold uppercase text-white/50 mt-1 font-bebas">
              Saturday, May 30
            </span>
          </div>

          {/* Mobile Push Notification Mockup Card */}
          <div className="mt-8 px-3 z-10 w-full">
            <div className="w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl select-none animate-fade-in transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-gradient-to-tr from-lime-500 to-emerald-400 text-black rounded-md flex items-center justify-center font-black text-[9px] shadow-[0_0_10px_rgba(132,204,22,0.3)]">
                    K
                  </div>
                  <span className="text-[10px] font-bold text-white tracking-wide uppercase">
                    Kridaz App
                  </span>
                </div>
                <span className="text-[9px] text-white/40 font-medium">
                  now
                </span>
              </div>
              <h4 className="text-xs font-bold text-white mb-1.5 truncate transition-all duration-200">
                {formData.title || "Announcements 📣"}
              </h4>
              <p className="text-[11px] text-white/70 leading-relaxed break-words font-medium transition-all duration-200">
                {formData.message ||
                  "This is a real-time preview of how your custom push notification card will appear on players' lockscreens."}
              </p>
            </div>
          </div>

          {/* Sparkle decorative */}
          <div className="mt-auto mb-16 flex flex-col items-center justify-center gap-1.5 z-10 text-white/30">
            <Sparkles size={18} className="animate-spin duration-[12s]" />
            <span className="text-[8px] font-bold tracking-widest uppercase font-mono">
              Real-time Preview
            </span>
          </div>

          {/* Bottom Swipe Bar */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/40 rounded-full z-20" />
        </div>
      </div>
    </div>
  );
};

export default PushComposer;
