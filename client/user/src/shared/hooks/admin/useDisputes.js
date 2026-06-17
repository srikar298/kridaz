import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useDisputes = (type = "all") => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const url = type === "all" ? "/api/admin/dispute" : `/api/admin/dispute?type=${type}`;
      const response = await axiosInstance.get(url);
      setDisputes(response.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch disputes");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, action, message, partialAmount = 0) => {
    setProcessingId(id);
    try {
      await axiosInstance.post(`/api/admin/dispute/${id}/resolve`, { 
        resolutionAction: action, 
        resolutionNotes: message,
        partialAmount 
      });
      toast.success("Dispute resolved");
      fetchDisputes();
    } catch (err) {
      toast.error("Resolution failed");
    } finally {
      setProcessingId("");
    }
  };

  const handleReply = async (id, message) => {
    try {
      await axiosInstance.post(`/api/admin/dispute/${id}/reply`, { message });
      toast.success("Reply sent");
      fetchDisputes();
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };


  const handleOwnerAction = async (id, action, message) => {
    setProcessingId(id);
    try {
      await axiosInstance.post(`/api/admin/dispute/${id}/owner-action`, { 
        action, 
        reason: message
      });
      toast.success(`Request ${action}d successfully`);
      fetchDisputes();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setProcessingId("");
    }
  };

  const handleEscalate = async (id) => {
    setProcessingId(id);
    try {
      await axiosInstance.post(`/api/admin/dispute/${id}/escalate`);
      toast.success("Dispute escalated to KRIDAZ Support");
      fetchDisputes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to escalate dispute");
    } finally {
      setProcessingId("");
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  return {
    disputes,
    loading,
    processingId,
    handleResolve,
    handleReply,
    handleOwnerAction,
    handleEscalate,

    refresh: fetchDisputes
  };
};

export default useDisputes;
