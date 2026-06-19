import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useBanking = () => {
  const [bankingDetails, setBankingDetails] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [payoutSettings, setPayoutSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPayoutDay, setIsPayoutDay] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bankingRes, settingsRes] = await Promise.all([
        axiosInstance.get("/api/owner/banking"),
        axiosInstance.get("/api/owner/banking/config"),
      ]);

      setBankingDetails(bankingRes.data.bankingDetails);
      setWalletBalance(bankingRes.data.walletBalance || 0);
      setPayoutSettings(settingsRes.data.settings);

      // Payout button is now always active as per request
      setIsPayoutDay(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load banking info");
    } finally {
      setLoading(false);
    }
  };

  const updateBanking = async (data) => {
    try {
      const res = await axiosInstance.put("/api/owner/banking", data);
      setBankingDetails(res.data.bankingDetails);
      toast.success("Banking details updated");
      return true;
    } catch (err) {
      toast.error("Update failed");
      return false;
    }
  };

  const requestPayout = async (amount, password) => {
    try {
      const res = await axiosInstance.post("/api/owner/banking/payout", {
        amount,
        password,
      });
      toast.success(res.data.message);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Payout request failed");
      return false;
    }
  };

  const verifyPassword = async (password) => {
    try {
      await axiosInstance.post("/api/owner/banking/verify-password", {
        password,
      });
      toast.success("Identity Verified");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    bankingDetails,
    walletBalance,
    payoutSettings,
    loading,
    isPayoutDay,
    updateBanking,
    requestPayout,
    verifyPassword,
    refresh: fetchData,
  };
};

export default useBanking;
