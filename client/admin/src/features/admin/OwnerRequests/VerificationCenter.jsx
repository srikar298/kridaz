import React, { useState } from "react";
import useOwnerRequests from "@hooks/admin/useOwnerRequests";
import OwnerRequestCard from "./OwnerRequestsCard";
import VerificationDetailModal from "./VerificationDetailModal";
import OwnerRequestsSkeleton from "./OwnerRequestSkeleton";
import OwnerRequestSearch from "./OwnerRequestSearch";
import {
  Clock,
  ShieldCheck,
  Users,
  Zap,
  Filter,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";import { Button, Input } from "@kridaz/ui";


const VerificationCenter = () => {
  const {
    requests,
    rejectedRequests,
    loading,
    handleAccept,
    handleReject,
    handleReconsider,
    requestId,
    searchTerm,
    handleSearch,
    roleFilter,
    handleRoleFilter,
    refresh,
  } = useOwnerRequests();

  const [activeTab, setActiveTab] = useState("pending");
  const [activeRole, setActiveRole] = useState("all");

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminInfo, setAdminInfo] = useState({ name: "", designation: "" });
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const handleOpenDetail = (request) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedRequest(null);
    setIsDetailModalOpen(false);
  };

  const roleOptions = [
    { id: "all", label: "ALL PARTNERS" },
    { id: "owner", label: "VENUE OWNERS" },
    { id: "coach", label: "COACHES" },
    { id: "umpire", label: "UMPIRES" },
    { id: "scorer", label: "SCORERS" },
    { id: "streamer", label: "STREAMERS" },
  ];

  const confirmApproval = async () => {
    if (!adminInfo.name || !adminInfo.designation) {
      return toast.error("Please provide admin name and designation");
    }
    await handleAccept(selectedRequest.id, {
      adminName: adminInfo.name,
      adminDesignation: adminInfo.designation,
    });
    setShowApprovalModal(false);
    setSelectedRequest(null);
    setAdminInfo({ name: "", designation: "" });
  };

  if (loading) return <OwnerRequestsSkeleton />;

  const displayRequests = activeTab === "pending" ? requests : rejectedRequests;

  return (
    <div className="bg-background">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 lg:space-y-10 animate-fade-in pt-0 pb-24 relative">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="space-y-8 lg:space-y-10 relative z-10">
          {/* Role Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic text-white">
                PARTNER <span className="text-primary">MISSION CONTROL</span>
              </h1>
              <p className="text-gray-500 font-medium tracking-wider uppercase text-[10px] mt-2">
                Unified Governance • Compliance Oversight • Role Verification
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Pending
                </p>
                <p className="text-2xl font-black text-primary italic">
                  {requests.length}
                </p>
              </div>
              <div className="w-[1px] h-10 bg-border" />
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Archived
                </p>
                <p className="text-2xl font-black text-white italic">
                  {rejectedRequests.length}
                </p>
              </div>
            </div>
          </div>

          {/* Control Center: Tabs, Role Filters & Search */}
          <div className="bg-background p-6 rounded-[8px] border border-border shadow-[var(--shadow-2)]">
            <div className="flex flex-col gap-6">
              {/* Header Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-1.5 bg-primary/10 text-primary rounded-[4px] border border-primary/20">
                      <ShieldCheck size={16} />
                    </div>
                    <h2 className="text-xl font-semibold text-white uppercase tracking-tight">
                      Verification Center
                    </h2>
                  </div>
                  <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest">
                    {activeTab === "pending"
                      ? "Orchestrating Global Partner Onboarding"
                      : "Reviewing Denied Verification Dossiers"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-card p-1 rounded-[6px] border border-border">
                    {["pending", "rejected"].map((tab) => (
                      <Button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-wider transition-all ${activeTab === tab ? "bg-primary text-black" : "text-muted-foreground hover:text-white"}`}
                      >
                        {tab}
                      </Button>
                    ))}
                  </div>

                  {/* Roles Dropdown */}
                  <div className="relative">
                    <Button
                      onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                      className="h-9 px-4 bg-[#0F0F0F] border border-border text-white rounded-[6px] flex items-center gap-3 hover:border-primary/50 transition-all min-w-[160px] justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                          {roleOptions.find((r) => r.id === roleFilter)
                            ?.label || "ROLES"}
                        </span>
                      </div>
                      <ChevronDown
                        size={12}
                        className={`text-gray-500 transition-transform ${isRoleDropdownOpen ? "rotate-180 text-primary" : ""}`}
                      />
                    </Button>

                    {isRoleDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsRoleDropdownOpen(false)}
                        />
                        <div className="absolute top-full right-0 mt-2 w-full bg-[#0F0F0F] border border-border rounded-[6px] shadow-2xl overflow-hidden z-50 animate-scale-in">
                          {roleOptions.map((role) => (
                            <Button
                              key={role.id}
                              onClick={() => {
                                handleRoleFilter(role.id);
                                setIsRoleDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-between ${roleFilter === role.id ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-white/[0.03] hover:text-white"}`}
                            >
                              {role.label}
                              {roleFilter === role.id && (
                                <Zap size={10} className="text-primary" />
                              )}
                            </Button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <OwnerRequestSearch
                    searchTerm={searchTerm}
                    handleSearch={handleSearch}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main List Area */}
          {displayRequests.length === 0 ? (
            <div className="bg-background p-20 rounded-[8px] border border-border text-center relative overflow-hidden group min-h-[400px] flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-[80px]" />
              <div className="relative z-10 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-border flex items-center justify-center text-gray-500 border border-[#404040]">
                  {activeTab === "pending" ? (
                    <Clock size={24} />
                  ) : (
                    <Filter size={24} />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white uppercase tracking-tight">
                    {activeTab === "pending"
                      ? "Queue Optimized"
                      : "No Rejections Found"}
                  </h2>
                  <p className="text-[12px] font-normal text-muted-foreground uppercase tracking-widest mt-1">
                    {activeTab === "pending"
                      ? "All verification pipelines are currently clear."
                      : "Your rejection history is currently empty."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pb-10">
              {displayRequests.map((request) => (
                <OwnerRequestCard
                  key={request.id}
                  request={request}
                  onAccept={() => {
                    setSelectedRequest(request);
                    setShowApprovalModal(true);
                  }}
                  onReject={handleReject}
                  onReconsider={handleReconsider}
                  onViewDetail={() => handleOpenDetail(request)}
                  isProcessing={requestId === request.id}
                  type={activeTab}
                />
              ))}
            </div>
          )}

          {/* Detailed Verification Modal */}
          {isDetailModalOpen && (
            <VerificationDetailModal
              request={selectedRequest}
              onClose={handleCloseDetail}
              onAccept={() => {
                setIsDetailModalOpen(false);
                setShowApprovalModal(true);
              }}
              onReject={() => {
                handleReject(selectedRequest.id);
                handleCloseDetail();
              }}
              isProcessing={requestId === selectedRequest?.id}
              type={activeTab}
            />
          )}

          {/* ── Approval Modal ────────────────────────────────────── */}
          {showApprovalModal && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setShowApprovalModal(false)}
              />
              <div className="relative w-full max-w-md bg-background border border-border rounded-[8px] p-8 space-y-6 shadow-2xl animate-scale-in">
                <div className="space-y-2">
                  <h3 className="text-xl font-display uppercase tracking-tight text-white">
                    Partner Authorization
                  </h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Confirming credentials for{" "}
                    <span className="text-primary">
                      {selectedRequest?.name}
                    </span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">
                      Admin Name
                    </label>
                    <Input
                      type="text"
                      value={adminInfo.name}
                      onChange={(e) =>
                        setAdminInfo({ ...adminInfo, name: e.target.value })
                      }
                      placeholder="ENTER FULL NAME"
                      className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-3 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 transition-colors uppercase font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">
                      Designation
                    </label>
                    <Input
                      type="text"
                      value={adminInfo.designation}
                      onChange={(e) =>
                        setAdminInfo({
                          ...adminInfo,
                          designation: e.target.value,
                        })
                      }
                      placeholder="E.G. OPERATIONS HEAD"
                      className="w-full bg-white/5 border border-white/10 rounded-[8px] px-4 py-3 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50 transition-colors uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Button
                    onClick={() => setShowApprovalModal(false)}
                    className="py-4 rounded-[8px] text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Abort
                  </Button>
                  <Button
                    onClick={confirmApproval}
                    disabled={!adminInfo.name || !adminInfo.designation}
                    className="py-4 rounded-[8px] text-[10px] font-black uppercase tracking-widest text-black bg-primary hover:bg-[#b8e600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(204,255,0,0.2)]"
                  >
                    Authorize Partner
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Metrics */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row gap-4 justify-between items-center pb-8 opacity-40">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Unified Verification Hub v3.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationCenter;
