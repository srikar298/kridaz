import React, { useState } from "react";
import { Button, Input } from "@kridaz/ui";

import {
  useGetChatsQuery,
  useCreateGroupChatMutation,
  useAddGroupsToCommunityMutation,
} from "@redux/api/chatApi";
import {
  Plus,
  X,
  Users,
  Search,
  CheckCircle2,
  MessageSquare,
  Globe,
} from "lucide-react";

const AddGroupToCommunityModal = ({ isOpen, onClose, communityId }) => {
  const [activeTab, setActiveTab] = useState("new"); // 'new' or 'existing'
  const [newGroupName, setNewGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExistingGroups, setSelectedExistingGroups] = useState([]);

  const { data: chatData, isLoading: isLoadingChats } = useGetChatsQuery();
  const [createGroupChat, { isLoading: isCreating }] =
    useCreateGroupChatMutation();
  const [addGroupsToCommunity, { isLoading: isAddingGroups }] =
    useAddGroupsToCommunityMutation();

  if (!isOpen) return null;

  const existingGroups =
    chatData?.chats?.filter(
      (c) => c.isGroupChat && !c.isCommunity && !c.parentCommunity
    ) || [];
  const filteredGroups = existingGroups.filter((g) =>
    g.chatName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      await createGroupChat({
        name: newGroupName,
        parentCommunity: communityId,
        users: JSON.stringify([]),
      }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to create group in community:", err);
    }
  };

  const handleAddExisting = async () => {
    if (selectedExistingGroups.length === 0) return;
    try {
      await addGroupsToCommunity({
        communityId,
        groupIds: selectedExistingGroups,
      }).unwrap();
      onClose();
    } catch (err) {
      console.error("Failed to add existing groups to community:", err);
      alert("Failed to add groups: " + (err.data?.message || err.error));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="bg-card border border-white/10 rounded-[8px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-primary/10 flex items-center justify-center">
              <Globe size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Add Group</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                To Community
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/20 hover:text-white"
           aria-label="Close">
            <X size={20} />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <Button
            onClick={() => setActiveTab("new")}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === "new" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-white/30 hover:text-white/60"}`}
          >
            Create New
          </Button>
          <Button
            onClick={() => setActiveTab("existing")}
            className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === "existing" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-white/30 hover:text-white/60"}`}
          >
            Add Existing
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeTab === "new" ? (
            <form
              onSubmit={handleCreateNew}
              className="space-y-6 animate-slide-in"
            >
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-[8px] bg-primary/10 mx-auto flex items-center justify-center mb-6">
                  <MessageSquare size={32} className="text-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 ml-1">
                    Group Name
                  </label>
                  <Input
                    type="text"
                    autoFocus
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-[8px] px-5 py-4 text-white focus:border-primary outline-none transition-all font-bold placeholder:text-white/10"
                    placeholder="e.g. Announcements, Off-topic..."
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isCreating || !newGroupName.trim()}
                className="w-full py-4 bg-primary text-black font-bold uppercase tracking-wider rounded-[8px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
               aria-label="Add">
                {isCreating ? "Creating..." : "Create Group"} <Plus size={18} />
              </Button>
            </form>
          ) : (
            <div className="space-y-6 animate-slide-in">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your groups..."
                  className="w-full bg-white/[0.02] border border-white/5 rounded-[8px] pl-10 pr-4 py-3 text-sm text-white focus:border-primary/40 outline-none transition-all placeholder:text-white/10"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {isLoadingChats ? (
                  <div className="py-10 flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <p className="text-center py-6 text-white/20 text-xs italic font-medium">
                    No available groups found.
                  </p>
                ) : (
                  filteredGroups.map((group) => {
                    const groupId = group.id || group._id;
                    return (
                      <div
                        key={groupId}
                        onClick={() => {
                          if (selectedExistingGroups.includes(groupId)) {
                            setSelectedExistingGroups(
                              selectedExistingGroups.filter(
                                (id) => id !== groupId
                              )
                            );
                          } else {
                            setSelectedExistingGroups([
                              ...selectedExistingGroups,
                              groupId,
                            ]);
                          }
                        }}
                        className={`flex items-center justify-between p-4 rounded-[8px] cursor-pointer transition-all border ${selectedExistingGroups.includes(groupId) ? "bg-primary/10 border-primary/30" : "bg-white/[0.02] border-transparent hover:border-white/10"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[8px] bg-white/5 flex items-center justify-center">
                            <Users size={18} className="text-white/40" />
                          </div>
                          <span className="text-sm font-bold text-white/80">
                            {group.chatName}
                          </span>
                        </div>
                        {selectedExistingGroups.includes(groupId) && (
                          <CheckCircle2 size={20} className="text-primary" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <Button
                onClick={handleAddExisting}
                disabled={selectedExistingGroups.length === 0 || isAddingGroups}
                className="w-full py-4 bg-primary text-black font-bold uppercase tracking-wider rounded-[8px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {isAddingGroups
                  ? "Adding..."
                  : `Add ${selectedExistingGroups.length} Group${selectedExistingGroups.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddGroupToCommunityModal;
