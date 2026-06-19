import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Building,
  ShieldCheck,
  Zap,
  TrendingUp,
  Filter,
  Settings,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Activity,
  Upload,
  X,
  Image,
} from "lucide-react";
import CountUp from "react-countup";
import useAdminFinance from "@hooks/admin/useAdminFinance";
import useWithdrawals from "@hooks/admin/useWithdrawals";

const FinancialMissionControl = () => {
  const navigate = useNavigate();
  const {
    payoutSettings,
    stats,
    kycQueue,
    loading: finLoading,
    updatePayoutSettings,
    verifyKYC,
    refresh: refreshFin,
  } = useAdminFinance();

  const {
    requests: withdrawalRequests,
    loading: withdrawalLoading,
    handleApprove,
    handleReject,
    refresh: refreshWithdrawals,
  } = useWithdrawals();

  const [activeTab, setActiveTab] = useState("payouts"); // payouts, kyc, settings
  const [searchTerm, setSearchTerm] = useState("");
  const [payoutFilter, setPayoutFilter] = useState("ALL");

  // Settlement modal state
  const [settleModal, setSettleModal] = useState(null); // holds the request object being settled
  const [settleTxnId, setSettleTxnId] = useState("");
  const [settleScreenshot, setSettleScreenshot] = useState(null); // base64 data URL
  const [settleScreenshotName, setSettleScreenshotName] = useState("");
  const [isSettling, setIsSettling] = useState(false);
  const screenshotInputRef = useRef(null);

  // Reject modal state
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const openSettleModal = (req) => {
    setSettleModal(req);
    setSettleTxnId("");
    setSettleScreenshot(null);
    setSettleScreenshotName("");
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSettleScreenshotName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => setSettleScreenshot(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSettleConfirm = async () => {
    if (!settleTxnId.trim()) return;
    setIsSettling(true);
    await handleApprove(
      settleModal._id || settleModal.id,
      settleTxnId.trim(),
      settleScreenshot || null
    );
    setIsSettling(false);
    setSettleModal(null);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;
    setIsRejecting(true);
    await handleReject(rejectModal._id || rejectModal.id, rejectReason.trim());
    setIsRejecting(false);
    setRejectModal(null);
    setRejectReason("");
  };

  const filteredWithdrawals = withdrawalRequests.filter((req) => {
    const matchesSearch =
      req.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.bankDetails?.accountNumber?.includes(searchTerm);

    const matchesFilter = payoutFilter === "ALL" || req.status === payoutFilter;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "COMPLETED":
        return "text-[#CCFF00] bg-[#CCFF00]/10 border-[#CCFF00]/20";
      case "REJECTED":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  const isLoading = finLoading || withdrawalLoading;

  // Merged Stats Calculation
  const totalProcessedMTD = withdrawalRequests
    .filter((r) => r.status === "COMPLETED")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const avgPayout =
    withdrawalRequests.length > 0
      ? Math.round(
          withdrawalRequests.reduce((acc, curr) => acc + curr.amount, 0) /
            withdrawalRequests.length
        )
      : 0;

  const pendingCount = withdrawalRequests.filter(
    (r) => r.status === "PENDING"
  ).length;

  return (
    <div className="min-h-screen bg-[#000000] text-white overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#CCFF00]/5 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-[#CCFF00]/5 blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto pb-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#CCFF00] rounded-full shadow-[0_0_15px_rgba(204,255,0,0.5)]" />
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                FINANCIAL{" "}
                <span className="text-[#CCFF00]">MISSION CONTROL</span>
              </h1>
            </div>
            <p className="text-gray-400 font-medium tracking-wider uppercase text-xs ml-4">
              Treasury Management • Payout Governance • Compliance Oversight
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#1A1A1A] p-1 rounded-[8px] border border-[#2D2D2D]">
            {["payouts", "kyc", "settings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-[6px] text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? "bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.1)]" : "text-gray-500 hover:text-white"}`}
              >
                {tab === "kyc"
                  ? "KYC Queue"
                  : tab === "payouts"
                    ? "Payouts"
                    : "Logistics"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
          <FinanceStatsCard
            title="Active Treasury"
            value={stats?.totalRevenue || 0}
            icon={IndianRupee}
            trend="+14.2%"
            prefix="Rs "
          />
          <FinanceStatsCard
            title="Pending Payouts"
            value={withdrawalRequests
              .filter((r) => r.status === "PENDING")
              .reduce((acc, curr) => acc + curr.amount, 0)}
            icon={Clock}
            trend={`${pendingCount} Requests`}
            trendColor="text-yellow-500"
            prefix="Rs "
          />
          <FinanceStatsCard
            title="Processed (MTD)"
            value={totalProcessedMTD}
            icon={CheckCircle2}
            trend="Stable"
            prefix="Rs "
          />
          <FinanceStatsCard
            title="Average Payout"
            value={avgPayout}
            icon={TrendingUp}
            trend="Rolling"
            prefix="Rs "
          />
          <FinanceStatsCard
            title="KYC Compliance"
            value={100 - kycQueue.length * 5}
            icon={ShieldCheck}
            suffix="%"
            trend="Verified"
          />
          <FinanceStatsCard
            title="System Pulse"
            value={98}
            icon={Activity}
            suffix="%"
            trend="Optimal"
          />
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {activeTab === "payouts" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              {/* Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0A0A0A] p-4 rounded-[8px] border border-[#2D2D2D]">
                <div className="relative w-full md:w-96">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search partner, email or account..."
                    className="w-full bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] py-2.5 pl-11 pr-4 text-[13px] text-white focus:outline-none focus:border-[#CCFF00] transition-all font-inter"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Filter className="text-gray-500" size={16} />
                  <select
                    className="flex-1 md:w-48 bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] py-2.5 px-4 text-[13px] text-white focus:outline-none focus:border-[#CCFF00] transition-all cursor-pointer uppercase font-bold tracking-wider"
                    value={payoutFilter}
                    onChange={(e) => setPayoutFilter(e.target.value)}
                  >
                    <option value="ALL">All Transactions</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Processed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Payouts Table */}
              <div className="bg-[#0A0A0A] rounded-[8px] border border-[#2D2D2D] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#1A1A1A]/50 border-b border-[#2D2D2D]">
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#878C9F]">
                          Partner
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#878C9F]">
                          Settlement Destination
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#878C9F]">
                          Quantum
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#878C9F]">
                          Lifecycle
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#878C9F]">
                          Timestamp
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#878C9F] text-right">
                          Governance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D2D2D]/30">
                      {isLoading ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-10 h-10 border-2 border-[#CCFF00] border-t-transparent rounded-full animate-spin" />
                              <p className="text-[11px] font-black uppercase tracking-widest text-[#CCFF00]">
                                Synchronizing Treasury Data...
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredWithdrawals.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-24 text-center">
                            <div className="flex flex-col items-center gap-4 text-gray-600">
                              <AlertCircle size={40} className="opacity-20" />
                              <p className="text-[11px] font-black uppercase tracking-widest">
                                No matching transactions found
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredWithdrawals.map((req) => (
                          <tr
                            key={req._id}
                            className="group hover:bg-[#1A1A1A]/50 transition-all duration-300"
                          >
                            <td className="px-6 py-4">
                              <div
                                onClick={() =>
                                  req.owner?._id &&
                                  navigate(`/profile/${req.owner._id}`)
                                }
                                className="flex items-center gap-3 cursor-pointer group/partner"
                              >
                                <div className="w-9 h-9 rounded-[6px] bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center overflow-hidden group-hover/partner:border-[#CCFF00] transition-colors">
                                  {req.owner?.profilePicture ? (
                                    <img
                                      src={req.owner.profilePicture}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-[#CCFF00] font-bold text-xs">
                                      {req.owner?.name?.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-[14px] tracking-tight uppercase group-hover/partner:text-[#CCFF00] transition-colors">
                                    {req.owner?.name}
                                  </p>
                                  <p className="text-[10px] text-[#878C9F] uppercase tracking-widest font-medium">
                                    {req.owner?.role || "PARTNER"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-0.5">
                                <p className="text-[12px] text-gray-300 font-semibold flex items-center gap-1.5 uppercase tracking-tight">
                                  <Building
                                    size={12}
                                    className="text-[#CCFF00]"
                                  />{" "}
                                  {req.bankDetails?.bankName}
                                </p>
                                <p className="text-[11px] text-[#878C9F] font-mono tracking-tighter">
                                  {req.bankDetails?.accountNumber}
                                </p>
                                <p className="text-[9px] text-[#CCFF00]/60 font-mono tracking-widest uppercase">
                                  {req.bankDetails?.ifscCode}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-black text-white text-[16px] tracking-tighter italic">
                                Rs {req.amount.toLocaleString()}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(req.status)}`}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[11px] font-medium text-[#878C9F] uppercase tracking-wider">
                              {new Date(req.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {req.status === "PENDING" ? (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => openSettleModal(req)}
                                    className="px-3 py-1.5 bg-[#CCFF00]/10 text-[#CCFF00] hover:bg-[#CCFF00] hover:text-black rounded-[6px] transition-all border border-[#CCFF00]/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                                  >
                                    <CheckCircle size={13} /> Settle
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectModal(req);
                                      setRejectReason("");
                                    }}
                                    className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-[6px] transition-all border border-red-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                                  >
                                    <XCircle size={13} /> Reject
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="text-[10px] text-[#878C9F] italic font-mono uppercase tracking-tighter">
                                    {req.status === "COMPLETED"
                                      ? `TXN: ${req.transactionId?.slice(-8) || "N/A"}`
                                      : req.rejectionReason?.slice(0, 30)}
                                  </div>
                                  {req.status === "COMPLETED" &&
                                    req.bankDetails?.screenshotUrl && (
                                      <button
                                        onClick={() =>
                                          window.open(
                                            req.bankDetails.screenshotUrl,
                                            "_blank"
                                          )
                                        }
                                        className="text-[9px] text-[#CCFF00] font-bold uppercase tracking-wider flex items-center gap-1 hover:underline"
                                      >
                                        <Image size={10} /> View Receipt
                                      </button>
                                    )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "kyc" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="bg-[#0A0A0A] p-8 rounded-[8px] border border-[#2D2D2D]">
                <div className="mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tighter italic mb-1">
                    Pending{" "}
                    <span className="text-[#CCFF00]">KYC Verifications</span>
                  </h3>
                  <p className="text-[#878C9F] text-[11px] font-medium uppercase tracking-widest">
                    Partner bank accounts awaiting treasury clearance
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {kycQueue.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-600 border border-dashed border-[#2D2D2D] rounded-[8px]">
                      <ShieldCheck
                        size={40}
                        className="mx-auto mb-4 opacity-10"
                      />
                      <p className="text-[11px] font-black uppercase tracking-widest">
                        Compliance Queue Empty
                      </p>
                    </div>
                  ) : (
                    kycQueue.map((owner) => (
                      <div
                        key={owner._id}
                        className="bg-[#1A1A1A] border border-[#2D2D2D] p-6 rounded-[8px] hover:border-[#CCFF00]/30 transition-all group relative overflow-hidden flex flex-col"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                          <ShieldCheck size={20} className="text-[#CCFF00]" />
                        </div>
                        <div
                          onClick={() =>
                            owner._id && navigate(`/profile/${owner._id}`)
                          }
                          className="flex items-start gap-4 mb-6 cursor-pointer group/profile"
                        >
                          <div className="w-12 h-12 rounded-[6px] bg-[#CCFF00]/10 flex items-center justify-center overflow-hidden border border-[#CCFF00]/20 group-hover/profile:border-[#CCFF00] transition-colors">
                            {owner.profilePicture ? (
                              <img
                                src={owner.profilePicture}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[#CCFF00] font-black text-xl">
                                {owner.name?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white uppercase tracking-tight text-[15px] group-hover/profile:text-[#CCFF00] transition-colors">
                              {owner.name}
                            </h4>
                            <p className="text-[10px] text-[#878C9F] uppercase tracking-widest">
                              {owner.email}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 bg-black/40 p-4 rounded-[6px] border border-[#2D2D2D] mb-6 flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-[#878C9F] tracking-widest">
                              Bank
                            </span>
                            <span className="text-xs text-gray-300 font-bold uppercase tracking-tight">
                              {owner.bankingDetails?.bankName}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-[#878C9F] tracking-widest">
                              Account
                            </span>
                            <span className="text-xs text-gray-300 font-mono">
                              {owner.bankingDetails?.accountNumber}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-[#878C9F] tracking-widest">
                              IFSC
                            </span>
                            <span className="text-xs text-[#CCFF00] font-mono font-bold">
                              {owner.bankingDetails?.ifscCode}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-auto">
                          <button
                            onClick={() => verifyKYC(owner._id, "VERIFIED")}
                            className="py-3 bg-[#CCFF00] text-black text-[10px] font-black uppercase tracking-widest rounded-[6px] hover:shadow-[0_0_20px_rgba(204,255,0,0.2)] transition-all"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => verifyKYC(owner._id, "REJECTED")}
                            className="py-3 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-[6px] hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
              <div className="bg-[#0A0A0A] p-8 lg:p-10 rounded-[8px] border border-[#2D2D2D] space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-[60px]"></div>

                <div className="flex items-center gap-4 border-b border-[#2D2D2D] pb-8">
                  <div className="p-3.5 bg-[#CCFF00]/10 text-[#CCFF00] rounded-[8px] border border-[#CCFF00]/20">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic">
                      Settlement{" "}
                      <span className="text-[#CCFF00]">Logistics</span>
                    </h3>
                    <p className="text-[#878C9F] text-[11px] font-medium uppercase tracking-widest mt-1">
                      Global Payout Orchestration & Thresholds
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#878C9F] block">
                      Weekly Settlement Cycle
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day) => (
                          <button
                            key={day}
                            onClick={() =>
                              updatePayoutSettings({
                                ...payoutSettings,
                                payoutDay: day,
                              })
                            }
                            className={`py-3.5 rounded-[6px] text-[11px] font-black uppercase tracking-widest transition-all border ${payoutSettings?.payoutDay === day ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.15)]" : "bg-[#1A1A1A] text-gray-500 border-[#2D2D2D] hover:border-[#CCFF00]/30"}`}
                          >
                            {day}
                          </button>
                        )
                      )}
                    </div>
                    <p className="text-[10px] text-[#878C9F] font-medium italic uppercase tracking-wider">
                      Automated batch processing occurs at 00:00 GMT on selected
                      day.
                    </p>
                  </div>

                  <div className="pt-8 border-t border-[#2D2D2D] space-y-4">
                    <div className="flex items-center justify-between p-5 bg-[#1A1A1A] rounded-[8px] border border-[#2D2D2D] group hover:border-[#CCFF00]/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-[#CCFF00]/10 rounded-[6px] text-[#CCFF00] group-hover:scale-110 transition-transform">
                          <IndianRupee size={18} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white uppercase tracking-tight">
                            Auto-Payout Threshold
                          </p>
                          <p className="text-[10px] text-[#878C9F] uppercase tracking-widest mt-0.5">
                            Minimum processing value
                          </p>
                        </div>
                      </div>
                      <p className="font-mono text-[#CCFF00] text-xl font-black italic">
                        Rs 5,000
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-[#1A1A1A] rounded-[8px] border border-[#2D2D2D] group hover:border-[#CCFF00]/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-[#CCFF00]/10 rounded-[6px] text-[#CCFF00] group-hover:scale-110 transition-transform">
                          <Zap size={18} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white uppercase tracking-tight">
                            Platform Service Fee
                          </p>
                          <p className="text-[10px] text-[#878C9F] uppercase tracking-widest mt-0.5">
                            Deducted from each slot booking
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={payoutSettings?.platformFeePercentage || 5}
                          onChange={(e) =>
                            updatePayoutSettings({
                              ...payoutSettings,
                              platformFeePercentage: Number(e.target.value),
                            })
                          }
                          className="w-16 bg-black/40 border border-[#2D2D2D] rounded-[4px] px-2 py-1 text-[#CCFF00] font-mono text-lg font-black text-center focus:outline-none focus:border-[#CCFF00]"
                        />
                        <span className="text-[#CCFF00] font-black">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-[#1A1A1A] rounded-[8px] border border-[#2D2D2D] group hover:border-[#CCFF00]/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-[#CCFF00]/10 rounded-[6px] text-[#CCFF00] group-hover:scale-110 transition-transform">
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white uppercase tracking-tight">
                            GST (Goods & Services Tax)
                          </p>
                          <p className="text-[10px] text-[#878C9F] uppercase tracking-widest mt-0.5">
                            Tax on total booking amount
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={payoutSettings?.gstPercentage || 18}
                          onChange={(e) =>
                            updatePayoutSettings({
                              ...payoutSettings,
                              gstPercentage: Number(e.target.value),
                            })
                          }
                          className="w-16 bg-black/40 border border-[#2D2D2D] rounded-[4px] px-2 py-1 text-[#CCFF00] font-mono text-lg font-black text-center focus:outline-none focus:border-[#CCFF00]"
                        />
                        <span className="text-[#CCFF00] font-black">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-[#1A1A1A] rounded-[8px] border border-[#2D2D2D] group hover:border-[#CCFF00]/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-[#CCFF00]/10 rounded-[6px] text-[#CCFF00] group-hover:scale-110 transition-transform">
                          <ExternalLink size={18} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white uppercase tracking-tight">
                            Payment Gateway Fee
                          </p>
                          <p className="text-[10px] text-[#878C9F] uppercase tracking-widest mt-0.5">
                            Razorpay/Transaction costs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={payoutSettings?.gatewayFeePercentage || 2}
                          onChange={(e) =>
                            updatePayoutSettings({
                              ...payoutSettings,
                              gatewayFeePercentage: Number(e.target.value),
                            })
                          }
                          className="w-16 bg-black/40 border border-[#2D2D2D] rounded-[4px] px-2 py-1 text-[#CCFF00] font-mono text-lg font-black text-center focus:outline-none focus:border-[#CCFF00]"
                        />
                        <span className="text-[#CCFF00] font-black">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SETTLE MODAL ── */}
      {settleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSettleModal(null)}
        >
          <div
            className="bg-[#0A0A0A] border border-[#2D2D2D] rounded-[12px] w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D2D]">
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-wider">
                  Settle Withdrawal
                </h3>
                <p className="text-[#878C9F] text-[10px] mt-0.5 font-mono">
                  {settleModal.owner?.name} · ₹
                  {Number(settleModal.amount).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setSettleModal(null)}
                className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
              >
                <X size={16} className="text-[#878C9F]" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Transaction ID */}
              <div>
                <label className="text-[10px] font-black text-[#878C9F] uppercase tracking-widest block mb-1.5">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  value={settleTxnId}
                  onChange={(e) => setSettleTxnId(e.target.value)}
                  placeholder="e.g. UTR123456789"
                  className="w-full bg-black/60 border border-[#2D2D2D] rounded-[6px] px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#CCFF00] transition-colors placeholder:text-[#878C9F]/40"
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="text-[10px] font-black text-[#878C9F] uppercase tracking-widest block mb-1.5">
                  Payment Screenshot (Optional)
                </label>
                <input
                  ref={screenshotInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />
                {settleScreenshot ? (
                  <div className="relative rounded-[6px] overflow-hidden border border-[#2D2D2D]">
                    <img
                      src={settleScreenshot}
                      alt="Receipt"
                      className="w-full max-h-48 object-contain bg-black"
                    />
                    <button
                      onClick={() => {
                        setSettleScreenshot(null);
                        setSettleScreenshotName("");
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/80 rounded-md border border-[#2D2D2D] hover:border-red-500 transition-colors"
                    >
                      <X size={12} className="text-red-400" />
                    </button>
                    <div className="px-3 py-1.5 bg-black/80 text-[9px] text-[#878C9F] font-mono truncate">
                      {settleScreenshotName}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => screenshotInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#2D2D2D] rounded-[6px] py-6 flex flex-col items-center gap-2 hover:border-[#CCFF00]/30 transition-colors group"
                  >
                    <Upload
                      size={20}
                      className="text-[#878C9F] group-hover:text-[#CCFF00] transition-colors"
                    />
                    <span className="text-[10px] text-[#878C9F] group-hover:text-white font-bold uppercase tracking-wider transition-colors">
                      Upload Receipt
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#2D2D2D] flex gap-3">
              <button
                onClick={() => setSettleModal(null)}
                className="flex-1 py-2.5 bg-white/5 text-[#878C9F] rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSettleConfirm}
                disabled={!settleTxnId.trim() || isSettling}
                className="flex-1 py-2.5 bg-[#CCFF00] text-black rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-[#b8e600] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isSettling ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={13} /> Confirm Settlement
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setRejectModal(null)}
        >
          <div
            className="bg-[#0A0A0A] border border-[#2D2D2D] rounded-[12px] w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D2D]">
              <div>
                <h3 className="text-red-400 font-black text-sm uppercase tracking-wider">
                  Reject Withdrawal
                </h3>
                <p className="text-[#878C9F] text-[10px] mt-0.5 font-mono">
                  {rejectModal.owner?.name} · ₹
                  {Number(rejectModal.amount).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setRejectModal(null)}
                className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
              >
                <X size={16} className="text-[#878C9F]" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <label className="text-[10px] font-black text-[#878C9F] uppercase tracking-widest block mb-1.5">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this withdrawal is being rejected…"
                rows={4}
                className="w-full bg-black/60 border border-[#2D2D2D] rounded-[6px] px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-red-500 transition-colors placeholder:text-[#878C9F]/40"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#2D2D2D] flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 bg-white/5 text-[#878C9F] rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || isRejecting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isRejecting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <XCircle size={13} /> Reject Withdrawal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FinanceStatsCard = ({
  title,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  trend,
  trendColor = "text-[#CCFF00]",
}) => {
  return (
    <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden group hover:border-[#CCFF00]/30 transition-all duration-500 min-h-[140px] shadow-2xl">
      <Icon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-[6px] text-[#CCFF00] flex items-center justify-center border border-[#CCFF00]/20 shadow-sm transition-all">
          <Icon size={18} />
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 ${trendColor} border border-white/5`}
        >
          {trend}
        </div>
      </div>
      <div className="space-y-2 relative z-10">
        <h3 className="text-[11px] font-normal text-[#878C9F] uppercase tracking-[1px]">
          {title}
        </h3>
        <div className="text-2xl font-black text-white tracking-tighter italic flex items-baseline gap-1">
          {prefix && (
            <span className="text-lg text-white/40 font-normal not-italic">
              {prefix}
            </span>
          )}
          <CountUp
            end={value}
            duration={2}
            separator=","
            decimals={value % 1 === 0 ? 0 : 1}
          />
          {suffix && (
            <span className="text-lg text-white/40 font-normal not-italic">
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialMissionControl;
