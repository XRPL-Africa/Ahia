"use client";
// src/components/notifications/NotificationPreferencesPanel.tsx
// Uses project's real design tokens: ahia-sunset, font-fredoka, rounded-xl, etc.

import { Bell, BellOff, Volume2, Moon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCategory } from "@/services/notification.service";

const CATEGORIES: { key: NotificationCategory; label: string; icon: string; description: string }[] = [
  { key: "chat",         label: "Messages",        icon: "💬", description: "New messages from buyers & sellers" },
  { key: "escrow",       label: "Orders & Escrow",  icon: "🔒", description: "Escrow state changes & fund releases" },
  { key: "listing",      label: "Listing Activity", icon: "🏷️", description: "Offers on your listings, price drops" },
  { key: "verification", label: "Verification",     icon: "🎓", description: "Student ID approval updates" },
  { key: "system",       label: "System",           icon: "📢", description: "Important announcements" },
  { key: "promo",        label: "Promotions",       icon: "🎁", description: "Campus deals & featured listings" },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ahia-sunset/40 ${
        value ? "bg-ahia-sunset" : "bg-gray-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function NotificationPreferencesPanel() {
  const { permission, preferences, updatePreferences, enable } = useNotifications();

  return (
    <div className="space-y-6">

      {/* Permission Banner */}
      {(permission === "default" || permission === "denied") && (
        <div className="flex items-start gap-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <BellOff className="text-ahia-trust mt-0.5 shrink-0" size={20} />
          <div className="flex-1">
            <p className="font-fredoka font-semibold text-gray-800">Enable Push Notifications</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {permission === "denied"
                ? "Notifications are blocked. Enable them in your browser settings."
                : "Get instant alerts for messages, orders, and escrow updates."}
            </p>
          </div>
          {permission !== "denied" && (
            <Button variant="primary" size="sm" className="shrink-0" onClick={enable}>
              Enable
            </Button>
          )}
        </div>
      )}

      {permission === "granted" && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
          <Bell className="text-ahia-success shrink-0" size={18} />
          <span className="text-sm font-fredoka font-medium text-green-700">
            Push notifications are active
          </span>
        </div>
      )}

      {/* Notification Types */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Notification Types
          </p>
        </div>
        {CATEGORIES.map(({ key, label, icon, description }, i) => (
          <div
            key={key}
            className={`flex items-center gap-4 px-5 py-4 ${
              i < CATEGORIES.length - 1 ? "border-b border-gray-50" : ""
            }`}
          >
            <span className="text-xl w-7 text-center">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-fredoka font-semibold text-gray-800 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{description}</p>
            </div>
            <Toggle
              value={preferences[key]}
              onChange={(v) => updatePreferences({ [key]: v })}
            />
          </div>
        ))}
      </div>

      {/* Delivery */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Delivery</p>
        </div>
        <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
          <Volume2 size={20} className="text-gray-400 shrink-0" />
          <div className="flex-1">
            <p className="font-fredoka font-semibold text-gray-800 text-sm">Sound</p>
            <p className="text-xs text-gray-400">Play a sound when a notification arrives</p>
          </div>
          <Toggle value={preferences.sound} onChange={(v) => updatePreferences({ sound: v })} />
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="text-xl w-5 shrink-0 text-center">🔴</span>
          <div className="flex-1">
            <p className="font-fredoka font-semibold text-gray-800 text-sm">Badge Count</p>
            <p className="text-xs text-gray-400">Show unread count on browser tab</p>
          </div>
          <Toggle value={preferences.badge} onChange={(v) => updatePreferences({ badge: v })} />
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Quiet Hours</p>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <Moon size={20} className="text-gray-400 shrink-0" />
          <div className="flex-1">
            <p className="font-fredoka font-semibold text-gray-800 text-sm">Do Not Disturb</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Silence alerts between{" "}
              <span className="font-semibold text-gray-600">{preferences.quietHoursStart}</span>
              {" "}–{" "}
              <span className="font-semibold text-gray-600">{preferences.quietHoursEnd}</span>
            </p>
          </div>
          <Toggle
            value={preferences.quietHoursEnabled}
            onChange={(v) => updatePreferences({ quietHoursEnabled: v })}
          />
        </div>
      </div>

    </div>
  );
}
