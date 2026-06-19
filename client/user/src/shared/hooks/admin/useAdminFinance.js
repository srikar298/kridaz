import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useAdminFinance = () => {
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [kycQueue, setKycQueue] = useState([]);
  const [payoutSettings, setPayoutSettings] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqsRes, kycRes, settingsRes, statsRes] = await Promise.all([
        axiosInstance.get("/api/admin/withdrawals/list"),
        axiosInstance.get("/api/admin/owners/all"),
        axiosInstance.get("/api/admin/settings/payout"),
        axiosInstance.get("/api/admin/dashboard/"),
      ]);

      setPayoutRequests(reqsRes.data.requests || []);
      setKycQueue(
        kycRes.data.owners?.filter(
          (o) => o.bankingDetails?.kycStatus === "PENDING"
        ) || []
      );
      setPayoutSettings(settingsRes.data.settings);
      setStats({
        totalRevenue: statsRes.data.totalPayouts + statsRes.data.totalBookings, // Rough estimation
        totalPayouts: statsRes.data.totalPayouts,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const updatePayoutSettingsConfig = async (newSettings) => {
    try {
      await axiosInstance.put("/api/admin/settings/payout", newSettings);
      setPayoutSettings(newSettings);
      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error("Failed to update settings");
    }
  };

  const verifyKYC = async (ownerId, status) => {
    try {
      await axiosInstance.put(`/api/admin/owners/${ownerId}/kyc`, { status });
      toast.success(`KYC ${status.toLowerCase()}`);
      fetchData();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    payoutRequests,
    kycQueue,
    payoutSettings,
    stats,
    loading,
    updatePayoutSettings: updatePayoutSettingsConfig,
    verifyKYC,
    refresh: fetchData,
  };
};

export default useAdminFinance;
