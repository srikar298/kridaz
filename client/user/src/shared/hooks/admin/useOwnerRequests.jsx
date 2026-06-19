import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useOwnerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [allRejectedRequests, setAllRejectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filterData = useCallback((term, role, pendingArr, rejectedArr) => {
    let filteredPending = [...pendingArr];
    let filteredRejected = [...rejectedArr];

    if (role !== "all") {
      filteredPending = filteredPending.filter((req) => req.role === role);
      filteredRejected = filteredRejected.filter((req) => req.role === role);
    }

    if (term !== "") {
      const lowerTerm = term.toLowerCase();
      filteredPending = filteredPending.filter(
        (request) =>
          request.name.toLowerCase().includes(lowerTerm) ||
          request.email.toLowerCase().includes(lowerTerm) ||
          (request.businessDetails?.businessName &&
            request.businessDetails.businessName
              .toLowerCase()
              .includes(lowerTerm))
      );

      filteredRejected = filteredRejected.filter(
        (request) =>
          request.name.toLowerCase().includes(lowerTerm) ||
          request.email.toLowerCase().includes(lowerTerm) ||
          (request.businessDetails?.businessName &&
            request.businessDetails.businessName
              .toLowerCase()
              .includes(lowerTerm))
      );
    }

    setRequests(filteredPending);
    setRejectedRequests(filteredRejected);
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    filterData(term, roleFilter, allRequests, allRejectedRequests);
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    filterData(searchTerm, role, allRequests, allRejectedRequests);
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        "/api/admin/venue-owner-requests/all"
      );
      const { pendingRequests, rejectedRequests: rejected } = response.data;

      setAllRequests(pendingRequests);
      setAllRejectedRequests(rejected);

      // Apply existing filters to fresh data
      filterData(searchTerm, roleFilter, pendingRequests, rejected);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Failed to fetch verification requests"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id, adminData) => {
    setRequestId(id);
    try {
      const response = await axiosInstance.put(
        `/api/admin/venue-owner-requests/${id}/accept`,
        adminData
      );
      toast.success(response.data.message);
      fetchRequests(); // Refresh to get updated stats and lists
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Authorization failed");
    } finally {
      setRequestId("");
    }
  };

  const handleReject = async (id) => {
    setRequestId(id);
    try {
      const response = await axiosInstance.delete(
        `/api/admin/venue-owner-requests/${id}`
      );
      toast.success(response.data.message);
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Rejection failed");
    } finally {
      setRequestId("");
    }
  };

  const handleReconsider = async (id) => {
    setRequestId(id);
    try {
      const response = await axiosInstance.put(
        `/api/admin/venue-owner-requests/reconsider/${id}`
      );
      toast.success(response.data.message);
      fetchRequests();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Reconsideration failed");
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
    rejectedRequests,
    handleReconsider,
    searchTerm,
    handleSearch,
    roleFilter,
    handleRoleFilter,
    refresh: fetchRequests,
  };
};

export default useOwnerRequests;
