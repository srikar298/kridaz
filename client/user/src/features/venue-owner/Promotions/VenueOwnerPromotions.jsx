import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Calendar,
  Clock,
  Percent,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import useTurfManagement from "@hooks/venue-owner/useTurfManagement";

export default function VenueOwnerPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { turfs, fetchTurfs } = useTurfManagement();

  useEffect(() => {
    fetchPromotions();
    fetchTurfs();
  }, []);

  const fetchPromotions = async () => {
    try {
      const res = await axiosInstance.get("/api/owner/promotions");
      setPromotions(res.data);
    } catch (error) {
      toast.error("Failed to fetch promotions");
    } finally {
      setIsLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: "",
    type: "PERCENTAGE",
    value: "",
    validUntil: "",
    usageLimit: "",
    turfId: "all",
  });

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (newPromo.type === "PERCENTAGE" && Number(newPromo.value) > 100) {
      return toast.error("Percentage discount cannot exceed 100%");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: newPromo.code,
        discountType: newPromo.type,
        discountValue: Number(newPromo.value),
        validUntil: newPromo.validUntil,
        usageLimit: newPromo.usageLimit ? Number(newPromo.usageLimit) : 0,
        turfId: newPromo.turfId,
      };
      await axiosInstance.post("/api/owner/promotions", payload);
      toast.success("Campaign deployed successfully");
      setIsModalOpen(false);
      setNewPromo({
        code: "",
        type: "PERCENTAGE",
        value: "",
        validUntil: "",
        usageLimit: "",
        turfId: "all",
      });
      fetchPromotions();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to deploy campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePromo = async (id) => {
    if (!window.confirm("Delete this campaign?")) return;
    try {
      await axiosInstance.delete(`/api/owner/promotions/${id}`);
      setPromotions(promotions.filter((p) => p._id !== id));
      toast.success("Campaign deleted");
    } catch (error) {
      toast.error("Failed to delete campaign");
    }
  };

  const toggleStatus = async (id) => {
    try {
      const res = await axiosInstance.patch(
        `/api/owner/promotions/${id}/toggle`
      );
      setPromotions(
        promotions.map((p) => {
          if (p._id === id) {
            return { ...p, isActive: res.data.isActive };
          }
          return p;
        })
      );
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to toggle status");
    }
  };

  const activeCount = promotions.filter((p) => p.isActive).length;
  const totalRedemptions = promotions.reduce(
    (acc, curr) => acc + curr.timesUsed,
    0
  );

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="px-1 lg:px-3 lg:pt-2 lg:pb-3 space-y-8 animate-fade-in pt-0 pb-4 h-full relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] sm:text-[24px] lg:text-[32px] mt-2 sm:mt-0 font-bold font-['Open_Sans'] tracking-tight uppercase whitespace-nowrap">
                Promotion Engine
              </h2>
            </div>
            <p className="text-white/70 font-inter text-[20px] mt-1">
              Generate and monitor discount campaigns
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none hover:opacity-90 text-black rounded-[16px] text-[13px] font-bold uppercase tracking-widest transition-all w-full md:w-auto shadow-[0_0_15px_rgba(204,255,0,0.15)] font-inter"
          >
            <Plus size={18} />
            Create Promotion
          </button>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
          <div className="bg-[#121212] border border-white/10 rounded-[16px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#B3DC26]/30 transition-all duration-500">
            <div className="w-10 h-10 bg-[#1B1B1B]/50 rounded-full flex items-center justify-center mb-4 text-white/70 group-hover:text-white transition-colors">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-[12px] font-normal text-white/70 uppercase tracking-[0.5px] mb-1">
              Active Campaigns
            </p>
            <h3 className="text-2xl font-semibold text-[#B3DC26] tracking-tight">
              {isLoading ? "..." : activeCount}
            </h3>
          </div>
          <div className="bg-[#121212] border border-white/10 rounded-[16px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#B3DC26]/30 transition-all duration-500">
            <div className="w-10 h-10 bg-[#1B1B1B]/50 rounded-full flex items-center justify-center mb-4 text-white/70 group-hover:text-white transition-colors">
              <Tag size={20} />
            </div>
            <p className="text-[12px] font-normal text-white/70 uppercase tracking-[0.5px] mb-1">
              Total Codes Issued
            </p>
            <h3 className="text-2xl font-semibold text-white tracking-tight">
              {isLoading ? "..." : promotions.length}
            </h3>
          </div>
          <div className="bg-[#121212] border border-white/10 rounded-[16px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#B3DC26]/30 transition-all duration-500">
            <div className="w-10 h-10 bg-[#1B1B1B]/50 rounded-full flex items-center justify-center mb-4 text-white/70 group-hover:text-white transition-colors">
              <Clock size={20} />
            </div>
            <p className="text-[12px] font-normal text-white/70 uppercase tracking-[0.5px] mb-1">
              Redemptions
            </p>
            <h3 className="text-2xl font-semibold text-white tracking-tight">
              {isLoading ? "..." : totalRedemptions}
            </h3>
          </div>
        </div>

        {/* Promotions Table */}
        <div className="bg-[#121212] border border-white/10 rounded-[16px] overflow-hidden shadow-[var(--shadow-2)]">
          <div className="p-4 border-b border-white/10 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
                size={16}
              />
              <input
                type="text"
                placeholder="Search campaigns..."
                className="w-full bg-[#1B1B1B] border border-white/10 text-white pl-10 pr-4 py-2 rounded-[16px] text-[13px] focus:outline-none focus:border-[#B3DC26]/50 transition-colors font-inter"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1B1B1B] border-b border-white/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    Code
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    Ground
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    Discount
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    Usage
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    Validity
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/70 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-white/70 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-white/70">
                      Loading campaigns...
                    </td>
                  </tr>
                ) : (
                  promotions.map((promo) => (
                    <tr
                      key={promo._id}
                      className="border-b border-white/10 hover:bg-[#1B1B1B]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#1B1B1B] rounded-[16px] text-sm font-bold tracking-wider text-white">
                          {promo.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-white/70">
                          {promo.turfName || "All Grounds"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-[#B3DC26]">
                          {promo.discountType === "PERCENTAGE" ? (
                            <Percent size={14} />
                          ) : (
                            <IndianRupee size={14} />
                          )}
                          {promo.discountValue}
                          {promo.discountType === "PERCENTAGE" ? "%" : " OFF"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-white">
                            {promo.timesUsed}{" "}
                            <span className="text-white/70 text-xs font-normal">
                              redemptions
                            </span>
                          </span>
                          {promo.usageLimit > 0 && (
                            <div className="w-24 h-1.5 bg-[#1B1B1B] rounded-full overflow-hidden">
                              <div
                                className={`h-full ${promo.timesUsed >= promo.usageLimit ? "bg-red-500" : "bg-[#B3DC26]"}`}
                                style={{
                                  width: `${Math.min((promo.timesUsed / promo.usageLimit) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-white/70">
                          <Calendar size={14} />
                          {new Date(promo.validUntil).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(promo._id)}
                          className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-[16px] border transition-colors ${promo.isActive ? "bg-[#B3DC26]/10 text-[#B3DC26] border-[#B3DC26]/20 hover:bg-[#B3DC26]/20" : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"}`}
                        >
                          {promo.isActive ? "ACTIVE" : "INACTIVE"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deletePromo(promo._id)}
                          className="p-2 text-white/70 hover:text-red-500 hover:bg-red-500/10 rounded-[16px] transition-all"
                          title="Delete Campaign"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {!isLoading && promotions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Tag size={32} className="text-[#333] mb-3" />
                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                          No Active Campaigns
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Promotion Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#121212] border border-white/10 rounded-[16px] w-full max-w-md overflow-hidden shadow-[var(--shadow-2)]">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1B1B1B]">
                <h2 className="text-lg font-bold font-['Open_Sans'] uppercase tracking-tight text-white flex items-center gap-2">
                  <Tag size={18} className="text-[#B3DC26]" />
                  Initialize Campaign
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/70 hover:text-[#B3DC26] transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleCreatePromo} className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    required
                    value={newPromo.code}
                    onChange={(e) =>
                      setNewPromo({
                        ...newPromo,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full bg-[#1B1B1B] border border-white/10 text-white px-4 py-2.5 rounded-[16px] text-sm focus:outline-none focus:border-[#B3DC26]/50 uppercase"
                    placeholder="e.g. SUMMER25"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">
                    Target Ground
                  </label>
                  <select
                    value={newPromo.turfId}
                    onChange={(e) =>
                      setNewPromo({ ...newPromo, turfId: e.target.value })
                    }
                    className="w-full bg-[#1B1B1B] border border-white/10 text-white px-4 py-2.5 rounded-[16px] text-sm focus:outline-none focus:border-[#B3DC26]/50"
                  >
                    <option value="all">Universal (All My Grounds)</option>
                    {turfs.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">
                      Type
                    </label>
                    <select
                      value={newPromo.type}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, type: e.target.value })
                      }
                      className="w-full bg-[#1B1B1B] border border-white/10 text-white px-4 py-2.5 rounded-[16px] text-sm focus:outline-none focus:border-[#B3DC26]/50"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Amount (Rs)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">
                      Value
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newPromo.value}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, value: e.target.value })
                      }
                      className="w-full bg-[#1B1B1B] border border-white/10 text-white px-4 py-2.5 rounded-[16px] text-sm focus:outline-none focus:border-[#B3DC26]/50"
                      placeholder="e.g. 25"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={newPromo.validUntil}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, validUntil: e.target.value })
                      }
                      className="w-full bg-[#1B1B1B] border border-white/10 text-white/70 px-4 py-2.5 rounded-[16px] text-sm focus:outline-none focus:border-[#B3DC26]/50 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">
                      Usage Limit (Opt)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newPromo.usageLimit}
                      onChange={(e) =>
                        setNewPromo({ ...newPromo, usageLimit: e.target.value })
                      }
                      className="w-full bg-[#1B1B1B] border border-white/10 text-white px-4 py-2.5 rounded-[16px] text-sm focus:outline-none focus:border-[#B3DC26]/50"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-[#1B1B1B] border border-white/10 text-white rounded-[16px] text-[13px] uppercase tracking-widest font-bold hover:bg-[#1B1B1B] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none text-black rounded-[16px] text-[13px] uppercase tracking-widest font-bold hover:opacity-90 transition-colors shadow-[0_0_15px_rgba(204,255,0,0.15)] disabled:opacity-50"
                  >
                    {isSubmitting ? "Deploying..." : "Deploy Campaign"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
