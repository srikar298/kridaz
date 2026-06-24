import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  IndianRupee,
  Loader2,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { updateUser } from "@redux/slices/authSlice";
import { loadRazorpay } from "@infrastructure/razorpay";import { Button, Input } from "@kridaz/ui";


const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const WalletPage = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [balance, setBalance] = useState(0);
  const [reservedBalance, setReservedBalance] = useState(0);
  const [usableBalance, setUsableBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [payableAmount, setPayableAmount] = useState(0);
  const [isCouponValid, setIsCouponValid] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!topupAmount || isNaN(topupAmount) || topupAmount <= 0) {
      setDiscountAmount(0);
      setPayableAmount(0);
      setIsCouponValid(false);
    } else {
      setPayableAmount(topupAmount);
      setIsCouponValid(false);
      setDiscountAmount(0);
    }
  }, [topupAmount]);

  const handleValidateCoupon = async () => {
    if (!couponCode) return;
    if (!topupAmount || isNaN(topupAmount) || topupAmount <= 0) {
      toast.error("Please enter a top-up amount first");
      return;
    }
    try {
      setIsValidatingCoupon(true);
      const { data } = await axiosInstance.post(
        "/api/user/wallet/topup/validate-coupon",
        {
          code: couponCode,
          amount: Number(topupAmount),
        }
      );
      if (data.success) {
        setIsCouponValid(true);
        setDiscountAmount(data.discount);
        setPayableAmount(data.payableAmount);
        toast.success(data.message);
      }
    } catch (error) {
      setIsCouponValid(false);
      setDiscountAmount(0);
      setPayableAmount(topupAmount);
      toast.error(error.response?.data?.message || "Invalid coupon code");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await axiosInstance.get("/api/user/wallet/data");
      setBalance(response.data.balance);
      setReservedBalance(response.data.reservedBalance);
      setUsableBalance(response.data.usableBalance);
      setTransactions(response.data.transactions);
      dispatch(
        updateUser({
          walletBalance: response.data.balance,
          reservedBalance: response.data.reservedBalance,
        })
      );
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!topupAmount || isNaN(topupAmount) || topupAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsProcessing(true);
      const { data } = await axiosInstance.post(
        "/api/user/wallet/topup/create-order",
        {
          amount: Number(topupAmount),
          couponCode: isCouponValid ? couponCode : undefined,
        }
      );

      if (data.payableAmount === 0) {
        toast.success("Wallet topped up successfully!");
        setTopupAmount("");
        setCouponCode("");
        setIsCouponValid(false);
        fetchWalletData();
        setIsProcessing(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "Kridaz Wallet",
        description: "Wallet Coin Top-up",
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await axiosInstance.post(
              "/api/user/wallet/topup/verify",
              response
            );
            if (verifyRes.data.success) {
              toast.success("Wallet topped up successfully!");
              setTopupAmount("");
              fetchWalletData();
            }
          } catch (error) {
            toast.error(error.response?.data?.message || "Verification failed");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "var(--primary)",
        },
      };

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        toast.error("Razorpay SDK failed to load");
        setIsProcessing(false);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to initiate top-up");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-2 md:pt-24 pb-20 px-4 font-inter">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-base font-black uppercase tracking-tight font-open-sans">
            My Wallet
          </h1>
          <p
            className="text-white/70 uppercase tracking-widest text-[11px]"
            style={SUBHEADING_STYLE}
          >
            Manage your coins & transactions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Balance Card */}
          <div className="md:col-span-5 space-y-4">
            <div className="relative group overflow-hidden bg-black p-4 rounded-[16px] animate-slide-in-left text-white">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Wallet className="w-20 h-20 text-white/5" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-card rounded-[12px] backdrop-blur-sm">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-inter text-[9px] font-black uppercase text-white/70 tracking-wider">
                    Available Coins
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white tracking-tighter font-open-sans">
                      {usableBalance}
                    </span>
                    <IndianRupee className="w-4 h-4 text-white/50 mt-1" />
                  </div>
                  <p className="font-inter text-[9px] font-bold text-primary uppercase">
                    Spendable Coins Right Now
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-card rounded-[16px] backdrop-blur-sm">
                    <p className="font-inter text-[9px] font-black uppercase text-white/70 mb-1 tracking-widest">
                      Total
                    </p>
                    <p className="text-base font-black text-white tracking-tighter font-open-sans">
                      {balance}
                    </p>
                  </div>
                  <div className="p-2 bg-card rounded-[16px] backdrop-blur-sm">
                    <p className="font-inter text-xs font-black uppercase text-white/70 mb-1 tracking-widest">
                      Reserved
                    </p>
                    <p className="text-lg font-black text-white tracking-tighter font-open-sans">
                      {reservedBalance}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="font-inter font-bold text-white/50 uppercase tracking-widest text-[8px]">
                    Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Top-up Form */}
            <div className="bg-black p-4 rounded-[16px] space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2 font-open-sans">
                <Plus className="w-4 h-4 text-primary" />
                Top-up Wallet
              </h2>
              <div className="space-y-4 font-inter">
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="Enter amount (e.g. 500)"
                    className="w-full bg-background border border-white/10 rounded-[16px] py-1.5 pl-8 pr-3 text-xs font-bold focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-white font-inter"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 font-inter">
                  {[500, 1000, 2000].map((amt) => (
                    <Button
                      key={amt}
                      onClick={() => setTopupAmount(amt.toString())}
                      className="py-1.5 rounded-[12px] bg-card border border-white/10 hover:border-secondary hover:text-secondary font-bold text-xs uppercase transition-all"
                    >
                      +{amt}
                    </Button>
                  ))}
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Have a coupon code?"
                    className="w-full bg-background border border-white/10 rounded-[16px] py-1.5 pl-4 pr-24 text-xs font-bold focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none text-white font-inter"
                  />
                  <Button
                    onClick={handleValidateCoupon}
                    disabled={isValidatingCoupon || !couponCode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-card text-primary px-3 py-1 rounded-[12px] text-xs font-bold uppercase disabled:opacity-50"
                  >
                    {isValidatingCoupon ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>

                {isCouponValid && (
                  <div className="bg-card p-3 rounded-[12px] text-xs font-inter space-y-1">
                    <div className="flex justify-between text-white/70">
                      <span>Top-up Amount</span>
                      <span>₹{topupAmount}</span>
                    </div>
                    <div className="flex justify-between text-primary">
                      <span>Discount</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold pt-1 border-t border-white/10">
                      <span>Amount to Pay</span>
                      <span>₹{payableAmount}</span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleTopup}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-secondary to-primary text-background h-[32px] rounded-[12px] font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale font-open-sans shadow-[0_10px_25px_rgba(85,222,232,0.25)]"
                >
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Purchase Coins
                      <ArrowUpRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="md:col-span-7 bg-black rounded-[16px] overflow-hidden flex flex-col font-inter">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2 font-open-sans">
                <History className="w-4 h-4 text-primary" />
                Coin Activity
              </h2>
              <span className="font-inter text-[9px] font-bold text-white/50 uppercase tracking-widest">
                Recent 20 entries
              </span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-hide">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                  <div className="p-6 bg-zinc-800/50 rounded-full">
                    <History className="w-12 h-12 text-zinc-600" />
                  </div>
                  <p className="text-zinc-500 font-bold uppercase text-xs font-inter">
                    No transactions yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10 font-inter">
                  {transactions.map((tx) => {
                    const isPositive = [
                      "TOPUP",
                      "OFFER",
                      "REFUND",
                      "SLOT_INCOME",
                      "CREDIT",
                    ].includes(tx.type);
                    return (
                      <div
                        key={tx._id || tx.id}
                        className="p-3 flex items-center justify-between hover:bg-card/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-[10px] ${isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-zinc-200 font-inter">
                              {tx.description || tx.type}
                              {tx.description
                                ?.toLowerCase()
                                .includes("bonus") && (
                                <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-primary/10 to-primary/10 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary text-[8px] font-black uppercase rounded-md border border-primary/20 font-inter">
                                  Platform Offer
                                </span>
                              )}
                            </p>
                            <p className="text-[8px] text-zinc-500 font-bold uppercase font-inter">
                              {new Date(tx.createdAt).toLocaleDateString()} •{" "}
                              {new Date(tx.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right font-inter">
                          <p
                            className={`font-black text-base font-open-sans ${isPositive ? "text-emerald-500" : "text-zinc-200"}`}
                          >
                            {isPositive ? "+" : "-"}
                            {tx.amount}
                          </p>
                          <div className="flex flex-col items-end gap-1 font-inter">
                            <span
                              className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full font-inter ${tx.status === "SUCCESS" ? "bg-primary/10 text-primary" : tx.status === "PENDING" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}
                            >
                              {tx.status}
                            </span>
                            {tx.status === "PENDING" && tx.type === "TOPUP" && (
                              <div className="flex gap-2 font-inter">
                                <Button
                                  onClick={async () => {
                                    try {
                                      const { data } = await axiosInstance.get(
                                        `/api/user/wallet/topup/check-status/${tx.razorpayOrderId}`
                                      );
                                      if (data.success) {
                                        toast.success(data.message);
                                        fetchWalletData();
                                      } else {
                                        toast.error(data.message);
                                      }
                                    } catch (error) {
                                      toast.error("Failed to check status");
                                    }
                                  }}
                                  className="text-[8px] font-bold text-primary hover:underline uppercase"
                                >
                                  Check Status
                                </Button>
                                <span className="text-[8px] text-zinc-600">
                                  |
                                </span>
                                <Button
                                  onClick={() => {
                                    setTopupAmount(tx.amount.toString());
                                    handleTopup();
                                  }}
                                  className="text-[8px] font-bold text-zinc-400 hover:underline uppercase"
                                >
                                  Retry
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
