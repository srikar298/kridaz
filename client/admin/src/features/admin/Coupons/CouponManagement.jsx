import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";import { Button, Input, Select } from "@kridaz/ui";

import {
  Plus,
  Trash2,
  Tag,
  Percent,
  IndianRupee,
  Clock,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react";

export const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    validUntil: "",
    usageLimit: "",
  });

  const API_BASE = "/api/admin/coupons";

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(API_BASE);
      setCoupons(res.data.coupons || []);
    } catch (error) {
      console.error("Coupons fetch error:", error);
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      code: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      validUntil: "",
      usageLimit: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.code || !formData.discountValue || !formData.validUntil) {
        toast.error("Please fill all required fields");
        return;
      }

      await axiosInstance.post(API_BASE, {
        code: formData.code,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        validUntil: formData.validUntil,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : 0,
      });

      toast.success("Coupon created successfully");
      setIsModalOpen(false);
      fetchCoupons();
    } catch (error) {
      console.error("Coupon save error:", error);
      toast.error(error.response?.data?.error || "Failed to save coupon");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await axiosInstance.delete(`${API_BASE}/${id}`);
      toast.success("Coupon deleted successfully");
      fetchCoupons();
    } catch (error) {
      console.error("Coupon delete error:", error);
      toast.error("Failed to delete coupon");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await axiosInstance.patch(`${API_BASE}/${id}/status`, {
        isActive: !currentStatus,
      });
      toast.success("Coupon status updated");
      fetchCoupons();
    } catch (error) {
      console.error("Coupon status update error:", error);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl font-bebas">
            COUPON MANAGEMENT
          </h1>
          <p className="text-sm text-gray-400">
            Create and manage discount codes for the platform.
          </p>
        </div>
        <Button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-[6px] font-bold hover:bg-yellow-400 transition-colors"
        >
          <Plus size={18} />
          Create Coupon
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => {
          const isValid = new Date(coupon.validUntil) > new Date();
          const isUsable =
            coupon.isActive &&
            isValid &&
            (coupon.usageLimit === 0 || coupon.usedCount < coupon.usageLimit);

          return (
            <div
              key={coupon.id}
              className={`group relative flex flex-col rounded-[8px] border border-white/10 bg-card p-5 transition-all hover:border-yellow-500/50 ${!isUsable ? "opacity-70" : ""}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[8px] bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <Tag size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-white uppercase tracking-wider">
                      {coupon.code}
                    </h3>
                    <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                      {coupon.discountType === "PERCENTAGE" ? (
                        <Percent size={12} />
                      ) : (
                        <IndianRupee size={12} />
                      )}
                      {coupon.discountValue}{" "}
                      {coupon.discountType === "PERCENTAGE" ? "% OFF" : "OFF"}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-[6px] flex items-center gap-1 ${coupon.isActive ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}
                >
                  {coupon.isActive ? (
                    <CheckCircle size={10} />
                  ) : (
                    <XCircle size={10} />
                  )}
                  {coupon.isActive ? "Active" : "Disabled"}
                </Button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Valid Until</span>
                  <span
                    className={`font-bold ${!isValid ? "text-red-400" : "text-white"}`}
                  >
                    {new Date(coupon.validUntil).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Usage</span>
                  <span className="text-white font-bold">
                    {coupon.usedCount} /{" "}
                    {coupon.usageLimit === 0 ? "âˆž" : coupon.usageLimit}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`font-bold ${isUsable ? "text-green-500" : "text-red-500"}`}
                  >
                    {isUsable ? "Usable" : "Not Usable"}
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5">
                <Button
                  onClick={() => handleDelete(coupon.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all text-xs"
                >
                  <Trash2 size={16} />
                  Delete Coupon
                </Button>
              </div>
            </div>
          );
        })}

        {coupons.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[8px]">
            <Tag size={40} className="text-gray-600 mb-4" />
            <h3 className="text-white font-bold">No coupons found</h3>
            <p className="text-gray-400 text-sm">
              Create your first coupon to get started.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-white/10 rounded-[8px] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold font-bebas tracking-wider text-white">
                CREATE COUPON
              </h2>
              <Button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Coupon Code
                </label>
                <Input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition-colors uppercase font-mono"
                  placeholder="e.g. SUMMER2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Discount Type
                  </label>
                  <Select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                  >
                    <option value="PERCENTAGE" className="bg-card">
                      Percentage (%)
                    </option>
                    <option value="FIXED" className="bg-card">
                      Fixed Amount
                    </option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Value
                  </label>
                  <Input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                    placeholder="e.g. 10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Valid Until
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock size={14} className="text-gray-500" />
                  </div>
                  <Input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Usage Limit (0 = Unlimited)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition-colors text-sm"
                  placeholder="e.g. 100"
                />
              </div>

              <div className="pt-6 border-t border-white/10 flex gap-4">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-[8px] border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  className="flex-1 py-3 rounded-[8px] bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                >
                  CREATE COUPON
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
