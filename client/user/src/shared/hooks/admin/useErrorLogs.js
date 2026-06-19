import { useState, useEffect } from "react";
import useAxiosInstance from "@hooks/useAxiosInstance";

const useErrorLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const axiosInstance = useAxiosInstance();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/error-logs");
      if (res.data?.success) {
        setLogs(res.data.alerts);
      }
    } catch (error) {
      console.error("Failed to fetch error logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const resolveLog = async (id) => {
    try {
      const res = await axiosInstance.patch(
        `/api/admin/error-logs/${id}/resolve`
      );
      if (res.data?.success) {
        setLogs((prev) =>
          prev.map((log) =>
            log.id === id ? { ...log, isResolved: true } : log
          )
        );
      }
    } catch (error) {
      console.error("Failed to resolve error log", error);
    }
  };

  return { logs, loading, resolveLog, refetch: fetchLogs };
};

export default useErrorLogs;
