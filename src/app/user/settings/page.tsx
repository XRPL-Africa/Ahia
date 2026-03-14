"use client";
import { Settings } from "lucide-react";
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function SettingsPage() {
  useAnalytics("Settings");

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Settings className="text-gray-500" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-fredoka font-bold text-gray-800">Settings</h1>
            <p className="text-sm text-gray-500">Manage your account preferences</p>
          </div>
        </div>
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Notifications</h2>
          <NotificationPreferencesPanel />
        </section>
      </div>
    </main>
  );
}
