import { useState, useMemo } from "react";
import { X, Search, Check, Send } from "lucide-react";
import { Button, Input } from "@kridaz/ui";

import {
  useGetFollowersFollowingQuery,
  useForwardMessageMutation,
} from "@redux/api/chatApi";

const ForwardModal = ({ isOpen, onClose, messageId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { data: networkData, isLoading } = useGetFollowersFollowingQuery(
    undefined,
    { skip: !isOpen }
  );
  const [forwardMessage, { isLoading: isForwarding }] =
    useForwardMessageMutation();

  const connections = useMemo(() => {
    if (!networkData) return [];
    const all = [
      ...(networkData.followers || []),
      ...(networkData.following || []),
    ];
    // Deduplicate by ID
    const unique = [];
    const seen = new Set();
    for (const u of all) {
      if (!seen.has(u._id)) {
        seen.add(u._id);
        unique.push(u);
      }
    }
    return unique;
  }, [networkData]);

  const filteredConnections = useMemo(() => {
    return connections.filter(
      (user) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [connections, searchQuery]);

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleForward = async () => {
    if (selectedUsers.length === 0) return;
    try {
      await forwardMessage({ messageId, userIds: selectedUsers }).unwrap();
      onClose();
      // Optional: show toast notification here
      setSelectedUsers([]);
      setSearchQuery("");
    } catch (err) {
      console.error("Failed to forward message:", err);
      alert(err.data?.message || "Failed to forward message");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className="bg-card border border-white/10 rounded-[8px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-scale-up"
        style={{ maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h2 className="text-white font-black tracking-wider uppercase text-lg">
            Forward to
          </h2>
          <Button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
           aria-label="Close">
            <X size={18} />
          </Button>
        </div>

        <div className="p-4 shrink-0 border-b border-white/5">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search followers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[8px] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-white/40 text-sm">
              Loading followers...
            </div>
          ) : filteredConnections.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/40 text-sm">
              No users found
            </div>
          ) : (
            filteredConnections.map((user) => {
              const isSelected = selectedUsers.includes(user._id);
              return (
                <div
                  key={user._id}
                  onClick={() => toggleUser(user._id)}
                  className={`flex items-center justify-between p-2 rounded-[8px] cursor-pointer transition-all ${isSelected ? "bg-primary/10" : "hover:bg-white/5"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                      {user.profilePicture || user.profileImage ? (
                        <img
                          src={user.profilePicture || user.profileImage}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const next = e.currentTarget.nextElementSibling;
                            if (next) {
                              next.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5"
                        style={{
                          display:
                            user.profilePicture || user.profileImage
                              ? "none"
                              : "flex",
                        }}
                      >
                        <span className="text-primary font-black text-xs tracking-tighter">
                          {user.name
                            ? user.name
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "?"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {user.name}
                      </p>
                      <p className="text-white/40 text-xs">
                        @
                        {user.username ||
                          user.name.toLowerCase().replace(" ", "")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-white/20"}`}
                  >
                    {isSelected && <Check size={14} className="text-black" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedUsers.length > 0 && (
          <div className="p-4 border-t border-white/10 shrink-0 bg-[#141414]">
            <Button
              onClick={handleForward}
              disabled={isForwarding}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-black font-black uppercase tracking-wider text-sm rounded-[8px] hover:bg-[#95e61a] transition-colors disabled:opacity-50"
             aria-label="Send">
              <Send size={16} />
              {isForwarding
                ? "Forwarding..."
                : `Forward to ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForwardModal;
