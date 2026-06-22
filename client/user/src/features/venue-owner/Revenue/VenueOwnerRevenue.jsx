import React, { useState } from "react";
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  Download,
  Clock,
  CheckCircle2,
  Wallet,
  Landmark,
  X,
  AlertCircle,
  ShieldCheck,
  AlertOctagon,
  CheckCircle,
  Hourglass,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import useVenueOwnerRevenue from "@hooks/venue-owner/useVenueOwnerRevenue";
import useOwnerWallet from "@hooks/venue-owner/useOwnerWallet";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";import { Button, Input } from "@kridaz/ui";


/**
 * VenueOwnerRevenue Rs � Financial intelligence and earnings portal.
 * Fully rebranded for the Scorer Portal with Teal Green (var(--primary)) and Inter font.
 * Layout optimized: 6 cards in one line.
 */

export default function VenueOwnerRevenue() {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "var(--primary)" : "var(--primary)";
  const portalTitle = isScorer ? "Earnings Dossier" : "Revenue Engine";

  const { revenueData, loading: revenueLoading } = useVenueOwnerRevenue();
  const { requestWithdrawal, submitting } = useOwnerWallet();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  });

  if (revenueLoading) return <DashboardSkeleton />;

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) < 500) {
      toast.error("Minimum withdrawal threshold is Rs 500", {
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
    const success = await requestWithdrawal(
      parseFloat(withdrawAmount),
      bankDetails
    );
    if (success) {
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      toast.success("Withdrawal request dispatched", {
        style: {
          background: "#000",
          color: "#fff",
          border: `1px solid ${themeColor}`,
          fontSize: "10px",
          fontWeight: "black",
        },
      });
    }
  };

  const { balances, inProgressBookings, recentTransactions } =
    revenueData || {};

  return (
    <div className="h-full custom-scrollbar bg-background text-white font-inter pb-4">
      <div className="px-1 lg:px-3 lg:pt-3 lg:pb-3 space-y-6 md:space-y-12 animate-fade-in relative">
        {/* Header Section */}
        <div className="flex flex-row justify-between items-center gap-2 relative z-10 pb-4 md:pb-6 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="text-[14px] sm:text-[24px] lg:text-[32px] mt-1 sm:mt-0 font-bold font-['Open_Sans'] tracking-tight uppercase leading-none whitespace-nowrap truncate">
                <span className="text-white">{portalTitle.split(" ")[0]}</span>{" "}
                <span style={{ color: themeColor }}>
                  {portalTitle.split(" ")[1]}
                </span>
              </h2>
              <p className="text-white/70 font-inter font-light text-[9px] sm:text-[14px] md:text-[20px] mt-1 md:mt-2 truncate">
                Financial lifecycle, audits & withdrawals
              </p>
            </div>
          </div>

          <div className="flex flex-row items-center shrink-0">
            <Button className="flex items-center justify-center p-2 md:p-3 bg-card hover:bg-white/[0.05] border border-white/10 rounded-[16px] md:rounded-[16px] transition-all shadow-xl text-neutral-400 hover:text-white group">
              <Download
                size={14}
                className="shrink-0 md:w-5 md:h-5 group-hover:scale-110 transition-transform"
              />
            </Button>
          </div>
        </div>

        {/* Financial Matrix (4 Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-card border border-white/10 rounded-[16px] md:rounded-[16px] p-2 md:p-5 flex flex-col relative overflow-hidden transition-all duration-500 shadow-2xl group hover:border-white/10">
            <div
              className="w-5 h-5 md:w-10 md:h-10 rounded-[16px] md:rounded-[16px] flex items-center justify-center mb-1.5 md:mb-5 border border-white/10 bg-white/[0.05] group-hover:border-primary/30 transition-all shadow-inner"
              style={{ color: themeColor }}
            >
              <CheckCircle2 className="w-2.5 h-2.5 md:w-[18px] md:h-[18px]" />
            </div>
            <p className="text-[6.5px] sm:text-[9px] md:text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-0.5 truncate">
              Usable Assets
            </p>
            <h3
              className="text-[11px] sm:text-[15px] md:text-[28px] font-black font-inter tracking-tighter truncate"
              style={{ color: themeColor }}
            >
              Rs {(balances?.usable || 0).toLocaleString()}
            </h3>
            <p className="text-[5.5px] sm:text-[8px] md:text-[9px] text-neutral-700 mt-1 md:mt-3 uppercase font-black tracking-widest truncate">
              Liquid / Available
            </p>
          </div>

          <div className="bg-card border border-white/10 rounded-[16px] md:rounded-[16px] p-2 md:p-5 flex flex-col relative overflow-hidden shadow-2xl hover:border-red-500/20 transition-all duration-500 group">
            <div className="w-5 h-5 md:w-10 md:h-10 bg-red-500/10 rounded-[16px] md:rounded-[16px] flex items-center justify-center mb-1.5 md:mb-5 border border-white/10 group-hover:border-red-500/30 transition-all text-red-500 shadow-inner">
              <AlertOctagon className="w-2.5 h-2.5 md:w-[18px] md:h-[18px]" />
            </div>
            <p className="text-[6.5px] sm:text-[9px] md:text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-0.5 truncate">
              Disputed Assets
            </p>
            <h3 className="text-[11px] sm:text-[15px] md:text-[28px] font-black font-inter tracking-tighter text-red-500 truncate">
              Rs {(balances?.dispute || 0).toLocaleString()}
            </h3>
            <p className="text-[5.5px] sm:text-[8px] md:text-[9px] text-neutral-700 mt-1 md:mt-3 uppercase font-black tracking-widest truncate">
              Frozen Assets
            </p>
          </div>

          <div className="bg-card border border-white/10 rounded-[16px] md:rounded-[16px] p-2 md:p-5 flex flex-col relative overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/10 group">
            <div className="w-5 h-5 md:w-10 md:h-10 bg-white/5 rounded-[16px] md:rounded-[16px] flex items-center justify-center mb-1.5 md:mb-5 border border-white/10 group-hover:border-white/20 transition-all text-neutral-500 shadow-inner">
              <TrendingUp className="w-2.5 h-2.5 md:w-[18px] md:h-[18px]" />
            </div>
            <p className="text-[6.5px] sm:text-[9px] md:text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-0.5 truncate">
              Lifetime Total
            </p>
            <h3 className="text-[11px] sm:text-[15px] md:text-[28px] font-black font-inter tracking-tighter text-white truncate">
              Rs {(balances?.totalRevenue || 0).toLocaleString()}
            </h3>
            <p className="text-[5.5px] sm:text-[8px] md:text-[9px] text-neutral-700 mt-1 md:mt-3 uppercase font-black tracking-widest truncate">
              Lifetime Volume
            </p>
          </div>

          <div className="bg-card border border-white/10 rounded-[16px] md:rounded-[16px] p-2 md:p-5 flex flex-col relative overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/10 group">
            <div className="w-5 h-5 md:w-10 md:h-10 bg-white/5 rounded-[16px] md:rounded-[16px] flex items-center justify-center mb-1.5 md:mb-5 border border-white/10 group-hover:border-white/20 transition-all text-neutral-500 shadow-inner">
              <Landmark className="w-2.5 h-2.5 md:w-[18px] md:h-[18px]" />
            </div>
            <p className="text-[6.5px] sm:text-[9px] md:text-[11px] font-black text-neutral-500 uppercase tracking-widest mb-0.5 truncate">
              Total Dispatched
            </p>
            <h3 className="text-[11px] sm:text-[15px] md:text-[28px] font-black font-inter tracking-tighter text-white truncate">
              Rs {(balances?.withdrawn || 0).toLocaleString()}
            </h3>
            <p className="text-[5.5px] sm:text-[8px] md:text-[9px] text-neutral-700 mt-1 md:mt-3 uppercase font-black tracking-widest truncate">
              Settled
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-12 relative z-10 mt-6 lg:mt-10">
          {/* Review Pipeline List */}
          <div className="bg-card border border-white/10 rounded-[16px] md:rounded-[16px] p-4 lg:p-10 shadow-2xl flex flex-col max-h-[400px] md:max-h-[600px] group overflow-hidden relative">
            <div className="flex justify-between items-center mb-4 md:mb-8 border-b border-white/10 pb-3 md:pb-6 relative z-10">
              <div className="flex items-center gap-2 md:gap-4">
                <h2 className="text-[10px] md:text-[12px] font-black font-inter text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  Escrow Pipeline
                </h2>
              </div>
              <span className="text-[8px] md:text-[10px] font-black text-amber-500/60 uppercase tracking-widest">
                Active Reviews
              </span>
            </div>

            <div className="overflow-y-auto no-scrollbar flex-1 pr-1 md:pr-2 relative z-10">
              <div className="space-y-3 md:space-y-6">
                {inProgressBookings && inProgressBookings.length > 0 ? (
                  inProgressBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="p-3 md:p-6 bg-card rounded-[16px] md:rounded-[16px] border border-white/10 flex items-center justify-between hover:border-amber-500/20 transition-all shadow-lg group/item"
                    >
                      <div className="space-y-1 md:space-y-1.5">
                        <p className="text-[11px] md:text-[14px] font-black text-white uppercase tracking-tight">
                          {booking.turf?.name || "Arena Node"}
                        </p>
                        <div className="flex items-center gap-1 md:gap-2">
                          <Clock
                            size={10}
                            className="text-amber-500/50 md:w-3 md:h-3"
                          />
                          <p className="text-[8px] md:text-[10px] text-amber-500/80 font-black uppercase tracking-widest">
                            Release:{" "}
                            {new Date(
                              booking.reviewWindowEndsAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[16px] md:text-2xl font-black text-white tracking-tighter">
                          Rs {booking.ownerRevenue}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 md:py-24 text-center">
                    <div className="flex flex-col items-center gap-4 md:gap-6 opacity-20">
                      <CheckCircle className="w-8 h-8 md:w-14 md:h-14 text-neutral-400" />
                      <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-neutral-600">
                        No assets in pipeline
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-card border border-white/10 rounded-[16px] md:rounded-[16px] p-4 lg:p-10 shadow-2xl flex flex-col max-h-[400px] md:max-h-[600px] group overflow-hidden relative">
            <div className="flex justify-between items-center mb-4 md:mb-8 border-b border-white/10 pb-3 md:pb-6 relative z-10">
              <div className="flex items-center gap-2 md:gap-4">
                <h2 className="text-[10px] md:text-[12px] font-black font-inter text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  Transaction History
                </h2>
              </div>
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-neutral-600">
                Audit Logs
              </span>
            </div>

            <div className="overflow-y-auto no-scrollbar flex-1 pr-1 md:pr-2 relative z-10">
              <div className="space-y-3 md:space-y-6">
                {recentTransactions && recentTransactions.length > 0 ? (
                  recentTransactions.map((tx) => {
                    let colorClass = "text-white";
                    let colorStyle = null;
                    let sign = "";
                    let icon = null;

                    if (
                      tx.type === "SETTLEMENT" ||
                      tx.type === "DISPUTE_RELEASE"
                    ) {
                      colorStyle = { color: themeColor };
                      sign = "+";
                      icon = (
                        <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      );
                    } else if (tx.type === "WITHDRAWAL") {
                      colorClass = "text-red-500";
                      sign = "-";
                      icon = (
                        <ArrowDownLeft className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      );
                    } else if (tx.type === "DISPUTE_FREEZE") {
                      colorClass = "text-amber-500";
                      sign = "";
                      icon = (
                        <AlertOctagon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      );
                    }

                    return (
                      <div
                        key={tx._id}
                        className="p-3 md:p-6 bg-card rounded-[16px] md:rounded-[16px] border border-white/10 flex items-center justify-between hover:border-white/10 transition-all shadow-lg"
                      >
                        <div className="space-y-1 md:space-y-1.5">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <span
                              className="p-1 md:p-1.5 bg-white/5 rounded-[16px] md:rounded-[16px] border border-white/10 shrink-0"
                              style={{ color: colorStyle?.color || "inherit" }}
                            >
                              {icon}
                            </span>
                            <p className="text-[10px] md:text-[12px] font-black text-white uppercase tracking-wider">
                              {tx.type.replace(/_/g, " ")}
                            </p>
                          </div>
                          <p className="text-[8px] md:text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-0.5 md:mt-1 ml-6 md:ml-9">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-[16px] md:text-2xl font-black tracking-tighter ${colorClass}`}
                            style={colorStyle || {}}
                          >
                            {sign} Rs {tx.amount}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 md:py-24 text-center">
                    <div className="flex flex-col items-center gap-4 md:gap-6 opacity-20">
                      <AlertCircle className="w-8 h-8 md:w-14 md:h-14 text-neutral-400" />
                      <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-neutral-600">
                        No financial audit logs
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Control Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="bg-card border border-white/10 rounded-[16px] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in relative">
              <div className="p-4 md:p-8 border-b border-white/10 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <div
                    className="w-1 md:w-1.5 h-6 md:h-8 rounded-full shadow-[0_0_10px_rgba(0,193,135,0.3)]"
                    style={{ backgroundColor: themeColor }}
                  />
                  <h3 className="text-lg md:text-xl font-black font-inter uppercase tracking-tight text-white">
                    Fund Withdrawal
                  </h3>
                </div>
                <Button
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-[16px] text-neutral-500 hover:text-white transition-all"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>

              <form
                onSubmit={handleWithdrawSubmit}
                className="p-4 md:p-8 space-y-3 md:space-y-8 relative z-10 h-auto max-h-[90vh] md:h-[500px] overflow-y-auto no-scrollbar pb-4 md:pb-10"
              >
                <div
                  className="rounded-[16px] p-3 md:p-6 flex items-center gap-3 md:gap-5 border border-white/10 bg-card"
                  style={{ borderColor: `${themeColor}20` }}
                >
                  <div
                    className="w-8 h-8 md:w-12 md:h-12 rounded-[16px] flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${themeColor}1A`,
                      color: themeColor,
                    }}
                  >
                    <Wallet className="w-4 h-4 md:w-6 md:h-6" />
                  </div>
                  <div className="space-y-0.5 md:space-y-1 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center w-full">
                      <p
                        className="text-[8px] md:text-[9px] font-black uppercase tracking-widest"
                        style={{ color: themeColor }}
                      >
                        Available Capital
                      </p>
                      <div className="flex items-center gap-1 md:gap-2 text-[7px] md:text-[8px] text-neutral-500 font-black uppercase tracking-widest font-inter">
                        <ShieldCheck
                          className="w-3 h-3 md:w-3.5 md:h-3.5"
                          style={{ color: themeColor }}
                        />
                        Min: Rs 500
                      </div>
                    </div>
                    <p className="text-xl md:text-4xl font-black tracking-tighter text-white font-inter leading-none">
                      Rs {(balances?.usable || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-6 pb-2 md:pb-4">
                  <div className="space-y-1 md:space-y-3">
                    <label className="text-[8px] md:text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                      Withdrawal Quantum
                    </label>
                    <div className="relative group">
                      <IndianRupee className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-primary transition-colors w-4 h-4 md:w-5 md:h-5" />
                      <Input
                        type="number"
                        required
                        min="500"
                        max={balances?.usable || 0}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-card border border-white/10 rounded-[16px] pl-10 md:pl-14 pr-4 md:pr-6 py-2 md:py-5 text-white focus:outline-none focus:border-primary/30 transition-all font-black text-lg md:text-3xl placeholder-neutral-800 shadow-inner"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:space-y-6 bg-card p-3 md:p-6 rounded-[16px] border border-white/10">
                    <p className="text-[8px] md:text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1 md:mb-4 text-center">
                      Settlement Credentials
                    </p>

                    <div className="space-y-0.5 md:space-y-2">
                      <label className="text-[8px] md:text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                        Account Holder
                      </label>
                      <Input
                        type="text"
                        required
                        value={bankDetails.accountName}
                        onChange={(e) =>
                          setBankDetails({
                            ...bankDetails,
                            accountName: e.target.value,
                          })
                        }
                        className="w-full bg-black border border-white/10 rounded-[16px] px-3 md:px-5 py-2 md:py-4 text-[11px] md:text-[13px] text-white focus:outline-none focus:border-primary/30 transition-all font-black placeholder-neutral-800"
                        placeholder="Full Legal Name"
                      />
                    </div>

                    <div className="space-y-0.5 md:space-y-2">
                      <label className="text-[8px] md:text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                        Account Sequence
                      </label>
                      <Input
                        type="text"
                        required
                        value={bankDetails.accountNumber}
                        onChange={(e) =>
                          setBankDetails({
                            ...bankDetails,
                            accountNumber: e.target.value,
                          })
                        }
                        className="w-full bg-black border border-white/10 rounded-[16px] px-3 md:px-5 py-2 md:py-4 text-[11px] md:text-[13px] text-white focus:outline-none focus:border-primary/30 transition-all font-black placeholder-neutral-800"
                        placeholder="Primary Account Number"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:gap-4">
                      <div className="space-y-0.5 md:space-y-2">
                        <label className="text-[8px] md:text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                          IFSC Vector
                        </label>
                        <Input
                          type="text"
                          required
                          value={bankDetails.ifscCode}
                          onChange={(e) =>
                            setBankDetails({
                              ...bankDetails,
                              ifscCode: e.target.value,
                            })
                          }
                          className="w-full bg-black border border-white/10 rounded-[16px] px-3 md:px-5 py-2 md:py-4 text-[11px] md:text-[13px] text-white focus:outline-none focus:border-primary/30 transition-all font-black uppercase placeholder-neutral-800"
                          placeholder="IFSC CODE"
                        />
                      </div>
                      <div className="space-y-0.5 md:space-y-2">
                        <label className="text-[8px] md:text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                          Institution
                        </label>
                        <Input
                          type="text"
                          required
                          value={bankDetails.bankName}
                          onChange={(e) =>
                            setBankDetails({
                              ...bankDetails,
                              bankName: e.target.value,
                            })
                          }
                          className="w-full bg-black border border-white/10 rounded-[16px] px-3 md:px-5 py-2 md:py-4 text-[11px] md:text-[13px] text-white focus:outline-none focus:border-primary/30 transition-all font-black placeholder-neutral-800"
                          placeholder="Bank Name"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 left-0 right-0 pt-2 md:pt-6 bg-card">
                  <Button
                    type="submit"
                    disabled={
                      submitting ||
                      !withdrawAmount ||
                      parseFloat(withdrawAmount) > (balances?.usable || 0)
                    }
                    className="w-full py-3 md:py-5 text-black rounded-[16px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-2xl active:scale-95 font-inter text-[10px] md:text-[11px]"
                    style={{
                      backgroundColor: themeColor,
                      boxShadow: `0 10px 30px ${themeColor}4d`,
                    }}
                  >
                    {submitting
                      ? "Authenticating Audit..."
                      : "Execute Settlement"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
