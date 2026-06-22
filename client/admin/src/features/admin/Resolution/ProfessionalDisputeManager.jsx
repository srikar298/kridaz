import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Info,
  CheckCircle,
  XCircle,
  Search,
  User,
  Building,
  MessageSquare,
  Send,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  AlertCircle,
  Clock,
  Phone,
} from "lucide-react";
import useDisputes from "@hooks/admin/useDisputes";import { Button, Input, Select, Textarea } from "@kridaz/ui";


const ProfessionalDisputeManager = () => {
  const { disputes, loading, processingId, handleResolve, handleReply } =
    useDisputes("professional");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [decision, setDecision] = useState("RELEASE_TO_OWNER");
  const [partialAmount, setPartialAmount] = useState("");
  const [notes, setNotes] = useState("");

  // Sync selected dispute with disputes list
  useEffect(() => {
    if (selectedDispute) {
      const updated = disputes.find((d) => d._id === selectedDispute._id);
      if (updated) setSelectedDispute(updated);
    }
  }, [disputes]);

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.booking?.userId?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      dispute.onDemandBooking?.professional?.businessName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      dispute.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === "ALL" || dispute.status === filter;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "RESOLVED":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "PENDING":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "INVESTIGATING":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  const handleConfirmResolve = async () => {
    if (!notes) return;
    await handleResolve(
      selectedDispute._id,
      decision,
      notes,
      parseFloat(partialAmount) || 0
    );
    setIsResolveModalOpen(false);
    setNotes("");
    setPartialAmount("");
  };

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-10">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">
              Pro Disputes <span className="text-orange-500">Manager</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium tracking-wide">
              Financial reconciliation and conflict resolution
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search disputes..."
                className="bg-card border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm w-full sm:w-64 focus:outline-none focus:border-orange-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              className="bg-card border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Dispute List (Left Sidebar) */}
          <div
            className={`lg:col-span-4 space-y-4 ${selectedDispute ? "hidden lg:block" : "block"}`}
          >
            <div className="bg-card border border-white/10 rounded-[8px] overflow-hidden">
              <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                  All Disputes
                </p>
                <span className="text-[10px] bg-orange-500 text-black px-2 py-0.5 rounded font-black">
                  {filteredDisputes.length}
                </span>
              </div>
              <div className="max-h-[750px] overflow-y-auto no-scrollbar">
                {loading ? (
                  <div className="p-12 text-center animate-pulse text-gray-500 font-bold uppercase tracking-widest text-xs">
                    Loading records...
                  </div>
                ) : filteredDisputes.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 font-medium italic">
                    No disputes found matching criteria
                  </div>
                ) : (
                  filteredDisputes.map((dispute) => (
                    <Button
                      key={dispute._id}
                      onClick={() => setSelectedDispute(dispute)}
                      className={`w-full text-left p-6 border-b border-white/5 transition-all hover:bg-white/[0.03] relative group ${selectedDispute?._id === dispute._id ? "bg-orange-500/5 border-l-4 border-l-orange-500" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-widest uppercase border ${getStatusColor(dispute.status)}`}
                        >
                          {dispute.status}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white truncate mb-1 group-hover:text-orange-400 transition-colors">
                        {dispute.reason}
                      </h4>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                          <User size={12} className="text-gray-600" />{" "}
                          {dispute.raisedBy?.name || "User"}
                        </div>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                          <Building size={12} className="text-gray-600" />{" "}
                          {dispute.onDemandBooking?.professional?.businessName}
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Dispute Workspace (Right Main) */}
          <div className="lg:col-span-8">
            {selectedDispute ? (
              <div className="space-y-6">
                {/* Summary Header Card */}
                <div className="bg-card border border-white/10 rounded-[8px] p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] -z-10" />

                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Button
                          onClick={() => setSelectedDispute(null)}
                          className="lg:hidden text-gray-500 hover:text-white mr-2"
                        >
                          <ChevronRight className="rotate-180" size={20} />
                        </Button>
                        <h2 className="text-2xl font-bold tracking-tight">
                          {selectedDispute.reason}
                        </h2>
                        <span
                          className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${getStatusColor(selectedDispute.status)}`}
                        >
                          {selectedDispute.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed max-w-2xl italic border-l-2 border-orange-500/30 pl-4">
                        &quot;{selectedDispute.description}&quot;
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedDispute.status !== "RESOLVED" && (
                        <Button
                          onClick={() => setIsResolveModalOpen(true)}
                          className="bg-orange-500 text-black px-6 py-3 rounded-[8px] text-xs font-black uppercase tracking-widest hover:bg-orange-400 transition-all shadow-[0_5px_15px_rgba(249,115,22,0.3)]"
                        >
                          Resolve Case
                        </Button>
                      )}
                      <Button className="bg-white/5 border border-white/10 text-white px-5 py-3 rounded-[8px] text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                        Log <AlertCircle size={14} />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Card */}
                  <div className="bg-card border border-white/10 rounded-[8px] p-6 group hover:border-orange-500/20 transition-all">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-[8px] bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 group-hover:scale-110 transition-transform">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          Customer Info
                        </p>
                        <h3 className="text-lg font-bold">
                          {selectedDispute.raisedBy?.name}
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-[8px] border border-white/5">
                        <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-2">
                          <Phone size={12} /> Phone
                        </span>
                        <span className="text-xs font-bold text-white">
                          {selectedDispute.raisedBy?.phone || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-[8px] border border-white/5">
                        <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-2">
                          <Clock size={12} /> Registered
                        </span>
                        <span className="text-xs font-bold text-white">
                          {selectedDispute.raisedBy?.createdAt
                            ? new Date(
                                selectedDispute.raisedBy.createdAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Professional Card */}
                  <div className="bg-card border border-white/10 rounded-[8px] p-6 group hover:border-orange-500/20 transition-all">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-[8px] bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <Building size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          Professional Profile
                        </p>
                        <h3 className="text-lg font-bold truncate">
                          {
                            selectedDispute.onDemandBooking?.professional
                              ?.businessName
                          }
                        </h3>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-[8px] border border-white/5">
                        <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-2">
                          <User size={12} /> Owner
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          {selectedDispute.owner?.businessName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-[8px] border border-white/5">
                        <span className="text-xs text-gray-500 font-bold uppercase flex items-center gap-2">
                          <Phone size={12} /> Contact
                        </span>
                        <span className="text-xs font-bold text-white">
                          {selectedDispute.owner?.phone || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Details & Evidence Gallery */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-1 space-y-6">
                    <div className="bg-card border border-white/10 rounded-[8px] p-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6">
                        Financial Snapshot
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-bold uppercase text-[10px]">
                            Total Blocked Amount
                          </span>
                          <span className="font-bold">
                            ₹{selectedDispute.onDemandBooking?.blockedAmount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-bold uppercase text-[10px]">
                            Professional Revenue
                          </span>
                          <span className="font-bold text-orange-400">
                            ₹{selectedDispute.onDemandBooking?.blockedAmount}
                          </span>
                        </div>
                        <div className="h-px bg-white/5 my-2" />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-bold uppercase text-[10px]">
                            Play Date
                          </span>
                          <span className="font-bold text-[11px]">
                            {selectedDispute.onDemandBooking?.bookingDate
                              ? new Date(
                                  selectedDispute.bookingDetails.playDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-bold uppercase text-[10px]">
                            Slot Time
                          </span>
                          <span className="font-bold text-[11px]">
                            {selectedDispute.onDemandBooking?.startTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Evidence Gallery */}
                  <div className="xl:col-span-2 bg-card border border-white/10 rounded-[8px] p-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-6 flex items-center gap-2">
                      <ImageIcon size={14} /> Evidence Gallery
                    </h4>
                    {selectedDispute.images &&
                    selectedDispute.images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {selectedDispute.images.map((img, i) => (
                          <a
                            key={i}
                            href={img}
                            target="_blank"
                            rel="noreferrer"
                            className="block relative aspect-square rounded-[8px] overflow-hidden border border-white/5 hover:border-orange-500/50 transition-all group/img"
                          >
                            <img
                              src={img}
                              alt={`evidence-${i}`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                              <ExternalLink size={20} className="text-white" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 bg-white/[0.02] rounded-[8px] border border-dashed border-white/10 text-gray-600">
                        <ImageIcon size={32} className="mb-2 opacity-20" />
                        <p className="text-xs font-bold uppercase">
                          No photographic evidence provided
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Communication Thread */}
                <div className="bg-card border border-white/10 rounded-[8px] overflow-hidden flex flex-col min-h-[500px]">
                  <div className="px-8 py-4 bg-white/5 border-b border-white/10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                      <MessageSquare size={14} /> Communication Thread
                    </h4>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-6 max-h-[600px] no-scrollbar bg-background/50">
                    {/* System Entry */}
                    <div className="flex justify-center">
                      <div className="bg-white/5 border border-white/5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">
                        Dispute initiated on{" "}
                        {new Date(selectedDispute.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {selectedDispute.replies &&
                      selectedDispute.replies.map((reply, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${reply.sender === "ADMIN" ? "items-end" : "items-start"} max-w-[85%] ${reply.sender === "ADMIN" ? "ml-auto" : ""}`}
                        >
                          <div
                            className={`p-5 rounded-[8px] border shadow-xl ${reply.sender === "ADMIN" ? "bg-orange-500/10 border-orange-500/20 rounded-tr-none" : "bg-card border-white/10 rounded-tl-none"}`}
                          >
                            <p className="text-sm leading-relaxed text-gray-200">
                              {reply.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-2 px-1">
                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                              {reply.sender === "ADMIN"
                                ? "Support Agent"
                                : selectedDispute.raisedBy?.name}
                            </span>
                            <div className="w-1 h-1 bg-white/10 rounded-full" />
                            <span className="text-[9px] text-gray-400 font-bold">
                              {new Date(reply.createdAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {selectedDispute.status !== "RESOLVED" && (
                    <div className="p-6 bg-white/[0.02] border-t border-white/10">
                      <div className="relative flex items-center gap-4">
                        <Input
                          type="text"
                          placeholder="Type a message to the user..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-[8px] px-6 py-4 text-sm focus:outline-none focus:border-orange-500 transition-all placeholder:text-gray-600"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" &&
                            replyText.trim() &&
                            handleReply(selectedDispute._id, replyText).then(
                              () => setReplyText("")
                            )
                          }
                        />
                        <Button
                          onClick={() =>
                            replyText.trim() &&
                            handleReply(selectedDispute._id, replyText).then(
                              () => setReplyText("")
                            )
                          }
                          disabled={!replyText.trim()}
                          className="bg-orange-500 text-black p-4 rounded-[8px] hover:bg-orange-400 transition-all disabled:opacity-50 shadow-[0_5px_15px_rgba(249,115,22,0.2)]"
                        >
                          <Send size={20} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[800px] bg-card border border-white/10 rounded-[8px] flex flex-col items-center justify-center text-center p-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent opacity-50" />

                <div className="w-24 h-24 bg-white/5 rounded-[8px] flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform duration-700">
                  <ShieldAlert
                    className="text-gray-500 group-hover:text-orange-500 transition-colors"
                    size={40}
                  />
                </div>
                <h3 className="text-3xl font-bold mb-3 tracking-tight">
                  Resolution Center
                </h3>
                <p className="text-gray-500 max-w-sm text-sm font-medium leading-relaxed">
                  Select a dispute from the left panel to review evidence,
                  communicate with parties, and issue final resolutions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resolution Modal */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-card border border-orange-500/30 rounded-[8px] w-full max-w-xl p-10 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-[8px] bg-orange-500/20 flex items-center justify-center text-orange-500">
                <CheckCircle size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                Issue Final Resolution
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">
                  Resolution Action
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      id: "RELEASE_TO_OWNER",
                      label: "Approve Payout",
                      icon: CheckCircle,
                    },
                    {
                      id: "REFUND_TO_USER",
                      label: "Full Refund",
                      icon: XCircle,
                    },
                    {
                      id: "PARTIAL_REFUND",
                      label: "Partial Refund",
                      icon: AlertCircle,
                    },
                    {
                      id: "CLOSE_NO_ACTION",
                      label: "Close & Settle",
                      icon: Info,
                    },
                  ].map((action) => (
                    <Button
                      key={action.id}
                      onClick={() => setDecision(action.id)}
                      className={`flex items-center gap-3 p-4 rounded-[8px] border text-xs font-bold transition-all ${decision === action.id ? "bg-orange-500 border-orange-500 text-black shadow-[0_5px_15px_rgba(249,115,22,0.3)]" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"}`}
                    >
                      <action.icon size={16} />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>

              {decision === "PARTIAL_REFUND" && (
                <div className="animate-slide-down">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">
                    Refund Amount (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                      ₹
                    </div>
                    <Input
                      type="number"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      placeholder="Enter amount to refund..."
                      className="w-full bg-background border border-white/10 rounded-[8px] pl-8 pr-4 py-4 text-white focus:outline-none focus:border-orange-500 transition-all font-bold"
                    />
                  </div>
                  <p className="text-[9px] text-gray-600 mt-2 font-bold uppercase italic">
                    * Remaining ₹
                    {selectedDispute.onDemandBooking?.blockedAmount -
                      (parseFloat(partialAmount) || 0)}{" "}
                    will be released to owner.
                  </p>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 block">
                  Resolution Notes (Internal)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Summarize the investigation and reason for this outcome..."
                  className="w-full bg-background border border-white/10 rounded-[8px] px-6 py-4 text-white min-h-[120px] resize-none focus:outline-none focus:border-orange-500 transition-all text-sm leading-relaxed"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={() => setIsResolveModalOpen(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-[8px] font-black uppercase tracking-widest transition-all border border-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmResolve}
                  disabled={
                    !notes ||
                    (decision === "PARTIAL_REFUND" && !partialAmount) ||
                    processingId === selectedDispute._id
                  }
                  className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-black rounded-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-[0_10px_20px_rgba(249,115,22,0.2)]"
                >
                  {processingId === selectedDispute._id
                    ? "Processing..."
                    : "Confirm Final Decision"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalDisputeManager;
