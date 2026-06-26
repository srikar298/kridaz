import { useState, useCallback, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useGetOwnerTurfsQuery } from "@redux/api/turfApi";

const useTurfManagement = () => {
  const [turfs, setTurfs] = useState([]);
  const { data: ownerTurfsData, isLoading, error: queryError, refetch } = useGetOwnerTurfsQuery();

  useEffect(() => {
    if (ownerTurfsData) {
      setTurfs(Array.isArray(ownerTurfsData) ? ownerTurfsData : []);
    }
  }, [ownerTurfsData]);

  // Keep fetchTurfs for backward compatibility — now just triggers RTK refetch
  const fetchTurfs = useCallback(() => {
    refetch();
  }, [refetch]);

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
    error: queryError ? "Failed to fetch turfs" : null,
    fetchTurfs,
    deleteTurf,
    toggleVisibility,
  };
};

export default useTurfManagement;
