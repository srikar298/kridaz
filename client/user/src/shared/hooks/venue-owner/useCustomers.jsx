import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activeUsers: 0,
    avgLtv: 0,
    retentionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        "/api/owner/dashboard/customers"
      );
      setCustomers(response.data.customers);
      setStats(response.data.stats);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to fetch customer data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return { customers, stats, loading, error, refresh: fetchCustomers };
};

export default useCustomers;
