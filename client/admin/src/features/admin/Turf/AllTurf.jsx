import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PackageOpen, Activity } from "lucide-react";
import toast from "react-hot-toast";
import useTurfData from "@hooks/admin/useTurf";
import Turf from "./Turf";
import TurfSkeleton from "./TurfSkeleton";
import VenueDetailsModal from "./VenueDetailsModal";
import ConfirmationPopup from "./ConfirmationPopup";
import { Button } from "@kridaz/ui";


export const AllTurf = () => {
  const {
    turfData,
    loading,
    approveTurf,
    rejectTurf,
    decommissionTurf,
    softDeleteTurf,
    hardDeleteTurf,
  } = useTurfData();
  const navigate = useNavigate();
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "",
    turfId: null,
    name: "",
  });

  const filters = [
    { id: "all", label: "All Venues" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "decommissioned", label: "Decommissioned" },
    { id: "deleted", label: "Deleted" },
  ];

  const filteredTurfs = turfData?.filter((turf) =>
    activeFilter === "all" ? true : turf.status === activeFilter
  );

  const handleViewDetails = (turf) => {
    setSelectedTurf(turf);
    setIsDetailsOpen(true);
  };

  const openApproveConfirm = (id, name) => {
    setConfirmModal({ isOpen: true, type: "approve", turfId: id, name });
  };

  const openRejectConfirm = (id, name) => {
    setConfirmModal({ isOpen: true, type: "reject", turfId: id, name });
  };

  const openDecommissionConfirm = (id, name) => {
    setConfirmModal({ isOpen: true, type: "decommission", turfId: id, name });
  };

  const openDeleteConfirm = (id, name, isPermanent = false) => {
    setConfirmModal({
      isOpen: true,
      type: isPermanent ? "hard-delete" : "soft-delete",
      turfId: id,
      name,
    });
  };

  const handleConfirm = async (adminData) => {
    let success = false;
    const { type, turfId } = confirmModal;

    if (type === "approve") {
      success = await approveTurf(turfId, adminData);
      if (success) toast.success(`Venue Approved`);
    } else if (type === "reject") {
      success = await rejectTurf(turfId, adminData);
      if (success) toast.success(`Venue Rejected`);
    } else if (type === "decommission") {
      success = await decommissionTurf(turfId, adminData);
      if (success) toast.success(`Venue Decommissioned`);
    } else if (type === "soft-delete") {
      success = await softDeleteTurf(turfId, adminData);
      if (success) toast.success(`Venue moved to Deleted`);
    } else if (type === "hard-delete") {
      success = await hardDeleteTurf(turfId);
      if (success) toast.success(`Venue permanently deleted`);
    }

    if (success) {
      setConfirmModal({ ...confirmModal, isOpen: false });
      setIsDetailsOpen(false);
    } else {
      toast.error("Operation Failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white p-6 lg:p-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <TurfSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-10 relative">
      <div className="space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary font-bold text-xs uppercase tracking-widest">
              <Activity size={14} className="animate-pulse" />
              <span>Venue Management</span>
            </div>
            <div className="relative flex justify-between items-start w-full">
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase text-white leading-none">
                  Platform <span className="text-primary">Venues</span>
                </h1>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-3">
                  Manage and monitor all platform venues
                </p>
              </div>
              <Button
                onClick={() => navigate("/admin/turfs/invites")}
                className="px-6 py-2 rounded-[8px] bg-gradient-to-r from-secondary to-primary text-black text-xs font-bold uppercase tracking-widest shadow-[0_4px_12px_rgba(179,220,38,0.2)] ml-4"
              >
                Invite Venues
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-[8px] border border-white/5">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === filter.id ? "bg-primary text-black shadow-lg shadow-[var(--primary)]/20" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {!filteredTurfs || filteredTurfs.length === 0 ? (
          <div className="relative p-20 rounded-[8px] border border-white/5 bg-white/[0.02] text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-[100px]"></div>
            <div className="relative space-y-6">
              <PackageOpen size={80} className="mx-auto text-gray-800" />
              <div className="space-y-2">
                <p className="font-black text-3xl text-white uppercase tracking-tighter">
                  No Venues Found
                </p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Try adjusting your filters or check back later for new
                  applications.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {filteredTurfs.map((turf) => (
              <Turf
                key={turf._id}
                turf={turf}
                onApprove={() => openApproveConfirm(turf._id, turf.name)}
                onReject={() => openRejectConfirm(turf._id, turf.name)}
                onDecommission={() =>
                  openDecommissionConfirm(turf._id, turf.name)
                }
                onDelete={(id, permanent) =>
                  openDeleteConfirm(id, turf.name, permanent)
                }
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <VenueDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        turf={selectedTurf}
        onApprove={() =>
          openApproveConfirm(selectedTurf?._id, selectedTurf?.name)
        }
        onReject={() =>
          openRejectConfirm(selectedTurf?._id, selectedTurf?.name)
        }
      />

      <ConfirmationPopup
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirm}
        title={
          confirmModal.type === "approve"
            ? "Verify Venue"
            : confirmModal.type === "reject"
              ? "Decline Venue"
              : confirmModal.type === "decommission"
                ? "Decommission Venue"
                : confirmModal.type === "soft-delete"
                  ? "Delete Venue"
                  : "Permanent Delete"
        }
        message={
          confirmModal.type === "approve"
            ? `Are you sure you want to approve "${confirmModal.name}"?`
            : confirmModal.type === "reject"
              ? `Are you sure you want to decline "${confirmModal.name}"?`
              : confirmModal.type === "decommission"
                ? `Are you sure you want to decommission "${confirmModal.name}"? The owner will need to re-apply for verification.`
                : confirmModal.type === "soft-delete"
                  ? `Are you sure you want to move "${confirmModal.name}" to the deleted list?`
                  : `WARNING: This will permanently delete "${confirmModal.name}" and all associated booking/slot data. This action CANNOT be undone.`
        }
        type={confirmModal.type === "approve" ? "success" : "danger"}
        confirmText={
          confirmModal.type === "approve"
            ? "Verify & Approve"
            : confirmModal.type === "reject"
              ? "Decline Venue"
              : confirmModal.type === "decommission"
                ? "Decommission Now"
                : confirmModal.type === "soft-delete"
                  ? "Move to Deleted"
                  : "Delete Permanently"
        }
        showGovernanceForm={confirmModal.type !== "hard-delete"}
      />
    </div>
  );
};

export default AllTurf;
