import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useProfessionalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = useCallback(
    (term) => {
      setSearchTerm(term);
      if (term === "") {
        setRequests(allRequests);
        return;
      }
      const filtered = allRequests.filter(
        (request) =>
          request.name.toLowerCase().includes(term.toLowerCase()) ||
          request.email.toLowerCase().includes(term.toLowerCase()) ||
          (request.role &&
            request.role.toLowerCase().includes(term.toLowerCase()))
      );
      setRequests(filtered);
    },
    [allRequests]
  );

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        "/api/admin/professionals/requests"
      );
      const data = response.data;
      setRequests(data.professionalRequests);
      setAllRequests(data.professionalRequests);
    } catch (err) {
      console.log(err, "err");
      toast.error(
        err.response?.data?.message || "Failed to fetch professional requests"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    setRequestId(id);
    try {
      const response = await axiosInstance.put(
        `/api/admin/professionals/requests/${id}/accept`
      );
      const result = await response.data;
      toast.success(result.message || "Professional request approved");
      setRequests(requests.filter((request) => request._id !== id));
      setAllRequests(allRequests.filter((request) => request._id !== id));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to approve request");
    } finally {
      setRequestId("");
    }
  };

  const handleReject = async (id) => {
    setRequestId(id);
    try {
      const response = await axiosInstance.delete(
        `/api/admin/professionals/requests/${id}`
      );
      const result = await response.data;
      toast.success(result.message || "Professional request rejected");
      setRequests(requests.filter((request) => request._id !== id));
      setAllRequests(allRequests.filter((request) => request._id !== id));
    } catch (err) {
      console.error(err, "delete error");
      toast.error(err.response?.data?.message || "Failed to reject request");
    } finally {
      setRequestId("");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return {
    requests,
    loading,
    handleAccept,
    handleReject,
    requestId,
    searchTerm,
    handleSearch,
  };
};

export default useProfessionalRequests;
