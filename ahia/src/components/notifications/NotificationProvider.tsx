"use client";
// src/components/notifications/NotificationProvider.tsx
// Drop this inside RootLayout (client boundary). Boots after Zustand auth rehydrates.

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import NotificationService from "@/services/notification.service";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) {
      // Logged out — tear down push subscription
      NotificationService.setUserId(null);
      NotificationService.setActiveChatId(null);
      return;
    }

    NotificationService.setUserId(user.id);

    // Silently subscribe if permission is already granted
    const status = NotificationService.getPermissionStatus();
    if (status === "granted") {
      NotificationService.initialize(user.id).catch(console.warn);
    }
  }, [user?.id]);

  return <>{children}</>;
}
