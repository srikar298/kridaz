import React, { useState } from "react";
import {
  useGetFollowersFollowingQuery,
  useCreateGroupChatMutation,
} from "@redux/api/chatApi";

const CreateGroupModal = ({ isOpen, onClose, onSuccess }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { data, isLoading } = useGetFollowersFollowingQuery();
  const [createGroupChat, { isLoading: isCreating }] =
    useCreateGroupChatMutation();

  if (!isOpen) return null;

  const connections = [
    ...(data?.followers || []),
    ...(data?.following || []),
  ].filter(
    (v, i, a) => a.findIndex((t) => (t.id || t._id) === (v.id || v._id)) === i
  ); // Unique users

  const toggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName || selectedUsers.length === 0) return;

    try {
      const data = await createGroupChat({
        name: groupName,
        users: JSON.stringify(selectedUsers),
      }).unwrap();
      onSuccess(data);
      onClose();
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1a1a1a] border border-[#2D2D2D] rounded-[8px] w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#2D2D2D] flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Create Group</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Group Name
            </label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-[#000000] border border-[#2D2D2D] rounded-[6px] px-4 py-3 text-white focus:border-primary outline-none transition-all"
              placeholder="Enter group name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">
              Invite Members (Followers/Following only)
            </label>
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {isLoading ? (
                <div className="text-center py-4 text-white/40">
                  Loading connections...
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-4 text-white/40 text-sm italic">
                  No connections found. Follow users to invite them.
                </div>
              ) : (
                connections.map((user) => {
                  const userId = user.id || user._id;
                  return (
                    <div
                      key={userId}
                      onClick={() => toggleUser(userId)}
                      className={`flex items-center gap-3 p-3 rounded-[6px] border cursor-pointer transition-all ${selectedUsers.includes(userId) ? "bg-primary/20 border-primary/50" : "bg-[#000000] border-transparent hover:border-[#2D2D2D]"}`}
                    >
                      <img
                        src={
                          user.profilePicture ||
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        className="w-10 h-10 rounded-full"
                        alt={user.name}
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">
                          {user.name}
                        </p>
                        <p className="text-white/40 text-xs">
                          @{user.username}
                        </p>
                      </div>
                      {selectedUsers.includes(userId) && (
                        <div className="bg-primary rounded-full p-1">
                          <svg
                            className="w-4 h-4 text-black"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating || !groupName || selectedUsers.length === 0}
            className="w-full py-4 bg-primary text-black font-bold rounded-[8px] hover:bg-primary/80 transition-all disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Group"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
