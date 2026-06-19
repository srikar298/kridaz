import React, { useState, useEffect } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import CreateGroupModal from "../components/CreateGroupModal";
import CreateCommunityModal from "../components/CreateCommunityModal";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useGetChatsQuery, useAccessChatMutation } from "@redux/api/chatApi";

const Messages = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userIdParam = searchParams.get("userId");
  const chatIdParam = searchParams.get("chatId");
  const [selectedChat, setSelectedChat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);

  const { data: chatData } = useGetChatsQuery();
  const [accessChat] = useAccessChatMutation();

  // Disable body scroll when viewing messages to lock layout in viewport
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (userIdParam) {
      handleAccessChat(userIdParam);
    }
  }, [userIdParam]);

  // Load chat from URL if available
  useEffect(() => {
    if (chatIdParam && chatData?.chats) {
      const chatToSelect = chatData.chats.find(
        (c) => (c.id || c._id) === chatIdParam
      );
      if (
        chatToSelect &&
        (!selectedChat || (selectedChat.id || selectedChat._id) !== chatIdParam)
      ) {
        setSelectedChat(chatToSelect);
      }
    }
  }, [chatIdParam, chatData, selectedChat]);

  // Keep selectedChat updated if chatData changes (e.g., group rename, member add/remove)
  useEffect(() => {
    if (selectedChat && chatData) {
      const updatedChat = chatData.chats?.find(
        (c) => (c.id || c._id) === (selectedChat.id || selectedChat._id)
      );
      // We do a simple JSON stringify comparison to avoid infinite loops
      // if the data structurally changed.
      if (
        updatedChat &&
        JSON.stringify(updatedChat) !== JSON.stringify(selectedChat)
      ) {
        setSelectedChat(updatedChat);
      }
    }
  }, [chatData, selectedChat]);

  const handleAccessChat = async (userId) => {
    try {
      const data = await accessChat(userId).unwrap();
      handleSelectChat(data);
    } catch (err) {
      console.error("Failed to access chat:", err);
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    if (chat) {
      navigate(`/messages?chatId=${chat.id || chat._id}`, { replace: true });
    } else {
      navigate(`/messages`, { replace: true });
    }
  };

  return (
    <div className="h-[calc(100dvh-64px)] md:h-[calc(100dvh-80px)] lg:h-[calc(100dvh-80px)] flex bg-black overflow-hidden">
      {/* Sidebar - hidden on mobile when a chat is selected */}
      <div
        className={`${selectedChat ? "hidden md:block" : "block"} w-full md:w-[340px] h-full shrink-0`}
      >
        <ChatSidebar
          onSelectChat={handleSelectChat}
          selectedChatId={selectedChat?.id || selectedChat?._id}
          onCreateGroup={() => setIsModalOpen(true)}
          onCreateCommunity={() => setIsCommunityModalOpen(true)}
        />
      </div>

      {/* Chat Window - hidden on mobile when no chat is selected */}
      <div
        className={`${selectedChat ? "block" : "hidden md:block"} flex-1 h-full`}
      >
        <ChatWindow
          chat={selectedChat}
          onBack={() => handleSelectChat(null)}
          onSelectChat={handleSelectChat}
        />
      </div>

      {isModalOpen && (
        <CreateGroupModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSelectChat}
        />
      )}

      {isCommunityModalOpen && (
        <CreateCommunityModal
          isOpen={isCommunityModalOpen}
          onClose={() => setIsCommunityModalOpen(false)}
          onSuccess={handleSelectChat}
        />
      )}
    </div>
  );
};

export default Messages;
