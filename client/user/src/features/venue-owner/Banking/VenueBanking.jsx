import React, { useState, useMemo } from "react";
import {
  Landmark,
  ArrowUpRight,
  TrendingUp,
  History,
  ShieldCheck,
  Download,
  Plus,
  FileText,
  CheckCircle,
  AlertCircle,
  Lock,
  IndianRupee,
  Wallet,
  X,
} from "lucide-react";
import useBanking from "@hooks/venue-owner/useBanking";
import useVenueOwnerDashboard from "@hooks/venue-owner/useVenueOwnerDashboard";
import useOwnerWallet from "@hooks/venue-owner/useOwnerWallet";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { Button, Input, Select } from "@kridaz/ui";


/**
 * VenueBanking Rs � Secure banking, KYC, and settlement management.
 * Fully standardized for the Console design language (Inter font, 8px radii, glassmorphism).
 */

const VenueBanking = () => {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "var(--primary)" : "var(--primary)";
  const vaultTitle = isScorer ? "Payout & Settlement" : "Marketplace Vault";

  const {
    bankingDetails,
    walletBalance,
    payoutSettings,
    loading: bankingLoading,
    isPayoutDay,
    updateBanking,
    requestPayout,
    verifyPassword,
  } = useBanking();
  const { dashboardData, loading: dashboardLoading } = useVenueOwnerDashboard();
  const {
    walletData,
    withdrawals,
    loading: walletLoading,
    refresh: refreshWallet,
    requestWithdrawal,
    submitting,
  } = useOwnerWallet();

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [password, setPassword] = useState("");
  const [bankForm, setBankForm] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
    payoutMode: "BANK",
  });
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  // Sync form with existing details
  React.useEffect(() => {
    if (bankingDetails) {
      setBankForm({
        accountName: bankingDetails.accountName || "",
        accountNumber: bankingDetails.accountNumber || "",
        ifscCode: bankingDetails.ifscCode || "",
        bankName: bankingDetails.bankName || "",
        upiId: bankingDetails.upiId || "",
        payoutMode: bankingDetails.payoutMode || "BANK",
      });
    }
  }, [bankingDetails]);

  // Deriving numbers to prevent string comparison issues
  const numericTotalCoins = Number(walletData?.balance || 0);
  const numericPendingCoins = Number(walletData?.pendingBalance || 0);
  const numericWithdrawAmount = Number(withdrawAmount);

  // Initialize withdraw amount when modal opens
  React.useEffect(() => {
    if (showVerifyModal) {
      setWithdrawAmount(numericTotalCoins);
      setIsVerified(false);
      setPassword("");
      setWithdrawStep(0);
    }
  }, [showVerifyModal, numericTotalCoins]);

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    const success = await updateBanking(bankForm);
    if (success) setIsEditingBank(false);
  };

  const isBankingInfoComplete = useMemo(() => {
    if (!bankingDetails) return false;
    const { accountName, payoutMode, accountNumber, ifscCode, upiId } =
      bankingDetails;
    if (!accountName) return false;
    if (payoutMode === "BANK") {
      return !!(accountNumber && ifscCode);
    } else if (payoutMode === "UPI") {
      return !!upiId;
    }
    return false;
  }, [bankingDetails]);

  const handleOpenPayoutModal = () => {
    if (!isBankingInfoComplete) {
      toast.error("Banking details incomplete", {
        style: {
          background: "#000",
          color: "#fff",
          border: `1px solid ${themeColor}`,
          fontSize: "10px",
          fontWeight: "black",
        },
      });
      setIsEditingBank(true);
      return;
    }
    setShowVerifyModal(true);
  };

  const handleVerify = async () => {
    setVerifying(true);
    const success = await verifyPassword(password);
    if (success) {
      setIsVerified(true);
      setWithdrawStep(1);
    }
    setVerifying(false);
  };

  const handleProceedToAmount = () => {
    setWithdrawStep(2);
  };

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
      bankForm
    );
    if (success) {
      setShowVerifyModal(false);
      setWithdrawAmount(0);
      toast.success("Withdrawal request dispatched", {
        style: {
          background: "#000",
          color: "#fff",
          border: `1px solid ${themeColor}`,
          fontSize: "10px",
          fontWeight: "black",
        },
      });
      refreshWallet();
    }
  };

  if (bankingLoading || dashboardLoading || walletLoading)
    return (
      <div className="p-10 text-center text-white/70 font-inter font-black uppercase tracking-widest animate-pulse">
        Initializing Secure Banking...
      </div>
    );

  return (
    <div className="h-full custom-scrollbar bg-background text-white font-inter pb-4">
      <div className="px-1 lg:px-3 pt-1 lg:pt-3 lg:pb-3 flex flex-col gap-4 md:gap-12 animate-fade-in relative">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 relative z-10 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Button
                  onClick={() => setShowBankModal(true)}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-card border border-white/10 hover:border-primary/30 rounded-[6px] text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 mt-2 sm:mt-0"
                >
                  <Landmark size={14} className="shrink-0" /> Bank Details
                </Button>
              </div>
              <p className="text-white/70 font-inter font-light text-[14px] md:text-[20px] mt-2">
                Banking & Secure Settlement Console
              </p>
            </div>
          </div>

          <div className="flex items-center w-full xl:w-auto mt-4 xl:mt-0">
            <div className="flex justify-between md:justify-end divide-x divide-white/10 w-full xl:w-auto">
              <div className="pr-4 md:px-6 py-1 flex flex-col justify-center">
                <p className="text-[7px] md:text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1 md:mb-1.5">
                  Confirmed
                </p>
                <p className="text-[14px] md:text-[20px] font-black text-white leading-none tracking-tighter truncate">
                  Rs {numericTotalCoins.toLocaleString()}
                </p>
              </div>
              <div className="px-4 md:px-6 py-1 flex flex-col justify-center">
                <p className="text-[7px] md:text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1 md:mb-1.5">
                  Pending
                </p>
                <p className="text-[14px] md:text-[20px] font-black text-white/50 leading-none tracking-tighter truncate">
                  Rs {numericPendingCoins.toLocaleString()}
                </p>
              </div>
              <div className="pl-4 md:px-6 py-1 flex flex-col justify-center">
                <p className="text-[7px] md:text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1 md:mb-1.5">
                  Lifetime
                </p>
                <p className="text-[14px] md:text-[20px] font-black text-white leading-none tracking-tighter truncate">
                  Rs {(dashboardData?.totalRevenue || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-8 space-y-6 md:space-y-10">
            {/* Simple Balance Card */}
            <div className="bg-card border border-white/10 rounded-[16px] p-4 md:p-6 shadow-2xl flex flex-row items-center justify-between gap-4">
              <div className="flex flex-col md:flex-row md:items-baseline gap-0.5 md:gap-3">
                <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest text-white/70">
                  Balance:
                </span>
                <span
                  className="text-[16px] md:text-[24px] font-black tracking-tight"
                  style={{ color: themeColor }}
                >
                  Rs {numericTotalCoins.toLocaleString()}
                </span>
              </div>
              <Button
                onClick={handleOpenPayoutModal}
                className="px-3 py-2 md:px-6 md:py-3 text-black rounded-[6px] font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all transform active:scale-95 whitespace-nowrap"
                style={{ backgroundColor: themeColor }}
              >
                Request Settlement
              </Button>
            </div>

            {/* Financial Ledger */}
            <div className="bg-card border border-white/10 rounded-[16px] overflow-hidden shadow-2xl">
              <div className="p-4 md:p-8 border-b border-white/10 flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 md:gap-4">
                  <h3 className="text-[10px] md:text-[12px] font-bold font-['Open_Sans'] uppercase tracking-[0.1em] md:tracking-[0.2em] whitespace-nowrap">
                    Financial Ledger
                  </h3>
                </div>
                <Button className="rounded-[6px] text-[7px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 md:gap-2 text-neutral-500 hover:text-white transition-all text-right md:text-left">
                  <Download className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />{" "}
                  Download Audit CSV
                </Button>
              </div>
              <div className="overflow-x-auto no-scrollbar w-full">
                <table className="w-full text-left table-fixed sm:table-auto">
                  <thead>
                    <tr className="bg-card">
                      <th className="px-3 md:px-8 py-3 md:py-5 text-[6px] md:text-[9px] font-black text-neutral-600 uppercase tracking-widest w-1/2 sm:w-auto">
                        Transaction Origin
                      </th>
                      <th className="px-2 md:px-8 py-3 md:py-5 text-[6px] md:text-[9px] font-black text-neutral-600 uppercase tracking-widest w-1/4 sm:w-auto">
                        Temporal Log
                      </th>
                      <th className="px-3 md:px-8 py-3 md:py-5 text-[6px] md:text-[9px] font-black text-neutral-600 uppercase tracking-widest text-right w-1/4 sm:w-auto">
                        Quantum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {walletData.transactions &&
                    walletData.transactions.length > 0 ? (
                      walletData.transactions.map((tx, idx) => (
                        <tr
                          key={tx._id || idx}
                          className="hover:bg-card transition-colors group"
                        >
                          {" "}
                          <td className="px-3 md:px-8 py-4 md:py-6 overflow-hidden">
                            <div className="flex items-center gap-2 md:gap-4">
                              <div
                                className="w-6 h-6 md:w-10 md:h-10 rounded-[16px] md:rounded-[16px] bg-card flex items-center justify-center border border-white/10 transition-all flex-shrink-0"
                                style={{
                                  color: [
                                    "DEBIT",
                                    "WITHDRAWAL",
                                    "DISPUTE_FREEZE",
                                    "HOST_GAME",
                                    "JOIN_GAME",
                                  ].includes(tx.type)
                                    ? "var(--destructive)"
                                    : themeColor,
                                  borderColor: [
                                    "DEBIT",
                                    "WITHDRAWAL",
                                    "DISPUTE_FREEZE",
                                    "HOST_GAME",
                                    "JOIN_GAME",
                                  ].includes(tx.type)
                                    ? "var(--destructive)33"
                                    : `${themeColor}33`,
                                }}
                              >
                                {[
                                  "DEBIT",
                                  "WITHDRAWAL",
                                  "DISPUTE_FREEZE",
                                  "HOST_GAME",
                                  "JOIN_GAME",
                                ].includes(tx.type) ? (
                                  <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                                ) : (
                                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] md:text-sm font-black uppercase tracking-tight text-white truncate">
                                  {tx.description ||
                                    `Log #${tx._id?.slice(-6).toUpperCase()}`}
                                </p>
                                <p className="text-[6px] md:text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5 md:mt-1 truncate">
                                  {tx.type} Rs • {tx.status}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 md:px-8 py-4 md:py-6 text-[7px] md:text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                            {new Date(tx.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "2-digit",
                                year: "2-digit",
                              }
                            )}
                          </td>
                          <td
                            className={`px-3 md:px-8 py-4 md:py-6 text-right font-black tracking-tighter text-[10px] md:text-lg`}
                            style={{
                              color: [
                                "DEBIT",
                                "WITHDRAWAL",
                                "DISPUTE_FREEZE",
                                "HOST_GAME",
                                "JOIN_GAME",
                              ].includes(tx.type)
                                ? "var(--destructive)"
                                : themeColor,
                            }}
                          >
                            {[
                              "DEBIT",
                              "WITHDRAWAL",
                              "DISPUTE_FREEZE",
                              "HOST_GAME",
                              "JOIN_GAME",
                            ].includes(tx.type)
                              ? "-"
                              : "+"}{" "}
                            Rs {Number(tx.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-20">
                            <FileText size={48} className="text-neutral-500" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600">
                              No active audit logs
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Records */}
          <div className="lg:col-span-4 space-y-10">
            {/* Recent Settlements */}
            <div className="bg-card border border-white/10 rounded-[16px] p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <h3 className="text-[12px] font-bold font-['Open_Sans'] uppercase tracking-[0.2em]">
                  Recent Records
                </h3>
              </div>
              <div className="space-y-4">
                {withdrawals && withdrawals.length > 0 ? (
                  withdrawals.slice(0, 3).map((withdrawal, i) => (
                    <div
                      key={withdrawal._id || i}
                      className="flex justify-between items-center p-5 bg-card rounded-[16px] border border-white/10 hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-[16px] flex items-center justify-center border transition-all ${withdrawal.status === "SUCCESS" ? "bg-primary/10 text-primary border-primary/20" : withdrawal.status === "PENDING" ? "bg-orange-500/10 text-orange-500 border-orange-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}
                        >
                          {withdrawal.status === "SUCCESS" ? (
                            <CheckCircle size={16} />
                          ) : (
                            <History size={16} />
                          )}
                        </div>
                        <div>
                          <p className="text-base font-black text-white tracking-tight">
                            Rs {Number(withdrawal.amount).toLocaleString()}
                          </p>
                          <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mt-1">
                            {new Date(withdrawal.createdAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "2-digit" }
                            )}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest ${withdrawal.status === "SUCCESS" ? "text-primary" : withdrawal.status === "PENDING" ? "text-orange-500" : "text-red-500"}`}
                      >
                        {withdrawal.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center bg-card rounded-[16px] border border-dashed border-white/10">
                    <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.2em]">
                      No Records Found
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Modal */}
        {showVerifyModal && (
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
                  onClick={() => setShowVerifyModal(false)}
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
                      Rs {numericTotalCoins.toLocaleString()}
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
                        max={numericTotalCoins}
                        value={withdrawAmount === 0 ? "" : withdrawAmount}
                        onChange={(e) =>
                          setWithdrawAmount(
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        className="w-full bg-card border border-white/10 rounded-[16px] pl-10 md:pl-14 pr-4 md:pr-6 py-2 md:py-5 text-white focus:outline-none focus:border-primary/30 transition-all font-black text-lg md:text-3xl placeholder-neutral-800 shadow-inner"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 left-0 right-0 pt-2 md:pt-6 bg-card">
                  <Button
                    type="submit"
                    disabled={
                      submitting ||
                      !withdrawAmount ||
                      parseFloat(withdrawAmount) > numericTotalCoins
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
        {showBankModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="bg-card border border-white/10 rounded-[16px] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in relative flex flex-col max-h-full">
              <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-1 h-6 rounded-full shadow-[0_0_10px_rgba(0,193,135,0.3)]"
                    style={{ backgroundColor: themeColor }}
                  />
                  <h3 className="text-lg font-black font-inter uppercase tracking-tight text-white">
                    Banking Details
                  </h3>
                </div>
                <Button
                  onClick={() => setShowBankModal(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-[16px] text-neutral-500 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 md:p-6 relative z-10 overflow-y-auto no-scrollbar flex-1">
                <div className="flex justify-end mb-6">
                  <Button
                    onClick={() => setIsEditingBank(!isEditingBank)}
                    className="px-3 py-1.5 flex items-center gap-2 bg-white/5 rounded-[16px] border border-white/10 hover:bg-white/10 transition-all text-neutral-400 hover:text-white text-[10px] uppercase font-bold tracking-widest"
                  >
                    {isEditingBank ? (
                      "View Details"
                    ) : (
                      <>
                        <Plus size={12} /> Edit Details
                      </>
                    )}
                  </Button>
                </div>

                {isEditingBank ? (
                  <form
                    onSubmit={handleBankSubmit}
                    className="space-y-5 animate-scale-in"
                  >
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                        Account Holder
                      </label>
                      <Input
                        type="text"
                        required
                        className="w-full bg-black border border-white/10 rounded-[16px] px-5 py-4 text-[13px] text-white focus:outline-none focus:border-primary/30 transition-all font-black placeholder-neutral-800"
                        value={bankForm.accountName}
                        onChange={(e) =>
                          setBankForm({
                            ...bankForm,
                            accountName: e.target.value,
                          })
                        }
                        placeholder="Full Legal Name"
                      />
                    </div>
                    {bankForm.payoutMode === "BANK" ? (
                      <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                            Account Number
                          </label>
                          <Input
                            type="text"
                            required
                            className="w-full bg-black border border-white/10 rounded-[16px] px-5 py-4 text-[13px] text-white focus:outline-none focus:border-primary/30 transition-all font-black placeholder-neutral-800"
                            value={bankForm.accountNumber}
                            onChange={(e) =>
                              setBankForm({
                                ...bankForm,
                                accountNumber: e.target.value,
                              })
                            }
                            placeholder="Account Number"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                            IFSC Code
                          </label>
                          <Input
                            type="text"
                            required
                            className="w-full bg-black border border-white/10 rounded-[16px] px-5 py-4 text-[13px] text-white focus:outline-none focus:border-primary/30 transition-all font-black uppercase placeholder-neutral-800"
                            value={bankForm.ifscCode}
                            onChange={(e) =>
                              setBankForm({
                                ...bankForm,
                                ifscCode: e.target.value,
                              })
                            }
                            placeholder="IFSC CODE"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                          UPI ID
                        </label>
                        <Input
                          type="text"
                          required
                          placeholder="username@bank"
                          className="w-full bg-black border border-white/10 rounded-[16px] px-5 py-4 text-[13px] text-white focus:outline-none focus:border-primary/30 transition-all font-black"
                          value={bankForm.upiId}
                          onChange={(e) =>
                            setBankForm({ ...bankForm, upiId: e.target.value })
                          }
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                        Payout Channel
                      </label>
                      <Select
                        className="w-full bg-black border border-white/10 rounded-[16px] px-5 py-4 text-[13px] text-white focus:outline-none font-black appearance-none cursor-pointer uppercase tracking-widest"
                        value={bankForm.payoutMode}
                        onChange={(e) =>
                          setBankForm({
                            ...bankForm,
                            payoutMode: e.target.value,
                          })
                        }
                      >
                        <option value="BANK">Bank Transfer</option>
                        <option value="UPI">UPI Gateway</option>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full py-5 text-black font-black uppercase text-[11px] tracking-[0.2em] rounded-[16px] mt-4 shadow-2xl transition-all"
                      style={{ backgroundColor: themeColor }}
                    >
                      Synchronize Credentials
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6 md:space-y-8 animate-fade-in">
                    <div className="flex items-center gap-3 md:gap-5 bg-card p-4 md:p-6 rounded-[16px] border border-white/10">
                      <div
                        className="w-10 h-10 md:w-14 md:h-14 rounded-[16px] flex items-center justify-center border shrink-0"
                        style={{
                          backgroundColor: `${themeColor}1A`,
                          color: themeColor,
                          borderColor: `${themeColor}33`,
                        }}
                      >
                        <Landmark className="w-5 h-5 md:w-7 md:h-7" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] md:text-[15px] font-black text-white uppercase tracking-tight truncate">
                          {bankingDetails?.bankName || "HDFC Bank"}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
                          Ending in ••••{" "}
                          {bankingDetails?.accountNumber?.slice(-4) || "4920"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black border-b border-white/10 pb-4">
                        <span className="text-neutral-600 uppercase tracking-widest">
                          Account Holder
                        </span>
                        <span className="text-white uppercase tracking-widest">
                          {bankingDetails?.accountName || "MANISH GOUD KATTA"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-black border-b border-white/10 pb-4">
                        <span className="text-neutral-600 uppercase tracking-widest">
                          {bankingDetails?.payoutMode === "UPI"
                            ? "UPI ID"
                            : "IFSC Code"}
                        </span>
                        <span className="text-white uppercase tracking-widest">
                          {bankingDetails?.payoutMode === "UPI"
                            ? bankingDetails?.upiId || "manish.goud@okaxis"
                            : bankingDetails?.ifscCode || "HDFC0001234"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-black">
                        <span className="text-neutral-600 uppercase tracking-widest">
                          Channel
                        </span>
                        <span
                          className="uppercase tracking-widest px-3 py-1 rounded-[16px] text-[8px] font-black border"
                          style={{
                            color: themeColor,
                            backgroundColor: `${themeColor}1A`,
                            borderColor: `${themeColor}33`,
                          }}
                        >
                          {bankingDetails?.payoutMode === "UPI"
                            ? "UPI Node"
                            : "Bank Swift"}
                        </span>
                      </div>
                    </div>

                    {!isBankingInfoComplete && (
                      <div className="p-4 md:p-6 bg-red-500/5 border border-red-500/10 rounded-[16px] space-y-3 md:space-y-4 mt-4 md:mt-6">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="text-red-500" size={16} />
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">
                            KYC REQUIRED
                          </span>
                        </div>
                        <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest leading-relaxed">
                          Financial identity verification is pending. Settlement
                          nodes are currently frozen.
                        </p>
                        <Button
                          onClick={() => setIsEditingBank(true)}
                          className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[16px] border transition-all flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: `${themeColor}1A`,
                            color: themeColor,
                            borderColor: `${themeColor}33`,
                          }}
                        >
                          <ShieldCheck size={14} /> INITIALIZE KYC
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueBanking;
