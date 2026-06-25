import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetTurfDetailsQuery } from "@redux/api/turfApi";
import {
  IndianRupee,
  ShieldCheck,
  Clock,
  Calendar,
  MapPin,
  ChevronLeft,
  Zap,
  Wallet,
  Smartphone,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  PlusCircle,
  Tag,
  Info,
  Shield,
  Lock,
} from "lucide-react";
import { format } from "date-fns";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { handlePayment, createOrder } from "@infrastructure/razorpay";
import GlobalBackButton from "@/shared/components/GlobalBackButton";
import { Button, Input } from "@kridaz/ui";


const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

// Helper: parse "01:00 PM" slot time + date into ISO string
const buildDateTime = (dateStr, timeStr, addHrs = 0) => {
  const base = new Date(dateStr);
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;
  base.setHours(hours + addHrs, minutes, 0, 0);
  return base.toISOString();
};

const CheckoutPage = () => {
  const { turfId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((/** @type {any} */ state) => state.auth);

  // Fetch real data
  const { data: turfData } = useGetTurfDetailsQuery(turfId, { skip: !turfId });
  const turf = turfData?.turf || turfData;

  // Extract booking data from location state or fallback
  const bookingData = location.state || {};
  const {
    turfName,
    selectedDate,
    startTime,
    duration,
    amount,
    location: turfLocation,
  } = bookingData;

  const [paymentPercentage, setPaymentPercentage] = useState(100);
  const [paymentMode, setPaymentMode] = useState("WALLET");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(
    user?.walletBalance || 0
  );
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [step, setStep] = useState("PAYMENT");
  const [bookingId, setBookingId] = useState(null);

  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axiosInstance.get("/api/settings/payout");
        setSettings(response.data.payoutSettings);
      } catch (err) {
        console.error("Failed to fetch payout settings:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await axiosInstance.get("/api/user/wallet/data");
        if (response.data) {
          setCurrentBalance(
            response.data.usableBalance ?? response.data.balance
          );
        }
      } catch (err) {
        console.error("Failed to fetch wallet data:", err);
      }
    };
    if (user) {
      fetchWallet();
    }
  }, [user]);

  // Calculations
  const fetchedPrice = (turf?.pricePerHour || 0) * (duration || 1);
  const venueCharges = amount || fetchedPrice;
  const serviceCharge = Math.round(venueCharges * 0.0125) || 25;
  const gstAmount = 0;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = venueCharges + serviceCharge + gstAmount - discount;
  const amountToPay = Math.round(total * (paymentPercentage / 100));
  const balanceAtVenue = total - amountToPay;

  useEffect(() => {
    if (!turfId || !startTime || !selectedDate) {
      toast.error("Checkout interrupted. Redirecting to venue...");
      navigate(`/venue/${turfId}`);
    }
  }, [turfId, startTime, selectedDate, navigate]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidating(true);
    try {
      const res = await axiosInstance.post(
        "/api/user/booking/validate-coupon",
        {
          code: couponCode,
          turfId,
          amount: venueCharges,
        }
      );
      if (res.data.success) {
        setAppliedCoupon({
          code: couponCode,
          discount: res.data.discount,
        });
        toast.success("Coupon applied successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid coupon code");
      setAppliedCoupon(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    const paymentType = paymentPercentage === 100 ? "FULL" : "PARTIAL";
    const advanceAmount = amountToPay;
    const balanceAmount = balanceAtVenue;

    const startISO = buildDateTime(selectedDate, startTime);
    const endISO = buildDateTime(selectedDate, startTime, duration);
    const dateISO = new Date(selectedDate).toISOString();

    try {
      if (paymentMode === "WALLET") {
        const bookingPayload = {
          turfId,
          startTime: startISO,
          endTime: endISO,
          selectedTurfDate: dateISO,
          totalPrice: total,
          advanceAmount,
          balanceAmount,
          paymentType,
          paymentPercentage,
          ...(appliedCoupon?.code && { couponCode: appliedCoupon.code }),
        };

        const res = await axiosInstance.post(
          "/api/user/booking/book-with-wallet",
          bookingPayload
        );

        if (res.data.success) {
          setCurrentBalance(res.data.newBalance ?? currentBalance);
          setBookingId(res.data.bookingId);
          setStep("SUCCESS");
          toast.success("Booking confirmed!");
        }
      } else {
        const { order } = await createOrder(advanceAmount);
        const paymentResult = await handlePayment(order, user);

        const res = await axiosInstance.post(
          "/api/user/booking/verify-payment",
          {
            turfId,
            startTime: startISO,
            endTime: endISO,
            selectedTurfDate: dateISO,
            totalPrice: total,
            advanceAmount,
            balanceAmount,
            paymentType,
            paymentId: paymentResult.razorpay_payment_id,
            orderId: paymentResult.razorpay_order_id,
            razorpay_signature: paymentResult.razorpay_signature,
            paymentMethod: paymentMode,
          }
        );

        if (res.data.success) {
          setBookingId(res.data.bookingId);
          setStep("SUCCESS");
          toast.success("Payment successful!");
        }
      }
    } catch (error) {
      console.error("Payment Error:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Payment failed. Please try again.";
      toast.error(msg);
      if (msg.toLowerCase().includes("insufficient")) {
        navigate("/wallet");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === "SUCCESS") {
    return (
      <div className="bg-background flex items-center justify-center px-1 pt-24 pb-12">
        <svg width="0" height="0" className="hidden">
          <defs>
            <linearGradient
              id="theme-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="var(--secondary)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
        </svg>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black border border-[rgba(255,255,255,0.08)] p-3 rounded-[12px] text-center max-w-xl w-full relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />
          <div className="w-10 h-10 bg-gradient-to-r from-secondary to-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0px_8px_24px_rgba(191,243,103,0.15)]">
            <Check size={20} className="text-background stroke-[3px]" />
          </div>

          <h2 className="text-[16px] font-[700] text-foreground uppercase tracking-tighter mb-1 font-inter">
            Slot Secured!
          </h2>
          <p className="text-[rgba(255,255,255,0.70)] uppercase text-[10px] tracking-widest mb-4">
            Your booking at {turfName} is confirmed.
          </p>

          <div className="grid grid-cols-1 gap-2">
            <Link
              to={`/booking-pass/${bookingId}`}
              className="w-full h-[36px] bg-gradient-to-r from-secondary to-primary text-background rounded-[8px] font-[700] text-[12px] flex items-center justify-center gap-2 shadow-[0px_8px_24px_rgba(191,243,103,0.15)] border-none"
            >
              Download Digital Pass
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/booking-history"
              className="w-full h-[36px] bg-black text-foreground border border-[rgba(255,255,255,0.08)] rounded-[8px] font-[700] text-[12px] flex items-center justify-center gap-2"
            >
              View Booking History
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-background text-white min-h-screen pt-6 pb-12 px-4 md:px-8 font-inter">
      {/* SVG Definitions for global gradient */}
      <svg width="0" height="0" className="hidden">
        <defs>
          <linearGradient id="theme-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--secondary)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
      </svg>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="scale-[0.8] origin-left">
            <GlobalBackButton />
          </div>
          <div>
            <h1 className="text-[14px] font-[800] tracking-widest uppercase font-inter text-foreground mt-0.5">
              CHECKOUT
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Summary */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Hero Image & Turf Title */}
            <div className="bg-black border border-[rgba(255,255,255,0.08)] rounded-[16px] overflow-hidden">
              <div className="h-[120px] md:h-[160px] w-full bg-black">
                <img
                  src={turf?.images?.[0] || "/banner-1.png"}
                  className="w-full h-full object-cover"
                  alt="Venue"
                />
              </div>
              <div className="px-4 py-3">
                <div>
                  <h2 className="text-[14px] font-[700] text-foreground uppercase tracking-wide font-inter">
                    {turfName || turf?.name || "Kridaz Venue"}
                  </h2>
                  <div className="flex items-center gap-3 text-[rgba(255,255,255,0.70)] text-[12px] mt-1.5 font-[600] uppercase tracking-wide">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {startTime} ({duration || 1} hr)
                    </span>
                    <span className="text-[rgba(255,255,255,0.08)]">|</span>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {selectedDate
                        ? format(new Date(selectedDate), "MM/dd/yyyy")
                        : "Select Date"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Plan Section */}
            <div className="bg-black border border-[rgba(255,255,255,0.08)] rounded-[12px] px-4 py-3 flex items-center justify-between">
              <span className="text-[14px] font-[700] text-foreground uppercase tracking-widest font-inter">
                Payment Plan
              </span>
              <div className="flex bg-black rounded-[8px] p-1 border border-[rgba(255,255,255,0.08)]">
                {[30, 50, 100].map((pct) => (
                  <Button
                    key={pct}
                    onClick={() => setPaymentPercentage(pct)}
                    className={`px-3 py-1.5 rounded-[6px] text-[12px] font-[700] uppercase tracking-wider transition-all ${
                      paymentPercentage === pct
                        ? "bg-gradient-to-r from-secondary to-primary text-background shadow-[0px_2px_8px_rgba(191,243,103,0.15)]"
                        : "text-[rgba(255,255,255,0.70)] hover:text-foreground"
                    }`}
                  >
                    {pct === 100 ? "FULL" : `${pct}%`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Details */}
            <div className="bg-black border border-[rgba(255,255,255,0.08)] rounded-[12px] px-4 py-3 space-y-2.5">
              <h3 className="text-[12px] font-[700] text-foreground uppercase tracking-widest font-inter mb-1">
                Price Details
              </h3>
              <div className="flex justify-between text-[14px] text-[rgba(255,255,255,0.70)] font-[400]">
                <span>Slot Price</span>
                <span className="text-foreground">₹ {venueCharges}</span>
              </div>
              <div className="flex justify-between text-[14px] text-[rgba(255,255,255,0.70)] font-[400]">
                <span className="flex items-center gap-1.5">
                  Service Charge{" "}
                  <Info className="w-3.5 h-3.5 text-[rgba(255,255,255,0.70)]" />
                </span>
                <span className="text-foreground">₹ {serviceCharge}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-[14px] font-[600] text-primary">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹ {discount}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] flex justify-between items-center">
                <span className="text-foreground font-[700] uppercase text-[14px] tracking-wide font-inter">
                  Total Amount
                </span>
                <span className="font-[700] text-[20px] tracking-tight text-primary">
                  ₹ {amountToPay}
                </span>
              </div>
              {paymentPercentage !== 100 && (
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[rgba(255,255,255,0.70)] font-[600] uppercase text-[12px] tracking-wide font-inter">
                    Pay at Venue
                  </span>
                  <span className="font-[700] text-[16px] tracking-tight text-foreground">
                    ₹ {balanceAtVenue}
                  </span>
                </div>
              )}
            </div>

            {/* Coupon Box */}
            <div className="bg-black border border-[rgba(255,255,255,0.08)] rounded-[12px] p-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.70)]"
                  />
                  <Input
                    type="text"
                    placeholder="ENTER COUPON CODE"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    className="w-full bg-black border border-[rgba(255,255,255,0.08)] rounded-[8px] py-[10px] pl-[36px] pr-[16px] text-[13px] font-[400] text-foreground outline-none focus:border-secondary transition-all placeholder:text-[rgba(255,255,255,0.70)]"
                  />
                </div>
                <Button
                  onClick={handleApplyCoupon}
                  disabled={isValidating || !couponCode}
                  className="bg-black border border-[rgba(255,255,255,0.08)] text-foreground px-5 rounded-[8px] text-[12px] font-[700] uppercase tracking-widest disabled:opacity-40"
                >
                  {isValidating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "APPLY"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Plan & Payment Method */}
          <div className="lg:col-span-5 space-y-4 pb-4">
            {/* Payment Method */}
            <div className="bg-black border border-[rgba(255,255,255,0.08)] rounded-[16px] p-4 md:p-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Wallet */}
                <Button
                  onClick={() => setPaymentMode("WALLET")}
                  className={`relative px-2 py-4 rounded-[12px] border transition-all flex flex-col items-center justify-center gap-2 text-center ${paymentMode === "WALLET" ? "bg-black border-primary" : "bg-black border-[rgba(255,255,255,0.08)]"}`}
                >
                  {paymentMode === "WALLET" && (
                    <div className="absolute top-2 right-2">
                      <Check
                        className="w-4 h-4"
                        style={{ stroke: "url(#theme-gradient)" }}
                      />
                    </div>
                  )}
                  <div
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${paymentMode === "WALLET" ? "bg-gradient-to-r from-secondary to-primary text-background" : "bg-black border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.70)]"}`}
                  >
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <div
                      className={`text-[10px] whitespace-nowrap font-[700] uppercase tracking-wide ${paymentMode === "WALLET" ? "text-foreground" : "text-[rgba(255,255,255,0.70)]"}`}
                    >
                      Wallet
                    </div>
                    <div className="text-[10px] text-[rgba(255,255,255,0.70)] font-[500] mt-0.5">
                      ₹{currentBalance}
                    </div>
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-background text-[9px] font-[800] px-2 py-0.5 rounded-[4px] uppercase whitespace-nowrap shadow-sm">
                    {settings?.cashbackPercentage || 5}% BACK
                  </div>
                </Button>

                {/* UPI */}
                <Button
                  onClick={() => setPaymentMode("UPI")}
                  className={`relative px-2 py-4 rounded-[12px] border transition-all flex flex-col items-center justify-center gap-2 text-center ${paymentMode === "UPI" ? "bg-black border-primary" : "bg-black border-[rgba(255,255,255,0.08)]"}`}
                >
                  {paymentMode === "UPI" && (
                    <div className="absolute top-2 right-2">
                      <Check
                        className="w-4 h-4"
                        style={{ stroke: "url(#theme-gradient)" }}
                      />
                    </div>
                  )}
                  <div
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center ${paymentMode === "UPI" ? "bg-gradient-to-r from-secondary to-primary text-background" : "bg-black border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.70)]"}`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div
                      className={`text-[10px] whitespace-nowrap font-[700] uppercase tracking-wide ${paymentMode === "UPI" ? "text-foreground" : "text-[rgba(255,255,255,0.70)]"}`}
                    >
                      Instant UPI
                    </div>
                  </div>
                </Button>
              </div>

              {/* Error or Pay Now */}
              <div className="pt-6">
                {paymentMode === "WALLET" && currentBalance < amountToPay ? (
                  <>
                    <div className="border border-[rgba(255,255,255,0.08)] bg-black rounded-[12px] p-4 flex gap-3 items-center mb-4">
                      <Info className="text-[rgba(255,255,255,0.70)] w-5 h-5 shrink-0" />
                      <p className="text-[12px] text-[rgba(255,255,255,0.70)] font-[400] leading-snug">
                        Your wallet balance is insufficient for this booking.
                        <br />
                        Required: ₹{amountToPay}
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate("/wallet")}
                      className="w-full h-[48px] bg-gradient-to-r from-secondary to-primary text-background rounded-[12px] flex items-center justify-center px-4 font-[700] text-[14px] md:text-[16px] transition-all gap-2 tracking-wide shadow-[0px_8px_24px_rgba(191,243,103,0.15)] border-none"
                    >
                      <PlusCircle className="w-4 h-4" /> RECHARGE WALLET
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="w-full h-[48px] bg-gradient-to-r from-secondary to-primary text-background rounded-[12px] flex items-center justify-between px-5 font-[700] text-[14px] md:text-[16px] transition-all disabled:opacity-40 shadow-[0px_8px_24px_rgba(191,243,103,0.15)] border-none"
                  >
                    <div className="flex items-center gap-2 tracking-wide">
                      {isProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      {isProcessing ? "PROCESSING..." : "PAY NOW"}
                    </div>
                    <span className="text-[18px]">₹ {amountToPay}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
