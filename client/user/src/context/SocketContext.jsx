import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { SOCKET } from "@kridaz/shared-constants/socketEvents";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastSeenMap, setLastSeenMap] = useState({});

  /**
   * Platform-wide live online user count.
   * Populated exclusively by the `online_users_count` WebSocket event which the
   * server broadcasts on every connect/disconnect via schedulePresenceBroadcast().
   * No HTTP polling — pure server push. Falls back to null until first push arrives.
   */
  const [onlineCount, setOnlineCount] = useState(null);

  const { user, token } = useSelector((state) => state.auth);
  const ENDPOINT =
    import.meta.env.VITE_SOCKET_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  useEffect(() => {
    if (user && token) {
      const newSocket = io(ENDPOINT, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ["websocket"], // Enforce WebSockets to avoid HTTP polling loops
      });

      newSocket.on("connect", () => {
        console.log("Connected to socket server");
        // Only send necessary fields to avoid HTTP 413 Payload Too Large errors
        newSocket.emit("setup", { id: user.id });
      });

      newSocket.on("connected", () => {
        console.log("Socket confirmed setup");
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      // Track individual online users (for per-user presence indicators)
      newSocket.on("online users", (users) => {
        setOnlineUsers(users);
      });

      // ── Platform-wide online count ────────────────────────────────────────
      // Server emits SOCKET.ONLINE_USERS_COUNT ('online_users_count') on every
      // connect/disconnect using a 1-second Redis distributed lock — only ONE
      // broadcast fires per event even on multi-instance deployments.
      newSocket.on(SOCKET.ONLINE_USERS_COUNT, ({ count }) => {
        setOnlineCount(count);
      });

      // Track per-user last seen timestamps
      newSocket.on("user last seen", ({ userId, lastSeen }) => {
        setLastSeenMap((prev) => ({ ...prev, [userId]: lastSeen }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user?.id, token, ENDPOINT]);

  const isUserOnline = useCallback(
    (userId) => {
      return onlineUsers.includes(userId);
    },
    [onlineUsers]
  );

  const getLastSeen = useCallback(
    (userId) => {
      return lastSeenMap[userId] || null;
    },
    [lastSeenMap]
  );

  const value = {
    socket,
    onlineUsers,
    onlineCount, // number | null — live platform online count via socket push
    isUserOnline,
    getLastSeen,
    lastSeenMap,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
