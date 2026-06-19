import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useOwnerWallet = () => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    reservedBalance: 0,
    usableBalance: 0,
    transactions: [],
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchWalletData = useCallback(async () => {
    try {
      const [walletRes, withdrawalsRes] = await Promise.all([
        axiosInstance.get("/api/owner/wallet/owner/data"),
        axiosInstance.get("/api/owner/wallet/owner/withdrawals"),
      ]);
      setWalletData(walletRes.data);
      setWithdrawals(withdrawalsRes.data.requests);
    } catch (err) {
      console.error("Error fetching wallet data:", err);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestWithdrawal = async (amount, bankDetails) => {
    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/api/owner/wallet/withdraw", {
        amount,
        bankDetails,
      });
      toast.success(response.data.message);
      fetchWalletData(); // Refresh data
      return true;
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to submit withdrawal request"
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  return {
    walletData,
    withdrawals,
    loading,
    submitting,
    requestWithdrawal,
    refresh: fetchWalletData,
  };
};

export default useOwnerWallet;
