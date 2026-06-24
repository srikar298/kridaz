import React, { useState, useEffect, useRef } from "react";
import {
  useGetChatsQuery,
  useRespondToInvitationMutation,
  useTogglePinChatMutation,
  useDeleteChatMutation,
  useRemoveFromGroupMutation,
  transformMessage,
  useAccessChatMutation,
} from "@redux/api/chatApi";
import { useLazySearchPlayersQuery } from "@redux/api/teamApi";
import { useSelector } from "react-redux";
import { useSocket } from "@context/SocketContext";
import {
  MessageSquare,
  Plus,
  Users,
  AlertCircle,
  Loader2,
  CheckCheck,
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
  ChevronDown,
  Megaphone,
  Crown,
  Search,
} from "lucide-react";
import ConfirmModal from "@components/modals/ConfirmModal";
import AddGroupToCommunityModal from "./AddGroupToCommunityModal";
import ManageCommunityAdminsModal from "./ManageCommunityAdminsModal";import { Button, Input } from "@kridaz/ui";


const ChatSidebar = ({
  onSelectChat,
  selectedChatId,
  onCreateGroup,
  onCreateCommunity,
  onEditProfile,
  onChatDeleted,
}) => {
  const { user } = useSelector((state) => state.auth);
  const { data, isLoading, error, refetch } = useGetChatsQuery();
  const [respondToInvitation] = useRespondToInvitationMutation();
  const { socket, isUserOnline } = useSocket();
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingChats, setTypingChats] = useState({});
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const addMenuRef = useRef(null);
  const menuRef = useRef(null);

  const [togglePinChat] = useTogglePinChatMutation();
  const [deleteChatMutation] = useDeleteChatMutation();
  const [removeFromGroup] = useRemoveFromGroupMutation();

  const [expandedCommunities, setExpandedCommunities] = useState({});
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);

  const [isManageAdminsOpen, setIsManageAdminsOpen] = useState(false);
  const [selectedCommunityForAdmins, setSelectedCommunityForAdmins] =
    useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [triggerSearchPlayers, { data: searchData, isFetching: isSearching }] =
    useLazySearchPlayersQuery();
  const [accessChat, { isLoading: isAccessingChat }] = useAccessChatMutation();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery.trim() !== "") {
      triggerSearchPlayers({ query: debouncedQuery, page: 1, limit: 20 });
    }
  }, [debouncedQuery, triggerSearchPlayers]);

  const handleSearchResultClick = async (userId) => {
    try {
      const chat = await accessChat(userId).unwrap();
      setSearchQuery("");
      setDebouncedQuery("");
      onSelectChat(chat);
    } catch (err) {
      console.error("Failed to start chat", err);
    }
  };

  const handleOpenManageAdmins = (community, event) => {
    if (event) event.stopPropagation();
    setSelectedCommunityForAdmins(community);
    setIsManageAdminsOpen(true);
  };

  const isCommunityAdmin = (communityChat) => {
    const myId = (user?._id || user?.id || user?.userId)?.toString();

    // Check direct creator IDs from database
    const creatorUserId = communityChat.createdByUserId?.toString();
    const creatorOwnerId = communityChat.createdByOwnerId?.toString();
    if (creatorUserId === myId || creatorOwnerId === myId) return true;

    const creatorId = (
      communityChat.createdBy?.user?._id ||
      communityChat.createdBy?.user ||
      communityChat.createdBy
    )?.toString();
    if (creatorId === myId) return true;

    const isGroupAdmin = communityChat.groupAdmins?.some((admin) => {
      const adminId = (admin.user?._id || admin.user)?.toString();
      return adminId === myId;
    });
    if (isGroupAdmin) return true;

    const adminSingleId = (
      communityChat.groupAdmin?._id ||
      communityChat.groupAdmin?.user?._id ||
      communityChat.groupAdmin
    )?.toString();
    if (adminSingleId === myId) return true;

    return false;
  };

  const getCommunityTotalUnread = (communityId) => {
    let total = unreadCounts[communityId] || 0;
    chats.forEach((c) => {
      if (
        (c.parentCommunity === communityId ||
          c.parentCommunity?._id === communityId) &&
        !c.isCommunity
      ) {
        total += unreadCounts[c._id] || 0;
      }
    });
    return total;
  };

  const handleOpenAddGroup = (communityId, event) => {
    event.stopPropagation();
    setSelectedCommunityId(communityId);
    setIsAddGroupModalOpen(true);
  };

  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const openConfirmModal = (title, message, onConfirm) => {
    setConfirmModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setIsAddMenuOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for incoming messages to bump unread count
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const transformed = transformMessage(newMessage);
      const chatId =
        transformed.chat?._id || transformed.chat?.id || transformed.chat;
      // If this chat is not currently selected, increment unread
      if (chatId && chatId !== selectedChatId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));
      }
      // Refetch chat list to update latest message preview
      refetch();
    };

    const handleTyping = (room) => {
      setTypingChats((prev) => ({ ...prev, [room]: true }));
    };

    const handleStopTyping = (room) => {
      setTypingChats((prev) => ({ ...prev, [room]: false }));
    };

    const handleChatUpdated = () => {
      refetch();
    };

    const handleChatDeleted = (deletedChatId) => {
      refetch();
      if (selectedChatId === deletedChatId && onChatDeleted) {
        onChatDeleted();
      }
    };

    const handleProfileUpdated = () => {
      refetch();
    };

    socket.on("message recieved", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);
    socket.on("chat updated", handleChatUpdated);
    socket.on("chat deleted", handleChatDeleted);
    socket.on("user profile updated", handleProfileUpdated);

    return () => {
      socket.off("message recieved", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
      socket.off("chat updated", handleChatUpdated);
      socket.off("chat deleted", handleChatDeleted);
      socket.off("user profile updated", handleProfileUpdated);
    };
  }, [socket, selectedChatId, refetch]);

  // Clear unread count when a chat is selected
  useEffect(() => {
    if (selectedChatId) {
      setUnreadCounts((prev) => ({ ...prev, [selectedChatId]: 0 }));
    }
  }, [selectedChatId]);

  const getChatName = (chat) => {
    if (chat.isGroupChat) return chat.chatName;
    const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
    const otherUser = chat.users?.find((u) => {
      const uid = u.user?._id || u.user;
      return !myIds.includes(uid);
    });
    return otherUser?.user?.name || "Unknown User";
  };

  const getChatOtherUser = (chat) => {
    if (chat.isGroupChat) return null;
    const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
    // Try matching by IDs
    const byId = chat.users?.find((u) => {
      const uid = u.user?._id || u.user;
      return !myIds.includes(uid);
    })?.user;
    if (byId) return byId;
    // Fallback: match by name
    const byName = chat.users?.find((u) => u.user?.name !== user?.name)?.user;
    return byName || null;
  };

  const getChatImage = (chat) => {
    if (chat.isGroupChat) return null;
    const otherUser = getChatOtherUser(chat);
    return otherUser?.profilePicture || otherUser?.profileImage;
  };

  const renderAvatar = (chat) => {
    const otherUser = getChatOtherUser(chat);
    const online = otherUser?._id ? isUserOnline(otherUser._id) : false;

    const getInitials = (name) => {
      if (!name) return "?";
      return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    if (chat.isGroupChat) {
      const groupImg = chat.groupImage;
      return (
        <div className="relative">
          <div className="w-10 h-10 rounded-full border border-white/5 bg-primary/10 flex items-center justify-center overflow-hidden shadow-lg">
            {groupImg ? (
              <img
                src={groupImg}
                className="w-full h-full object-cover"
                alt={chat.chatName}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5"
              style={{ display: groupImg ? "none" : "flex" }}
            >
              <Users size={19} className="text-primary opacity-80" />
            </div>
          </div>
        </div>
      );
    }

    const imageUrl = otherUser?.profilePicture || otherUser?.profileImage;

    return (
      <div className="relative">
        <div className="w-10 h-10 rounded-full border border-white/5 bg-white/5 flex items-center justify-center overflow-hidden shadow-lg group-hover/chat:border-primary/30 transition-all">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={otherUser?.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextElementSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5"
            style={{ display: imageUrl ? "none" : "flex" }}
          >
            <span className="text-primary font-bold text-xs tracking-tighter">
              {getInitials(otherUser?.name)}
            </span>
          </div>
        </div>
        {/* Online dot */}
        {online && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full border-[3px] border-card shadow-sm animate-pulse" />
        )}
      </div>
    );
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const oneDay = 86400000;

    if (diff < oneDay && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diff < 2 * oneDay) return "Yesterday";
    return date.toLocaleDateString([], {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const handleRespond = async (chatId, status) => {
    try {
      await respondToInvitation({ chatId, status }).unwrap();
    } catch (err) {
      console.error("Failed to respond to invitation:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full md:w-[340px] h-full border-r border-white/5 bg-black flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4 opacity-20" />
        <p className="chat-subheading text-white/20 font-bold uppercase">
          Loading Chats
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full md:w-[340px] h-full border-r border-white/5 bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-white font-bold mb-2">Sync Failed</h3>
        <p className="chat-subheading text-white/40 mb-6">
          We couldn't load your conversations. Please try again.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-[8px] text-xs font-bold transition-all"
        >
          Retry
        </Button>
      </div>
    );
  }

  const chats = data?.chats || [];
  const invitations = data?.invitations || [];

  return (
    <div className="w-full md:w-[340px] h-full border-r border-white/5 bg-black flex flex-col overflow-hidden">
      <div className="p-3 border-b border-white/5 flex justify-between items-center bg-background">
        <div>
          <h2 className="text-xs font-bold text-white/50 tracking-widest uppercase font-sans">
            Messages
          </h2>
        </div>
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className={`w-10 h-10 ${isAddMenuOpen ? "bg-primary text-black" : "bg-primary/10 text-primary"} hover:bg-primary hover:text-black rounded-[8px] transition-all flex items-center justify-center group outline-none`}
            title="Add New"
          >
            <Plus
              size={20}
              className={`${isAddMenuOpen ? "rotate-45" : ""} transition-transform duration-300 group-hover:text-black`}
            />
          </button>

          {isAddMenuOpen && (
            <div className="absolute right-0 top-12 w-56 bg-card border border-white/5 rounded-[8px] shadow-2xl py-2 z-50 animate-scale-up overflow-hidden">
              <Button
                onClick={() => {
                  setIsAddMenuOpen(false);
                  onCreateGroup();
                }}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/[0.04] flex items-center gap-3 transition-colors group/menu"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center text-primary group-hover/menu:border-primary/40">
                  <Users size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white">Create Group</span>
                  <span className="text-[10px] text-white/45">
                    Chat with multiple people
                  </span>
                </div>
              </Button>

              <Button
                onClick={() => {
                  setIsAddMenuOpen(false);
                  // Trigger community creation
                  if (typeof onCreateCommunity === "function")
                    onCreateCommunity();
                }}
                className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/[0.04] flex items-center gap-3 transition-colors group/menu"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center text-primary group-hover/menu:border-primary/40">
                  <MessageSquare size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white">Create Community</span>
                  <span className="text-[10px] text-white/45">
                    Organize related groups
                  </span>
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-b border-white/5 bg-background">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <Input
            type="text"
            placeholder="Search members to message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-[8px] pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {searchQuery.trim() !== "" ? (
          <div className="p-3 space-y-2">
            <h3 className="px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
              Search Results
            </h3>
            {isSearching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            ) : searchData?.players?.length > 0 ? (
              searchData.players.map((player) => (
                <Button
                  key={player._id || player.id}
                  onClick={() =>
                    handleSearchResultClick(player._id || player.id)
                  }
                  disabled={isAccessingChat}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-[8px] hover:bg-white/[0.03] transition-all text-left"
                >
                  <img
                    src={
                      player.profilePicture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=111111&color=BFF367&bold=true`
                    }
                    className="w-10 h-10 rounded-full object-cover border border-white/5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-white truncate">
                      {player.name}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      @{player.username}
                    </p>
                  </div>
                </Button>
              ))
            ) : (
              <div className="text-center py-4 text-white/40 text-sm">
                No members found.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Invitations Section */}
            {invitations.length > 0 && (
              <div className="p-3 space-y-2">
                <h3 className="px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Pending Invitations
                </h3>
                {invitations.map((chat) => (
                  <div
                    key={chat._id}
                    className="bg-white/[0.03] border border-white/5 rounded-[8px] p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full border border-white/5 bg-white/5 flex items-center justify-center overflow-hidden">
                        {getChatImage(chat) ? (
                          <img
                            src={getChatImage(chat)}
                            alt={chat.chatName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users size={18} className="text-white/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-base truncate">
                          {chat.chatName}
                        </p>
                        <p className="chat-subheading text-white/40 font-medium uppercase">
                          Group Invitation
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRespond(chat._id, "accepted")}
                        className="flex-1 h-9 bg-primary text-black text-[10px] font-bold uppercase tracking-widest rounded-[8px] hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleRespond(chat._id, "rejected")}
                        className="flex-1 h-9 bg-white/5 text-white text-[10px] font-bold uppercase tracking-widest rounded-[8px] hover:bg-white/10 transition-all"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* All Chats Section */}
            <div className="px-2 py-3 space-y-2.5">
              {chats
                .filter((chat) => !chat.parentCommunity)
                .sort((a, b) => {
                  const myId = user?._id || user?.id || user?.userId;
                  const aPinned = a.pinnedBy?.includes(myId) ? 1 : 0;
                  const bPinned = b.pinnedBy?.includes(myId) ? 1 : 0;
                  if (aPinned !== bPinned) return bPinned - aPinned;
                  return 0;
                })
                .map((chat) => {
                  const myId = user?._id || user?.id || user?.userId;
                  const unreadCount = unreadCounts[chat._id] || 0;
                  const isTypingInChat = typingChats[chat._id];
                  const isSelected = selectedChatId === chat._id;
                  const isPinned = chat.pinnedBy?.includes(myId);
                  const latestSenderId =
                    chat.latestMessage?.sender?.user?._id ||
                    chat.latestMessage?.sender?.user;
                  const latestSenderName =
                    chat.latestMessage?.sender?.user?.name ||
                    chat.latestMessage?.sender?.name;
                  const isMySentMessage =
                    [myId].includes(latestSenderId) ||
                    (latestSenderName && latestSenderName === user?.name);
                  const isExpanded = !!expandedCommunities[chat._id];
                  const childGroups = chat.isCommunity
                    ? chats.filter(
                        (c) =>
                          (c.parentCommunity === chat._id ||
                            c.parentCommunity?._id === chat._id) &&
                          !c.isCommunity
                      )
                    : [];
                  const isChildSelected =
                    chat.isCommunity &&
                    childGroups.some((c) => selectedChatId === c._id);

                  return (
                    <div key={chat._id} className="relative group/chat">
                      <div className="relative">
                        <button
                          onClick={() => {
                            if (chat.isCommunity) {
                              const announcementGroup = chats.find(
                                (c) =>
                                  (c.parentCommunity === chat._id ||
                                    c.parentCommunity?._id === chat._id) &&
                                  (c.isAnnouncementGroup ||
                                    c.chatName === "Announcements")
                              );
                              if (announcementGroup) {
                                onSelectChat(announcementGroup);
                              } else {
                                onSelectChat(chat);
                              }
                            } else {
                              onSelectChat(chat);
                            }
                          }}
                          className={`w-full h-auto min-h-[4.5rem] flex items-center gap-3 px-3 py-4 rounded-[8px] transition-all outline-none text-left ${chat.isCommunity ? "pr-20" : "pr-12"} ${isSelected || (chat.isCommunity && isChildSelected) ? "bg-primary/10 border border-primary/20" : "hover:bg-white/[0.03] border border-transparent"}`}
                        >
                          <div className="relative shrink-0">
                            {renderAvatar(chat)}
                            {chat.isCommunity ? (
                              <div className="absolute -bottom-1 -right-1 bg-primary text-black text-[6px] px-1 py-0.5 rounded font-bold uppercase">
                                Com
                              </div>
                            ) : chat.isGroupChat ? (
                              <div className="absolute -bottom-1 -right-1 bg-primary text-black text-[6px] px-1 py-0.5 rounded font-bold uppercase">
                                Grp
                              </div>
                            ) : null}
                          </div>
                          <div className="flex-1 text-left overflow-hidden min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p
                                  className={`font-bold truncate text-sm transition-colors ${isSelected || (chat.isCommunity && isChildSelected) ? "text-primary" : unreadCount > 0 ? "text-white" : "text-white/80 group-hover/chat:text-white"}`}
                                >
                                  {isPinned && (
                                    <Pin
                                      size={10}
                                      className="inline mr-1 text-primary"
                                    />
                                  )}
                                  {getChatName(chat)}
                                </p>
                              </div>
                              <span
                                className={`text-[10px] font-medium shrink-0 ml-2 ${unreadCount > 0 ? "text-primary" : "text-white/20"}`}
                              >
                                {chat.latestMessage
                                  ? formatTime(chat.latestMessage.createdAt)
                                  : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                {isMySentMessage && !isTypingInChat && (
                                  <CheckCheck
                                    size={14}
                                    className="text-primary/40 shrink-0"
                                  />
                                )}
                                <p
                                  className={`text-xs truncate ${isTypingInChat ? "text-primary font-medium italic" : isSelected ? "text-primary/80" : unreadCount > 0 ? "text-white/90 font-medium" : "text-white/60 group-hover:text-white/80"}`}
                                >
                                  {isTypingInChat
                                    ? "typing..."
                                    : chat.latestMessage
                                      ? chat.latestMessage.content
                                      : chat.isCommunity
                                        ? "Community Created"
                                        : "No messages yet"}
                                </p>
                              </div>
                              {unreadCount > 0 && (
                                <div className="shrink-0 min-w-[20px] h-5 bg-primary text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                                  {unreadCount > 99 ? "99+" : unreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Right Side Controls: Chevron (for Communities) & 3-Dot (always visible) */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                          {chat.isCommunity && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCommunities((prev) => ({
                                  ...prev,
                                  [chat._id]: !prev[chat._id],
                                }));
                              }}
                              className="text-white/60 hover:text-primary w-7 h-7 rounded-full hover:bg-white/10 transition-all flex items-center justify-center"
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              <ChevronDown
                                size={18}
                                className={`transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                              />
                            </Button>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(
                                activeMenu === chat._id ? null : chat._id
                              );
                            }}
                            className="text-white/45 hover:text-white w-7 h-7 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
                          >
                            <MoreVertical size={16} />
                          </Button>
                        </div>

                        {/* Dropdown Menu */}
                        {activeMenu === chat._id &&
                          (() => {
                            const isGroupAdmin =
                              chat.isGroupChat &&
                              chat.groupAdmins?.some((admin) => {
                                const adminId = (
                                  admin.user?._id || admin.user
                                )?.toString();
                                return adminId === myId;
                              });

                            const creatorId = (
                              chat.createdBy?.user?._id ||
                              chat.createdBy?.user ||
                              chat.createdBy ||
                              chat.createdByUserId ||
                              chat.createdByOwnerId
                            )?.toString();
                            const isCreator =
                              creatorId === myId ||
                              chat.createdByUserId?.toString() === myId ||
                              chat.createdByOwnerId?.toString() === myId;

                            const handleDelete = async () => {
                              setActiveMenu(null);
                              try {
                                await deleteChatMutation(chat._id).unwrap();
                                if (selectedChatId === chat._id)
                                  onChatDeleted?.();
                              } catch (err) {
                                console.error("Delete failed:", err);
                                alert(err.data?.message || "Failed to delete");
                              }
                            };

                            const handleExit = async () => {
                              setActiveMenu(null);
                              try {
                                await removeFromGroup({
                                  chatId: chat._id,
                                  userId: myId,
                                }).unwrap();
                                if (selectedChatId === chat._id)
                                  onChatDeleted?.();
                              } catch (err) {
                                console.error("Exit failed:", err);
                                alert(err.data?.message || "Failed to exit");
                              }
                            };

                            return (
                              <div
                                ref={menuRef}
                                className="absolute right-2 top-10 w-44 bg-card border border-white/5 rounded-[8px] shadow-2xl py-1.5 z-50 animate-scale-up"
                              >
                                {/* Pin / Unpin */}
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePinChat({ chatId: chat._id });
                                    setActiveMenu(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 flex items-center gap-2.5 transition-colors"
                                >
                                  {isPinned ? (
                                    <PinOff size={14} />
                                  ) : (
                                    <Pin size={14} />
                                  )}
                                  {isPinned ? "Unpin chat" : "Pin chat"}
                                </Button>

                                {/* --- 1-on-1 Chat: just Delete --- */}
                                {!chat.isGroupChat && (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenu(null);
                                      openConfirmModal(
                                        "Delete Chat",
                                        "Are you sure you want to delete this entire conversation?",
                                        handleDelete
                                      );
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Trash2 size={14} /> Delete chat
                                  </Button>
                                )}

                                {/* --- Group (not community): Leave or Delete --- */}
                                {chat.isGroupChat && !chat.isCommunity && (
                                  <>
                                    {!(isCreator || isGroupAdmin) ? (
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenu(null);
                                          openConfirmModal(
                                            "Leave Group",
                                            "Are you sure you want to leave this group?",
                                            handleExit
                                          );
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors font-bold"
                                      >
                                        <svg
                                          className="w-3.5 h-3.5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                          />
                                        </svg>
                                        Leave group
                                      </Button>
                                    ) : (
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenu(null);
                                          openConfirmModal(
                                            "Delete Group",
                                            "Permanently delete this group and all messages for everyone?",
                                            handleDelete
                                          );
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-red-500 font-bold hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                                      >
                                        <Trash2 size={14} /> Delete group
                                      </Button>
                                    )}
                                  </>
                                )}

                                {/* --- Community: Exit + Delete --- */}
                                {chat.isCommunity && (
                                  <>
                                    {isCommunityAdmin(chat) && (
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenu(null);
                                          handleOpenAddGroup(chat._id, e);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-primary hover:text-black flex items-center gap-2.5 transition-colors font-bold"
                                      >
                                        <Plus size={14} /> Add group
                                      </Button>
                                    )}
                                    {isCommunityAdmin(chat) && (
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenu(null);
                                          handleOpenManageAdmins(chat, e);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-primary hover:text-black flex items-center gap-2.5 transition-colors font-bold"
                                      >
                                        <Crown size={14} /> Manage admins
                                      </Button>
                                    )}
                                    {!isCreator ? (
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenu(null);
                                          openConfirmModal(
                                            "Leave Community",
                                            "Are you sure you want to leave this community? You will be removed from all its sub-groups as well.",
                                            handleExit
                                          );
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors font-bold"
                                      >
                                        <svg
                                          className="w-3.5 h-3.5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                          />
                                        </svg>
                                        Leave community
                                      </Button>
                                    ) : (
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenu(null);
                                          openConfirmModal(
                                            "Delete Community",
                                            "Permanently delete this community and ALL its groups and messages for everyone?",
                                            handleDelete
                                          );
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-red-500 font-bold hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                                      >
                                        <Trash2 size={14} /> Delete community
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })()}
                      </div>

                      {/* Community Sub-groups Dropdown */}
                      {chat.isCommunity && isExpanded && (
                        <div className="pl-4 pr-2 pb-2 mt-1 space-y-1 ml-6 border-l border-white/5 animate-fade-in">
                          {childGroups.map((group) => {
                            const isGroupSelected =
                              selectedChatId === group._id;
                            const isAnnouncement =
                              group.isAnnouncementGroup ||
                              group.chatName === "Announcements";
                            const childUnreadCount =
                              unreadCounts[group._id] || 0;

                            return (
                              <Button
                                key={group._id}
                                onClick={() => onSelectChat(group)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] transition-all ${isGroupSelected ? "bg-primary/10 text-primary border border-primary/20" : "text-white/60 hover:text-white hover:bg-white/[0.03] border border-transparent"}`}
                              >
                                {isAnnouncement ? (
                                  <Megaphone
                                    size={13}
                                    className="text-primary shrink-0"
                                  />
                                ) : (
                                  <Users
                                    size={13}
                                    className="text-white/40 shrink-0"
                                  />
                                )}
                                <span className="text-xs font-bold truncate flex-1 text-left">
                                  {group.chatName}
                                </span>
                                {childUnreadCount > 0 && (
                                  <div className="shrink-0 min-w-[16px] h-4 bg-primary text-black text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                                    {childUnreadCount}
                                  </div>
                                )}
                              </Button>
                            );
                          })}
                          {isCommunityAdmin(chat) && (
                            <Button
                              onClick={(e) => handleOpenAddGroup(chat._id, e)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-[8px] border border-dashed border-white/5 hover:border-primary/30 hover:bg-primary/5 text-white/40 hover:text-primary transition-all text-xs font-bold mt-1"
                            >
                              <Plus size={14} className="shrink-0" />
                              <span>Add more group</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() =>
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
      <AddGroupToCommunityModal
        isOpen={isAddGroupModalOpen}
        onClose={() => {
          setIsAddGroupModalOpen(false);
          setSelectedCommunityId(null);
        }}
        communityId={selectedCommunityId}
      />
      <ManageCommunityAdminsModal
        isOpen={isManageAdminsOpen}
        onClose={() => {
          setIsManageAdminsOpen(false);
          setSelectedCommunityForAdmins(null);
        }}
        community={selectedCommunityForAdmins}
        allChats={chats}
      />
    </div>
  );
};

export default ChatSidebar;
