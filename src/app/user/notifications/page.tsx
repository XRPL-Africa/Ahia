"use client";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { Settings2 } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useState } from "react";

export default function NotificationsPage() {
  useAnalytics("NotificationSettings");
  const [showPrefs, setShowPrefs] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* In-app notification list */}
        <NotificationCenter />

        {/* Collapsible push-notification preferences */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowPrefs((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Settings2 size={18} className="text-ahia-sunset" />
              <span className="font-fredoka font-bold text-gray-800 text-base">
                Notification Preferences
              </span>
            </div>
            <span className="text-xs font-fredoka text-gray-400">
              {showPrefs ? "Hide" : "Show"}
            </span>
          </button>

          {showPrefs && (
            <div className="px-5 pb-5 border-t border-gray-100 pt-4">
              <NotificationPreferencesPanel />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
