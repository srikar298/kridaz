import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee,
  ShieldCheck,
  X,
  Zap,
  Tag,
  Check,
  Loader2,
  Wallet,
  CreditCard,
  Smartphone,
  PlusCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import CountUp from "react-countup";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  handlePayment,
  createOrder,
  loadRazorpay,
} from "@infrastructure/razorpay";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const CoinDeductionModal = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  currentBalance: initialBalance,
  title = "Confirm Payment",
  description = "Ready to secure your pitch?",
  turfId,
  turfName,
  selectedDate,
  startTime,
  duration,
}) => {
  const { user } = useSelector((state) => state.auth);
  const [step, setStep] = useState(0); // 0: Selection/Summary, 1: Confirmation, 2: Recharge
  const [paymentMode, setPaymentMode] = useState("WALLET");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(initialBalance);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Recharge state
  const [rechargeAmount, setRechargeAmount] = useState(500);
  const [isRecharging, setIsRecharging] = useState(false);

  const [paymentPercentage, setPaymentPercentage] = useState(100); // 30, 50, 100

  const modalRef = useRef(null);

  // Detailed Calculation
  const venueCharges = amount;
  const platformFee = 0; // Can be added if needed
  const subtotal = venueCharges + platformFee;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = subtotal - discount;

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setIsSuccess(false);
      setIsProcessing(false);
      setCouponCode("");
      setAppliedCoupon(null);
      setPaymentMode("WALLET");
      setCurrentBalance(initialBalance);

      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.95, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [isOpen, initialBalance]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidating(true);
    try {
      const res = await axiosInstance.post(
        "/api/user/booking/validate-coupon",
        {
          code: couponCode,
          turfId,
          amount,
        }
      );
      if (res.data.success) {
        setAppliedCoupon({
          code: couponCode,
          discount: res.data.discount,
          finalAmount: res.data.finalAmount,
        });
        toast.success("Coupon applied!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid coupon code");
      setAppliedCoupon(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    const advanceAmount = Math.round(total * (paymentPercentage / 100));
    const balanceAmount = total - advanceAmount;
    const paymentType = paymentPercentage === 100 ? "FULL" : "PARTIAL";

    try {
      if (paymentMode === "WALLET") {
        const result = await onConfirm(appliedCoupon?.code, {
          advanceAmount,
          balanceAmount,
          paymentType,
          paymentPercentage,
        });
        if (result && result.success) {
          setBookingId(result.bookingId);
          setIsSuccess(true);
        }
      } else {
        // Direct Payment Logic
        const { order } = await createOrder(advanceAmount);
        const paymentResult = await handlePayment(order, user);

        // Finalize booking with direct payment info
        const res = await axiosInstance.post(
          "/api/user/booking/verify-payment",
          {
            id: turfId,
            startTime: new Date(
              new Date(selectedDate).setHours(parseInt(startTime), 0, 0, 0)
            ).toISOString(),
            endTime: new Date(
              new Date(selectedDate).setHours(
                parseInt(startTime) + duration,
                0,
                0,
                0
              )
            ).toISOString(),
            selectedTurfDate: selectedDate.toISOString(),
            totalPrice: total,
            advanceAmount,
            balanceAmount,
            paymentType,
            paymentId: paymentResult.razorpay_payment_id,
            orderId: paymentResult.razorpay_order_id,
            razorpay_signature: paymentResult.razorpay_signature,
            paymentMethod: paymentMode, // UPI, CARD, etc.
          }
        );

        if (res.data.success) {
          setBookingId(res.data.bookingId);
          setIsSuccess(true);
        }
      }
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInstantRecharge = async () => {
    setIsRecharging(true);
    try {
      const response = await axiosInstance.post("/api/user/wallet/topup", {
        amount: rechargeAmount,
      });
      const order = response.data.order;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Kridaz Wallet",
        description: "Wallet Instant Recharge",
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyRes = await axiosInstance.post(
              "/api/user/wallet/topup/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );

            if (verifyRes.data.success) {
              setCurrentBalance(verifyRes.data.balance);
              toast.success("Recharge successful!");
              setStep(0); // Go back to summary
            }
          } catch (err) {
            toast.error("Recharge verification failed");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: "#BFF367" },
      };

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        toast.error("Razorpay SDK failed to load");
        setIsRecharging(false);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Recharge failed");
    } finally {
      setIsRecharging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        ref={modalRef}
        className="bg-[#000000] border border-[#2D2D2D] w-full max-w-md rounded-[8px] overflow-hidden shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-[#000000] text-zinc-500 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="payment-flow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              {/* Header */}
              <div className="p-8 pb-4">
                <p className="text-[10px] font-bold text-[#BFF367] uppercase tracking-widest mb-1">
                  Secure Checkout
                </p>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  {title}
                </h3>
                <p className="text-zinc-500 text-xs font-medium mt-1">
                  {description}
                </p>
              </div>

              {step === 0 && (
                <div className="p-8 pt-0 space-y-6">
                  {/* Summary Section */}
                  <div className="bg-[#000000] rounded-[8px] p-5 space-y-4 border border-[#2D2D2D]">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          {turfName}
                        </p>
                        <div className="flex items-center gap-2 text-white">
                          <Clock size={14} className="text-[#BFF367]" />
                          <span className="text-sm font-bold">
                            {startTime} ({duration} hr)
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-zinc-500">
                          {format(new Date(selectedDate), "EEEE, d MMM yyyy")}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#2D2D2D] space-y-2">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-zinc-500 uppercase tracking-wider">
                          Venue Charges
                        </span>
                        <span className="text-zinc-300">
                          +�Rs �-�{venueCharges}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-zinc-500 uppercase tracking-wider">
                          Platform Fee
                        </span>
                        <span className="text-zinc-300">
                          +�Rs �-�{platformFee}
                        </span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-[11px] font-medium text-[#BFF367]">
                          <span className="uppercase tracking-wider">
                            Coupon Discount ({appliedCoupon.code})
                          </span>
                          <span>-+�Rs �-�{discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-black pt-2">
                        <span className="text-white uppercase tracking-tighter">
                          Total Payable
                        </span>
                        <span className="text-[#BFF367]">+�Rs �-�{total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Type Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        Select Payment Plan
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#BFF367] uppercase">
                        <ShieldCheck size={12} />
                        <span>Flexible Secure Pay</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[30, 50, 100].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setPaymentPercentage(pct)}
                          className={`relative py-4 px-2 rounded-[8px] border-2 transition-all flex flex-col items-center gap-1 group ${paymentPercentage === pct ? "bg-[#BFF367]/10 border-[#BFF367] text-[#BFF367]" : "bg-[#000000] border-[#2D2D2D] text-white hover:border-white/20"}`}
                        >
                          <span
                            className={`text-sm font-black ${paymentPercentage === pct ? "text-[#BFF367]" : "text-white"}`}
                          >
                            {pct}%
                          </span>
                          <span
                            className={`text-[8px] font-bold uppercase tracking-tighter ${paymentPercentage === pct ? "text-[#BFF367]/60" : "text-zinc-500"}`}
                          >
                            {pct === 100 ? "Full Pay" : "Advance"}
                          </span>
                          {paymentPercentage === pct && (
                            <motion.div
                              layoutId="pct-active"
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#BFF367] rounded-full flex items-center justify-center text-black shadow-lg"
                            >
                              <Check size={10} strokeWidth={4} />
                            </motion.div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Summary for Selection */}
                  <div className="space-y-2 p-4 bg-[#000000] rounded-[8px] border border-[#2D2D2D]">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      <span>Total Booking Value</span>
                      <span className="text-white">+�Rs �-�{total}</span>
                    </div>
                    {paymentPercentage < 100 && (
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[#BFF367]">
                        <span>Payable Now ({paymentPercentage}%)</span>
                        <span className="font-black text-sm">
                          +�Rs �-�
                          {Math.round(total * (paymentPercentage / 100))}
                        </span>
                      </div>
                    )}
                    {paymentPercentage < 100 && (
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-orange-400">
                        <span>Balance at Venue</span>
                        <span className="font-black">
                          +�Rs �-�
                          {total -
                            Math.round(total * (paymentPercentage / 100))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Payment Mode Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Select Payment Mode
                      </p>
                      {paymentMode === "WALLET" && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#BFF367]/10 rounded-[6px]">
                          <Zap
                            size={10}
                            className="text-[#BFF367] fill-[#BFF367]"
                          />
                          <span className="text-[8px] font-black text-[#BFF367] uppercase">
                            5% Cashback
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {/* Wallet Option */}
                      <button
                        onClick={() => setPaymentMode("WALLET")}
                        className={`group relative flex items-center justify-between p-4 rounded-[8px] border transition-all ${paymentMode === "WALLET" ? "bg-[#BFF367]/10 border-[#BFF367]" : "bg-[#000000] border-[#2D2D2D] hover:border-white/20"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-[6px] ${paymentMode === "WALLET" ? "bg-[#BFF367] text-black" : "bg-[#000000] text-zinc-500"}`}
                          >
                            <Wallet size={20} />
                          </div>
                          <div className="text-left">
                            <p
                              className={`text-xs font-bold uppercase tracking-tight ${paymentMode === "WALLET" ? "text-white" : "text-zinc-400"}`}
                            >
                              Kridaz Wallet
                            </p>
                            <p className="text-[10px] font-medium text-zinc-500">
                              Balance: +�Rs �-�{currentBalance}
                            </p>
                          </div>
                        </div>
                        {paymentMode === "WALLET" && (
                          <Check size={16} className="text-[#BFF367]" />
                        )}
                      </button>

                      {/* UPI Option */}
                      <button
                        onClick={() => setPaymentMode("UPI")}
                        className={`flex items-center justify-between p-4 rounded-[8px] border transition-all ${paymentMode === "UPI" ? "bg-[#BFF367]/10 border-[#BFF367]" : "bg-[#000000] border-[#2D2D2D] hover:border-white/20"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-[6px] ${paymentMode === "UPI" ? "bg-[#BFF367] text-black" : "bg-[#000000] text-zinc-500"}`}
                          >
                            <Smartphone size={20} />
                          </div>
                          <div className="text-left">
                            <p
                              className={`text-xs font-bold uppercase tracking-tight ${paymentMode === "UPI" ? "text-white" : "text-zinc-400"}`}
                            >
                              Instant UPI
                            </p>
                            <p className="text-[10px] font-medium text-zinc-500">
                              G-Pay, PhonePe, Paytm
                            </p>
                          </div>
                        </div>
                        {paymentMode === "UPI" && (
                          <Check size={16} className="text-[#BFF367]" />
                        )}
                      </button>

                      {/* Card Option */}
                      <button
                        onClick={() => setPaymentMode("CARD")}
                        className={`flex items-center justify-between p-4 rounded-[8px] border transition-all ${paymentMode === "CARD" ? "bg-[#BFF367]/10 border-[#BFF367]" : "bg-[#000000] border-[#2D2D2D] hover:border-white/20"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-[6px] ${paymentMode === "CARD" ? "bg-[#BFF367] text-black" : "bg-[#000000] text-zinc-500"}`}
                          >
                            <CreditCard size={20} />
                          </div>
                          <div className="text-left">
                            <p
                              className={`text-xs font-bold uppercase tracking-tight ${paymentMode === "CARD" ? "text-white" : "text-zinc-400"}`}
                            >
                              Credit / Debit Card
                            </p>
                            <p className="text-[10px] font-medium text-zinc-500">
                              Visa, Mastercard, RuPay
                            </p>
                          </div>
                        </div>
                        {paymentMode === "CARD" && (
                          <Check size={16} className="text-[#BFF367]" />
                        )}
                      </button>

                      <button
                        onClick={() => setPaymentMode("UPI")}
                        className={`flex items-center justify-between p-4 rounded-[8px] border transition-all ${paymentMode === "UPI" ? "bg-[#BFF367]/10 border-[#BFF367]" : "bg-[#000000] border-[#2D2D2D] hover:border-white/20"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-[6px] ${paymentMode === "UPI" ? "bg-[#BFF367] text-black" : "bg-[#000000] text-zinc-500"}`}
                          >
                            <Smartphone size={20} />
                          </div>
                          <div className="text-left">
                            <p
                              className={`text-xs font-bold uppercase tracking-tight ${paymentMode === "UPI" ? "text-white" : "text-zinc-400"}`}
                            >
                              UPI Payment
                            </p>
                            <p className="text-[10px] font-medium text-zinc-500">
                              Google Pay, PhonePe, Paytm
                            </p>
                          </div>
                        </div>
                        {paymentMode === "UPI" && (
                          <Check size={16} className="text-[#BFF367]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {paymentMode === "WALLET" &&
                    currentBalance <
                      Math.round(total * (paymentPercentage / 100)) ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[8px]">
                          <p className="text-[10px] font-bold text-red-500 uppercase text-center tracking-widest">
                            Insufficient Wallet Balance
                          </p>
                          <p className="text-[9px] text-red-500/60 text-center uppercase tracking-tighter mt-1">
                            Required: +�Rs �-�
                            {Math.round(total * (paymentPercentage / 100))}
                          </p>
                        </div>
                        <button
                          onClick={() => setStep(2)}
                          className="w-full bg-[#BFF367] text-black h-14 rounded-[8px] font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          <PlusCircle size={18} />
                          Instant Recharge Wallet
                        </button>
                        <p className="text-[9px] font-medium text-zinc-500 text-center uppercase tracking-widest">
                          Get 5% Cashback on Wallet Payments
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="w-full bg-[#BFF367] text-black h-14 rounded-[8px] font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <>
                            Confirm & Pay +�Rs �-�
                            {Math.round(total * (paymentPercentage / 100))}
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="p-8 pt-0 space-y-6">
                  <div className="bg-[#BFF367]/10 border border-[#BFF367]/20 rounded-[8px] p-6 text-center">
                    <div className="w-12 h-12 bg-[#BFF367] text-black rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet size={24} />
                    </div>
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                      Instant Recharge
                    </p>
                    <p className="text-white text-sm font-bold mb-6">
                      Select amount to add
                    </p>

                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {[500, 1000, 2000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setRechargeAmount(amt)}
                          className={`py-3 rounded-[6px] border text-xs font-black transition-all ${rechargeAmount === amt ? "bg-[#BFF367] text-black border-[#BFF367]" : "bg-[#000000] border-[#2D2D2D] text-zinc-400 hover:border-white/20"}`}
                        >
                          +�Rs �-�{amt}
                        </button>
                      ))}
                    </div>

                    <div className="relative mb-6">
                      <IndianRupee
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                      />
                      <input
                        type="number"
                        placeholder="Custom amount"
                        value={rechargeAmount}
                        onChange={(e) =>
                          setRechargeAmount(parseInt(e.target.value) || 0)
                        }
                        className="w-full bg-black border border-[#2D2D2D] rounded-[6px] py-4 pl-10 pr-4 text-white text-sm font-bold focus:border-[#BFF367]/50 outline-none transition-colors"
                      />
                    </div>

                    <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-4 mb-6">
                      <div className="flex items-center justify-center gap-2 text-[#BFF367]">
                        <Tag size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">
                          Wallet Exclusive Offer
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium mt-1 uppercase">
                        Pay through wallet and save 5% on every booking!
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleInstantRecharge}
                        disabled={isRecharging || rechargeAmount < 100}
                        className="w-full bg-[#BFF367] text-black h-14 rounded-[8px] font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {isRecharging ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          "Confirm Recharge"
                        )}
                      </button>
                      <button
                        onClick={() => setStep(0)}
                        className="w-full bg-[#000000] text-zinc-500 h-14 rounded-[8px] font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success-screen"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center"
            >
              <div className="w-20 h-20 bg-[#BFF367] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(85,222,232,0.4)]">
                <Check size={40} className="text-black" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                Booking Successful!
              </h3>
              <p className="text-zinc-500 text-[11px] mb-8 font-bold uppercase tracking-wider">
                Your entry pass is ready for download.
              </p>

              {paymentMode === "WALLET" && (
                <div className="bg-[#BFF367]/10 border border-[#BFF367]/20 rounded-[8px] p-5 mb-8 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#BFF367]/20 rounded-full blur-xl transition-all group-hover:scale-150" />
                  <div className="flex items-center justify-center gap-4 relative z-10">
                    <div className="p-3 bg-[#BFF367] rounded-[6px] text-black">
                      <Zap size={20} fill="currentColor" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-[#BFF367] uppercase tracking-[0.2em]">
                        Cashback Reward
                      </p>
                      <p className="text-white text-sm font-black">
                        +�Rs �-�{Math.round(total * 0.05)} added to wallet
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Link
                  to={`/booking-pass/${bookingId}`}
                  className="w-full bg-[#BFF367] text-black h-14 rounded-[8px] font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                >
                  Download Digital Pass
                </Link>
                <button
                  onClick={onClose}
                  className="w-full bg-[#000000] text-zinc-400 h-14 rounded-[8px] font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                >
                  Back to Venue Details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CoinDeductionModal;
