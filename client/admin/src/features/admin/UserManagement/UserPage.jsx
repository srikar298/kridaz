import React, { useState } from "react";
import useUsers from "@hooks/admin/useUsers";
import UserSkeleton from "./UserSkeleton";
import UserCard from "./UserCard";
import SearchInput from "./SearchInput";
import { Trash2, Ban, CheckCircle, X } from "lucide-react";
import ConfirmationModal from "@components/shared/ConfirmationModal";

const UserPage = () => {
  const {
    users,
    loading,
    searchTerm,
    handleSearch,
    toggleUserStatus,
    deleteUser,
    batchDeleteUsers,
    batchToggleStatus,
  } = useUsers();

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "",
    target: null,
  });

  const handleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u._id));
    }
  };

  const openDeleteModal = (user) => {
    setModalConfig({
      isOpen: true,
      type: "DELETE_SINGLE",
      target: user,
      title: "Delete User",
      message: `Are you sure you want to PERMANENTLY delete user ${user.name}? This action cannot be undone and will remove all associated data.`,
      confirmText: "Delete User",
    });
  };

  const openBatchDeleteModal = () => {
    setModalConfig({
      isOpen: true,
      type: "DELETE_BATCH",
      target: selectedUsers,
      title: "Batch Delete Users",
      message: `Are you sure you want to PERMANENTLY delete ${selectedUsers.length} selected users? This action is irreversible.`,
      confirmText: `Delete ${selectedUsers.length} Users`,
    });
  };

  const handleConfirmAction = async () => {
    const { type, target } = modalConfig;

    if (type === "DELETE_SINGLE") {
      await deleteUser(target._id);
    } else if (type === "DELETE_BATCH") {
      await batchDeleteUsers(target);
      setSelectedUsers([]);
    }

    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleBatchStatusUpdate = async (status) => {
    await batchToggleStatus(selectedUsers, status);
    setSelectedUsers([]);
  };

  if (loading) return <UserSkeleton />;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 lg:p-10">
      <div className="space-y-12 lg:space-y-16 animate-fade-in relative">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#CCFF00]/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 space-y-12">
          {/* Header Section */}
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-[#2D2D2D] pb-10">
            <div className="relative">
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-14 bg-[#CCFF00] rounded-full shadow-[0_0_25px_rgba(204,255,0,0.5)]"></div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                Platform <span className="text-[#CCFF00]">Users</span>
              </h1>
              <p className="admin-subheading text-[#999999]">
                Global Identity Directory • User Telemetry
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-80">
                <SearchInput
                  searchTerm={searchTerm}
                  handleSearch={handleSearch}
                />
              </div>
              <div className="px-5 py-2.5 bg-[#CCFF00]/10 border border-[#CCFF00]/20 rounded-full">
                <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">
                  Total: {users.length} Active
                </span>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedUsers.length > 0 && (
            <div className="sticky top-6 z-[40] bg-[#0d0d0d] border border-[#CCFF00]/30 rounded-[8px] p-4 shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-6 pl-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#CCFF00] flex items-center justify-center text-black font-black text-xs">
                    {selectedUsers.length}
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#CCFF00]">
                    Users Selected
                  </span>
                </div>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleBatchStatusUpdate("blocked")}
                  className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-[8px] text-orange-400 font-black text-[10px] uppercase tracking-widest hover:bg-orange-500/20 transition-all flex items-center gap-2"
                >
                  <Ban size={14} /> Block
                </button>
                <button
                  onClick={() => handleBatchStatusUpdate("active")}
                  className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-[8px] text-green-400 font-black text-[10px] uppercase tracking-widest hover:bg-green-500/20 transition-all flex items-center gap-2"
                >
                  <CheckCircle size={14} /> Activate
                </button>
                <div className="w-px h-6 bg-white/10 mx-2" />
                <button
                  onClick={openBatchDeleteModal}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          )}

          {/* User List Table */}
          <div className="space-y-6">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-[#0d0d0d] border border-[#2D2D2D] rounded-[12px] text-[10px] font-black text-[#878C9F] uppercase tracking-[0.2em] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] items-center">
              <div className="col-span-1 flex justify-center">
                <input
                  type="checkbox"
                  checked={
                    users.length > 0 && selectedUsers.length === users.length
                  }
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-[#2D2D2D] bg-[#0d0d0d] text-[#CCFF00] focus:ring-[#CCFF00]/50"
                />
              </div>
              <div className="col-span-3">User Profile</div>
              <div className="col-span-1">Role</div>
              <div className="col-span-2">Contact Email</div>
              <div className="col-span-2">Registration Date</div>
              <div className="col-span-1">Account Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {users.length === 0 ? (
              <div className="relative p-20 rounded-[8px] border border-[#2D2D2D] bg-[#000000] text-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[#CCFF00]/5 blur-[100px]"></div>
                <div className="relative space-y-4">
                  <p className="text-2xl font-black text-white uppercase tracking-tighter">
                    No Users Found
                  </p>
                  <p className="admin-subheading text-[#999999]">
                    The identity database is currently empty.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    isSelected={selectedUsers.includes(user._id)}
                    onSelect={handleSelectUser}
                    onToggleStatus={toggleUserStatus}
                    onDelete={openDeleteModal}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type="danger"
      />
    </div>
  );
};

export default UserPage;
