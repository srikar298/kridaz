// useOwners.jsx
import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

const useOwners = () => {
  const [owners, setOwners] = useState({
    all: [],
    filtered: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value === "") {
      setOwners((prev) => {
        console.log(prev, "prev");
        return {
          ...prev,
          filtered: prev.all,
        };
      });
    } else {
      const filtered = owners.all.filter(
        (owner) =>
          owner.name.toLowerCase().includes(value.toLowerCase()) ||
          owner.email.toLowerCase().includes(value.toLowerCase())
      );
      setOwners((prev) => ({
        ...prev,
        filtered: filtered,
      }));
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/owners/all");
      const result = response.data.owners;
      setOwners({
        all: result,
        filtered: result,
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching owners:", err);
      setLoading(false);
    }
  };

  const deleteOwner = async (id) => {
    try {
      await axiosInstance.delete(`/api/admin/owners/${id}`);
      setOwners((prev) => ({
        all: prev.all.filter((o) => o._id !== id),
        filtered: prev.filtered.filter((o) => o._id !== id),
      }));
      return true;
    } catch (err) {
      console.error("Error deleting owner:", err);
      return false;
    }
  };

  const batchDeleteOwners = async (ids) => {
    try {
      await axiosInstance.post("/api/admin/owners/batch-delete", {
        ownerIds: ids,
      });
      setOwners((prev) => ({
        all: prev.all.filter((o) => !ids.includes(o._id)),
        filtered: prev.filtered.filter((o) => !ids.includes(o._id)),
      }));
      return true;
    } catch (err) {
      console.error("Error batch deleting owners:", err);
      return false;
    }
  };

  const batchUpdateOwnerStatus = async (ids, status) => {
    try {
      await axiosInstance.put("/api/admin/owners/batch-status", {
        ownerIds: ids,
        status,
      });
      setOwners((prev) => ({
        all: prev.all.map((o) => (ids.includes(o._id) ? { ...o, status } : o)),
        filtered: prev.filtered.map((o) =>
          ids.includes(o._id) ? { ...o, status } : o
        ),
      }));
      return true;
    } catch (err) {
      console.error("Error batch updating status:", err);
      return false;
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  return {
    owners: owners.filtered,
    loading,
    searchTerm,
    handleSearch,
    deleteOwner,
    batchDeleteOwners,
    batchUpdateOwnerStatus,
    refresh: fetchOwners,
  };
};

export default useOwners;
