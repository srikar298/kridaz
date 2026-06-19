import React, { useState, useCallback } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useTurfManagement = () => {
  const [turfs, setTurfs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTurfs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/api/owner/turf/owner/all");
      setTurfs(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Failed to fetch turfs");
      toast.error("Failed to load your arenas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTurf = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to decommission this arena? All associated slots and data will be permanently removed."
      )
    )
      return;

    try {
      await axiosInstance.delete(`/api/owner/turf/owner/${id}`);
      setTurfs((prev) => prev.filter((turf) => turf._id !== id));
      toast.success("Arena decommissioned successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete turf");
    }
  };

  const toggleVisibility = async (id) => {
    try {
      const response = await axiosInstance.put(
        `/api/owner/turf/owner/${id}/visibility`
      );
      setTurfs((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, isActive: response.data.isActive } : t
        )
      );
      toast.success(response.data.message);
    } catch (err) {
      toast.error("Failed to update visibility");
    }
  };

  return {
    turfs,
    isLoading,
    error,
    fetchTurfs,
    deleteTurf,
    toggleVisibility,
  };
};

export default useTurfManagement;
