import React from "react";
import { useNavigate } from "react-router-dom";
import {
  PackageOpen,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  TrendingUp,
  ShieldCheck,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import useTurfData from "@hooks/admin/useTurfData";
import useOwners from "@hooks/admin/useOwners";
import ConfirmationModal from "@components/shared/ConfirmationModal";

import Turf from "./Turf";
import TurfSkeleton from "./TurfSkeleton";
import { format } from "date-fns";import { Button } from "@kridaz/ui";


const TurfList = () => {
  const { turfData, owner, loading } = useTurfData();
  const { deleteOwner } = useOwners();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  const handleDelete = async () => {
    const success = await deleteOwner(owner._id);
    if (success) {
      navigate("/admin/owners");
    }
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="h-48 bg-white/5 rounded-[8px] border border-white/5" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <TurfSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* ── Navigation ───────────────────────────────────────────── */}
      <Button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-primary transition-colors group w-fit"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Back to Directory
      </Button>

      {/* ── Owner Profile Header ───────────────────────────────────── */}
      {owner && (
        <div className="relative group">
          {/* Decorative background glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 to-transparent rounded-[8px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative bms-card p-8 sm:p-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />

            <div className="flex flex-col lg:flex-row gap-10 items-start lg:items-center">
              {/* Profile Avatar Container */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-zinc-900 rounded-[8px] border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-2xl relative z-10">
                  {owner.profilePicture ? (
                    <img
                      src={owner.profilePicture}
                      alt={owner.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} className="text-primary/40" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-[8px] shadow-lg z-20">
                  <ShieldCheck size={18} />
                </div>
              </div>

              {/* Information Grid */}
              <div className="flex-1 space-y-6 w-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
                      Verified Partner
                    </span>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                      ID: {owner._id?.slice(-8)}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-tighter text-white">
                    {owner.name}
                  </h1>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 font-black text-[10px] uppercase tracking-widest rounded-[8px] hover:bg-red-500/20 transition-all flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Terminate Partnership
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4 group/item">
                    <div className="p-3 bg-white/5 rounded-[8px] border border-white/5 group-hover/item:border-primary/30 transition-colors">
                      <Mail size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        Operational Email
                      </p>
                      <p className="text-white font-bold tracking-tight">
                        {owner.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group/item">
                    <div className="p-3 bg-white/5 rounded-[8px] border border-white/5 group-hover/item:border-primary/30 transition-colors">
                      <Phone size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        Primary Contact
                      </p>
                      <p className="text-white font-bold tracking-tight">
                        {owner.phone || "Not Provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group/item">
                    <div className="p-3 bg-white/5 rounded-[8px] border border-white/5 group-hover/item:border-primary/30 transition-colors">
                      <Calendar size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        Partnership Since
                      </p>
                      <p className="text-white font-bold tracking-tight">
                        {owner.createdAt
                          ? format(new Date(owner.createdAt), "MMMM yyyy")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Approval Context */}
                {owner.approvalDetails?.adminName && (
                  <div className="pt-6 border-t border-white/5 flex flex-wrap gap-x-12 gap-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                        Approved By:{" "}
                        <span className="text-white">
                          {owner.approvalDetails.adminName}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                        Designation:{" "}
                        <span className="text-white">
                          {owner.approvalDetails.adminDesignation}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                        Auth Date:{" "}
                        <span className="text-white">
                          {owner.approvalDetails.approvedAt
                            ? format(
                                new Date(owner.approvalDetails.approvedAt),
                                "dd MMM yyyy"
                              )
                            : "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats Module */}
              <div className="w-full lg:w-48 p-6 bg-white/5 rounded-[8px] border border-white/5 space-y-4">
                <div className="text-center">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
                    Total Assets
                  </p>
                  <p className="text-4xl font-display text-primary tracking-tighter">
                    {turfData?.length || 0}
                  </p>
                </div>
                <div className="h-px bg-white/5 w-full" />
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 px-2">
                  <span>Growth</span>
                  <div className="flex items-center gap-1 text-primary">
                    <TrendingUp size={10} />
                    <span>+12%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Assets Section ────────────────────────────────────────── */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-[8px] border border-primary/20">
              <Building2 size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display uppercase tracking-tight text-white leading-none">
                Listed Grounds
              </h2>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
                Managing {turfData?.length || 0} active facilities
              </p>
            </div>
          </div>
        </div>

        {!turfData || turfData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bms-card border-dashed border-white/10 opacity-60">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
              <PackageOpen size={32} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-display uppercase tracking-tight text-white mb-2">
              No Assets Detected
            </h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              This partner has not listed any grounds yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {turfData.map((turf) => (
              <Turf key={turf._id} turf={turf} />
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Terminate Partnership"
        message={`Are you sure you want to PERMANENTLY delete ${owner?.name}? This will remove their profile and all associated data. This action is irreversible.`}
        confirmText="Terminate Now"
        type="danger"
      />
    </div>
  );
};

export default TurfList;
