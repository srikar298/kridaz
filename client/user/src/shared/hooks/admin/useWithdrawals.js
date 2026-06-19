import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useWithdrawals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/admin/withdrawals/list");
      setRequests(response.data.requests);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, transactionId, screenshot) => {
    if (!transactionId) {
      toast.error("Transaction ID is required for approval");
      return;
    }
    setProcessingId(id);
    try {
      const response = await axiosInstance.put(
        `/api/admin/withdrawals/${id}/approve`,
        { transactionId, screenshot }
      );
      toast.success(response.data.message);
      fetchWithdrawals(); // Refresh list
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to approve withdrawal"
      );
    } finally {
      setProcessingId("");
    }
  };

  const handleReject = async (id, reason) => {
    if (!reason) {
      toast.error("Rejection reason is required");
      return;
    }
    setProcessingId(id);
    try {
      const response = await axiosInstance.put(
        `/api/admin/withdrawals/${id}/reject`,
        { reason }
      );
      toast.success(response.data.message);
      fetchWithdrawals(); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject withdrawal");
    } finally {
      setProcessingId("");
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  return {
    requests,
    loading,
    processingId,
    handleApprove,
    handleReject,
    refresh: fetchWithdrawals,
  };
};

export default useWithdrawals;
