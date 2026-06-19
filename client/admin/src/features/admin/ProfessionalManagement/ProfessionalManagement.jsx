import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Search,
  Trash2,
  Ban,
  CheckCircle,
  X,
  ExternalLink,
} from "lucide-react";
import useProfessionals from "@hooks/admin/useProfessionals";
import ConfirmationModal from "@components/shared/ConfirmationModal";

const ProfessionalManagement = ({ role }) => {
  const {
    professionals,
    loading,
    searchTerm,
    handleSearch,
    deleteProfessional,
    batchDeleteProfessionals,
    batchUpdateProfessionalStatus,
  } = useProfessionals(role);

  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "",
    target: null,
  });

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === professionals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(professionals.map((p) => p._id));
    }
  };

  const openDeleteModal = (prof) => {
    setModalConfig({
      isOpen: true,
      type: "DELETE_SINGLE",
      target: prof,
      title: `Delete ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      message: `Are you sure you want to PERMANENTLY delete ${prof.name}? This will remove their professional profile and system access.`,
      confirmText: "Delete Record",
    });
  };

  const openBatchDeleteModal = () => {
    setModalConfig({
      isOpen: true,
      type: "DELETE_BATCH",
      target: selectedIds,
      title: `Batch Delete ${role}s`,
      message: `Are you sure you want to PERMANENTLY delete ${selectedIds.length} selected records? This action is irreversible.`,
      confirmText: `Delete ${selectedIds.length} Records`,
    });
  };

  const handleConfirmAction = async () => {
    const { type, target } = modalConfig;

    if (type === "DELETE_SINGLE") {
      await deleteProfessional(target._id);
    } else if (type === "DELETE_BATCH") {
      await batchDeleteProfessionals(target);
      setSelectedIds([]);
    }

    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleBatchStatusUpdate = async (status) => {
    await batchUpdateProfessionalStatus(selectedIds, status);
    setSelectedIds([]);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white p-6 lg:p-10 relative overflow-hidden font-inter">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />
      <div className="space-y-12">
        {/* Header Section */}
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-[#2D2D2D] pb-10">
          <div className="relative">
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#CCFF00] rounded-full shadow-[0_0_20px_rgba(204,255,0,0.4)]"></div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              Manage <span className="text-[#CCFF00]">{role}s</span>
            </h1>
            <p className="admin-subheading mt-4 ml-1">
              Active Professional Roster • System Telemetry
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-full lg:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#CCFF00] transition-colors w-4 h-4" />
              <input
                type="text"
                placeholder={`Search ${role}s by name...`}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-[12px] pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00]/50 transition-all font-inter"
              />
            </div>
            <div className="px-5 py-2.5 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full">
              <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">
                Total: {professionals.length}
              </span>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="sticky top-6 z-[40] bg-[#0d0d0d] border border-[#CCFF00]/30 rounded-[8px] p-4 shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-6 pl-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#CCFF00] flex items-center justify-center text-black font-black text-xs">
                  {selectedIds.length}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00]">
                  Selected
                </span>
              </div>
              <button
                onClick={() => setSelectedIds([])}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBatchStatusUpdate("blocked")}
                className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-[8px] text-orange-400 font-black text-[10px] uppercase tracking-widest hover:bg-orange-500/20 transition-all flex items-center gap-2"
              >
                <Ban size={14} /> Block
              </button>
              <button
                onClick={() => handleBatchStatusUpdate("active")}
                className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-[8px] text-green-400 font-black text-[10px] uppercase tracking-widest hover:bg-green-500/20 transition-all flex items-center gap-2"
              >
                <CheckCircle size={14} /> Activate
              </button>
              <div className="w-px h-6 bg-white/10 mx-2" />
              <button
                onClick={openBatchDeleteModal}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CCFF00]"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-[#0d0d0d] border border-[#2D2D2D] rounded-[12px] text-[10px] font-black text-[#878C9F] uppercase tracking-[0.2em] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] items-center">
              <div className="col-span-1 flex justify-center">
                <input
                  type="checkbox"
                  checked={
                    professionals.length > 0 &&
                    selectedIds.length === professionals.length
                  }
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-[#2D2D2D] bg-[#0d0d0d] text-[#CCFF00] focus:ring-[#CCFF00]/50"
                />
              </div>
              <div className="col-span-3">Professional Profile</div>
              <div className="col-span-3">Contact Email</div>
              <div className="col-span-2">Expertise / XP</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {professionals.length === 0 ? (
              <div className="relative p-20 rounded-[8px] border border-[#2D2D2D] bg-[#000000] text-center overflow-hidden">
                <div className="absolute inset-0 bg-[#CCFF00]/5 blur-[100px]" />
                <div className="relative z-10 space-y-4">
                  <p className="text-2xl font-black text-white uppercase tracking-tighter">
                    No {role}s Found
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {professionals.map((prof) => (
                  <div
                    key={prof._id}
                    className={`group relative bg-[#000000] border transition-all duration-500 rounded-[12px] p-4 lg:px-8 lg:py-5 shadow-xl overflow-hidden cursor-pointer ${selectedIds.includes(prof._id) ? "border-[#CCFF00] bg-[#CCFF00]/5" : "border-[#2D2D2D] hover:border-[#CCFF00]/40"}`}
                    onClick={(e) => {
                      if (
                        e.target.closest("button") ||
                        e.target.closest('input[type="checkbox"]')
                      )
                        return;
                      navigate(`/admin/professionals/${prof._id}`);
                    }}
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1 bg-[#CCFF00] transition-transform duration-500 shadow-[0_0_15px_#CCFF00] ${selectedIds.includes(prof._id) ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"}`}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
                      {/* Checkbox */}
                      <div className="lg:col-span-1 flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(prof._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelect(prof._id);
                          }}
                          className="w-5 h-5 rounded border-[#2D2D2D] bg-[#0d0d0d] text-[#CCFF00] focus:ring-[#CCFF00]/50"
                        />
                      </div>

                      {/* Profile */}
                      <div className="lg:col-span-3 flex items-center gap-5">
                        <div className="relative w-11 h-11 rounded-[10px] bg-[#CCFF00]/10 flex items-center justify-center text-[18px] font-black text-[#CCFF00] uppercase border border-[#CCFF00]/20 overflow-hidden">
                          {prof.profilePicture ? (
                            <img
                              src={prof.profilePicture}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            prof.name?.[0]
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[15px] font-black text-white uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors truncate">
                            {prof.name}
                          </h3>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="lg:col-span-3 flex items-center gap-3">
                        <Mail size={14} className="text-white/20" />
                        <span className="text-[12px] font-bold text-white/60 truncate">
                          {prof.email}
                        </span>
                      </div>

                      {/* Expertise */}
                      <div className="lg:col-span-2 flex flex-col">
                        <span className="text-[11px] font-black text-white uppercase tracking-tighter">
                          {prof.businessDetails?.specialization || "GENERALIST"}
                        </span>
                        <span className="text-[8px] font-bold text-[#878C9F] uppercase tracking-widest mt-0.5">
                          XP: {prof.businessDetails?.experience || "N/A"}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="lg:col-span-1">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-[6px] ${prof.status === "blocked" ? "border-red-500/20 text-red-400 bg-red-500/5" : "border-green-500/20 text-green-400 bg-green-500/5"}`}
                        >
                          <div
                            className={`w-1 h-1 rounded-full ${prof.status === "blocked" ? "bg-red-400" : "bg-green-400"}`}
                          />
                          <span className="text-[8px] font-black uppercase">
                            {prof.status || "active"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-2 flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            batchUpdateProfessionalStatus(
                              [prof._id],
                              prof.status === "blocked" ? "active" : "blocked"
                            );
                          }}
                          title={
                            prof.status === "blocked"
                              ? "Activate Record"
                              : "Block Record"
                          }
                          className={`p-2 rounded-[8px] border transition-all ${prof.status === "blocked" ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20" : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"}`}
                        >
                          {prof.status === "blocked" ? (
                            <CheckCircle size={16} />
                          ) : (
                            <Ban size={16} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(prof);
                          }}
                          className="p-2 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/professionals/${prof._id}`);
                          }}
                          className="p-2 rounded-[8px] bg-white/5 border border-white/10 text-white/40 hover:bg-[#CCFF00] hover:text-black transition-all"
                        >
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type="danger"
      />
    </div>
  );
};

export default ProfessionalManagement;
