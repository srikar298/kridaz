import React, { useState, useEffect, useRef } from "react";
import {
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessagesReadMutation,
  useRemoveFromGroupMutation,
  useDeleteMessagesMutation,
  useDeleteChatMutation,
  useGetChatsQuery,
  transformMessage,
} from "@redux/api/chatApi";
import { useSocket } from "@context/SocketContext";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import GroupInfoModal from "./GroupInfoModal";
import { Plus, Users, MessageSquare, Globe } from "lucide-react";
import AddGroupToCommunityModal from "./AddGroupToCommunityModal";
import { Button, Input } from "@kridaz/ui";


const ChatWindow = ({ chat, onBack, onSelectChat, prefillMessage }) => {
  const { user } = useSelector((state) => state.auth);
  const { socket, isUserOnline, getLastSeen } = useSocket();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [isAddGroupToCommunityOpen, setIsAddGroupToCommunityOpen] =
    useState(false);
  const scrollRef = useRef();
  const typingTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  const [removeFromGroup] = useRemoveFromGroupMutation();
  const [deleteMessages] = useDeleteMessagesMutation();
  const [deleteChatMutation] = useDeleteChatMutation();
  const { data: chatData } = useGetChatsQuery();

  const { data, isLoading } = useGetMessagesQuery(chat?._id, {
    skip: !chat?._id,
  });
  const [sendMessageMutation] = useSendMessageMutation();
  const [markMessagesReadMutation] = useMarkMessagesReadMutation();

  useEffect(() => {
    if (data) {
      setMessages(data);
    }
  }, [data]);

  useEffect(() => {
    if (prefillMessage && chat && !message) {
      setMessage(prefillMessage);
      const url = new URL(window.location);
      url.searchParams.delete('prefill');
      window.history.replaceState({}, '', url);
    }
  }, [prefillMessage, chat, message]);

  // Redirect community view to Announcements page automatically
  useEffect(() => {
    if (chat?.isCommunity && chatData?.chats && onSelectChat) {
      const announcementGroup = chatData.chats.find(
        (c) =>
          (c.parentCommunity === chat._id ||
            c.parentCommunity?._id === chat._id) &&
          (c.isAnnouncementGroup || c.chatName === "Announcements")
      );
      if (announcementGroup) {
        onSelectChat(announcementGroup);
      }
    }
  }, [chat, chatData, onSelectChat]);

  useEffect(() => {
    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chat]);

  // Notify server we've read messages when chat opens or new messages arrive
  useEffect(() => {
    if (socket && chat && messages.length > 0) {
      const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
      // Check if there are any messages not read by me
      const hasUnread = messages.some((m) => {
        if (!m.readBy) return true;
        return !m.readBy.some((r) => myIds.includes(r.user?._id || r.user));
      });

      if (hasUnread) {
        const myIdToSend = user?._id || user?.id;
        socket.emit("messages read", { chatId: chat._id, userId: myIdToSend });
        markMessagesReadMutation(chat._id).catch(console.error);
      }
    }
  }, [socket, chat?._id, messages, user, markMessagesReadMutation]);

  useEffect(() => {
    if (socket && chat) {
      socket.emit("join chat", chat._id);

      const handleNewMessage = (newMessage) => {
        const transformed = transformMessage(newMessage);
        const incomingChatId =
          transformed.chat?._id || transformed.chat?.id || transformed.chat;
        if (chat._id === incomingChatId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === transformed._id)) return prev;
            return [...prev, transformed];
          });
          // Mark as read immediately since chat is open
          socket.emit("messages read", {
            chatId: chat._id,
            userId: user?._id || user?.id,
          });
        }
      };

      const handleTyping = (room) => {
        if (room === chat._id) setShowTypingIndicator(true);
      };

      const handleStopTyping = (room) => {
        if (room === chat._id) setShowTypingIndicator(false);
      };

      const handleMessagesRead = ({ chatId, userId }) => {
        if (chatId === chat._id) {
          setMessages((prev) =>
            prev.map((m) => {
              // Add to readBy array if not already present
              const readByArray = m.readBy || [];
              const alreadyRead = readByArray.some(
                (r) => (r.user?._id || r.user) === userId
              );
              if (!alreadyRead) {
                return { ...m, readBy: [...readByArray, { user: userId }] };
              }
              return m;
            })
          );
        }
      };

      socket.on("message recieved", handleNewMessage);
      socket.on("typing", handleTyping);
      socket.on("stop typing", handleStopTyping);
      socket.on("messages read", handleMessagesRead);

      return () => {
        socket.off("message recieved", handleNewMessage);
        socket.off("typing", handleTyping);
        socket.off("stop typing", handleStopTyping);
        socket.off("messages read", handleMessagesRead);
      };
    }
  }, [socket, chat]);

  useEffect(() => {
    if (scrollRef.current && scrollRef.current.parentElement) {
      const parent = scrollRef.current.parentElement;
      // Use scrollTo instead of scrollIntoView to prevent entire page shifting
      parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
    }
  }, [messages, showTypingIndicator]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit("stop typing", chat._id);
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const messageContent = message;
    setMessage("");

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      id: tempId,
      content: messageContent,
      createdAt: new Date().toISOString(),
      sender: user,
      isOptimistic: true,
      chat: chat._id,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const data = await sendMessageMutation({
        chatId: chat._id,
        content: messageContent,
      }).unwrap();

      setMessages((prev) => prev.map((m) => (m._id === tempId ? data : m)));
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  const typingHandler = (e) => {
    setMessage(e.target.value);

    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", chat._id);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop typing", chat._id);
      setIsTyping(false);
    }, 1200);
  };

  const getChatOtherUser = () => {
    if (!chat || chat.isGroupChat) return null;
    // Match by _id, handling Owner/User polymorphism
    const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
    return chat.users?.find((u) => {
      const uid = u.user?._id || u.user;
      return !myIds.includes(uid);
    })?.user;
  };

  // Get "my" user entry from the chat to extract my ID in the chat context
  const getMyUserEntry = () => {
    if (!chat) return null;
    const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
    // First try matching by any of my IDs
    const byId = chat.users?.find((u) => {
      const uid = u.user?._id || u.user;
      return myIds.includes(uid);
    });
    if (byId) return byId;
    // Fallback: match by name (for Owner/User cross-model)
    return chat.users?.find((u) => u.user?.name === user?.name);
  };

  const getChatName = () => {
    if (chat.isGroupChat)
      return (
        chat.chatName ||
        (chat.isAnnouncementGroup ? "Announcements" : "Unnamed Group")
      );
    const otherUser = getChatOtherUser();
    return otherUser?.name || "Unknown User";
  };

  // Format last seen
  // Format status text (online/last seen)
  const getStatusText = () => {
    if (chat.isGroupChat) return `${chat.users?.length || 0} members`;

    const otherUser = getChatOtherUser();
    const otherId = otherUser?._id;
    if (!otherId) return "";

    if (isUserOnline(otherId)) return "online";

    // Try socket state first, then fallback to DB value
    const lastSeen = getLastSeen(otherId) || otherUser?.lastSeen;
    if (lastSeen) {
      const date = new Date(lastSeen);
      const now = new Date();

      const isToday = date.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();

      const timeStr = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (isToday) return `last seen today at ${timeStr}`;
      if (isYesterday) return `last seen yesterday at ${timeStr}`;

      return `last seen ${date.toLocaleDateString([], { day: "numeric", month: "short" })} at ${timeStr}`;
    }

    return "offline";
  };

  // Group messages by date
  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Determine sender ID from message object (handles nested and flat sender shapes)
  const getSenderId = (m) => {
    return m.sender?.user?._id || m.sender?.user || m.sender?._id || m.sender;
  };

  // Check if a message was sent by the current user
  const checkIsMine = (m) => {
    const senderId = getSenderId(m);
    const myIds = [user?._id, user?.id, user?.userId].filter(Boolean);
    // Direct ID match against any of my IDs
    if (myIds.includes(senderId)) return true;
    // Cross-model match: check if sender ID matches my chat entry
    const myEntry = getMyUserEntry();
    const myEntryId = myEntry?.user?._id || myEntry?.user;
    if (myEntryId && senderId === myEntryId) return true;
    // Name-based fallback for edge cases
    const senderName = m.sender?.user?.name || m.sender?.name;
    if (senderName && senderName === user?.name) return true;
    return false;
  };

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-white/40">
        <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 opacity-20"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </div>
        <p className="chat-heading text-sm font-bold uppercase text-white/20">
          Select a conversation
        </p>
        <p className="chat-subheading text-white/10 mt-1">to start chatting</p>
      </div>
    );
  }

  const otherUserObj = getChatOtherUser();
  const imageUrl = otherUserObj?.profilePicture || otherUserObj?.profileImage;
  const otherOnline = otherUserObj?._id
    ? isUserOnline(otherUserObj._id)
    : false;

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3 bg-background backdrop-blur-md sticky top-0 z-10">
        <Button
          onClick={onBack}
          className="md:hidden p-2 -ml-2 text-white/60 hover:text-white transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Button>

        {/* Avatar with online dot - clickable to profile/group info */}
        <div
          className="relative shrink-0 cursor-pointer"
          onClick={() => {
            if (chat.isGroupChat) {
              setIsGroupInfoOpen(true);
            } else if (otherUserObj?._id) {
              navigate(`/profile/${otherUserObj._id}`);
            }
          }}
        >
          <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-primary/10 flex items-center justify-center">
            {chat.isGroupChat ? (
              <svg
                className="w-5 h-5 text-primary"
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
            ) : (
              <>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={getChatName()}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling)
                        e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ display: imageUrl ? "none" : "flex" }}
                >
                  <span className="text-primary font-bold text-xs">
                    {otherUserObj?.name
                      ? otherUserObj.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "U"}
                  </span>
                </div>
              </>
            )}
          </div>
          {/* Online indicator dot */}
          {!chat.isGroupChat && otherOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
          )}
        </div>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => {
            if (chat.isGroupChat) {
              setIsGroupInfoOpen(true);
            } else if (otherUserObj?._id) {
              navigate(`/profile/${otherUserObj._id}`);
            }
          }}
        >
          <h3 className="text-white font-bold text-sm truncate hover:underline">
            {getChatName()}
          </h3>
          <p
            className={`text-[11px] transition-colors ${showTypingIndicator ? "text-primary font-medium" : otherOnline ? "text-green-400" : "text-white/40"}`}
          >
            {showTypingIndicator ? "typing..." : getStatusText()}
          </p>
        </div>

        {/* Header Actions (Search & Three Dots Dropdown) */}
        <div className="flex items-center gap-2 relative" ref={dropdownRef}>
          {chat.isCommunity && !isSelectionMode && (
            <Button
              onClick={() => setIsAddGroupToCommunityOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-black rounded-[6px] transition-all text-[11px] font-bold uppercase tracking-wider shadow-sm"
            >
              <Plus size={14} />
              <span>Add Group</span>
            </Button>
          )}
          {!isSelectionMode && (
            <Button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (isSearchOpen) setMessageSearchQuery("");
              }}
              className={`p-2 transition-colors rounded-full ${isSearchOpen ? "bg-white/[0.1] text-white" : "text-white/60 hover:text-white hover:bg-white/[0.05]"}`}
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Button>
          )}
          <Button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`p-2 transition-colors rounded-full ${isDropdownOpen ? "bg-white/[0.1] text-white" : "text-white/60 hover:text-white hover:bg-white/[0.05]"}`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" />
            </svg>
          </Button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-12 right-0 w-48 bg-card border border-white/5 rounded-[8px] shadow-xl py-2 z-50 animate-fade-in">
              <Button
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (chat.isGroupChat || chat.isCommunity)
                    setIsGroupInfoOpen(true);
                  else if (otherUserObj?._id)
                    navigate(`/profile/${otherUserObj._id}`);
                }}
                className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors"
              >
                {chat.isCommunity
                  ? "Community info"
                  : chat.isGroupChat
                    ? "Group info"
                    : "Contact info"}
              </Button>
              <Button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsSearchOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors"
              >
                Search
              </Button>
              <Button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsSelectionMode(true);
                  setSelectedMessages([]);
                }}
                className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors"
              >
                Select messages
              </Button>
              {chat.isCommunity && (
                <Button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsAddGroupToCommunityOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-white/[0.05] transition-colors"
                >
                  Add group to community
                </Button>
              )}
              <Button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onBack();
                }}
                className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors"
              >
                Close chat
              </Button>
              <Button
                onClick={() => {
                  setIsDropdownOpen(false);
                  alert("Clear chat functionality coming soon!");
                }}
                className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/[0.05] hover:text-white transition-colors"
              >
                Clear chat
              </Button>
              {chat.isCommunity && (
                <>
                  <Button
                    onClick={async () => {
                      setIsDropdownOpen(false);
                      if (
                        window.confirm(
                          "Are you sure you want to exit this community? This will remove you from all community groups."
                        )
                      ) {
                        try {
                          const myId = user?._id || user?.id || user?.userId;
                          await removeFromGroup({
                            chatId: chat._id,
                            userId: myId,
                          }).unwrap();
                          onBack();
                        } catch (err) {
                          console.error("Failed to exit community", err);
                        }
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/[0.05] transition-colors"
                  >
                    Exit community
                  </Button>
                  {(() => {
                    const myId = (
                      user?._id ||
                      user?.id ||
                      user?.userId
                    )?.toString();
                    const isAdmin = chat.groupAdmins?.some((admin) => {
                      const adminId = (
                        admin.user?._id || admin.user
                      )?.toString();
                      return adminId === myId;
                    });

                    return (
                      isAdmin && (
                        <Button
                          onClick={async () => {
                            setIsDropdownOpen(false);
                            if (
                              window.confirm(
                                "Are you sure you want to PERMANENTLY delete this community? All child groups and messages will be removed."
                              )
                            ) {
                              try {
                                await deleteChatMutation(chat._id).unwrap();
                                onBack();
                              } catch (err) {
                                console.error(
                                  "Failed to delete community",
                                  err
                                );
                                alert(
                                  "Failed to delete community: " +
                                    (err.data?.message || err.error)
                                );
                              }
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-white/[0.05] transition-colors"
                        >
                          Delete community
                        </Button>
                      )
                    );
                  })()}
                </>
              )}
              {chat.isGroupChat && !chat.isCommunity && (
                <Button
                  onClick={async () => {
                    setIsDropdownOpen(false);
                    if (
                      window.confirm(
                        "Are you sure you want to leave this group?"
                      )
                    ) {
                      try {
                        const myId = user?._id || user?.id || user?.userId;
                        await removeFromGroup({
                          chatId: chat._id,
                          userId: myId,
                        }).unwrap();
                        onBack();
                      } catch (err) {
                        console.error("Failed to leave group", err);
                      }
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-white/[0.05] transition-colors"
                >
                  Exit group
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contextual Action Bar for Selection Mode */}
      {isSelectionMode && (
        <div className="absolute top-0 left-0 right-0 h-[68px] bg-primary z-20 flex items-center justify-between px-4 shadow-lg animate-fade-in">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedMessages([]);
              }}
              className="p-2 text-white/80 hover:text-white transition-colors"
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
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
            <span className="chat-subheading text-white font-medium">
              {selectedMessages.length} selected
            </span>
          </div>
          {selectedMessages.length > 0 && (
            <Button
              onClick={() => setShowDeleteOptions(true)}
              className="p-2 text-black/60 hover:text-black hover:bg-black/10 rounded-full transition-colors"
              title="Delete selected messages"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          )}
        </div>
      )}

      {/* Inline Search Bar */}
      {isSearchOpen && (
        <div className="bg-background px-4 py-2 border-b border-white/5 flex items-center gap-3 shadow-md z-10 animate-fade-in relative">
          <div className="flex-1 bg-white/[0.05] rounded-lg flex items-center px-3 border border-white/5 focus-within:border-primary/40 transition-colors">
            <svg
              className="w-4 h-4 text-white/40"
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
            <Input
              type="text"
              autoFocus
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full bg-transparent border-none text-white text-sm py-2 px-3 focus:outline-none placeholder:text-white/30"
            />
            {messageSearchQuery && (
              <Button
                onClick={() => setMessageSearchQuery("")}
                className="text-white/40 hover:text-white"
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
              </Button>
            )}
          </div>
          <Button
            onClick={() => {
              setIsSearchOpen(false);
              setMessageSearchQuery("");
            }}
            className="text-white/60 hover:text-white text-sm font-medium"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {/* Scrollable Messages Content */}
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] z-0 flex flex-col px-2 py-4 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : (
            (() => {
              const filteredMessages = messageSearchQuery.trim()
                ? messages.filter((m) =>
                    m.content
                      .toLowerCase()
                      .includes(messageSearchQuery.toLowerCase())
                  )
                : messages;

              if (filteredMessages.length === 0) {
                if (messageSearchQuery.trim()) {
                  return (
                    <div className="flex flex-col items-center justify-center h-full text-white/40 mt-10">
                      <svg
                        className="w-12 h-12 mb-3 opacity-20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <p className="chat-subheading">
                        No messages found for "{messageSearchQuery}"
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col items-center justify-center h-full text-white/40 mt-10">
                    <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 opacity-20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="chat-subheading text-white/20">
                      No messages yet.
                    </p>
                    <p className="text-[11px] text-white/10 mt-1">
                      Start the conversation!
                    </p>
                  </div>
                );
              }

              return filteredMessages.map((m, i) => {
                const senderId = getSenderId(m);
                const isMine = checkIsMine(m);
                const prevMsg = messages[i - 1];
                const prevSenderId = prevMsg ? getSenderId(prevMsg) : null;
                const prevIsMine = prevMsg ? checkIsMine(prevMsg) : null;
                const showSender =
                  chat.isGroupChat && !isMine && senderId !== prevSenderId;
                const senderName = m.sender?.user?.name || m.sender?.name || "";

                // Date separator
                const currentDate = getDateLabel(m.createdAt);
                const prevDate = prevMsg
                  ? getDateLabel(prevMsg.createdAt)
                  : null;
                const showDateSeparator = currentDate !== prevDate;

                // Message grouping: reduce spacing between consecutive same-sender messages
                const isSameSender = prevSenderId === senderId;
                const isSameDirection = prevMsg && isMine === prevIsMine;

                // Check if message is read by the other person
                const myIds = [user?._id, user?.id, user?.userId].filter(
                  Boolean
                );
                const isRead =
                  m.readBy &&
                  m.readBy.some((r) => !myIds.includes(r.user?._id || r.user));

                return (
                  <React.Fragment key={m._id}>
                    {/* Date separator */}
                    {showDateSeparator && (
                      <div className="flex items-center justify-center py-3">
                        <span className="bg-white/[0.06] text-white/40 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/5">
                          {currentDate}
                        </span>
                      </div>
                    )}

                    <div
                      className={`w-full flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"} ${isSameDirection ? "mt-0.5" : "mt-3"}`}
                      onClick={() => {
                        if (isSelectionMode) {
                          setSelectedMessages((prev) =>
                            prev.includes(m._id)
                              ? prev.filter((id) => id !== m._id)
                              : [...prev, m._id]
                          );
                        }
                      }}
                    >
                      {/* Receiver Profile Picture */}
                      {!isMine && (
                        <div className="w-8 h-8 shrink-0 mb-1">
                          {!isSameDirection ? (
                            <img
                              src={
                                m.sender?.user?.profilePicture ||
                                m.sender?.user?.profileImage ||
                                `https://ui-avatars.com/api/?name=${senderName}&background=random`
                              }
                              alt=""
                              className="w-full h-full rounded-full object-cover shadow-md"
                            />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                      )}

                      <div
                        className={`flex flex-col relative ${isMine ? "items-end" : "items-start"} max-w-[85%] md:max-w-[65%] ${isSelectionMode ? "cursor-pointer pointer-events-none" : ""}`}
                      >
                        <div className="flex items-start group">
                          {/* Receiver Tail */}
                          {!isMine && !isSameDirection && (
                            <div className="absolute top-0 -left-1.5 text-primary/20">
                              <svg
                                viewBox="0 0 8 13"
                                width="8"
                                height="13"
                                fill="currentColor"
                              >
                                <path d="M2.812 1H8v11.193L1.533 3.568C.474 2.156 1.042 1 2.812 1z" />
                              </svg>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`relative px-3 py-1.5 shadow-md border bg-primary/10 border-primary/30 text-primary rounded-[8px] ${isMine ? (!isSameDirection ? "rounded-tr-none" : "") : !isSameDirection ? "rounded-tl-none" : ""}`}
                          >
                            <p className="text-[14.2px] leading-[19px] break-words whitespace-pre-wrap">
                              {m.content}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1 -mb-1 float-right ml-4 text-primary/60">
                              <span className="text-[11px]">
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isMine &&
                                (m.isOptimistic ? (
                                  <svg
                                    className="w-3 h-3 text-primary/60"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                  >
                                    <path
                                      d="M5 13l4 4L19 7"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    className={`w-4 h-[11px] ${isRead ? "text-[#34B7F1]" : "text-primary/60"}`}
                                    viewBox="0 0 20 12"
                                    fill="none"
                                  >
                                    <path
                                      d="M1 6l4 4L13 2"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M7 6l4 4L19 2"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      opacity={isRead ? "1" : "0.6"}
                                    />
                                  </svg>
                                ))}
                            </div>
                          </div>

                          {/* Sender Tail */}
                          {isMine && !isSameDirection && (
                            <div className="absolute top-0 -right-1.5 text-primary/20">
                              <svg
                                viewBox="0 0 8 13"
                                width="8"
                                height="13"
                                fill="currentColor"
                              >
                                <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selection Checkbox for Sent Messages */}
                      {isSelectionMode && isMine && (
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${selectedMessages.includes(m._id) ? "bg-primary border-primary" : "border-white/30"}`}
                        >
                          {selectedMessages.includes(m._id) && (
                            <svg
                              className="w-3 h-3 text-black"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              });
            })()
          )}

          {/* Typing indicator bubble */}
          {showTypingIndicator && (
            <div className="flex items-start mt-3">
              <div className="bg-white/[0.08] rounded-[8px] rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area */}
      {(() => {
        const myId = (user?._id || user?.id || user?.userId)?.toString();

        // Check if user is an admin of the current group
        const isAdmin =
          chat.groupAdmins?.some((admin) => {
            const adminId = (admin.user?._id || admin.user)?.toString();
            return adminId === myId;
          }) ||
          chat.createdByUserId?.toString() === myId ||
          chat.createdByOwnerId?.toString() === myId ||
          (
            chat.groupAdmin?._id ||
            chat.groupAdmin?.user?._id ||
            chat.groupAdmin ||
            chat.createdBy?.user?._id ||
            chat.createdBy?.user ||
            chat.createdBy
          )?.toString() === myId;

        // Check if user is admin of parent community for announcement groups
        let isParentCommunityAdmin = false;
        const isAnnouncement =
          chat.isAnnouncementGroup || chat.chatName === "Announcements";

        if (isAnnouncement && chat.parentCommunity) {
          // If parentCommunity is populated (object), use it directly
          const pChat =
            typeof chat.parentCommunity === "object" &&
            chat.parentCommunity !== null
              ? chat.parentCommunity
              : (chatData?.chats || chatData || [])?.find(
                  (c) => c._id === chat.parentCommunity.toString()
                );

          if (pChat) {
            isParentCommunityAdmin = pChat.groupAdmins?.some((admin) => {
              const adminId = (admin.user?._id || admin.user)?.toString();
              return adminId === myId;
            });

            // Also check if I'm the creator or admin of the parent community via direct IDs
            const parentCreatorId = (
              pChat.createdBy?.user?._id ||
              pChat.createdBy?.user ||
              pChat.createdBy ||
              pChat.createdByUserId ||
              pChat.createdByOwnerId
            )?.toString();
            if (
              parentCreatorId === myId ||
              pChat.createdByUserId?.toString() === myId ||
              pChat.createdByOwnerId?.toString() === myId
            ) {
              isParentCommunityAdmin = true;
            }
          }
        }

        const canMessage = isAnnouncement
          ? isAdmin || isParentCommunityAdmin
          : !chat.adminOnlyMessages || isAdmin || isParentCommunityAdmin;

        return canMessage ? (
          <form
            onSubmit={handleSendMessage}
            className="p-3 pb-8 md:pb-4 bg-background border-t border-white/5 z-10 relative"
          >
            <div className="flex items-center gap-2 bg-card border border-white/10 rounded-full px-4 py-1 focus-within:border-primary/40 transition-all shadow-sm">
              <Input
                type="text"
                value={message}
                onChange={typingHandler}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none text-white py-2.5 focus:ring-0 focus:outline-none text-sm placeholder:text-white/40"
              />
              <Button
                type="submit"
                disabled={!message.trim()}
                className="p-2 bg-primary text-black rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 disabled:bg-white/10 disabled:text-white/30"
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-6 pb-10 md:pb-6 bg-background border-t border-white/5 text-center relative z-10">
            <p className="text-xs text-primary/60 font-bold uppercase tracking-widest">
              Only admins can send messages to this group
            </p>
          </div>
        );
      })()}

      {isGroupInfoOpen && (
        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          chat={chat}
        />
      )}

      {isAddGroupToCommunityOpen && (
        <AddGroupToCommunityModal
          isOpen={isAddGroupToCommunityOpen}
          onClose={() => setIsAddGroupToCommunityOpen(false)}
          communityId={chat._id}
        />
      )}

      {showDeleteOptions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background backdrop-blur-sm"
            onClick={() => setShowDeleteOptions(false)}
          />
          <div className="bg-[#1e1e1e] border border-white/5 rounded-[8px] p-6 w-full max-w-sm relative z-10 shadow-2xl">
            <h3 className="text-white text-lg font-bold mb-4">
              Delete messages?
            </h3>
            <p className="chat-subheading text-white/60 mb-6">
              Delete {selectedMessages.length} selected message
              {selectedMessages.length > 1 ? "s" : ""}?
            </p>

            <div className="flex flex-col gap-2">
              <Button
                onClick={async () => {
                  try {
                    await deleteMessages({
                      messageIds: selectedMessages,
                      chatId: chat._id,
                      deleteType: "everyone",
                    }).unwrap();
                    setShowDeleteOptions(false);
                    setIsSelectionMode(false);
                    setSelectedMessages([]);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="w-full py-3 bg-primary text-black font-bold rounded-[8px] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Delete for everyone
              </Button>

              <Button
                onClick={async () => {
                  try {
                    await deleteMessages({
                      messageIds: selectedMessages,
                      chatId: chat._id,
                      deleteType: "me",
                    }).unwrap();
                    setShowDeleteOptions(false);
                    setIsSelectionMode(false);
                    setSelectedMessages([]);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="w-full py-3 bg-white/[0.05] text-white font-bold rounded-[8px] hover:bg-white/[0.1] transition-all"
              >
                Delete for me
              </Button>

              <Button
                onClick={() => setShowDeleteOptions(false)}
                className="w-full py-3 text-white/40 text-sm hover:text-white transition-all mt-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
