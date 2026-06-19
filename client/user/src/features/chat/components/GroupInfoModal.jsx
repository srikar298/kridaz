import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useUpdateGroupMutation,
  useRemoveFromGroupMutation,
  useAddToGroupMutation,
  useGetFollowersFollowingQuery,
  useMakeGroupAdminMutation,
  useDismissGroupAdminMutation,
  useGetChatsQuery,
  useDeleteChatMutation,
} from "@redux/api/chatApi";

const GroupInfoModal = ({ isOpen, onClose, chat }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState(chat?.chatName || "");
  const [isEditingName, setIsEditingName] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [renameGroup] = useUpdateGroupMutation();
  const [removeFromGroup] = useRemoveFromGroupMutation();
  const [addToGroup] = useAddToGroupMutation();
  const [makeAdmin] = useMakeGroupAdminMutation();
  const [dismissAdmin] = useDismissGroupAdminMutation();
  const [deleteChat] = useDeleteChatMutation();
  const { data: networkData } = useGetFollowersFollowingQuery();

  if (!isOpen || !chat) return null;

  const myIds = [user?._id, user?.id, user?.userId]
    .filter(Boolean)
    .map((id) => id.toString());
  const isAdmin =
    chat.groupAdmins?.some((admin) => {
      const adminId = (admin.user?._id || admin.user)?.toString();
      return myIds.includes(adminId);
    }) ||
    myIds.includes(chat.createdByUserId?.toString()) ||
    myIds.includes(chat.createdByOwnerId?.toString()) ||
    myIds.includes(
      (
        chat.groupAdmin?._id ||
        chat.groupAdmin?.user?._id ||
        chat.groupAdmin ||
        chat.createdBy?.user?._id ||
        chat.createdBy?.user ||
        chat.createdBy
      )?.toString()
    );

  const handleRename = async () => {
    if (!groupName || groupName === chat.chatName) {
      setIsEditingName(false);
      return;
    }
    try {
      await renameGroup({ chatId: chat._id, chatName: groupName }).unwrap();
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to rename group", err);
    }
  };

  const handleRemove = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to remove this user from the group?"
      )
    ) {
      try {
        await removeFromGroup({ chatId: chat._id, userId }).unwrap();
      } catch (err) {
        console.error("Failed to remove user", err);
      }
    }
  };

  const createdById = (
    chat.createdBy?._id ||
    chat.createdBy?.id ||
    chat.createdByUserId ||
    chat.createdByOwnerId
  )?.toString();
  const isCreator = myIds.includes(createdById);

  const handleDeleteCommunity = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this community? This will permanently delete all associated groups and messages under this community."
      )
    ) {
      try {
        await deleteChat(chat._id).unwrap();
        onClose();
        window.location.reload();
      } catch (err) {
        console.error("Failed to delete community", err);
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (
      window.confirm(
        chat.isCommunity
          ? "Are you sure you want to leave this community?"
          : "Are you sure you want to leave this group?"
      )
    ) {
      try {
        const myIdToSend = user?._id || user?.id || user?.userId;
        await removeFromGroup({
          chatId: chat._id,
          userId: myIdToSend,
        }).unwrap();
        onClose(); // Close modal after leaving, ChatWindow might unmount because chat is no longer selected
        window.location.reload(); // Simple refresh to clear chat state
      } catch (err) {
        console.error("Failed to leave group", err);
      }
    }
  };

  const handleAddUser = async (userId) => {
    try {
      await addToGroup({ chatId: chat._id, userId }).unwrap();
    } catch (err) {
      console.error("Failed to add user", err);
    }
  };

  const handleMakeAdmin = async (userId) => {
    try {
      await makeAdmin({ chatId: chat._id, userId }).unwrap();
    } catch (err) {
      console.error("Failed to make admin", err);
    }
  };

  const handleDismissAdmin = async (userId) => {
    try {
      await dismissAdmin({ chatId: chat._id, userId }).unwrap();
    } catch (err) {
      console.error("Failed to dismiss admin", err);
    }
  };

  const connections = [
    ...(networkData?.followers || []),
    ...(networkData?.following || []),
  ].filter((v, i, a) => a.findIndex((t) => t._id === v._id) === i);

  const { data: chatData } = useGetChatsQuery();
  const childGroups = chat.isCommunity
    ? chatData?.chats?.filter(
        (g) =>
          g.parentCommunity === chat._id || g.parentCommunity?._id === chat._id
      )
    : [];

  // Users not currently in the group
  const availableUsers = connections.filter(
    (c) =>
      !chat.users?.some((u) => (u.user?._id || u.user) === c._id) &&
      !chat.pendingMembers?.some((p) => (p.user?._id || p.user) === c._id)
  );

  return (
    <>
      {/* Overlay to catch clicks outside the drawer on smaller screens if needed */}
      {isOpen && (
        <div className="absolute inset-0 bg-black/20 z-40" onClick={onClose} />
      )}

      {/* Sliding Drawer */}
      <div
        className={`absolute top-0 right-0 h-full w-full sm:w-[380px] bg-[#1A1A1A] border-l border-white/10 z-50 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header - WhatsApp Style */}
        <div className="bg-[#111111] border-b border-white/10 px-5 py-4 flex items-center gap-4 shrink-0 shadow-sm">
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <h2 className="text-base font-bold text-white tracking-wide">
            {chat.isCommunity ? "Community info" : "Group info"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Main Info Section (Avatar + Name) */}
          <div className="bg-[#111111] py-8 px-6 flex flex-col items-center mb-2 shadow-sm">
            <div className="w-40 h-40 rounded-full border border-white/5 bg-[#BFF367]/10 flex items-center justify-center mb-6 overflow-hidden">
              {chat.groupImage ? (
                <img
                  src={chat.groupImage}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <svg
                  className="w-20 h-20 text-[#BFF367] opacity-80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              )}
            </div>

            {isEditingName ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2 border-b-2 border-[#BFF367] pb-1">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="flex-1 bg-transparent text-white text-lg font-medium outline-none"
                    autoFocus
                  />
                  <span className="text-white/30 text-sm">
                    {25 - groupName.length}
                  </span>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="text-white/40 hover:text-white/80 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRename}
                    className="bg-[#BFF367] text-black px-4 py-1.5 rounded-full text-sm font-bold shadow-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center group/edit">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-medium text-white">
                    {chat.chatName}
                  </h3>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-white/20 group-hover/edit:text-white/60 hover:!text-[#BFF367] transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-white/40 text-sm mt-1">
                  {chat.users?.length}{" "}
                  {chat.isCommunity ? "members" : "participants"}
                </p>
                {chat.description && (
                  <p className="text-white/60 text-sm mt-4 text-center px-4 leading-relaxed">
                    {chat.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Groups in this community */}
          {chat.isCommunity && childGroups?.length > 0 && (
            <div className="bg-[#111111] py-4 px-6 mb-2 shadow-sm space-y-4">
              <h4 className="text-[13px] font-medium text-[#BFF367]">
                Groups in this community
              </h4>
              <div className="space-y-3">
                {childGroups.map((group) => (
                  <div
                    key={group._id}
                    className="flex items-center gap-3 p-2 hover:bg-white/[0.03] rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center shrink-0 overflow-hidden">
                      {group.groupImage ? (
                        <img
                          src={group.groupImage}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <svg
                          className="w-5 h-5 text-white/30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-[15px] font-medium leading-tight">
                        {group.chatName}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {group.users?.length} participants
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parent Community Info */}
          {chat.parentCommunity && (
            <div className="bg-[#111111] py-4 px-6 mb-2 shadow-sm">
              <h4 className="text-[13px] font-medium text-white/50 mb-3">
                Parent Community
              </h4>
              <div className="flex items-center gap-3 bg-[#1A1A1A] p-3 rounded-[8px] border border-white/5">
                <div className="w-10 h-10 rounded-full bg-[#BFF367]/10 flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-[#BFF367]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-[15px] font-medium leading-tight">
                    {typeof chat.parentCommunity === "object"
                      ? chat.parentCommunity.chatName
                      : "Community"}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">
                    Parent of this group
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Add Members Section (Admin only) */}
          {isAdmin && availableUsers.length > 0 && (
            <div className="bg-[#111111] py-4 px-6 mb-2 shadow-sm space-y-4">
              <h4 className="text-[13px] font-medium text-[#BFF367]">
                {chat.isCommunity ? "Add Members" : "Add Participants"}
              </h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search your network..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1A1A1A] border-none rounded-lg pl-10 pr-4 py-2.5 text-white outline-none text-sm placeholder:text-white/30"
                />
                <svg
                  className="w-4 h-4 text-white/30 absolute left-3.5 top-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar -mx-2 px-2">
                {availableUsers
                  .filter((u) =>
                    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((user) => (
                    <div
                      key={user._id}
                      onClick={() => {
                        navigate(`/profile/${user._id}`);
                        onClose();
                      }}
                      className="flex justify-between items-center hover:bg-white/[0.03] p-2 rounded-lg cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.profilePicture ||
                            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                          }
                          className="w-10 h-10 rounded-full object-cover"
                          alt=""
                        />
                        <div>
                          <p className="text-white text-[15px] font-medium leading-tight">
                            {user.name}
                          </p>
                          <p className="text-white/40 text-xs mt-0.5">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddUser(user._id);
                        }}
                        className="text-[#BFF367] opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-[#BFF367]/10 transition-all"
                        title="Add"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Participants List */}
          <div className="bg-[#111111] py-4 shadow-sm mb-2">
            <h4 className="text-[13px] font-medium text-white/50 px-6 mb-3">
              {chat.users?.length || 0}{" "}
              {chat.isCommunity ? "members" : "participants"}
            </h4>

            <div className="flex flex-col">
              {/* Active Members */}
              {chat.users?.map((u, i) => {
                const uid = u.user?._id || u.user;
                const isThisAdmin = chat.groupAdmins?.some((admin) => {
                  const adminId = (admin.user?._id || admin.user)?.toString();
                  return adminId === uid.toString();
                });
                const isMe = myIds.includes(uid);

                return (
                  <div
                    key={`active-${uid}-${i}`}
                    onClick={() => {
                      navigate(`/profile/${uid}`);
                      onClose();
                    }}
                    className="flex justify-between items-center hover:bg-white/[0.03] px-6 py-3 cursor-pointer transition-colors group/member"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center overflow-hidden shrink-0">
                        {u.user?.profilePicture ? (
                          <img
                            src={u.user.profilePicture}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <svg
                            className="w-5 h-5 text-white/30"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-white text-[15px] leading-tight">
                          {isMe ? "You" : u.user?.name || "Unknown"}
                        </p>
                        <p className="text-white/40 text-[13px] leading-tight mt-0.5">
                          {u.user?.bio || u.user?.username || "Available"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isThisAdmin && (
                        <span className="border border-[#BFF367]/40 text-[#BFF367] text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm">
                          {chat.isCommunity ? "Community Admin" : "Group Admin"}
                        </span>
                      )}
                      {isAdmin && !isThisAdmin && !isMe && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/member:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMakeAdmin(uid);
                            }}
                            className="text-[#BFF367] hover:bg-[#BFF367]/10 p-1.5 rounded-full transition-all"
                            title="Make Admin"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(uid);
                            }}
                            className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-full transition-all"
                            title="Remove member"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                      {isAdmin && isThisAdmin && !isMe && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismissAdmin(uid);
                          }}
                          className="text-white/40 opacity-0 group-hover/member:opacity-100 hover:bg-white/10 p-1.5 rounded-full transition-all"
                          title="Dismiss Admin"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pending Members */}
              {chat.pendingMembers?.length > 0 && (
                <>
                  <div className="w-full h-px bg-white/5 my-2"></div>
                  <h4 className="text-[13px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-[#BFF367]/80 to-[#BFF367]/80 px-6 my-2">
                    {chat.pendingMembers.length} pending invites
                  </h4>
                  {chat.pendingMembers.map((u, i) => {
                    const uid = u.user?._id || u.user;
                    return (
                      <div
                        key={`pending-${uid}-${i}`}
                        className="flex justify-between items-center hover:bg-white/[0.03] px-6 py-3 transition-colors opacity-70 group/pending"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-dashed border-white/20 bg-transparent flex items-center justify-center shrink-0">
                            <svg
                              className="w-4 h-4 text-white/30"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <div className="flex flex-col justify-center">
                            <p className="text-white/80 text-[15px] leading-tight">
                              {u.user?.name || "Pending User"}
                            </p>
                            <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#BFF367]/60 to-[#BFF367]/60 text-[11px] leading-tight mt-0.5">
                              Invite sent
                            </p>
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleRemove(uid)}
                            className="text-red-400 opacity-0 group-hover/pending:opacity-100 hover:bg-red-500/10 p-1.5 rounded-full transition-all"
                            title="Cancel Invite"
                          >
                            <svg
                              className="w-4 h-4"
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
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-[#111111] py-2 shadow-sm mb-10">
            {chat.isCommunity && isCreator ? (
              <button
                onClick={handleDeleteCommunity}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.03] text-[#EF4444] transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="text-[15px] font-medium tracking-wide">
                  Delete Community
                </span>
              </button>
            ) : (
              <button
                onClick={handleLeaveGroup}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/[0.03] text-[#EF4444] transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="text-[15px] font-medium tracking-wide">
                  {chat.isCommunity ? "Leave Community" : "Exit group"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupInfoModal;
