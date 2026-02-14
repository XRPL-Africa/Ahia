import type { Metadata } from "next";
import { Fredoka, Inter } from "next/font/google"; // New Fonts
import "./globals.css";
import Header from "@/components/layout/Header";

// Fredoka for Headings (matches logo vibe)
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Inter for Body (clean, high legibility for marketplace details)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ahia | The Trusted Campus Marketplace",
  description:
    "Secure, verified student-to-student trade with Safety-Lock Escrow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${inter.variable} antialiased`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
