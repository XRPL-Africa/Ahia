"use client";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { Bell } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function NotificationsPage() {
  const { track } = useAnalytics("NotificationSettings");

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-ahia-sunset/10 flex items-center justify-center">
            <Bell className="text-ahia-sunset" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-fredoka font-bold text-gray-800">Notifications</h1>
            <p className="text-sm text-gray-500">Control what you get alerted about</p>
          </div>
        </div>
        <NotificationPreferencesPanel />
      </div>
    </main>
  );
}
