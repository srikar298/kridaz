import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Check,
  X,
  ChevronDown,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input, Select } from "@kridaz/ui";
import LocationVenuePicker from "../../../shared/components/modals/LocationVenuePicker";

import {
  useCreateMatchRequestMutation,
  useGetUserOnDemandBookingsQuery,
} from "../../../redux/api/professionalApi";

export default function MatchRequestModal({
  isOpen,
  onClose,
  initialSelectedRoles = [],
}) {
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);

  // States
  const [selectedRoles, setSelectedRoles] = useState(initialSelectedRoles);
  const [budget, setBudget] = useState(1000);
  const [matchDate, setMatchDate] = useState("");
  const [matchStartTime, setMatchStartTime] = useState("");
  const [matchEndTime, setMatchEndTime] = useState("");
  const [expiresInSeconds] = useState(40);

  const [grounds, setGrounds] = useState([]);
  const [selectedGroundId, setSelectedGroundId] = useState("");
  const [customLocation, setCustomLocation] = useState({
    latitude: "",
    longitude: "",
    address: "",
  });
  const [showLocationSearchModal, setShowLocationSearchModal] = useState(false);

  // RTK Query Mutations & Queries
  const [createMatchRequest, { isLoading: isCreatingRequest }] =
    useCreateMatchRequestMutation();
  const { refetch: refetchBookings } = useGetUserOnDemandBookingsQuery(
    undefined,
    {
      skip: !isLoggedIn,
    }
  );

  const userLocation = useSelector((state) => state.ui?.userLocation);

  useEffect(() => {
    if (isOpen) {
      setSelectedRoles(initialSelectedRoles);
      fetchGrounds();

      // Auto-set Date & Time
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      setMatchDate(`${year}-${month}-${day}`);

      const startH = String(now.getHours()).padStart(2, "0");
      const startM = String(now.getMinutes()).padStart(2, "0");
      setMatchStartTime(`${startH}:${startM}`);

      const later = new Date(now.getTime() + 60 * 60 * 1000);
      const endH = String(later.getHours()).padStart(2, "0");
      const endM = String(later.getMinutes()).padStart(2, "0");
      setMatchEndTime(`${endH}:${endM}`);

      // Auto-set Location
      if (userLocation && userLocation.lat && userLocation.lng) {
        setSelectedGroundId("custom");
        setCustomLocation({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          address: userLocation.city ? `${userLocation.city}${userLocation.state ? `, ${userLocation.state}` : ""}` : "Your current location",
        });
      } else {
        setSelectedGroundId("");
        setCustomLocation({ latitude: "", longitude: "", address: "" });
      }
    }
  }, [isOpen, initialSelectedRoles, userLocation]);

  const fetchGrounds = async () => {
    try {
      const res = await axiosInstance.get("/api/turf/all-turfs");
      setGrounds(res.data.data || []);
    } catch (error) {
      console.error("Error fetching grounds:", error);
    }
  };

  const handleToggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleLocationVenueSelect = (data) => {
    if (data.type === "VENUE") {
      setSelectedGroundId(data.venueId);
      setCustomLocation({ latitude: "", longitude: "", address: "" });
    } else if (data.type === "CUSTOM") {
      setSelectedGroundId("custom");
      setCustomLocation({
        latitude: data.lat,
        longitude: data.lng,
        address: data.displayName,
      });
    }
    setShowLocationSearchModal(false);
  };

  const handleRequestMatch = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      toast.error("Please login to place a request.");
      navigate("/login");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role to hire.");
      return;
    }

    if (!selectedGroundId) {
      toast.error("Please select a venue or location.");
      return;
    }

    if (selectedGroundId === "custom" && !customLocation.address) {
      toast.error("Please specify your custom location.");
      return;
    }

    if (!matchDate || !matchStartTime || !matchEndTime) {
      toast.error("Please provide valid schedule details.");
      return;
    }

    const payload = {
      roles: selectedRoles,
      budget,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      matchDate,
      matchStartTime,
      matchEndTime,
    };

    if (selectedGroundId && selectedGroundId !== "custom") {
      payload.groundId = selectedGroundId;
    } else {
      payload.customLocation = {
        latitude: parseFloat(customLocation.latitude),
        longitude: parseFloat(customLocation.longitude),
        address: customLocation.address || "Custom Geocoded Location",
      };
    }

    try {
      const res = await createMatchRequest(payload).unwrap();
      if (res.success) {
        toast.success(
          "Match request placed! We'll notify you once a pro accepts."
        );
        setSelectedRoles([]);
        setSelectedGroundId("");
        setCustomLocation({ latitude: "", longitude: "", address: "" });
        onClose();
        refetchBookings();
      }
    } catch (err) {
      let errorMessage = err.data?.message || "Failed to create match request";
      
      if (errorMessage.toLowerCase().includes("no professionals found")) {
        errorMessage = "Oops! No professionals available right now. 🏏";
      }

      toast.error(errorMessage);
      if (
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("balance")
      ) {
        setTimeout(() => {
          navigate("/wallet");
        }, 1000);
      }
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "Select Date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDisplayTime = (timeStr) => {
    if (!timeStr) return "Select Time";
    const [h, m] = timeStr.split(":");
    const d = new Date();
    d.setHours(h);
    d.setMinutes(m);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => !isCreatingRequest && onClose()}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md bg-[#0a0a0a] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/5 p-5 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div>
              <h2
                className="text-lg font-bold uppercase tracking-tight text-white"
                style={{ fontFamily: "'Open Sans', sans-serif" }}
              >
                Find Professional
              </h2>
              <p
                className="text-[10px] text-white/50"
                style={{ fontFamily: "'Inter 28pt Light', sans-serif" }}
              >
                On-demand matching for coaches, umpires & scorers.
              </p>
            </div>
          </div>
          <Button
            onClick={() => !isCreatingRequest && onClose()}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors bg-white/5"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Modal Body */}
        {isCreatingRequest ? (
          <div className="p-10 sm:p-16 flex flex-col items-center justify-center space-y-8 min-h-[400px]">
            <div className="relative flex items-center justify-center w-32 h-32">
              <div className="absolute inset-0 border-[3px] border-primary rounded-full animate-ping opacity-75"></div>
              <div
                className="absolute inset-2 border-[3px] border-primary rounded-full animate-ping opacity-60"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="absolute inset-4 border-[3px] border-white/20 rounded-full animate-ping opacity-50"
                style={{ animationDelay: "0.4s" }}
              ></div>
              <div className="relative bg-[#0d0d0e] rounded-full p-5 border border-white/10 z-10 shadow-[0_0_40px_rgba(191,243,103,0.4)]">
                <Search size={40} className="text-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest animate-pulse">
                Finding Pros...
              </h3>
              <p className="text-xs sm:text-sm text-white/50 max-w-[280px] mx-auto leading-relaxed">
                Analyzing your request and matching with the best professionals
                nearby
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            <form onSubmit={handleRequestMatch} className="p-5 sm:p-6 space-y-5">
              {/* Roles Selection */}
              <div>
                <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">
                  Roles
                </label>
                <div
                  className="flex overflow-x-auto gap-2 pb-2 [&::-webkit-scrollbar]:hidden"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {[
                    "COACH",
                    "UMPIRE",
                    "PHYSIO",
                    "SCORER",
                    "STREAMER",
                    "COMMENTATOR",
                    "CHEERLEADER",
                  ].map((roleVal) => {
                    const isSelected = selectedRoles.includes(roleVal);
                    return (
                      <Button
                        key={roleVal}
                        type="button"
                        onClick={() => handleToggleRole(roleVal)}
                        className={`px-4 py-2 shrink-0 rounded-[8px] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-primary/15 border border-primary text-primary"
                            : "bg-white/5 border border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                        {roleVal}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Venue Selector */}
              <div>
                <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">
                  Venue / Location
                </label>
                <Button
                  type="button"
                  onClick={() => setShowLocationSearchModal(true)}
                  className="w-full bg-[#111111] hover:bg-[#1a1a1a] border border-white/10 rounded-[16px] p-4 text-xs font-bold text-white transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="truncate text-left">
                      {selectedGroundId === "custom" && customLocation.address
                        ? customLocation.address
                        : selectedGroundId && grounds.find(g => g._id === selectedGroundId)
                        ? `${grounds.find(g => g._id === selectedGroundId).name} - ${grounds.find(g => g._id === selectedGroundId).city || ""}`.replace(/- $/g, "").trim()
                        : "Search by Location / Venue"}
                    </span>
                  </div>
                  <ChevronDown size={16} className="text-white/50 shrink-0" />
                </Button>
              </div>

              {/* Schedule / Timing Selection */}
              <div>
                <label className="text-[10px] font-black uppercase text-white/50 tracking-wider block mb-2">
                  Match Schedule
                </label>
                <div className="flex items-center bg-card border border-white/10 rounded-lg divide-x divide-white/10 overflow-hidden">
                  <div className="flex-[1.2] p-2.5 relative group hover:bg-white/5 transition-colors">
                    <span className="text-[8px] text-primary font-bold uppercase mb-1 flex items-center gap-1">
                      <Calendar size={10} /> Date
                    </span>
                    <div className="text-[11px] sm:text-xs font-bold text-white group-hover:text-primary transition-colors truncate">
                      {formatDisplayDate(matchDate)}
                    </div>
                    <Input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      onClick={(e) =>
                        e.target.showPicker && e.target.showPicker()
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                  <div className="flex-1 p-2.5 relative group hover:bg-white/5 transition-colors">
                    <span className="text-[8px] text-white/40 font-bold uppercase mb-1 flex items-center gap-1">
                      <Clock size={10} /> Start
                    </span>
                    <div className="text-[11px] sm:text-xs font-bold text-white truncate">
                      {formatDisplayTime(matchStartTime)}
                    </div>
                    <Input
                      type="time"
                      value={matchStartTime}
                      onChange={(e) => setMatchStartTime(e.target.value)}
                      onClick={(e) =>
                        e.target.showPicker && e.target.showPicker()
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                  <div className="flex-1 p-2.5 relative group hover:bg-white/5 transition-colors">
                    <span className="text-[8px] text-white/40 font-bold uppercase mb-1 flex items-center gap-1">
                      <Clock size={10} /> End
                    </span>
                    <div className="text-[11px] sm:text-xs font-bold text-white truncate">
                      {formatDisplayTime(matchEndTime)}
                    </div>
                    <Input
                      type="time"
                      value={matchEndTime}
                      onChange={(e) => setMatchEndTime(e.target.value)}
                      onClick={(e) =>
                        e.target.showPicker && e.target.showPicker()
                      }
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Budget Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black uppercase text-white/50 tracking-wider">
                    Budget (₹)
                  </label>
                  <span className="text-xs font-bold text-primary">
                    ₹{budget}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold text-white/40 w-6 shrink-0">
                      Max
                    </span>
                    <div className="flex-1 relative">
                      <Input
                        type="range"
                        min={500}
                        max={10000}
                        step={100}
                        value={budget}
                        onChange={(e) => setBudget(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(191,243,103,0.4)] [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isCreatingRequest}
                className="w-full py-4 rounded-lg bg-gradient-to-r from-primary to-primary text-black font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(191,243,103,0.2)] hover:shadow-[0_4px_25px_rgba(191,243,103,0.4)]"
              >
                {isCreatingRequest ? (
                  <>
                    <Loader2 className="animate-spin text-black" size={16} />
                    Initiating Match...
                  </>
                ) : (
                  "⚡ FIND PRO'S"
                )}
              </Button>

              {/* Info Footer */}
              <p className="text-[9px] text-white/30 text-center leading-relaxed">
                Your max budget will be reserved from your wallet as escrow.
                After a match is confirmed, check your{" "}
                <Link
                  to="/booking-history?subTab=professionals"
                  className="text-primary underline hover:text-primary/80"
                >
                  Booking History
                </Link>{" "}
                for OTP verification and status updates.
              </p>
            </form>
          </div>
        )}
      </motion.div>
      <LocationVenuePicker
        isOpen={showLocationSearchModal}
        onClose={() => setShowLocationSearchModal(false)}
        onSelect={handleLocationVenueSelect}
      />
    </div>
  );
}
