import { useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSocket } from "@context/SocketContext";
import { baseApi } from "@redux/api/baseApi";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useClearAllNotificationsMutation,
} from "@redux/api/userApi";

const useNotifications = () => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { user, role } = useSelector((state) => state.auth);

  const getBaseUrl = useCallback(() => {
    const normalizedRole = (role || user?.role || "").toString().toLowerCase();

    if (normalizedRole === "admin" || normalizedRole === "bmsp_admin") {
      return "/api/admin/notifications";
    }

    if (
      normalizedRole.includes("venu_owners") ||
      normalizedRole === "owner" ||
      normalizedRole === "venue_owner" ||
      normalizedRole === "verified_venue_owner" ||
      normalizedRole === "bmsp_owner" ||
      ["coach", "umpire", "scorer", "streamer"].some((r) =>
        normalizedRole.includes(r)
      )
    ) {
      return "/api/owner/notifications";
    }

    return "/api/user/notifications";
  }, [role, user?.role]);

  const prefix = getBaseUrl();
  const hasUser = !!user?.id;

  const { data, isLoading, refetch } = useGetNotificationsQuery(prefix, {
    skip: !hasUser,
    pollingInterval: 60000,
  });

  // Listen for socket notifications and update cache optimistically
  useEffect(() => {
    if (!socket || !hasUser) return;

    const handleNewNotification = (notification) => {
      dispatch(
        baseApi.util.updateQueryData("getNotifications", prefix, (draft) => {
          if (draft) {
            if (!draft.notifications) {
              draft.notifications = [];
            }
            // Add notification to top if not already exists
            const id = notification.id || notification._id;
            const exists = draft.notifications.some(
              (n) => (n.id || n._id) === id
            );
            if (!exists) {
              draft.notifications.unshift(notification);
            }
          }
        })
      );
    };

    socket.on("new_notification", handleNewNotification);
    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, prefix, dispatch, hasUser]);

  const [markReadMutation] = useMarkNotificationReadMutation();
  const [markAllReadMutation] = useMarkAllNotificationsReadMutation();
  const [clearAllMutation] = useClearAllNotificationsMutation();

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = async (id) => {
    try {
      await markReadMutation({ prefix, id }).unwrap();
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await markAllReadMutation(prefix).unwrap();
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const clearAll = async () => {
    try {
      await clearAllMutation(prefix).unwrap();
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  return {
    notifications,
    loading: isLoading,
    unreadCount,
    markRead,
    markAllRead,
    clearAll,
    refresh: refetch,
  };
};

export default useNotifications;
