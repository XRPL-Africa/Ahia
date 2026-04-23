"use client";
// src/hooks/useNotifications.ts
// Wires NotificationService to Zustand's useAuthStore.

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import NotificationService, {
  NotificationPreferences,
} from "@/services/notification.service";

export interface UseNotificationsReturn {
  /** Current browser permission status */
  permission: NotificationPermission | "unsupported" | "loading";
  /** Whether push subscription is active */
  isActive: boolean;
  preferences: NotificationPreferences;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  /** Request permission and subscribe */
  enable: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuthStore();

  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported" | "loading"
  >("loading");
  const [isActive, setIsActive] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    () => NotificationService.getPreferences()
  );

  useEffect(() => {
    // Resolve permission status on mount (client only)
    const status = NotificationService.getPermissionStatus();
    setPermission(status);

    if (!user?.id) {
      setIsActive(false);
      return;
    }

    // If already granted, initialise silently
    if (status === "granted") {
      NotificationService.initialize(user.id)
        .then((token) => setIsActive(!!token))
        .catch(console.warn);
    }
  }, [user?.id]);

  const enable = useCallback(async () => {
    if (!user?.id) return;
    setPermission("loading" as NotificationPermission);
    const token = await NotificationService.initialize(user.id);
    setPermission(NotificationService.getPermissionStatus());
    setIsActive(!!token);
  }, [user?.id]);

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      const updated = await NotificationService.updatePreferences(updates);
      setPreferences(updated);
    },
    []
  );

  return { permission, isActive, preferences, updatePreferences, enable };
};
