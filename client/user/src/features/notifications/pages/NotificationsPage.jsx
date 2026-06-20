import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Trash2,
  Users,
  MessageCircle,
  Calendar,
  Heart,
  Trophy,
  Loader2,
  ShieldCheck,
  Zap,
  X,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  Star,
  ArrowLeft,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { useSocket } from "@context/SocketContext";
import { formatDistanceToNow } from "date-fns";
import useNotifications from "@hooks/shared/useNotifications";import { Button } from "@kridaz/ui";

const PRI = "var(--primary)";
const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

/**
 * Notification type → visual configuration map.
 * Each type has an icon, color, and route resolution strategy.
 */
const NOTIF_CONFIG = {
  FOLLOW: {
    icon: Users,
    color: "var(--primary)",
    bgColor: "rgba(191,243,103,0.08)",
    getRoute: (notif) => `/profile/${notif.metadata?.senderId || ""}`,
  },
  MESSAGE: {
    icon: MessageCircle,
    color: "#60A5FA",
    bgColor: "rgba(96,165,250,0.08)",
    getRoute: () => "/messages",
  },
  BOOKING: {
    icon: Calendar,
    color: "var(--primary)",
    bgColor: "rgba(85,222,232,0.08)",
    getRoute: (notif) =>
      notif.link || `/booking-pass/${notif.metadata?.bookingId || ""}`,
  },
  LIKE: {
    icon: Heart,
    color: "var(--destructive)",
    bgColor: "rgba(239,68,68,0.08)",
    getRoute: (notif) => notif.link || "/community",
  },
  COMMENT: {
    icon: MessageCircle,
    color: "#8B5CF6",
    bgColor: "rgba(139,92,246,0.08)",
    getRoute: (notif) => notif.link || "/community",
  },
  PAYMENT: {
    icon: CreditCard,
    color: "var(--success)",
    bgColor: "rgba(16,185,129,0.08)",
    getRoute: (notif) => notif.link || "/wallet",
  },
  REVIEW: {
    icon: Star,
    color: "var(--primary)",
    bgColor: "rgba(251,191,36,0.08)",
    getRoute: (notif) => notif.link || "/profile",
  },
  SUPPORT: {
    icon: ShieldCheck,
    color: "#06B6D4",
    bgColor: "rgba(6,182,212,0.08)",
    getRoute: (notif) => notif.link || "/profile",
  },
  WITHDRAWAL: {
    icon: AlertTriangle,
    color: "#F97316",
    bgColor: "rgba(249,115,22,0.08)",
    getRoute: (notif) => notif.link || "/wallet",
  },
  GAME_JOIN_REQUEST: {
    icon: Zap,
    color: "var(--primary)",
    bgColor: "rgba(191,243,103,0.08)",
    getRoute: (notif) => notif.link || "/booking-history?subTab=games",
  },
  TEAM_INVITE: {
    icon: Users,
    color: "var(--primary)",
    bgColor: "rgba(85,222,232,0.08)",
    getRoute: (notif) => notif.link || "/profile?tab=connections",
  },
  TEAM_JOIN_REQUEST: {
    icon: Users,
    color: "var(--primary)",
    bgColor: "rgba(85,222,232,0.08)",
    getRoute: (notif) => notif.link || "/profile?tab=connections",
  },
  TEAM_JOIN_ACCEPTED: {
    icon: ShieldCheck,
    color: "var(--primary)",
    bgColor: "rgba(191,243,103,0.08)",
    getRoute: (notif) => notif.link || "/profile?tab=connections",
  },
  TEAM_JOIN_REJECTED: {
    icon: X,
    color: "var(--destructive)",
    bgColor: "rgba(239,68,68,0.08)",
    getRoute: (notif) => notif.link || "/profile?tab=connections",
  },
  OPPONENT_REQUEST: {
    icon: Trophy,
    color: "#F59E0B",
    bgColor: "rgba(245,158,11,0.08)",
    getRoute: (notif) => notif.link || "/profile?tab=connections",
  },
  OPPONENT_ACCEPTED: {
    icon: Trophy,
    color: "var(--primary)",
    bgColor: "rgba(191,243,103,0.08)",
    getRoute: (notif) => notif.link || "/profile?tab=connections",
  },
  SYSTEM: {
    icon: Zap,
    color: "#A78BFA",
    bgColor: "rgba(167,139,250,0.08)",
    getRoute: (notif) => notif.link || "/",
  },
};

const DEFAULT_CONFIG = {
  icon: Bell,
  color: "var(--primary)",
  bgColor: "rgba(191,243,103,0.08)",
  getRoute: (notif) => notif.link || "/",
};

/**
 * NotificationsPage — Dedicated full-page notification center.
 *
 * Architecture:
 *  - UI Layer: Pure rendering of notification cards, filters, and empty states.
 *  - Behavior Layer: Manages filter and route resolution.
 *  - Service Layer: RTK Query hook useNotifications.
 */
const NotificationsPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all"); // all | unread

  const {
    notifications,
    loading,
    unreadCount,
    markRead,
    markAllRead,
    clearAll,
  } = useNotifications();

  const filtered =
    activeFilter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleNotificationClick = (notif) => {
    const id = notif.id || notif._id;
    if (!notif.isRead) markRead(id);

    const type = notif.type?.toUpperCase() || "SYSTEM";
    const config = NOTIF_CONFIG[type] || DEFAULT_CONFIG;
    const route = config.getRoute(notif);
    if (route) navigate(route);
  };

  const getConfig = (type) => {
    const key = (type || "SYSTEM").toUpperCase();
    return NOTIF_CONFIG[key] || DEFAULT_CONFIG;
  };

  // ── UI Layer: Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black pt-2 md:pt-24 pb-20 px-0 sm:px-4 font-inter">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <h1
              className="text-[20px] font-black uppercase tracking-tight font-open-sans text-white"
              style={HEADING_STYLE}
            >
              Notifications
            </h1>
            <p
              className="text-[11px] font-semibold text-white/30 mt-0.5 tracking-widest uppercase"
              style={SUBHEADING_STYLE}
            >
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={markAllRead}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[16px] bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
              >
                <CheckCheck size={14} />
                <span className="hidden sm:inline">Read All</span>
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[16px] bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-4">
          {["all", "unread"].map((filter) => (
            <Button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all border ${activeFilter === filter ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white/60 hover:border-white/10"}`}
            >
              {filter === "all" ? "All" : `Unread (${unreadCount})`}
            </Button>
          ))}
        </div>

        {/* ── Notification List ────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 size={36} className="text-primary animate-spin" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
              Loading notifications…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-[16px] bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center">
              <Bell size={40} className="text-white/10" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-black text-white/30 uppercase tracking-widest">
                {activeFilter === "unread"
                  ? "No unread notifications"
                  : "No notifications yet"}
              </p>
              <p
                className="text-[11px] text-white/15 mt-1 font-medium"
                style={SUBHEADING_STYLE}
              >
                {activeFilter === "unread"
                  ? "You're all caught up!"
                  : "When you get notifications, they'll show up here"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((notif, index) => {
                const id = notif.id || notif._id;
                const config = getConfig(notif.type);
                const IconComponent = config.icon;

                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group relative flex items-start gap-4 p-3 sm:p-4 rounded-[16px] border cursor-pointer transition-all duration-300 ${notif.isRead ? "bg-background border-white/5 hover:bg-card/50" : "bg-card border-white/10 hover:border-white/20"}`}
                  >
                    {/* Unread indicator */}
                    {!notif.isRead && (
                      <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(179,220,38,0.5)]" />
                    )}

                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 border border-white/5 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: notif.isRead
                          ? "rgba(255,255,255,0.03)"
                          : config.bgColor,
                      }}
                    >
                      <IconComponent
                        size={18}
                        style={{ color: notif.isRead ? "#555" : config.color }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h4
                          className={`text-[13px] font-bold leading-tight transition-colors ${notif.isRead ? "text-white/40" : "text-white group-hover:text-primary"}`}
                          style={SUBHEADING_STYLE}
                        >
                          {notif.title}
                        </h4>
                      </div>
                      <p
                        className={`text-[12px] mt-1 leading-relaxed ${notif.isRead ? "text-white/25" : "text-white/50"}`}
                        style={SUBHEADING_STYLE}
                      >
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-wider">
                          {notif.createdAt
                            ? formatDistanceToNow(new Date(notif.createdAt), {
                                addSuffix: true,
                              }).replace("about ", "")
                            : "Just now"}
                        </span>
                        {notif.type && (
                          <span
                            className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                            style={{
                              color: notif.isRead ? "#444" : config.color,
                              borderColor: notif.isRead
                                ? "rgba(255,255,255,0.05)"
                                : config.color + "30",
                              backgroundColor: notif.isRead
                                ? "transparent"
                                : config.bgColor,
                            }}
                          >
                            {notif.type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronRight
                      size={16}
                      className="text-white/10 group-hover:text-white/30 transition-colors shrink-0 mt-1"
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
