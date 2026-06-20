import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  Banknote,
  MapPin,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import axios from "axios";
import { useDispatch } from "react-redux";
import { restoreAuth, logout } from "@redux/slices/authSlice";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";import { Button, Input } from "@kridaz/ui";


const ManualBookingModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [turfs, setTurfs] = useState([]);
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [customerData, setCustomerData] = useState({
    name: "",
    email: "",
    phone: "",
    paymentMethod: "CASH",
  });

  useEffect(() => {
    if (isOpen) {
      fetchTurfs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTurf && selectedDate) {
      fetchSlots();
    }
  }, [selectedTurf, selectedDate]);

  const fetchTurfs = async () => {
    try {
      const res = await axiosInstance.get("/api/owner/turf/owner/all");
      setTurfs(res.data || []);
    } catch (err) {
      toast.error("Failed to load grounds");
    }
  };

  const fetchSlots = async () => {
    if (!selectedTurf || !selectedDate) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/api/user/turf/timeSlot?date=${selectedDate}&turfId=${selectedTurf._id}`
      );
      const { timeSlots: turfDetails, bookedTime } = res.data;

      // Calculate available slots based on generatedSlots and bookedTime
      if (turfDetails && turfDetails.generatedSlots) {
        const slots = turfDetails.generatedSlots
          .filter((slot) => slot.isActive)
          .map((slot) => {
            const isBooked = bookedTime.some((booking) => {
              const bStart = format(parseISO(booking.startTime), "hh:mm a");
              return bStart === slot.startTime;
            });
            return {
              ...slot,
              isBooked,
            };
          });
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    } catch (err) {
      toast.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTurf || !selectedSlot || !customerData.name) {
      return toast.error("Please fill all required fields");
    }

    setLoading(true);

    const performBooking = async (retryCount = 0) => {
      try {
        await axiosInstance.post("/api/booking/owner/manual", {
          turfId: selectedTurf._id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          selectedTurfDate: selectedDate,
          totalPrice: selectedTurf.pricePerHour,
          paymentMethod: customerData.paymentMethod,
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
        });

        toast.success("Manual booking successful!");
        onClose();
        // Reset state
        setStep(1);
        setSelectedTurf(null);
        setSelectedSlot(null);
        setCustomerData({
          name: "",
          email: "",
          phone: "",
          paymentMethod: "CASH",
        });
      } catch (err) {
        if (
          err.response?.status === 401 &&
          err.response?.data?.message === "TOKEN_EXPIRED" &&
          retryCount < 1
        ) {
          try {
            const refreshUrl = `${import.meta.env.VITE_API_URL || ""}/api/user/auth/refresh`;
            const { data } = await axios.post(
              refreshUrl,
              {},
              { withCredentials: true }
            );
            if (data.token) {
              dispatch(restoreAuth({ token: data.token }));
              // Small delay to ensure state updates
              await new Promise((resolve) => setTimeout(resolve, 100));
              return performBooking(retryCount + 1);
            }
          } catch (refreshErr) {
            toast.error("Session expired. Please log in again.");
            dispatch(logout());
            return;
          }
        }
        toast.error(err.response?.data?.message || "Booking failed");
      }
    };

    await performBooking();
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-card border border-white/10 rounded-[16px] overflow-hidden shadow-[var(--shadow-2)] relative">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-background">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <div>
              <h2 className="text-[20px] font-bold uppercase tracking-tight text-white font-open-sans">
                Manual <span className="text-primary">Booking</span>
              </h2>
              <p className="text-[10px] font-medium text-white/70 uppercase tracking-[0.2em] mt-0.5 font-inter">
                Console Step {step} of 3
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="p-2 hover:bg-card rounded-[16px] transition-all text-white/70 hover:text-white border border-transparent hover:border-white/10"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar bg-background">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {turfs.map((turf) => (
                <Button
                  key={turf._id}
                  onClick={() => {
                    setSelectedTurf(turf);
                    setStep(2);
                  }}
                  className={`flex items-start gap-4 p-4 rounded-[16px] border transition-all text-left group ${selectedTurf?._id === turf._id ? "bg-primary/5 border-primary" : "bg-background border-white/10 hover:border-primary/30"}`}
                >
                  <div className="w-14 h-14 rounded-[16px] bg-card overflow-hidden flex-shrink-0 border border-white/10">
                    <img
                      src={turf.images[0]}
                      alt={turf.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-[13px] uppercase tracking-wider text-white font-inter">
                      {turf.name}
                    </h3>
                    <p className="text-[9px] text-white/70 flex items-center gap-1 mt-1 uppercase font-bold tracking-widest">
                      <MapPin size={10} className="text-primary" />{" "}
                      {turf.location}
                    </p>
                    <p className="text-[12px] font-black text-primary mt-2 tracking-widest font-inter">
                      Rs {turf.pricePerHour}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-[0.15em] ml-1 font-inter">
                    Booking Date
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
                      size={16}
                    />
                    <Input
                      type="date"
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="w-full bg-card border border-white/10 rounded-[16px] py-3 pl-11 pr-4 text-[13px] focus:outline-none focus:border-primary font-bold text-white font-inter appearance-none"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-[0.15em] ml-1 font-inter">
                    Active Facility
                  </label>
                  <div className="w-full bg-card border border-white/10 rounded-[16px] py-3 px-4 text-[13px] font-bold flex justify-between items-center text-white font-inter">
                    <span className="uppercase truncate max-w-[120px]">
                      {selectedTurf?.name}
                    </span>
                    <Button
                      onClick={() => setStep(1)}
                      className="text-primary text-[10px] hover:underline font-black tracking-widest"
                    >
                      SWITCH
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-[0.15em] ml-1 font-inter">
                  Schedule Matrix
                </label>
                {loading ? (
                  <div className="py-10 text-center animate-pulse text-[10px] font-black text-white/70 uppercase tracking-widest font-inter">
                    Accessing Ground Feed...
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {availableSlots.map((slot, i) => (
                      <Button
                        key={i}
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex flex-col items-center justify-center min-h-[38px] rounded-[16px] transition-all font-inter ${selectedSlot === slot ? "bg-gradient-to-r from-secondary to-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none text-black" : slot.isBooked ? "bg-red-500/10 border border-red-500/20 text-red-500 cursor-not-allowed opacity-50" : "bg-card border border-white/10 hover:border-primary/50 text-white/70"}`}
                      >
                        <span className="text-[10px] font-black tracking-tighter">
                          {slot.startTime}
                        </span>
                        {selectedSlot === slot && (
                          <span className="text-[8px] font-bold opacity-80">
                            Rs {selectedTurf?.pricePerHour}
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-[0.15em] ml-1 font-inter">
                    Player Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70"
                      size={16}
                    />
                    <Input
                      type="text"
                      className="w-full bg-card border border-white/10 rounded-[16px] py-3 pl-11 pr-4 text-[13px] focus:outline-none focus:border-primary font-bold text-white font-inter"
                      placeholder="ENTER FULL NAME"
                      value={customerData.name}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-[0.15em] ml-1 font-inter">
                    Contact Number
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70"
                      size={16}
                    />
                    <Input
                      type="tel"
                      className="w-full bg-card border border-white/10 rounded-[16px] py-3 pl-11 pr-4 text-[13px] focus:outline-none focus:border-primary font-bold text-white font-inter"
                      placeholder="+91 XXXXX XXXXX"
                      value={customerData.phone}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-[0.15em] ml-1 font-inter">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70"
                      size={16}
                    />
                    <Input
                      type="email"
                      className="w-full bg-card border border-white/10 rounded-[16px] py-3 pl-11 pr-4 text-[13px] focus:outline-none focus:border-primary font-bold text-white font-inter"
                      placeholder="PLAYER@EXAMPLE.COM"
                      value={customerData.email}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-white/70 uppercase tracking-[0.15em] ml-1 font-inter">
                  Settlement Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() =>
                      setCustomerData({
                        ...customerData,
                        paymentMethod: "CASH",
                      })
                    }
                    className={`flex items-center gap-3 p-3 rounded-[16px] border transition-all ${customerData.paymentMethod === "CASH" ? "bg-primary/5 border-primary" : "bg-card border-white/10 hover:border-primary/30"}`}
                  >
                    <Banknote
                      size={18}
                      className={
                        customerData.paymentMethod === "CASH"
                          ? "text-primary"
                          : "text-white/70"
                      }
                    />
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white font-inter">
                        CASH / OFFLINE
                      </p>
                    </div>
                  </Button>
                  <Button
                    onClick={() =>
                      setCustomerData({
                        ...customerData,
                        paymentMethod: "ONLINE",
                      })
                    }
                    className={`flex items-center gap-3 p-3 rounded-[16px] border transition-all ${customerData.paymentMethod === "ONLINE" ? "bg-primary/5 border-primary" : "bg-card border-white/10 hover:border-primary/30"}`}
                  >
                    <CreditCard
                      size={18}
                      className={
                        customerData.paymentMethod === "ONLINE"
                          ? "text-primary"
                          : "text-white/70"
                      }
                    />
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white font-inter">
                        ONLINE / UPI
                      </p>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/10 bg-background flex items-center justify-between">
          <div className="hidden sm:block">
            {selectedTurf && (
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold text-white/70 uppercase tracking-[0.2em] font-inter">
                  Total Settlement
                </p>
                <p className="text-[20px] font-bold text-primary font-open-sans">
                  Rs {selectedTurf.pricePerHour}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-[16px] bg-card text-white font-bold uppercase tracking-widest text-[11px] hover:bg-card transition-all border border-white/10 font-inter"
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                disabled={!selectedTurf || (step === 2 && !selectedSlot)}
                onClick={() => setStep(step + 1)}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-[16px] bg-white text-black font-bold uppercase tracking-widest text-[11px] hover:bg-gradient-to-r from-secondary to-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none transition-all disabled:opacity-20 font-inter"
              >
                Continue
              </Button>
            ) : (
              <Button
                disabled={loading || !customerData.name}
                onClick={handleSubmit}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-[16px] bg-gradient-to-r from-secondary to-primary shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none text-black font-bold uppercase tracking-widest text-[11px] hover:opacity-90 transition-all shadow-[0_0_20px_rgba(204,255,0,0.15)] disabled:opacity-50 font-inter"
              >
                {loading ? "Processing..." : "Confirm Booking"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualBookingModal;
