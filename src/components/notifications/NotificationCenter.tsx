"use client";
// src/components/notifications/NotificationCenter.tsx
// In-app notification list: fetches, filters, marks read, clears, requests push permission.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  MessageCircle,
  ShieldCheck,
  Megaphone,
  Tag,
  GraduationCap,
  Gift,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/useAuthStore";
import { resolveNotificationRoute } from "@/services/notification.service";
import type { NotificationCategory } from "@/services/notification.service";
import type { AppNotification } from "@/store/useNotificationStore";

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterType = "all" | "chat" | "transaction" | "system";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all",         label: "All" },
  { key: "chat",        label: "Chat" },
  { key: "transaction", label: "Transaction" },
  { key: "system",      label: "System" },
];

// Maps each UI filter to the NotificationCategory values it covers
const FILTER_MAP: Record<FilterType, NotificationCategory[]> = {
  all:         ["chat", "escrow", "listing", "verification", "system", "promo"],
  chat:        ["chat"],
  transaction: ["escrow"],
  system:      ["system", "verification", "promo"],
};

// ─── Per-category visual config ───────────────────────────────────────────────

const CATEGORY_META: Record<
  NotificationCategory,
  { icon: React.ReactNode; bg: string; color: string }
> = {
  chat: {
    icon: <MessageCircle size={17} />,
    bg: "bg-blue-50",
    color: "text-blue-500",
  },
  escrow: {
    icon: <ShieldCheck size={17} />,
    bg: "bg-green-50",
    color: "text-green-600",
  },
  listing: {
    icon: <Tag size={17} />,
    bg: "bg-purple-50",
    color: "text-purple-500",
  },
  verification: {
    icon: <GraduationCap size={17} />,
    bg: "bg-yellow-50",
    color: "text-yellow-600",
  },
  system: {
    icon: <Megaphone size={17} />,
    bg: "bg-orange-50",
    color: "text-ahia-sunset",
  },
  promo: {
    icon: <Gift size={17} />,
    bg: "bg-pink-50",
    color: "text-pink-500",
  },
};

// ─── Relative time helper ─────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Notification list item ───────────────────────────────────────────────────

function NotificationItem({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: () => void;
}) {
  const router = useRouter();
  const meta = CATEGORY_META[notification.type] ?? CATEGORY_META.system;

  const handleClick = () => {
    onRead();
    const route = resolveNotificationRoute({
      category:       notification.type,
      notificationId: notification.id,
      sentAt:         notification.createdAt,
      href:           notification.href,
      chatId:         notification.chatId,
      transactionId:  notification.transactionId,
      listingId:      notification.listingId,
    });
    router.push(route);
  };

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.18 }}
      onClick={handleClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-b-0 ${
        !notification.isRead ? "bg-ahia-sunset/[0.03]" : ""
      }`}
    >
      {/* Category icon */}
      <div
        className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}
      >
        {meta.icon}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-snug text-gray-800 font-fredoka ${
              !notification.isRead ? "font-bold" : "font-semibold"
            }`}
          >
            {notification.title}
          </p>
          <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 font-fredoka">
            {timeAgo(notification.createdAt)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
          {notification.body}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.isRead && (
        <span className="shrink-0 mt-2 w-2 h-2 rounded-full bg-ahia-sunset" />
      )}
    </motion.button>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="divide-y divide-gray-50">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3.5 animate-pulse">
          <div className="w-9 h-9 rounded-xl bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 bg-gray-100 rounded-full w-2/3" />
            <div className="h-2.5 bg-gray-100 rounded-full w-full" />
            <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: FilterType }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
        <Bell size={24} className="text-gray-200" />
      </div>
      <p className="font-fredoka font-semibold text-gray-500 text-sm">
        No notifications
      </p>
      <p className="text-xs text-gray-400 mt-1 font-fredoka">
        {filter === "all"
          ? "You're all caught up!"
          : `No ${filter} notifications yet`}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationCenter() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markRead,
    markAllRead,
    clearAll,
  } = useNotificationStore();

  // useNotifications hook — reuses existing push permission logic
  const { permission, enable } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Fetch once on mount (when user is present)
  useEffect(() => {
    if (user?.id) fetchNotifications();
  }, [user?.id]);

  // Apply active filter
  const filtered = notifications.filter((n) =>
    FILTER_MAP[activeFilter].includes(n.type)
  );

  // Unread count per filter tab (for tab badges)
  const tabUnreadCount = (key: FilterType) =>
    key === "all"
      ? unreadCount
      : notifications.filter(
          (n) => FILTER_MAP[key].includes(n.type) && !n.isRead
        ).length;

  return (
    <div className="space-y-4">

      {/* ── Push permission banner (uses existing useNotifications hook) ── */}
      <AnimatePresence>
        {(permission === "default" || permission === "denied") && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl"
          >
            <BellOff className="text-blue-500 mt-0.5 shrink-0" size={20} />
            <div className="flex-1">
              <p className="font-fredoka font-semibold text-gray-800 text-sm">
                Enable Push Notifications
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {permission === "denied"
                  ? "Notifications are blocked. Enable them in your browser settings."
                  : "Get instant alerts for messages, orders, and escrow updates."}
              </p>
            </div>
            {permission !== "denied" && (
              <Button
                variant="primary"
                size="sm"
                className="shrink-0 font-fredoka"
                onClick={enable}
              >
                Enable
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notification card ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">

        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Bell size={18} className="text-ahia-sunset" />
            <h2 className="font-fredoka font-bold text-gray-800 text-lg leading-none">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="bg-ahia-sunset text-white text-[10px] font-bold font-fredoka px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Mark all read */}
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1.5 text-xs font-fredoka font-medium text-gray-500 hover:text-ahia-sunset transition-colors"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}

            {/* Clear all */}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-xs font-fredoka font-medium text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 overflow-x-auto scrollbar-hide">
          {FILTERS.map(({ key, label }) => {
            const count = tabUnreadCount(key);
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-fredoka font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-ahia-sunset text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`text-[9px] font-bold px-1 py-0.5 rounded-full leading-none ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-ahia-sunset/10 text-ahia-sunset"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Refresh button */}
          <button
            onClick={fetchNotifications}
            disabled={loading}
            title="Refresh"
            className="ml-auto p-1.5 text-gray-400 hover:text-ahia-sunset transition-colors rounded-full hover:bg-gray-100 shrink-0"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Content area */}
        <div className="min-h-[140px]">
          {loading && notifications.length === 0 ? (
            <NotificationSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <p className="text-sm font-fredoka text-gray-500">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 font-fredoka"
                onClick={fetchNotifications}
              >
                Try again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState filter={activeFilter} />
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => {
                    if (!notification.isRead) markRead(notification.id);
                  }}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
