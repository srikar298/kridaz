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
import useWithdrawals from "@hooks/admin/useWithdrawals";import { Button, Input, Select, Textarea } from "@kridaz/ui";


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
        return "text-primary bg-primary/10 border-primary/20";
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
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 p-6 lg:p-10 space-y-10 max-w-[1600px] mx-auto pb-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(204,255,0,0.5)]" />
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                FINANCIAL{" "}
                <span className="text-primary">MISSION CONTROL</span>
              </h1>
            </div>
            <p className="text-gray-400 font-medium tracking-wider uppercase text-xs ml-4">
              Treasury Management • Payout Governance • Compliance Oversight
            </p>
          </div>

          <div className="flex items-center gap-2 bg-card p-1 rounded-[8px] border border-border">
            {["payouts", "kyc", "settings"].map((tab) => (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-[6px] text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? "bg-primary text-black shadow-[0_0_20px_rgba(204,255,0,0.1)]" : "text-gray-500 hover:text-white"}`}
              >
                {tab === "kyc"
                  ? "KYC Queue"
                  : tab === "payouts"
                    ? "Payouts"
                    : "Logistics"}
              </Button>
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
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-background p-4 rounded-[8px] border border-border">
                <div className="relative w-full md:w-96">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={16}
                  />
                  <Input
                    type="text"
                    placeholder="Search partner, email or account..."
                    className="w-full bg-card border border-border rounded-[6px] py-2.5 pl-11 pr-4 text-[13px] text-white focus:outline-none focus:border-primary transition-all font-inter"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Filter className="text-gray-500" size={16} />
                  <Select
                    className="flex-1 md:w-48 bg-card border border-border rounded-[6px] py-2.5 px-4 text-[13px] text-white focus:outline-none focus:border-primary transition-all cursor-pointer uppercase font-bold tracking-wider"
                    value={payoutFilter}
                    onChange={(e) => setPayoutFilter(e.target.value)}
                  >
                    <option value="ALL">All Transactions</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Processed</option>
                    <option value="REJECTED">Rejected</option>
                  </Select>
                </div>
              </div>

              {/* Payouts Table */}
              <div className="bg-background rounded-[8px] border border-border overflow-hidden shadow-2xl">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-card/50 border-b border-border">
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Partner
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Settlement Destination
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Quantum
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Lifecycle
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Timestamp
                        </th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-right">
                          Governance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]/30">
                      {isLoading ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              <p className="text-[11px] font-black uppercase tracking-widest text-primary">
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
                            className="group hover:bg-card/50 transition-all duration-300"
                          >
                            <td className="px-6 py-4">
                              <div
                                onClick={() =>
                                  req.owner?._id &&
                                  navigate(`/profile/${req.owner._id}`)
                                }
                                className="flex items-center gap-3 cursor-pointer group/partner"
                              >
                                <div className="w-9 h-9 rounded-[6px] bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden group-hover/partner:border-primary transition-colors">
                                  {req.owner?.profilePicture ? (
                                    <img
                                      src={req.owner.profilePicture}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-primary font-bold text-xs">
                                      {req.owner?.name?.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-white text-[14px] tracking-tight uppercase group-hover/partner:text-primary transition-colors">
                                    {req.owner?.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
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
                                    className="text-primary"
                                  />{" "}
                                  {req.bankDetails?.bankName}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-mono tracking-tighter">
                                  {req.bankDetails?.accountNumber}
                                </p>
                                <p className="text-[9px] text-primary/60 font-mono tracking-widest uppercase">
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
                            <td className="px-6 py-4 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
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
                                  <Button
                                    onClick={() => openSettleModal(req)}
                                    className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-black rounded-[6px] transition-all border border-primary/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                                  >
                                    <CheckCircle size={13} /> Settle
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setRejectModal(req);
                                      setRejectReason("");
                                    }}
                                    className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-[6px] transition-all border border-red-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                                  >
                                    <XCircle size={13} /> Reject
                                  </Button>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="text-[10px] text-muted-foreground italic font-mono uppercase tracking-tighter">
                                    {req.status === "COMPLETED"
                                      ? `TXN: ${req.transactionId?.slice(-8) || "N/A"}`
                                      : req.rejectionReason?.slice(0, 30)}
                                  </div>
                                  {req.status === "COMPLETED" &&
                                    req.bankDetails?.screenshotUrl && (
                                      <Button
                                        onClick={() =>
                                          window.open(
                                            req.bankDetails.screenshotUrl,
                                            "_blank"
                                          )
                                        }
                                        className="text-[9px] text-primary font-bold uppercase tracking-wider flex items-center gap-1 hover:underline"
                                      >
                                        <Image size={10} /> View Receipt
                                      </Button>
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
              <div className="bg-background p-8 rounded-[8px] border border-border">
                <div className="mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tighter italic mb-1">
                    Pending{" "}
                    <span className="text-primary">KYC Verifications</span>
                  </h3>
                  <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-widest">
                    Partner bank accounts awaiting treasury clearance
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {kycQueue.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-600 border border-dashed border-border rounded-[8px]">
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
                        className="bg-card border border-border p-6 rounded-[8px] hover:border-primary/30 transition-all group relative overflow-hidden flex flex-col"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                          <ShieldCheck size={20} className="text-primary" />
                        </div>
                        <div
                          onClick={() =>
                            owner._id && navigate(`/profile/${owner._id}`)
                          }
                          className="flex items-start gap-4 mb-6 cursor-pointer group/profile"
                        >
                          <div className="w-12 h-12 rounded-[6px] bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 group-hover/profile:border-primary transition-colors">
                            {owner.profilePicture ? (
                              <img
                                src={owner.profilePicture}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-primary font-black text-xl">
                                {owner.name?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-white uppercase tracking-tight text-[15px] group-hover/profile:text-primary transition-colors">
                              {owner.name}
                            </h4>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                              {owner.email}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 bg-black/40 p-4 rounded-[6px] border border-border mb-6 flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                              Bank
                            </span>
                            <span className="text-xs text-gray-300 font-bold uppercase tracking-tight">
                              {owner.bankingDetails?.bankName}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                              Account
                            </span>
                            <span className="text-xs text-gray-300 font-mono">
                              {owner.bankingDetails?.accountNumber}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                              IFSC
                            </span>
                            <span className="text-xs text-primary font-mono font-bold">
                              {owner.bankingDetails?.ifscCode}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-auto">
                          <Button
                            onClick={() => verifyKYC(owner._id, "VERIFIED")}
                            className="py-3 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-[6px] hover:shadow-[0_0_20px_rgba(204,255,0,0.2)] transition-all"
                          >
                            Verify
                          </Button>
                          <Button
                            onClick={() => verifyKYC(owner._id, "REJECTED")}
                            className="py-3 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-[6px] hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                          >
                            Decline
                          </Button>
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
              <div className="bg-background p-8 lg:p-10 rounded-[8px] border border-border space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px]"></div>

                <div className="flex items-center gap-4 border-b border-border pb-8">
                  <div className="p-3.5 bg-primary/10 text-primary rounded-[8px] border border-primary/20">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic">
                      Settlement{" "}
                      <span className="text-primary">Logistics</span>
                    </h3>
                    <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-widest mt-1">
                      Global Payout Orchestration & Thresholds
                    </p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground block">
                      Weekly Settlement Cycle
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (day) => (
                          <Button
                            key={day}
                            onClick={() =>
                              updatePayoutSettings({
                                ...payoutSettings,
                                payoutDay: day,
                              })
                            }
                            className={`py-3.5 rounded-[6px] text-[11px] font-black uppercase tracking-widest transition-all border ${payoutSettings?.payoutDay === day ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(204,255,0,0.15)]" : "bg-card text-gray-500 border-border hover:border-primary/30"}`}
                          >
                            {day}
                          </Button>
                        )
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium italic uppercase tracking-wider">
                      Automated batch processing occurs at 00:00 GMT on selected
                      day.
                    </p>
                  </div>

                  <div className="pt-8 border-t border-border space-y-4">
                    <div className="flex items-center justify-between p-5 bg-card rounded-[8px] border border-border group hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-[6px] text-primary group-hover:scale-110 transition-transform">
                          <IndianRupee size={18} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white uppercase tracking-tight">
                            Auto-Payout Threshold
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                            Minimum processing value
                          </p>
                        </div>
                      </div>
                      <p className="font-mono text-primary text-xl font-black italic">
                        Rs 5,000
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-card rounded-[8px] border border-border group hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-[6px] text-primary group-hover:scale-110 transition-transform">
                          <Zap size={18} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white uppercase tracking-tight">
                            Platform Service Fee
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                            Deducted from each slot booking
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={payoutSettings?.platformFeePercentage || 5}
                          onChange={(e) =>
                            updatePayoutSettings({
                              ...payoutSettings,
                              platformFeePercentage: Number(e.target.value),
                            })
                          }
                          className="w-16 bg-black/40 border border-border rounded-[4px] px-2 py-1 text-primary font-mono text-lg font-black text-center focus:outline-none focus:border-primary"
                        />
                        <span className="text-primary font-black">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-card rounded-[8px] border border-border group hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-[6px] text-primary group-hover:scale-110 transition-transform">
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white uppercase tracking-tight">
                            GST (Goods & Services Tax)
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                            Tax on total booking amount
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={payoutSettings?.gstPercentage || 18}
                          onChange={(e) =>
                            updatePayoutSettings({
                              ...payoutSettings,
                              gstPercentage: Number(e.target.value),
                            })
                          }
                          className="w-16 bg-black/40 border border-border rounded-[4px] px-2 py-1 text-primary font-mono text-lg font-black text-center focus:outline-none focus:border-primary"
                        />
                        <span className="text-primary font-black">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-card rounded-[8px] border border-border group hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-[6px] text-primary group-hover:scale-110 transition-transform">
                          <ExternalLink size={18} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-white uppercase tracking-tight">
                            Payment Gateway Fee
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                            Razorpay/Transaction costs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={payoutSettings?.gatewayFeePercentage || 2}
                          onChange={(e) =>
                            updatePayoutSettings({
                              ...payoutSettings,
                              gatewayFeePercentage: Number(e.target.value),
                            })
                          }
                          className="w-16 bg-black/40 border border-border rounded-[4px] px-2 py-1 text-primary font-mono text-lg font-black text-center focus:outline-none focus:border-primary"
                        />
                        <span className="text-primary font-black">%</span>
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
            className="bg-background border border-border rounded-[12px] w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-white font-black text-sm uppercase tracking-wider">
                  Settle Withdrawal
                </h3>
                <p className="text-muted-foreground text-[10px] mt-0.5 font-mono">
                  {settleModal.owner?.name} · ₹
                  {Number(settleModal.amount).toLocaleString("en-IN")}
                </p>
              </div>
              <Button
                onClick={() => setSettleModal(null)}
                className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </Button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Transaction ID */}
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">
                  Transaction ID *
                </label>
                <Input
                  type="text"
                  value={settleTxnId}
                  onChange={(e) => setSettleTxnId(e.target.value)}
                  placeholder="e.g. UTR123456789"
                  className="w-full bg-black/60 border border-border rounded-[6px] px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/40"
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">
                  Payment Screenshot (Optional)
                </label>
                <Input
                  ref={screenshotInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />
                {settleScreenshot ? (
                  <div className="relative rounded-[6px] overflow-hidden border border-border">
                    <img
                      src={settleScreenshot}
                      alt="Receipt"
                      className="w-full max-h-48 object-contain bg-black"
                    />
                    <Button
                      onClick={() => {
                        setSettleScreenshot(null);
                        setSettleScreenshotName("");
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/80 rounded-md border border-border hover:border-red-500 transition-colors"
                    >
                      <X size={12} className="text-red-400" />
                    </Button>
                    <div className="px-3 py-1.5 bg-black/80 text-[9px] text-muted-foreground font-mono truncate">
                      {settleScreenshotName}
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => screenshotInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-[6px] py-6 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors group"
                  >
                    <Upload
                      size={20}
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                    />
                    <span className="text-[10px] text-muted-foreground group-hover:text-white font-bold uppercase tracking-wider transition-colors">
                      Upload Receipt
                    </span>
                  </Button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <Button
                onClick={() => setSettleModal(null)}
                className="flex-1 py-2.5 bg-white/5 text-muted-foreground rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSettleConfirm}
                disabled={!settleTxnId.trim() || isSettling}
                className="flex-1 py-2.5 bg-primary text-black rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-[#b8e600] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isSettling ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={13} /> Confirm Settlement
                  </>
                )}
              </Button>
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
            className="bg-background border border-border rounded-[12px] w-full max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-red-400 font-black text-sm uppercase tracking-wider">
                  Reject Withdrawal
                </h3>
                <p className="text-muted-foreground text-[10px] mt-0.5 font-mono">
                  {rejectModal.owner?.name} · ₹
                  {Number(rejectModal.amount).toLocaleString("en-IN")}
                </p>
              </div>
              <Button
                onClick={() => setRejectModal(null)}
                className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
              >
                <X size={16} className="text-muted-foreground" />
              </Button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1.5">
                Rejection Reason *
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this withdrawal is being rejected…"
                rows={4}
                className="w-full bg-black/60 border border-border rounded-[6px] px-3 py-2.5 text-white text-sm resize-none focus:outline-none focus:border-red-500 transition-colors placeholder:text-muted-foreground/40"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <Button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 bg-white/5 text-muted-foreground rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Cancel
              </Button>
              <Button
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
              </Button>
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
  trendColor = "text-primary",
}) => {
  return (
    <div className="bg-background border border-border rounded-[8px] p-5 flex flex-col relative overflow-hidden group hover:border-primary/30 transition-all duration-500 min-h-[140px] shadow-2xl">
      <Icon className="absolute -right-4 -bottom-4 w-20 h-20 text-white/[0.02] group-hover:text-white/[0.04] transition-colors" />
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="w-10 h-10 bg-primary/10 rounded-[6px] text-primary flex items-center justify-center border border-primary/20 shadow-sm transition-all">
          <Icon size={18} />
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 ${trendColor} border border-white/5`}
        >
          {trend}
        </div>
      </div>
      <div className="space-y-2 relative z-10">
        <h3 className="text-[11px] font-normal text-muted-foreground uppercase tracking-[1px]">
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
