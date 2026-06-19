import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";

export default function useVenueOwnerRevenue() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [transactionsData, setTransactionsData] = useState({
    transactions: [],
    pagination: {},
  });
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchRevenueSummary = async () => {
    try {
      const response = await axiosInstance.get("/api/owner/revenue/summary");
      if (response.data?.success) {
        setRevenueData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching revenue summary:", error);
      toast.error("Failed to load revenue data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (page = 1, limit = 15) => {
    setLoadingTransactions(true);
    try {
      const response = await axiosInstance.get(
        `/api/owner/revenue/transactions?page=${page}&limit=${limit}`
      );
      if (response.data?.success) {
        setTransactionsData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchRevenueSummary();
    fetchTransactions();
  }, []);

  return {
    loading,
    revenueData,
    transactionsData,
    loadingTransactions,
    refetch: fetchRevenueSummary,
    fetchTransactions,
  };
}
