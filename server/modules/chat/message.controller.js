import { prisma } from "../../config/prisma.js";
import { getIO } from "../../config/socket.js";
import logger from "../../utils/logger.js";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";


// Helper: resolve the correct user IDs and model for the current request
function resolveCurrentUser(req) {
  const isOwner = req.user?.role?.includes("venue") || req.user?.role === "owner" || req.owner?.role?.includes("venue") || req.owner?.role === "owner";

  const currentUserId = isOwner
    ? (req.user?.ownerId || req.owner?.ownerId || req.user?.id || req.owner?.id)
    : (req.user?.id || req.user?.userId);

  const currentUserModel = isOwner ? "Owner" : "User";
  
  const participantData = isOwner 
    ? { ownerId: currentUserId, userId: null, onModel: "Owner" }
    : { userId: currentUserId, ownerId: null, onModel: "User" };

  return { currentUserId, currentUserModel, participantData };
}

// Helper: check if a user is an admin in a chat
async function checkIsAdmin(chatId, participantData) {
  const participant = await prisma.chatParticipant.findFirst({
    where: {
      chatId,
      userId: participantData.userId,
      ownerId: participantData.ownerId,
      isAdmin: true
    }
  });
  
  if (participant) return true;

  // For announcement channels, also check if user is an admin of the parent community
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { parentCommunityId: true, isAnnouncementGroup: true, chatName: true }
  });

  if (chat && chat.parentCommunityId && (chat.isAnnouncementGroup || chat.chatName === "Announcements")) {
    const parentParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: chat.parentCommunityId,
        userId: participantData.userId,
        ownerId: participantData.ownerId,
        isAdmin: true
      }
    });
    if (parentParticipant) return true;

    // Check if they are the creator of the parent community
    const parentChat = await prisma.chat.findUnique({
      where: { id: chat.parentCommunityId },
      select: { createdByUserId: true, createdByOwnerId: true }
    });
    if (parentChat && 
        ((parentChat.createdByUserId && parentChat.createdByUserId === participantData.userId) || 
         (parentChat.createdByOwnerId && parentChat.createdByOwnerId === participantData.ownerId))) {
      return true;
    }
  }

  return false;
}

/**
 * Get all messages for a specific chat
 */
export const allMessages = async (req, res) => {
  const { chatId } = req.params;
  const { participantData } = resolveCurrentUser(req);

  try {
    const messages = await prisma.message.findMany({
      where: {
        chatId,
        deletedBy: {
          none: {
            userId: participantData.userId,
            ownerId: participantData.ownerId
          }
        }
      },
      include: {
        senderUser: { select: { id: true, name: true, profilePicture: true, email: true } },
        senderOwner: { include: { user: { select: { name: true, profilePicture: true } } } },
      },
      orderBy: { createdAt: "asc" }
    });
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Send a new message
 */
export const sendMessage = async (req, res) => {
  const { content, chatId, media } = req.body;
  const { participantData } = resolveCurrentUser(req);

  console.log("=== SEND_MESSAGE DIAGNOSTIC ===");
  console.log("Input content:", content, "chatId:", chatId);
  console.log("participantData:", JSON.stringify(participantData));

  if ((!content && !media) || !chatId) {
    console.log("SEND_MESSAGE: Invalid data passed");
    return res.status(400).json({ message: "Invalid data passed into request" });
  }

  try {
    console.log("SEND_MESSAGE: Querying chat...");
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true }
    });

    if (!chat) {
      console.log("SEND_MESSAGE: Chat not found");
      return res.status(404).json({ message: "Chat not found" });
    }
    console.log("SEND_MESSAGE: Chat found successfully");

    // Check admin-only restriction
    if (chat.adminOnlyMessages) {
      console.log("SEND_MESSAGE: Checking admin restriction...");
      if (!(await checkIsAdmin(chatId, participantData))) {
        console.log("SEND_MESSAGE: Not admin, forbidden");
        return res.status(403).json({ message: "Only admins can send messages in this group" });
      }
    }

    // Find the participant record for the sender in-memory to avoid an extra DB roundtrip
    console.log("SEND_MESSAGE: Finding sender participant in-memory...");
    let senderParticipant = chat.participants.find(p => 
      p.userId === participantData.userId && p.ownerId === participantData.ownerId
    );
    console.log("SEND_MESSAGE: Sender participant in-memory result:", JSON.stringify(senderParticipant));

    if (!senderParticipant) {
      // Check if user is an admin of the parent community or the chat
      const isAllowedAdmin = await checkIsAdmin(chatId, participantData);
      if (isAllowedAdmin) {
        console.log("SEND_MESSAGE: Sender is authorized admin, auto-creating participant record...");
        senderParticipant = await prisma.chatParticipant.create({
          data: {
            chatId,
            userId: participantData.userId,
            ownerId: participantData.ownerId,
            onModel: participantData.onModel || "User",
            isAdmin: true,
            isPending: false
          }
        });
      } else {
        console.log("SEND_MESSAGE: Sender participant not found in chat");
        return res.status(400).json({ message: "Sender is not a participant of this chat" });
      }
    }

    console.log("SEND_MESSAGE: Creating message in DB...");
    const message = await prisma.message.create({
      data: {
        content: content || "",
        chatId,
        senderUserId: participantData.userId,
        senderOwnerId: participantData.ownerId,
        senderModel: participantData.onModel,
        media: media || [],
        readBy: {
          connect: { id: senderParticipant.id }
        }
      },
      include: {
        senderUser: { select: { id: true, name: true, profilePicture: true, email: true } },
        senderOwner: { include: { user: { select: { name: true, profilePicture: true } } } },
        chat: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, profilePicture: true } },
                owner: { include: { user: { select: { name: true, profilePicture: true } } } }
              }
            }
          }
        }
      }
    });
    console.log("SEND_MESSAGE: Message created successfully in DB, ID:", message.id);

    // Update latest message in chat
    console.log("SEND_MESSAGE: Updating chat latestMessageId...");
    await prisma.chat.update({
      where: { id: chatId },
      data: { latestMessageId: message.id }
    });
    console.log("SEND_MESSAGE: Chat latestMessageId updated successfully");

    // Socket emission
    console.log("SEND_MESSAGE: Emmitting socket message...");
    const io = getIO();
    if (io) {
      message.chat.participants.forEach(p => {
        const uid = p.userId || p.ownerId;
        if (uid === (participantData.userId || participantData.ownerId)) return;
        io.to(uid).emit(SOCKET.MESSAGE_RECEIVED, message);
      });
    }
    console.log("SEND_MESSAGE: Socket message emitted successfully");

    res.json(message);
  } catch (error) {
    console.log("SEND_MESSAGE ERROR:", error);
    logger.error("Error in sendMessage:", error);
    res.status(400).json({ message: error.message });
  }
};

/**
 * Forward a message
 */
export const forwardMessage = async (req, res) => {
  const { messageId, chatIds = [], userIds = [] } = req.body;
  const { participantData: self } = resolveCurrentUser(req);

  if (!messageId || (chatIds.length === 0 && userIds.length === 0)) {
    return res.status(400).json({ message: "Invalid data passed into request" });
  }

  try {
    const originalMessage = await prisma.message.findUnique({ where: { id: messageId } });
    if (!originalMessage) return res.status(404).json({ message: "Message not found" });

    let finalChatIds = [...chatIds];
    
    // For direct userIds, find or create 1-on-1 chats
    for (const targetUserId of userIds) {
      let chat = await prisma.chat.findFirst({
        where: {
          isGroupChat: false,
          AND: [
            { participants: { some: { userId: self.userId, ownerId: self.ownerId } } },
            { participants: { some: { userId: targetUserId, onModel: "User" } } }
          ]
        }
      });

      if (!chat) {
        chat = await prisma.chat.create({
          data: {
            chatName: "sender",
            isGroupChat: false,
            participants: {
              create: [
                { userId: self.userId, ownerId: self.ownerId, onModel: self.onModel, isPending: false },
                { userId: targetUserId, onModel: "User", isPending: false }
              ]
            }
          }
        });
      }
      finalChatIds.push(chat.id);
    }

    finalChatIds = [...new Set(finalChatIds)];
    const forwardedMessages = [];

    for (const chatId of finalChatIds) {
      const senderParticipant = await prisma.chatParticipant.findFirst({
        where: {
          chatId,
          userId: self.userId,
          ownerId: self.ownerId
        }
      });

      const message = await prisma.message.create({
        data: {
          chatId,
          senderUserId: self.userId,
          senderOwnerId: self.ownerId,
          senderModel: self.onModel,
          content: originalMessage.content,
          media: originalMessage.media || [],
          isForwarded: true,
          readBy: { connect: { id: senderParticipant.id } }
        },
        include: {
          senderUser: { select: { id: true, name: true, profilePicture: true, email: true } },
          senderOwner: { include: { user: { select: { name: true, profilePicture: true } } } },
          chat: {
            include: {
              participants: {
                include: {
                  user: { select: { id: true, name: true, profilePicture: true } },
                  owner: { include: { user: { select: { name: true, profilePicture: true } } } }
                }
              }
            }
          }
        }
      });

      await prisma.chat.update({ where: { id: chatId }, data: { latestMessageId: message.id } });
      forwardedMessages.push(message);

      const io = getIO();
      if (io) {
        message.chat.participants.forEach(p => {
          const uid = p.userId || p.ownerId;
          if (uid === (self.userId || self.ownerId)) return;
          io.to(uid).emit(SOCKET.MESSAGE_RECEIVED, message);
        });
      }
    }

    res.json(forwardedMessages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Broadcast a new message to multiple users or chats
 */
export const broadcastMessage = async (req, res) => {
  const { content, media = [], chatIds = [], userIds = [] } = req.body;
  const { participantData: self } = resolveCurrentUser(req);

  if ((!content && media.length === 0) || (chatIds.length === 0 && userIds.length === 0)) {
    return res.status(400).json({ message: "Invalid data passed into request" });
  }

  try {
    let finalChatIds = [...chatIds];
    
    for (const targetUserId of userIds) {
      let chat = await prisma.chat.findFirst({
        where: {
          isGroupChat: false,
          AND: [
            { participants: { some: { userId: self.userId, ownerId: self.ownerId } } },
            { participants: { some: { userId: targetUserId, onModel: "User" } } }
          ]
        }
      });

      if (!chat) {
        chat = await prisma.chat.create({
          data: {
            chatName: "sender",
            isGroupChat: false,
            participants: {
              create: [
                { userId: self.userId, ownerId: self.ownerId, onModel: self.onModel, isPending: false },
                { userId: targetUserId, onModel: "User", isPending: false }
              ]
            }
          }
        });
      }
      finalChatIds.push(chat.id);
    }

    finalChatIds = [...new Set(finalChatIds)];
    const sentMessages = [];

    for (const chatId of finalChatIds) {
      const senderParticipant = await prisma.chatParticipant.findFirst({
        where: {
          chatId,
          userId: self.userId,
          ownerId: self.ownerId
        }
      });

      const message = await prisma.message.create({
        data: {
          chatId,
          senderUserId: self.userId,
          senderOwnerId: self.ownerId,
          senderModel: self.onModel,
          content,
          media: media || [],
          isForwarded: true,
          readBy: { connect: { id: senderParticipant.id } }
        },
        include: {
          senderUser: { select: { id: true, name: true, profilePicture: true, email: true } },
          senderOwner: { include: { user: { select: { name: true, profilePicture: true } } } },
          chat: {
            include: {
              participants: {
                include: {
                  user: { select: { id: true, name: true, profilePicture: true } },
                  owner: { include: { user: { select: { name: true, profilePicture: true } } } }
                }
              }
            }
          }
        }
      });

      await prisma.chat.update({ where: { id: chatId }, data: { latestMessageId: message.id } });
      sentMessages.push(message);

      const io = getIO();
      if (io) {
        message.chat.participants.forEach(p => {
          const uid = p.userId || p.ownerId;
          if (uid === (self.userId || self.ownerId)) return;
          io.to(uid).emit(SOCKET.MESSAGE_RECEIVED, message);
        });
      }
    }

    res.json(sentMessages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Mark messages as read
 */
export const markMessagesRead = async (req, res) => {
  const { chatId } = req.params;
  const { participantData: self } = resolveCurrentUser(req);

  try {
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: self.userId,
        ownerId: self.ownerId
      }
    });

    if (!participant) return res.status(404).json({ success: false });

    const unreadMessages = await prisma.message.findMany({
      where: {
        chatId,
        readBy: {
          none: { id: participant.id }
        }
      },
      select: { id: true }
    });

    for (const msg of unreadMessages) {
      await prisma.message.update({
        where: { id: msg.id },
        data: {
          readBy: {
            connect: { id: participant.id }
          }
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete multiple messages
 */
export const deleteMessages = async (req, res) => {
  const { messageIds, chatId, deleteType } = req.body; // deleteType: "me" or "everyone"
  const { participantData: self } = resolveCurrentUser(req);

  if (!messageIds || !Array.isArray(messageIds)) {
    return res.status(400).json({ message: "Invalid message IDs" });
  }

  try {
    if (deleteType === "everyone") {
      await prisma.message.deleteMany({ where: { id: { in: messageIds } } });
    } else {
      // Delete for me: add to deletedBy relation
      const participant = await prisma.chatParticipant.findFirst({
        where: {
          chatId,
          userId: self.userId,
          ownerId: self.ownerId
        }
      });

      if (participant) {
        for (const msgId of messageIds) {
          await prisma.message.update({
            where: { id: msgId },
            data: {
              deletedBy: { connect: { id: participant.id } }
            }
          });
        }
      }
    }

    // Update latestMessage for the chat
    if (chatId) {
      const latestRemaining = await prisma.message.findFirst({
        where: {
          chatId,
          deletedBy: {
            none: {
              userId: self.userId,
              ownerId: self.ownerId
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      await prisma.chat.update({
        where: { id: chatId },
        data: { latestMessageId: latestRemaining?.id || null }
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Clear all messages in a chat (for me)
 */
export const clearChat = async (req, res) => {
  const { chatId } = req.body;
  const { participantData: self } = resolveCurrentUser(req);

  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }

  try {
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: self.userId,
        ownerId: self.ownerId
      }
    });

    if (participant) {
      const messages = await prisma.message.findMany({
        where: { chatId, deletedBy: { none: { id: participant.id } } }
      });

      for (const msg of messages) {
        await prisma.message.update({
          where: { id: msg.id },
          data: { deletedBy: { connect: { id: participant.id } } }
        });
      }
    }

    await prisma.chat.update({
      where: { id: chatId },
      data: { latestMessageId: null }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get all media for a specific chat
 */
export const getChatMedia = async (req, res) => {
  const { chatId } = req.params;
  const { participantData: self } = resolveCurrentUser(req);

  try {
    const mediaMessages = await prisma.message.findMany({
      where: {
        chatId,
        NOT: { media: { equals: [] } },
        deletedBy: {
          none: {
            userId: self.userId,
            ownerId: self.ownerId
          }
        }
      },
      orderBy: { createdAt: "desc" },
      select: { media: true, createdAt: true }
    });
    
    const allMedia = mediaMessages.reduce((acc, msg) => {
      const mediaList = Array.isArray(msg.media) ? msg.media : [];
      const flattened = mediaList.map(m => ({ ...m, createdAt: msg.createdAt }));
      return acc.concat(flattened);
    }, []);

    res.status(200).json(allMedia);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
