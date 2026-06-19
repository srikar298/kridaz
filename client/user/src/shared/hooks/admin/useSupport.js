import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/admin/support/tickets");
      setTickets(response.data.tickets);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setProcessingId(id);
    try {
      await axiosInstance.put(`/api/admin/support/tickets/${id}/status`, {
        status,
      });
      toast.success("Status updated");
      fetchTickets();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setProcessingId("");
    }
  };

  const handleReply = async (id, message) => {
    if (!message.trim()) return;
    setProcessingId(id);
    try {
      await axiosInstance.post(`/api/admin/support/tickets/${id}/reply`, {
        message,
      });
      toast.success("Reply sent");
      fetchTickets();
    } catch (err) {
      toast.error("Reply failed");
    } finally {
      setProcessingId("");
    }
  };

  const handleToggleAgentStatus = async (id, isOnline) => {
    setProcessingId(id);
    try {
      await axiosInstance.put(`/api/admin/support/tickets/${id}/agent-status`, {
        isOnline,
      });
      toast.success(isOnline ? "You are now ONLINE" : "You are now OFFLINE");
      fetchTickets();
    } catch (err) {
      toast.error("Status toggle failed");
    } finally {
      setProcessingId("");
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return {
    tickets,
    loading,
    processingId,
    handleUpdateStatus,
    handleReply,
    handleToggleAgentStatus,
    refresh: fetchTickets,
  };
};

export default useSupport;
