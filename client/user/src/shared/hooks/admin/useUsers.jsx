import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      // Replace this with your actual API call
      const response = await axiosInstance.get("/api/admin/users/all");
      const result = await response.data;
      setUsers(result.users);
      setFilteredUsers(result.users);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = useCallback(
    (term) => {
      setSearchTerm(term);
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(term.toLowerCase()) ||
          user.email.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    },
    [users]
  );

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "blocked" : "active";
      await axiosInstance.put(`/api/admin/users/${userId}/status`, {
        status: newStatus,
      });
      setUsers((prev) =>
        prev.map((u) =>
          (u.id || u._id) === userId ? { ...u, status: newStatus } : u
        )
      );
      setFilteredUsers((prev) =>
        prev.map((u) =>
          (u.id || u._id) === userId ? { ...u, status: newStatus } : u
        )
      );
      return { success: true };
    } catch (error) {
      console.error("Error toggling user status:", error);
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      await axiosInstance.delete(`/api/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => (u.id || u._id) !== userId));
      setFilteredUsers((prev) =>
        prev.filter((u) => (u.id || u._id) !== userId)
      );
      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      return { success: false, error: error.message };
    }
  };

  const batchDeleteUsers = async (userIds) => {
    try {
      await axiosInstance.post("/api/admin/users/batch-delete", { userIds });
      setUsers((prev) => prev.filter((u) => !userIds.includes(u.id || u._id)));
      setFilteredUsers((prev) =>
        prev.filter((u) => !userIds.includes(u.id || u._id))
      );
      return { success: true };
    } catch (error) {
      console.error("Error batch deleting users:", error);
      return { success: false, error: error.message };
    }
  };

  const batchToggleStatus = async (userIds, status) => {
    try {
      await axiosInstance.put("/api/admin/users/batch-status", {
        userIds,
        status,
      });
      setUsers((prev) =>
        prev.map((u) =>
          userIds.includes(u.id || u._id) ? { ...u, status } : u
        )
      );
      setFilteredUsers((prev) =>
        prev.map((u) =>
          userIds.includes(u.id || u._id) ? { ...u, status } : u
        )
      );
      return { success: true };
    } catch (error) {
      console.error("Error batch updating status:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    users: filteredUsers,
    loading,
    searchTerm,
    handleSearch,
    toggleUserStatus,
    deleteUser,
    batchDeleteUsers,
    batchToggleStatus,
    refreshUsers: fetchUsers,
  };
};

export default useUsers;
