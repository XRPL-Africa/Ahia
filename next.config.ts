import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Images ────────────────────────────────────────────────────────────────
  images: {
    // Enable Next.js image optimisation for all external hosts Ahia uses
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "api.ahiamarket.app" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    // Serve AVIF first, then WebP — smaller files = faster LCP
    formats: ["image/avif", "image/webp"],
    // Aggressive device sizes reduces wasted bytes on mobile
    deviceSizes: [390, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 64, 128, 256],
    // Minimum TTL for image cache (7 days)
    minimumCacheTTL: 604800,
  },

  // ─── Bundle & Compilation ───────────────────────────────────────────────────
  compiler: {
    // Remove console.log in production (keeps console.error/warn)
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["error", "warn"] }
      : false,
  },

  // ─── Experimental ──────────────────────────────────────────────────────────
  experimental: {
    // Turbopack for faster local dev (stable in Next 16)
    turbo: {},
    // Partial prerendering — static shell + dynamic islands
    ppr: true,
    // Tree-shake unused package exports
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-slot",
    ],
  },

  // ─── HTTP Headers ──────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Cache static assets aggressively
        source: "/:path*\\.(js|css|woff2|png|jpg|jpeg|svg|ico|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Service worker must not be cached by the browser
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        // Security headers for all routes
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control",    value: "on" },
        ],
      },
    ];
  },

  // ─── Redirects ─────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Redirect old dashboard path if it changes
      {
        source: "/dashboard",
        destination: "/user/dashboard",
        permanent: true,
      },
    ];
  },

  // ─── PWA Manifest headers ──────────────────────────────────────────────────
  // manifest.json is served from /public — no plugin needed
};

export default nextConfig;
