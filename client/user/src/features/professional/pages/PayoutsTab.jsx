import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  Landmark,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Edit2,
  X,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
  ArrowLeft,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { Button, Input, Select } from "@kridaz/ui";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const PayoutsTab = ({ role }) => {
  const [banking, setBanking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Banking Form state
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [payoutMode, setPayoutMode] = useState("BANK"); // BANK or UPI

  // UI States
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Card Description Toggles
  const [activeDescCard, setActiveDescCard] = useState(null); // 'usable', 'reserved', 'dispute', 'lifetime' or null

  // Feedback
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackType, setFeedbackType] = useState("success");

  // Lifetime Earnings Filter state
  const [earningsFilter, setEarningsFilter] = useState("ALL_TIME"); // TODAY, 7_DAYS, THIS_MONTH, LAST_MONTH, CUSTOM
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);

  // Mock comparison chart data based on filter selection
  const [chartData, setChartData] = useState([]);

  // Fetch Banking details & wallet balances from API
  const fetchBankingDetails = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.get("/api/owner/banking", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        setBanking(res.data);
        const details = res.data.bankingDetails || {};
        setAccountName(details.accountName || "");
        setAccountNumber(details.accountNumber || "");
        setIfscCode(details.ifscCode || "");
        setBankName(details.bankName || "");
        setUpiId(details.upiId || "");
        setPayoutMode(details.payoutMode || "BANK");

        // If banking details aren't fully configured, force edit mode to display form at top
        if (!details.accountName) {
          setIsEditingBank(true);
        } else {
          setIsEditingBank(false);
        }
      }
    } catch (err) {
      console.error("Failed to load banking details", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankingDetails();
  }, []);

  // Generate chart data from live balances
  useEffect(() => {
    if (!banking) return;
    const usable = parseFloat(banking.walletBalance || 0);
    const reserved = parseFloat(banking.reservedBalance || 0);
    const dispute = parseFloat(banking.disputeBalance || 0);
    const withdrawn = parseFloat(banking.withdrawnBalance || 0);
    setChartData([
      { name: "Usable", "Current Balance": usable, Withdrawn: 0 },
      { name: "Reserved", "Current Balance": reserved, Withdrawn: 0 },
      { name: "Dispute", "Current Balance": dispute, Withdrawn: 0 },
      { name: "Withdrawn", "Current Balance": 0, Withdrawn: withdrawn },
    ]);
  }, [banking]);

  // Save Banking Configuration
  const handleSaveBanking = async (e) => {
    e.preventDefault();
    setFeedbackMsg("");
    setIsSavingDetails(true);
    try {
      const token = localStorage.getItem("token") || "";
      const payload = {
        accountName,
        payoutMode,
        ...(payoutMode === "BANK"
          ? { accountNumber, ifscCode, bankName }
          : { upiId }),
      };

      const res = await axios.put("/api/owner/banking", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data) {
        setFeedbackType("success");
        setFeedbackMsg(
          "Banking configurations saved successfully and sent for pending verification!"
        );
        setIsEditingBank(false);
        fetchBankingDetails();
      }
    } catch (err) {
      setFeedbackType("error");
      setFeedbackMsg(
        err.response?.data?.message || "Failed to save banking configurations."
      );
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Submit Withdrawal Request
  const handleRequestPayout = async (e) => {
    e.preventDefault();
    setFeedbackMsg("");

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFeedbackType("error");
      setFeedbackMsg("Please enter a valid withdrawal amount.");
      return;
    }

    if (amountNum > parseFloat(banking?.walletBalance || 0)) {
      setFeedbackType("error");
      setFeedbackMsg("Insufficient usable balance in wallet.");
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.post(
        "/api/owner/banking/payout",
        { amount: amountNum },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data) {
        setFeedbackType("success");
        setFeedbackMsg(
          "Withdrawal request submitted successfully! Pending admin approval."
        );
        setWithdrawAmount("");
        setIsWithdrawModalOpen(false);
        fetchBankingDetails();
      }
    } catch (err) {
      setFeedbackType("error");
      setFeedbackMsg(
        err.response?.data?.message || "Failed to process withdrawal request."
      );
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const walletBalance = parseFloat(banking?.walletBalance || 0);
  const reservedBalance = parseFloat(banking?.reservedBalance || 0);
  const disputeBalance = parseFloat(banking?.disputeBalance || 0);
  const withdrawnBalance = parseFloat(banking?.withdrawnBalance || 0);

  // Calculate Lifetime Earning based on live balances
  const getFilteredLifetimeEarning = () => {
    return walletBalance + reservedBalance + disputeBalance + withdrawnBalance;
  };

  const hasConfiguredBank =
    banking?.bankingDetails && banking.bankingDetails.accountName;
  const kycStatus = banking?.bankingDetails?.kycStatus || "PENDING";

  return (
    <div className="space-y-6 text-white font-inter w-full overflow-x-hidden pb-4">
      {/* feedback message banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in duration-300 ${feedbackType === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
        >
          {feedbackType === "success" ? (
            <CheckCircle size={20} className="flex-shrink-0" />
          ) : (
            <AlertCircle size={20} className="flex-shrink-0" />
          )}
          <span className="text-sm font-medium flex-1">{feedbackMsg}</span>
          <Button
            onClick={() => setFeedbackMsg("")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </Button>
        </div>
      )}

      {/* TOP BANK DETAILS SECTION */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-[#141414] to-background border border-border space-y-4 relative overflow-hidden">
        {/* Glow element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] pointer-events-none" />

        {isEditingBank ? (
          // BANK CONFIGURATION INPUT FORM
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                <Button
                  type="button"
                  onClick={() => setIsEditingBank(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all shrink-0 mt-0.5 sm:mt-0"
                >
                  <ArrowLeft size={18} />
                </Button>
                <Landmark
                  size={22}
                  className="text-primary shrink-0 mt-1 sm:mt-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] sm:text-lg font-black tracking-widest uppercase font-inter text-white break-words">
                    Configure Payout Destination
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 break-words">
                    Fill details to request payouts. Verification status will
                    show as pending.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex bg-black p-1 rounded-xl border border-border gap-2 w-full sm:max-w-xs">
              <button
                type="button"
                onClick={() => setPayoutMode("BANK")}
                style={payoutMode === "BANK" ? { backgroundColor: "var(--primary)", color: "#000" } : { backgroundColor: "transparent" }}
                className={`flex-1 font-bold text-xs py-2 rounded-lg transition-all uppercase tracking-wider outline-none border-none ${payoutMode === "BANK" ? "" : "text-muted-foreground hover:text-white"}`}
              >
                Bank Account
              </button>
              <button
                type="button"
                onClick={() => setPayoutMode("UPI")}
                style={payoutMode === "UPI" ? { backgroundColor: "var(--primary)", color: "#000" } : { backgroundColor: "transparent" }}
                className={`flex-1 font-bold text-xs py-2 rounded-lg transition-all uppercase tracking-wider outline-none border-none ${payoutMode === "UPI" ? "" : "text-muted-foreground hover:text-white"}`}
              >
                UPI ID
              </button>
            </div>

            <form
              onSubmit={handleSaveBanking}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <div className="space-y-2 min-w-0">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest ml-1 truncate block">
                  Account Holder Name
                </label>
                <Input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Name as in Bank Account"
                  className="w-full bg-black border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {payoutMode === "BANK" ? (
                <>
                  <div className="space-y-2 min-w-0">
                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest ml-1 truncate block">
                      Bank Name
                    </label>
                    <Input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g., HDFC Bank"
                      className="w-full bg-black border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest ml-1 truncate block">
                      IFSC Code
                    </label>
                    <Input
                      type="text"
                      required
                      value={ifscCode}
                      onChange={(e) =>
                        setIfscCode(e.target.value.toUpperCase())
                      }
                      placeholder="IFSC Code"
                      className="w-full bg-black border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest ml-1 truncate block">
                      Account Number
                    </label>
                    <Input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) =>
                        setAccountNumber(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Enter Account Number"
                      className="w-full bg-black border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors font-mono"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2 md:col-span-2 min-w-0">
                  <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest ml-1 truncate block">
                    UPI ID / VPA
                  </label>
                  <Input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bank"
                    className="w-full bg-black border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors font-mono"
                  />
                </div>
              )}

              <div className="md:col-span-2 pt-2 flex flex-col sm:flex-row gap-3 min-w-0 w-full">
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  style={{ backgroundColor: "var(--primary)", color: "#000" }}
                  className="w-full md:w-auto px-4 sm:px-8 font-extrabold rounded-xl py-3.5 transition-all text-xs sm:text-sm shadow-[0_0_20px_rgba(191,243,103,0.15)] uppercase tracking-wider whitespace-normal break-words outline-none border-none hover:brightness-110 disabled:opacity-50"
                >
                  {isSavingDetails
                    ? "Saving Configuration..."
                    : "Submit for Verification"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          // CONFIGURED BANK VIEW (ICON + VERIFICATION STATUS)
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Landmark size={28} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col items-start justify-center">
                <span
                  className={`mb-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap ${
                    kycStatus === "VERIFIED"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : kycStatus === "REJECTED"
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  }`}
                >
                  {kycStatus === "VERIFIED"
                    ? "Verified"
                    : kycStatus === "REJECTED"
                      ? "Rejected"
                      : "Verification Pending"}
                </span>
                {bankName && payoutMode === "BANK" && (
                  <h4 className="font-bold text-white tracking-tight text-base sm:text-lg truncate w-full">
                    {bankName}
                  </h4>
                )}
                {payoutMode === "UPI" && (
                  <h4 className="font-bold text-white tracking-tight text-base sm:text-lg truncate w-full">
                    UPI Payment Destination
                  </h4>
                )}
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-widest font-mono truncate w-full mt-0.5">
                  {payoutMode === "BANK"
                    ? `A/C: *******${accountNumber ? accountNumber.slice(-4) : "0000"} (${accountName || "N/A"})`
                    : `UPI ID: ${upiId} (${accountName || "N/A"})`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                onClick={() => setIsEditingBank(true)}
                className="flex-1 md:flex-initial px-4 py-3 bg-card hover:bg-[#252525] border border-border rounded-xl text-xs font-bold text-gray-300 transition-all flex items-center justify-center gap-2"
              >
                <Edit2 size={14} />
                Edit Bank details
              </Button>

              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={walletBalance <= 0 || kycStatus !== "VERIFIED"}
                style={{ backgroundColor: "var(--primary)", color: "#000" }}
                className="flex-1 md:flex-initial px-6 py-3 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(191,243,103,0.1)] outline-none border-none hover:brightness-110 disabled:opacity-50"
              >
                <ArrowUpRight size={15} />
                Withdrawal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOUR FINANCIAL BOXES (2 per row layout) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Usable Balance */}
        <div className="py-3.5 px-3 rounded-2xl bg-gradient-to-br from-[#141414] to-[#0f0f0f] border border-border relative overflow-hidden flex flex-col justify-center min-h-[5.5rem] h-auto text-center items-center gap-1.5">
          <div className="w-full">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider truncate">
                Usable Balance
              </span>
              <button
                onClick={() =>
                  setActiveDescCard(
                    activeDescCard === "usable" ? null : "usable"
                  )
                }
                className="text-gray-500 hover:text-white transition-colors outline-none bg-transparent border-0 p-0 shrink-0"
                title="View Details"
              >
                <Info size={11} />
              </button>
            </div>
            <h2 className="text-xl font-black text-primary tracking-tight" style={{ fontFamily: "'Nunito', 'Quicksand', sans-serif" }}>
              ₹{walletBalance.toFixed(2)}
            </h2>
          </div>
          {activeDescCard === "usable" && (
            <div className="text-[9px] text-gray-300 bg-black/40 p-1.5 rounded border border-white/5 animate-in fade-in duration-200 w-full mt-1">
              Available for immediate withdrawal request.
            </div>
          )}
        </div>

        {/* Card 2: Reserved Escrow */}
        <div className="py-3.5 px-3 rounded-2xl bg-[#141414] border border-border relative overflow-hidden flex flex-col justify-center min-h-[5.5rem] h-auto text-center items-center gap-1.5">
          <div className="w-full">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider truncate">
                Reserved Escrow
              </span>
              <button
                onClick={() =>
                  setActiveDescCard(
                    activeDescCard === "reserved" ? null : "reserved"
                  )
                }
                className="text-gray-500 hover:text-white transition-colors outline-none bg-transparent border-0 p-0 shrink-0"
                title="View Details"
              >
                <Info size={11} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Nunito', 'Quicksand', sans-serif" }}>
              ₹{reservedBalance.toFixed(2)}
            </h2>
          </div>
          {activeDescCard === "reserved" && (
            <div className="text-[9px] text-gray-300 bg-black/40 p-1.5 rounded border border-white/5 animate-in fade-in duration-200 w-full mt-1">
              Released to usable balance automatically upon successful match
              completion.
            </div>
          )}
        </div>

        {/* Card 3: Dispute Balance */}
        <div className="py-3.5 px-3 rounded-2xl bg-[#141414] border border-border relative overflow-hidden flex flex-col justify-center min-h-[5.5rem] h-auto text-center items-center gap-1.5">
          <div className="w-full">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider truncate">
                Conflict Balance
              </span>
              <button
                onClick={() =>
                  setActiveDescCard(
                    activeDescCard === "dispute" ? null : "dispute"
                  )
                }
                className="text-gray-500 hover:text-white transition-colors outline-none bg-transparent border-0 p-0 shrink-0"
                title="View Details"
              >
                <Info size={11} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Nunito', 'Quicksand', sans-serif" }}>
              ₹{disputeBalance.toFixed(2)}
            </h2>
          </div>
          {activeDescCard === "dispute" && (
            <div className="text-[9px] text-gray-300 bg-black/40 p-1.5 rounded border border-white/5 animate-in fade-in duration-200 w-full mt-1">
              Under review due to dispute/claims raised within 12 hours of match
              ending.
            </div>
          )}
        </div>

        {/* Card 4: Total Lifetime Earnings with Filtering */}
        <div className="py-3.5 px-3 rounded-2xl bg-[#141414] border border-border relative overflow-hidden flex flex-col justify-center min-h-[5.5rem] h-auto text-center items-center gap-1.5">
          <div className="w-full flex flex-col items-center">
            <div className="flex items-center justify-center gap-1 mb-1 w-full">
              <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider truncate">
                Lifetime Earnings
              </span>
              <button
                onClick={() =>
                  setActiveDescCard(
                    activeDescCard === "lifetime" ? null : "lifetime"
                  )
                }
                className="text-gray-500 hover:text-white transition-colors outline-none bg-transparent border-0 p-0 shrink-0"
                title="View Details"
              >
                <Info size={11} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-1 w-full">
              <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Nunito', 'Quicksand', sans-serif" }}>
                ₹{getFilteredLifetimeEarning().toLocaleString()}
              </h2>
              {/* Filter Dropdown */}
              <select
                value={earningsFilter}
                onChange={(e) => setEarningsFilter(e.target.value)}
                className="bg-black border border-white/10 text-[9px] font-bold text-gray-300 rounded px-2 py-1 focus:outline-none focus:border-primary transition-all cursor-pointer w-fit max-w-[90%] text-center mx-auto shadow-xl"
              >
                <option value="ALL_TIME" className="bg-black text-gray-300">All Time</option>
                <option value="TODAY" className="bg-black text-gray-300">Today's Journey</option>
                <option value="7_DAYS" className="bg-black text-gray-300">Last 7 Days</option>
                <option value="THIS_MONTH" className="bg-black text-gray-300">This Month</option>
                <option value="LAST_MONTH" className="bg-black text-gray-300">Last Month</option>
                <option value="CUSTOM" className="bg-black text-gray-300">Custom Range</option>
              </select>
            </div>
          </div>

          {earningsFilter === "CUSTOM" && (
            <div className="flex flex-col gap-1 mt-2 p-1.5 bg-black/40 rounded border border-white/5 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-1">
                <DatePicker
                  selected={customStartDate}
                  onChange={(date) => setCustomStartDate(date)}
                  placeholderText="Start"
                  className="bg-black border border-border rounded px-1 py-0.5 text-[8px] text-white focus:outline-none w-14"
                />
                <span className="text-[8px] text-muted-foreground">to</span>
                <DatePicker
                  selected={customEndDate}
                  onChange={(date) => setCustomEndDate(date)}
                  placeholderText="End"
                  className="bg-black border border-border rounded px-1 py-0.5 text-[8px] text-white focus:outline-none w-14"
                />
              </div>
            </div>
          )}

          {activeDescCard === "lifetime" && (
            <div className="text-[9px] text-gray-300 bg-black/40 p-1.5 rounded border border-white/5 animate-in fade-in duration-200 w-full mt-1">
              Gross earnings generated from all completed match duties.
            </div>
          )}
        </div>
      </div>

      {/* GRAPH / ANALYTICS SECTION */}
      <div className="p-6 rounded-2xl bg-[#141414] border border-border space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 gap-4 sm:gap-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] sm:text-lg font-black tracking-widest uppercase font-inter text-white break-words">
              Balance Distribution
            </h3>
            <p className="text-xs text-muted-foreground mt-1 break-words">
              Live breakdown of your wallet across categories
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Active Balance
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-neutral-600" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider font-inter">
                Withdrawn
              </span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="colorWithdrawn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                }}
                itemStyle={{ color: "#fff", fontSize: "12px" }}
                labelStyle={{
                  color: "var(--muted-foreground)",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
                formatter={(value) => [
                  `₹${Number(value).toLocaleString()}`,
                  undefined,
                ]}
              />
              <Bar
                dataKey="Current Balance"
                fill="url(#colorBalance)"
                radius={[6, 6, 0, 0]}
                name="Active Balance"
              />
              <Bar
                dataKey="Withdrawn"
                fill="url(#colorWithdrawn)"
                radius={[6, 6, 0, 0]}
                name="Withdrawn"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* WITHDRAWAL REQUEST OVERLAY MODAL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-6 relative animate-in zoom-in-95 duration-200">
            <Button
              onClick={() => setIsWithdrawModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-neutral-800 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </Button>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black tracking-widest text-primary uppercase italic font-inter">
                Request Fund Withdrawal
              </h3>
              <p className="text-xs text-gray-400">
                Withdraw money from your usable balance directly to your
                configured payout destination.
              </p>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border flex items-center justify-between">
              <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                Available quantum:
              </span>
              <span className="text-lg font-black text-primary font-inter">
                ₹{walletBalance.toFixed(2)}
              </span>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-widest ml-1">
                  Withdrawal Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-lg font-bold text-gray-500">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={walletBalance}
                    step="any"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-black border border-border rounded-xl pl-10 pr-4 py-3.5 text-lg font-bold text-white focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 bg-card hover:bg-[#333] text-white font-bold rounded-xl py-3.5 transition-all text-sm uppercase tracking-wider border border-border"
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={
                    isSubmittingPayout ||
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) > walletBalance
                  }
                  style={!(isSubmittingPayout || !withdrawAmount || parseFloat(withdrawAmount) > walletBalance) ? { backgroundColor: "var(--primary)", color: "#000" } : {}}
                  className="flex-1 disabled:bg-neutral-800 disabled:text-neutral-500 font-extrabold rounded-xl py-3.5 transition-all text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(191,243,103,0.15)] outline-none border-none hover:brightness-110 disabled:opacity-50"
                >
                  {isSubmittingPayout ? "Processing..." : "Confirm Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsTab;
