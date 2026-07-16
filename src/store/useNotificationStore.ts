// src/store/useNotificationStore.ts
// Zustand store for in-app notifications — fetches from backend, tracks unread count.

import { create } from "zustand";
import api from "@/services/api";
import type { NotificationCategory } from "@/services/notification.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: NotificationCategory;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  href?: string;
  chatId?: string;
  transactionId?: string;
  listingId?: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<AppNotification[]>("/notifications");
      const notifications = data ?? [];
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
        loading: false,
      });
    } catch {
      set({ loading: false, error: "Failed to load notifications" });
    }
  },

  markRead: async (id: string) => {
    // Optimistic update
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    });
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // revert on failure by re-fetching
      get().fetchNotifications();
    }
  },

  markAllRead: async () => {
    // Optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await api.patch("/notifications/read-all");
    } catch {
      get().fetchNotifications();
    }
  },

  clearAll: async () => {
    const previous = get().notifications;
    // Optimistic update
    set({ notifications: [], unreadCount: 0 });
    try {
      await api.delete("/notifications");
    } catch {
      // revert
      set({
        notifications: previous,
        unreadCount: previous.filter((n) => !n.isRead).length,
      });
    }
  },
}));
