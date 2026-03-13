// src/services/notification.service.ts
// Ahia - Campus Marketplace | Push Notification Service
// Advanced Features Sprint — Task 1

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as TaskManager from "expo-task-manager";
import { useState, useEffect, useRef } from "react";
import {
  View, Text, Switch, StyleSheet,
  ScrollView, TouchableOpacity, Platform,
} from "react-native";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationCategory =
  | "chat"          // New message from buyer/seller
  | "escrow"        // Escrow state changes
  | "listing"       // Offer on your listing, price drop
  | "verification"  // Student ID approved/rejected
  | "system"        // Announcements, maintenance
  | "promo";        // Campus deals, featured listings

export type NotificationEvent =
  | "received"
  | "tapped"
  | "dismissed"
  | "action"
  | "permission_granted"
  | "permission_denied"
  | "token_registered";

export interface NotificationPreferences {
  chat: boolean;
  escrow: boolean;
  listing: boolean;
  verification: boolean;
  system: boolean;
  promo: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

export interface AhiaNotificationData {
  category: NotificationCategory;
  // Deep link target — maps to RootStackParamList keys
  screen?: string;
  params?: Record<string, string>;
  // Contextual IDs
  chatId?: string;
  transactionId?: string;
  listingId?: string;
  userId?: string;
  // Analytics
  campaignId?: string;
  notificationId: string;
  sentAt: string;
}

export interface NotificationAnalyticsEvent {
  event: NotificationEvent;
  notificationId: string;
  category: NotificationCategory;
  campaignId?: string;
  timestamp: Date;
  userId: string;
  platform: "ios" | "android";
  timeToTap?: number; // ms from received → tapped
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BACKGROUND_NOTIFICATION_TASK = "AHIA_BACKGROUND_NOTIFICATION";
const PUSH_TOKEN_STORAGE_KEY = "@ahia/expo_push_token";
const PREFERENCES_STORAGE_KEY = "@ahia/notification_preferences";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  chat: true,
  escrow: true,
  listing: true,
  verification: true,
  system: true,
  promo: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  sound: true,
  vibration: true,
  badge: true,
};

// ─── Android Channel IDs ──────────────────────────────────────────────────────

const ANDROID_CHANNEL: Record<NotificationCategory, string> = {
  chat: "ahia-messages",
  escrow: "ahia-escrow",
  listing: "ahia-listings",
  verification: "ahia-verification",
  system: "ahia-system",
  promo: "ahia-promo",
};

// ─── Foreground Behaviour ─────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as AhiaNotificationData;

    // Suppress if user is already viewing that chat
    if (data?.category === "chat" && NotificationService.isInChat(data.chatId)) {
      return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false };
    }

    if (await NotificationService.isQuietHours()) {
      return { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: true };
    }

    const prefs = await NotificationService.getPreferences();
    const enabled = data?.category ? prefs[data.category] : true;

    return {
      shouldShowAlert: enabled,
      shouldPlaySound: enabled && prefs.sound,
      shouldSetBadge: prefs.badge,
    };
  },
});

// ─── Background Task ──────────────────────────────────────────────────────────

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("[Notifications] Background task error:", error);
    return;
  }

  const notification = (data as { notification: Notifications.Notification }).notification;
  const notifData = notification?.request?.content?.data as AhiaNotificationData;
  if (!notifData) return;

  await NotificationService.trackEvent({
    event: "received",
    notificationId: notifData.notificationId,
    category: notifData.category,
    campaignId: notifData.campaignId,
    timestamp: new Date(),
    userId: NotificationService._currentUserId ?? "unknown",
    platform: Platform.OS as "ios" | "android",
  });

  // Pre-fetch to speed up screen load when user taps
  if (notifData.category === "chat" && notifData.chatId) {
    await NotificationService.prefetchChat(notifData.chatId);
  }
  if (notifData.category === "escrow" && notifData.transactionId) {
    await NotificationService.prefetchEscrow(notifData.transactionId);
  }
});

// ─── Notification Action Categories ──────────────────────────────────────────

const registerNotificationCategories = async () => {
  // Chat: inline reply + mark-read
  await Notifications.setNotificationCategoryAsync("chat_message", [
    {
      identifier: "reply",
      buttonTitle: "Reply",
      textInput: { submitButtonTitle: "Send", placeholder: "Type a reply..." },
    },
    { identifier: "mark_read", buttonTitle: "Mark as Read" },
  ]);

  // Escrow: view order + message counterparty
  await Notifications.setNotificationCategoryAsync("escrow_update", [
    { identifier: "view_escrow", buttonTitle: "View Order" },
    { identifier: "chat_seller", buttonTitle: "Message Seller" },
  ]);

  // Listing offer: view + dismiss
  await Notifications.setNotificationCategoryAsync("new_offer", [
    { identifier: "view_offer", buttonTitle: "View Offer" },
    { identifier: "dismiss", buttonTitle: "Dismiss", isDestructive: true },
  ]);
};

// ─── Main Service ─────────────────────────────────────────────────────────────

export const NotificationService = {

  // ── Internal State ────────────────────────────────────────────────────────
  _currentChatId: null as string | null,
  _currentUserId: null as string | null,
  _receivedTimestamps: new Map<string, number>(),

  setCurrentChat: (chatId: string | null) => {
    NotificationService._currentChatId = chatId;
  },
  isInChat: (chatId?: string): boolean =>
    !!chatId && NotificationService._currentChatId === chatId,

  setCurrentUser: (userId: string | null) => {
    NotificationService._currentUserId = userId;
  },

  // ── Init ──────────────────────────────────────────────────────────────────

  /**
   * Call once after auth is restored.
   * Returns Expo push token, or null if permissions denied / simulator.
   */
  initialize: async (userId: string): Promise<string | null> => {
    NotificationService.setCurrentUser(userId);

    if (!Device.isDevice) {
      console.warn("[Notifications] Push notifications require a physical device.");
      return null;
    }

    await registerNotificationCategories();
    await NotificationService.registerBackgroundTask();

    return NotificationService.requestPermissionsAndGetToken(userId);
  },

  // ── Permissions ───────────────────────────────────────────────────────────

  requestPermissionsAndGetToken: async (userId: string): Promise<string | null> => {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      await NotificationService.trackEvent({
        event: "permission_denied",
        notificationId: "system",
        category: "system",
        timestamp: new Date(),
        userId,
        platform: Platform.OS as "ios" | "android",
      });
      return null;
    }

    if (Platform.OS === "android") {
      await NotificationService.setupAndroidChannels();
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID,
    });

    await StorageAdapter.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    await NotificationService.registerTokenWithBackend(userId, token);
    await NotificationService.trackEvent({
      event: "token_registered",
      notificationId: "system",
      category: "system",
      timestamp: new Date(),
      userId,
      platform: Platform.OS as "ios" | "android",
    });

    return token;
  },

  checkPermissionStatus: async (): Promise<"granted" | "denied" | "undetermined"> => {
    const { status } = await Notifications.getPermissionsAsync();
    return status as "granted" | "denied" | "undetermined";
  },

  // ── Android Channels ──────────────────────────────────────────────────────

  setupAndroidChannels: async () => {
    const configs: Array<[string, Notifications.NotificationChannelInput]> = [
      [ANDROID_CHANNEL.chat, {
        name: "Messages",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1D4ED8",
        showBadge: true,
      }],
      [ANDROID_CHANNEL.escrow, {
        name: "Orders & Escrow",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        lightColor: "#059669",
        showBadge: true,
      }],
      [ANDROID_CHANNEL.listing, {
        name: "Listing Activity",
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: "default",
        showBadge: true,
      }],
      [ANDROID_CHANNEL.verification, {
        name: "Verification",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        showBadge: true,
      }],
      [ANDROID_CHANNEL.system, {
        name: "System",
        importance: Notifications.AndroidImportance.LOW,
        showBadge: false,
      }],
      [ANDROID_CHANNEL.promo, {
        name: "Promotions",
        importance: Notifications.AndroidImportance.MIN,
        showBadge: false,
      }],
    ];

    for (const [id, config] of configs) {
      await Notifications.setNotificationChannelAsync(id, config);
    }
  },

  // ── Preferences ───────────────────────────────────────────────────────────

  getPreferences: async (): Promise<NotificationPreferences> => {
    try {
      const stored = await StorageAdapter.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch { /* use defaults */ }
    return { ...DEFAULT_PREFERENCES };
  },

  updatePreferences: async (
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const current = await NotificationService.getPreferences();
    const updated = { ...current, ...updates };
    await StorageAdapter.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
    await NotificationService.syncPreferencesToBackend(updated);
    return updated;
  },

  syncPreferencesToBackend: async (prefs: NotificationPreferences) => {
    const userId = NotificationService._currentUserId;
    if (!userId) return;
    await fetch(`/api/users/${userId}/notification-preferences`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
  },

  // ── Quiet Hours ───────────────────────────────────────────────────────────

  isQuietHours: async (): Promise<boolean> => {
    const prefs = await NotificationService.getPreferences();
    if (!prefs.quietHoursEnabled) return false;

    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = prefs.quietHoursStart.split(":").map(Number);
    const [eh, em] = prefs.quietHoursEnd.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;

    return start > end
      ? cur >= start || cur < end   // overnight
      : cur >= start && cur < end;
  },

  // ── Deep Link Resolution ──────────────────────────────────────────────────

  /**
   * Converts notification data into a { screen, params } navigation instruction.
   * Pass directly to navigation.navigate() on notification tap.
   */
  resolveDeepLink: (
    data: AhiaNotificationData
  ): { screen: string; params?: Record<string, unknown> } | null => {
    switch (data.category) {
      case "chat":
        if (!data.chatId) return null;
        return {
          screen: "Chat",
          params: { chatId: data.chatId, recipientId: data.userId ?? "", listingId: data.listingId },
        };
      case "escrow":
        if (!data.transactionId) return null;
        return { screen: "EscrowDetail", params: { transactionId: data.transactionId } };
      case "listing":
        if (!data.listingId) return null;
        return {
          screen: "ProductDetail",
          params: { productId: data.listingId, campusSubdomain: data.params?.campusSubdomain ?? "" },
        };
      case "verification":
        return { screen: "Main", params: { screen: "Profile" } };
      case "system":
        return { screen: "Notifications" };
      default:
        return null;
    }
  },

  // ── Listeners ─────────────────────────────────────────────────────────────

  /**
   * Mount all notification listeners. Returns cleanup fn for useEffect.
   */
  setupListeners: (
    navigate: (screen: string, params?: Record<string, unknown>) => void
  ): (() => void) => {
    const receivedSub = Notifications.addNotificationReceivedListener(
      async (notification) => {
        const data = notification.request.content.data as AhiaNotificationData;
        if (!data?.notificationId) return;

        NotificationService._receivedTimestamps.set(data.notificationId, Date.now());

        await NotificationService.trackEvent({
          event: "received",
          notificationId: data.notificationId,
          category: data.category,
          campaignId: data.campaignId,
          timestamp: new Date(),
          userId: NotificationService._currentUserId ?? "unknown",
          platform: Platform.OS as "ios" | "android",
        });
      }
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data as AhiaNotificationData;
        if (!data?.notificationId) return;

        const receivedAt = NotificationService._receivedTimestamps.get(data.notificationId);
        const timeToTap = receivedAt ? Date.now() - receivedAt : undefined;
        const actionId = response.actionIdentifier;

        if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          const dest = NotificationService.resolveDeepLink(data);
          if (dest) navigate(dest.screen, dest.params);
        } else if (actionId === "reply") {
          const userText = (response as Notifications.NotificationResponse & { userText?: string }).userText;
          if (userText && data.chatId) await NotificationService.sendQuickReply(data.chatId, userText);
        } else if (actionId === "mark_read" && data.chatId) {
          await NotificationService.markChatAsRead(data.chatId);
        } else if (actionId === "view_escrow" && data.transactionId) {
          navigate("EscrowDetail", { transactionId: data.transactionId });
        }

        await NotificationService.trackEvent({
          event: actionId === Notifications.DEFAULT_ACTION_IDENTIFIER ? "tapped" : "action",
          notificationId: data.notificationId,
          category: data.category,
          campaignId: data.campaignId,
          timestamp: new Date(),
          userId: NotificationService._currentUserId ?? "unknown",
          platform: Platform.OS as "ios" | "android",
          timeToTap,
        });

        NotificationService._receivedTimestamps.delete(data.notificationId);
        await Notifications.setBadgeCountAsync(0);
      }
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  },

  /**
   * Handle cold-start: notification that launched the app from a killed state.
   * Call after navigation is ready (small setTimeout ensures stack is mounted).
   */
  handleInitialNotification: async (
    navigate: (screen: string, params?: Record<string, unknown>) => void
  ): Promise<void> => {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) return;

    const data = response.notification.request.content.data as AhiaNotificationData;
    if (!data) return;

    const dest = NotificationService.resolveDeepLink(data);
    if (dest) setTimeout(() => navigate(dest.screen, dest.params), 300);
  },

  // ── Badge ─────────────────────────────────────────────────────────────────

  setBadge: (count: number) => Notifications.setBadgeCountAsync(Math.max(0, count)),
  clearBadge: () => Notifications.setBadgeCountAsync(0),
  incrementBadge: async () => {
    const current = await Notifications.getBadgeCountAsync();
    return Notifications.setBadgeCountAsync(current + 1);
  },

  // ── Local / Scheduled ─────────────────────────────────────────────────────

  scheduleLocal: async (
    title: string,
    body: string,
    data: Partial<AhiaNotificationData>,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> =>
    Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { ...data, notificationId: data.notificationId ?? `local-${Date.now()}` },
        sound: true,
      },
      trigger,
    }),

  /**
   * Schedule a 2-hour-before reminder for an expiring escrow.
   */
  scheduleEscrowExpiryReminder: async (
    transactionId: string,
    expiryDate: Date,
    listingTitle: string
  ): Promise<void> => {
    const reminderAt = new Date(expiryDate.getTime() - 2 * 60 * 60 * 1000);
    if (reminderAt <= new Date()) return;

    await NotificationService.scheduleLocal(
      "⏰ Escrow Expiring Soon",
      `Your escrow for "${listingTitle}" expires in 2 hours`,
      { category: "escrow", transactionId, notificationId: `expiry-${transactionId}`, sentAt: new Date().toISOString() },
      { date: reminderAt }
    );
  },

  cancelScheduled: (id: string) => Notifications.cancelScheduledNotificationAsync(id),

  // ── Background Task ───────────────────────────────────────────────────────

  registerBackgroundTask: async () => {
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (!registered) await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  },

  // ── Analytics ─────────────────────────────────────────────────────────────

  trackEvent: async (event: NotificationAnalyticsEvent): Promise<void> => {
    try {
      fetch("/api/analytics/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).catch(() => AnalyticsQueue.enqueue(event));
    } catch {
      AnalyticsQueue.enqueue(event);
    }
  },

  // ── Backend ───────────────────────────────────────────────────────────────

  registerTokenWithBackend: async (userId: string, token: string) => {
    await fetch("/api/users/push-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId, token,
        platform: Platform.OS,
        deviceModel: Device.modelName,
        osVersion: Device.osVersion,
        appVersion: process.env.APP_VERSION,
      }),
    });
  },

  deregisterToken: async (userId: string) => {
    const token = await StorageAdapter.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (!token) return;
    await fetch("/api/users/push-token", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, token }),
    });
    await StorageAdapter.removeItem(PUSH_TOKEN_STORAGE_KEY);
  },

  // ── Prefetch ──────────────────────────────────────────────────────────────

  prefetchChat: async (chatId: string) => {
    try { await fetch(`/api/chats/${chatId}/messages?limit=20`); } catch { /* silent */ }
  },

  prefetchEscrow: async (transactionId: string) => {
    try { await fetch(`/api/escrow/${transactionId}`); } catch { /* silent */ }
  },

  // ── Quick Actions ─────────────────────────────────────────────────────────

  sendQuickReply: async (chatId: string, text: string) => {
    await fetch(`/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, type: "text" }),
    });
  },

  markChatAsRead: async (chatId: string) => {
    await fetch(`/api/chats/${chatId}/read`, { method: "POST" });
  },
};

// ─── useNotifications Hook ────────────────────────────────────────────────────

export interface UseNotificationsReturn {
  permissionStatus: "granted" | "denied" | "undetermined" | "loading";
  pushToken: string | null;
  preferences: NotificationPreferences;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  requestPermissions: () => Promise<void>;
  badgeCount: number;
  clearBadge: () => Promise<void>;
}

export const useNotifications = (
  userId: string,
  navigate: (screen: string, params?: Record<string, unknown>) => void
): UseNotificationsReturn => {
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "undetermined" | "loading"
  >("loading");
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [badgeCount, setBadgeCount] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      setPreferences(await NotificationService.getPreferences());

      const status = await NotificationService.checkPermissionStatus();
      setPermissionStatus(status);

      if (status === "granted") {
        const token = await NotificationService.initialize(userId);
        setPushToken(token);
      }

      await NotificationService.handleInitialNotification(navigate);
      cleanupRef.current = NotificationService.setupListeners(navigate);

      const badge = await Notifications.getBadgeCountAsync();
      setBadgeCount(badge);
    })();

    return () => { cleanupRef.current?.(); };
  }, [userId]);

  return {
    permissionStatus,
    pushToken,
    preferences,
    updatePreferences: async (updates) => {
      const updated = await NotificationService.updatePreferences(updates);
      setPreferences(updated);
    },
    requestPermissions: async () => {
      setPermissionStatus("loading");
      const token = await NotificationService.requestPermissionsAndGetToken(userId);
      setPermissionStatus(await NotificationService.checkPermissionStatus());
      if (token) setPushToken(token);
    },
    badgeCount,
    clearBadge: async () => {
      await NotificationService.clearBadge();
      setBadgeCount(0);
    },
  };
};

// ─── NotificationPreferencesScreen ───────────────────────────────────────────

export const NotificationPreferencesScreen: React.FC<{
  userId: string;
  onBack: () => void;
}> = ({ userId, onBack }) => {
  const { preferences, updatePreferences, permissionStatus, requestPermissions } =
    useNotifications(userId, () => {});

  const CATEGORIES: {
    key: NotificationCategory;
    label: string;
    icon: string;
    description: string;
  }[] = [
    { key: "chat",         label: "Messages",       icon: "💬", description: "New messages from buyers & sellers" },
    { key: "escrow",       label: "Orders & Escrow", icon: "🔒", description: "Escrow state changes & payment releases" },
    { key: "listing",      label: "Listing Activity",icon: "🏷️", description: "Offers on your listings, price drops" },
    { key: "verification", label: "Verification",    icon: "🎓", description: "Student ID approval status updates" },
    { key: "system",       label: "System",          icon: "📢", description: "Important app announcements" },
    { key: "promo",        label: "Promotions",      icon: "🎁", description: "Campus deals and featured listings" },
  ];

  const Row = ({
    icon, label, desc, value, onChange,
  }: { icon: string; label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) => (
    <View style={ps.row}>
      <Text style={ps.rowIcon}>{icon}</Text>
      <View style={ps.rowInfo}>
        <Text style={ps.rowLabel}>{label}</Text>
        {desc && <Text style={ps.rowDesc}>{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#E5E7EB", true: "#BFDBFE" }}
        thumbColor={value ? "#1D4ED8" : "#9CA3AF"}
      />
    </View>
  );

  return (
    <ScrollView style={ps.screen}>
      {/* Header */}
      <View style={ps.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={ps.back}>←</Text>
        </TouchableOpacity>
        <Text style={ps.title}>Notifications</Text>
      </View>

      {/* Permission banner */}
      {permissionStatus === "denied" && (
        <TouchableOpacity style={ps.permBanner} onPress={requestPermissions}>
          <Text style={ps.permTitle}>🔔 Enable Notifications</Text>
          <Text style={ps.permDesc}>
            Tap to enable push notifications — never miss a message or order update.
          </Text>
        </TouchableOpacity>
      )}

      {/* Category toggles */}
      <View style={ps.section}>
        <Text style={ps.sectionTitle}>NOTIFICATION TYPES</Text>
        {CATEGORIES.map(({ key, label, icon, description }) => (
          <Row
            key={key}
            icon={icon}
            label={label}
            desc={description}
            value={preferences[key]}
            onChange={(v) => updatePreferences({ [key]: v })}
          />
        ))}
      </View>

      {/* Delivery preferences */}
      <View style={ps.section}>
        <Text style={ps.sectionTitle}>DELIVERY</Text>
        <Row icon="🔊" label="Sound"      value={preferences.sound}     onChange={(v) => updatePreferences({ sound: v })} />
        <Row icon="📳" label="Vibration"  value={preferences.vibration} onChange={(v) => updatePreferences({ vibration: v })} />
        <Row icon="🔴" label="Badge Count" value={preferences.badge}    onChange={(v) => updatePreferences({ badge: v })} />
      </View>

      {/* Quiet hours */}
      <View style={[ps.section, { marginBottom: 40 }]}>
        <Text style={ps.sectionTitle}>QUIET HOURS</Text>
        <Row
          icon="🌙"
          label="Enable Quiet Hours"
          desc={`${preferences.quietHoursStart} – ${preferences.quietHoursEnd}`}
          value={preferences.quietHoursEnabled}
          onChange={(v) => updatePreferences({ quietHoursEnabled: v })}
        />
      </View>
    </ScrollView>
  );
};

const ps = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: "#F9FAFB" },
  header:       { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  back:         { fontSize: 20, color: "#1D4ED8", paddingRight: 8 },
  title:        { fontSize: 18, fontWeight: "700", color: "#111827" },
  permBanner:   { margin: 16, padding: 16, backgroundColor: "#EFF6FF", borderRadius: 14, borderWidth: 1, borderColor: "#BFDBFE" },
  permTitle:    { fontSize: 15, fontWeight: "700", color: "#1D4ED8", marginBottom: 4 },
  permDesc:     { fontSize: 13, color: "#374151", lineHeight: 18 },
  section:      { marginTop: 24, marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", overflow: "hidden" },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#6B7280", letterSpacing: 0.6, textTransform: "uppercase", padding: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  row:          { flexDirection: "row", alignItems: "center", padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  rowIcon:      { fontSize: 20 },
  rowInfo:      { flex: 1 },
  rowLabel:     { fontSize: 14, fontWeight: "600", color: "#111827" },
  rowDesc:      { fontSize: 12, color: "#6B7280", marginTop: 2 },
});

// ─── Offline Analytics Queue ──────────────────────────────────────────────────

const AnalyticsQueue = {
  _queue: [] as NotificationAnalyticsEvent[],

  enqueue(event: NotificationAnalyticsEvent) {
    this._queue.push(event);
    // In production: persist to AsyncStorage so it survives app restarts
  },

  async flush() {
    if (this._queue.length === 0) return;
    const batch = [...this._queue];
    this._queue = [];
    try {
      await fetch("/api/analytics/notifications/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
    } catch {
      this._queue = [...batch, ...this._queue]; // Re-enqueue on failure
    }
  },
};

// ─── Storage Adapter ─────────────────────────────────────────────────────────
// Swap implementations: expo-secure-store for tokens, AsyncStorage for prefs

const StorageAdapter = {
  getItem: async (_key: string): Promise<string | null> => {
    // Production: return SecureStore.getItemAsync(key) for tokens
    //             return AsyncStorage.getItem(key) for preferences
    return null;
  },
  setItem: async (_key: string, _value: string): Promise<void> => {
    // Production: SecureStore.setItemAsync(key, value)
  },
  removeItem: async (_key: string): Promise<void> => {
    // Production: SecureStore.deleteItemAsync(key)
  },
};

export default NotificationService;
