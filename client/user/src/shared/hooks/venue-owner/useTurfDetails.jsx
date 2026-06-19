import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

const useTurfDetails = (turfId) => {
  const [turfData, setTurfData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTurfDetails = async () => {
    if (!turfId) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `/api/owner/turf/owner/${turfId}/details`
      );
      setTurfData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching turf details:", err);
      const msg = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.response?.data?.message ||
          err.message ||
          "Failed to fetch turf details";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTurfDetails();
  }, [turfId]);

  const toggleVisibility = async () => {
    try {
      await axiosInstance.put(`/api/owner/turf/owner/${turfId}/visibility`);
      await fetchTurfDetails();
      return true;
    } catch (err) {
      console.error("Error toggling visibility:", err);
      return false;
    }
  };

  const deleteArena = async () => {
    try {
      await axiosInstance.delete(`/api/owner/turf/owner/${turfId}`);
      return true;
    } catch (err) {
      console.error("Error deleting arena:", err);
      return false;
    }
  };

  return {
    turfData,
    isLoading,
    error,
    refetch: fetchTurfDetails,
    toggleVisibility,
    deleteArena,
  };
};

export default useTurfDetails;
