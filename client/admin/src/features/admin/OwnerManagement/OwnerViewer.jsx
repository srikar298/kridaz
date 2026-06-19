import React, { useState, useEffect } from "react";
import useOwners from "@hooks/admin/useOwners";
import axiosInstance from "@hooks/useAxiosInstance";
import OwnerList from "./OwnerList";
import SearchBar from "./SearchBar";
import OwnersSkeleton from "./OwnersSkeleton";
import {
  Users,
  Building,
  Activity,
  ShieldCheck,
  Trash2,
  Ban,
  CheckCircle,
  X,
} from "lucide-react";
import CountUp from "react-countup";
import ConfirmationModal from "@components/shared/ConfirmationModal";

const OwnerViewer = () => {
  const {
    owners,
    loading,
    searchTerm,
    handleSearch,
    deleteOwner,
    batchDeleteOwners,
    batchUpdateOwnerStatus,
  } = useOwners();

  const [stats, setStats] = useState({
    totalOwners: 0,
    activeOwners: 0,
    growthRate: "+12.5%",
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "",
    target: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get("/api/admin/dashboard");
        setStats({
          totalOwners: response.data.totalOwners || 0,
          activeOwners: owners.length,
          growthRate: "+12.5%",
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();
  }, [owners.length]);

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === owners.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(owners.map((o) => o._id));
    }
  };

  const openDeleteModal = (owner) => {
    setModalConfig({
      isOpen: true,
      type: "DELETE_SINGLE",
      target: owner,
      title: "Delete Venue Owner",
      message: `Are you sure you want to PERMANENTLY delete ${owner.name}? This will remove their owner profile and system access.`,
      confirmText: "Delete Record",
    });
  };

  const openBatchDeleteModal = () => {
    setModalConfig({
      isOpen: true,
      type: "DELETE_BATCH",
      target: selectedIds,
      title: "Batch Delete Owners",
      message: `Are you sure you want to PERMANENTLY delete ${selectedIds.length} selected records? This action is irreversible.`,
      confirmText: `Delete ${selectedIds.length} Records`,
    });
  };

  const handleConfirmAction = async () => {
    const { type, target } = modalConfig;

    if (type === "DELETE_SINGLE") {
      await deleteOwner(target._id);
    } else if (type === "DELETE_BATCH") {
      await batchDeleteOwners(target);
      setSelectedIds([]);
    }

    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleBatchStatusUpdate = async (status) => {
    await batchUpdateOwnerStatus(selectedIds, status);
    setSelectedIds([]);
  };

  if (loading) return <OwnersSkeleton />;

  return (
    <div className="bg-[#000000] min-h-screen">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-12 lg:space-y-16 animate-fade-in pt-0 pb-24 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />

        <div className="space-y-12 lg:space-y-16 relative z-10">
          {/* Header Section */}
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-[#2D2D2D] pb-10">
            <div className="relative">
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-14 bg-[#CCFF00] rounded-full shadow-[0_0_25px_rgba(204,255,0,0.5)]"></div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                Partner <span className="text-[#CCFF00]">Directory</span>
              </h1>
              <p className="admin-subheading text-[#999999]">
                Verified Venue Proprietors • Enterprise Roster
              </p>
            </div>

            <div className="flex items-center gap-6">
              <SearchBar searchTerm={searchTerm} handleSearch={handleSearch} />
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

          {/* Metrics */}
          {!selectedIds.length && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
              <StatsCard
                title="Verified Owners"
                value={stats.totalOwners}
                icon={Building}
                trend="Platform Assets"
              />
              <StatsCard
                title="Live Sessions"
                value={owners.length}
                icon={Activity}
                trend="Active Index"
              />
              <StatsCard
                title="Partner Growth"
                value={12.5}
                suffix="%"
                icon={Users}
                trend="MoM Growth"
              />
              <StatsCard
                title="System Trust"
                value={99.9}
                suffix="%"
                icon={ShieldCheck}
                trend="Verified"
              />
            </div>
          )}

          {/* Proprietor List Table */}
          <div className="space-y-6">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-[#0d0d0d] border border-[#2D2D2D] rounded-[12px] text-[10px] font-black text-[#878C9F] uppercase tracking-[0.2em] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] items-center">
              <div className="col-span-1 flex justify-center">
                <input
                  type="checkbox"
                  checked={
                    owners.length > 0 && selectedIds.length === owners.length
                  }
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-[#2D2D2D] bg-[#0d0d0d] text-[#CCFF00] focus:ring-[#CCFF00]/50"
                />
              </div>
              <div className="col-span-3">Partner Profile</div>
              <div className="col-span-3">Operational Email</div>
              <div className="col-span-2">Contact Number</div>
              <div className="col-span-1">Account Status</div>
              <div className="col-span-2 text-right">Action</div>
            </div>
            <OwnerList
              owners={owners}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onDelete={openDeleteModal}
              onToggleStatus={batchUpdateOwnerStatus}
            />
          </div>
        </div>
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

const StatsCard = ({
  title,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  trend,
}) => (
  <div className="bg-[#000000] border border-[#2D2D2D] rounded-[12px] p-6 flex flex-col relative overflow-hidden group hover:border-[#CCFF00]/30 transition-all duration-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
    <Icon className="absolute -right-4 -bottom-4 w-24 h-24 text-white/[0.02] group-hover:text-white/[0.05] transition-all duration-700 rotate-12 pointer-events-none" />

    <div className="flex items-center justify-between mb-6 relative z-10">
      <div className="w-12 h-12 bg-[#CCFF00]/10 rounded-[10px] text-[#CCFF00] flex items-center justify-center border border-[#CCFF00]/20 shadow-[0_0_15px_rgba(204,255,0,0.1)] transition-transform group-hover:scale-110">
        <Icon size={22} />
      </div>
      <div className="px-3 py-1 rounded-[8px] bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest border border-white/5 group-hover:border-[#CCFF00]/20 group-hover:text-[#CCFF00] transition-all">
        {trend}
      </div>
    </div>

    <div className="space-y-1 relative z-10">
      <h3 className="text-[11px] font-bold text-[#878C9F] uppercase tracking-[2px]">
        {title}
      </h3>
      <div className="text-3xl font-black text-white tracking-tighter flex items-baseline gap-1">
        {prefix && (
          <span className="text-xl text-white/40 font-bold">{prefix}</span>
        )}
        <CountUp
          end={value}
          duration={2}
          separator=","
          decimals={value % 1 === 0 ? 0 : 1}
        />
        {suffix && (
          <span className="text-xl text-white/40 font-bold">{suffix}</span>
        )}
      </div>
    </div>
  </div>
);

export default OwnerViewer;
