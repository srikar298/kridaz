import { useEffect, useState } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

const useTurfData = () => {
  const [turfData, setTurfData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTurfData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/admin/turfs/admin/all`);
      const result = await response.data;
      setTurfData(result.turfs);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurfData();
  }, []);

  const approveTurf = async (id, adminData) => {
    try {
      await axiosInstance.put(
        `/api/admin/turfs/admin/${id}/approve`,
        adminData
      );
      await fetchTurfData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const rejectTurf = async (id, adminData) => {
    try {
      await axiosInstance.put(`/api/admin/turfs/admin/${id}/reject`, adminData);
      await fetchTurfData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const decommissionTurf = async (id, adminData) => {
    try {
      await axiosInstance.put(
        `/api/admin/turfs/admin/${id}/decommission`,
        adminData
      );
      await fetchTurfData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const softDeleteTurf = async (id, adminData) => {
    try {
      await axiosInstance.put(
        `/api/admin/turfs/admin/${id}/soft-delete`,
        adminData
      );
      await fetchTurfData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const hardDeleteTurf = async (id) => {
    try {
      await axiosInstance.delete(`/api/admin/turfs/admin/${id}/hard-delete`);
      await fetchTurfData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return {
    turfData,
    loading,
    approveTurf,
    rejectTurf,
    decommissionTurf,
    softDeleteTurf,
    hardDeleteTurf,
    refetch: fetchTurfData,
  };
};

export default useTurfData;
