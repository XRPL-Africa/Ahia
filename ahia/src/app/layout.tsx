import type { Metadata, Viewport } from "next";
import { Fredoka, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { OfflineBanner, PendingActionsDrawer } from "@/components/offline/OfflineUI";
import { PerformanceProvider } from "@/components/PerformanceProvider";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ahia | The Trusted Campus Marketplace",
  description: "Secure, verified student-to-student trade with Safety-Lock Escrow.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Ahia" },
  other: { "msapplication-TileColor": "#ff7a00" },
};

export const viewport: Viewport = {
  themeColor: "#ff7a00",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="//api.ahiamarket.app" />
        <link rel="preconnect" href="https://api.ahiamarket.app" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//api.dicebear.com" />
        <link rel="preload" href="/logo.png" as="image" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" type="image/png" href="/logo.png" />
      </head>
      <body className={`${fredoka.variable} ${inter.variable} antialiased`}>
        {/*
          Provider order (outermost → innermost):
          PerformanceProvider  — Web Vitals, fires immediately
          AnalyticsProvider    — event queue + error boundary, needs auth
          NotificationProvider — push subscription, needs auth
        */}
        <PerformanceProvider>
          <AnalyticsProvider>
            <NotificationProvider>
              <Header />
              <OfflineBanner />
              {children}
              <PendingActionsDrawer />
            </NotificationProvider>
          </AnalyticsProvider>
        </PerformanceProvider>
      </body>
    </html>
  );
}
