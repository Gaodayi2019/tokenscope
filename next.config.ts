import type { NextConfig } from "next";

const ContentSecurityPolicy = [
  // Default: only allow same-origin
  "default-src 'self'",
  // Scripts: Next.js self + inline (for hydration) + Vercel analytics
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' va.vercel-insights.com",
  // Styles: self + inline + Google Fonts
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  // Fonts: self + Google Fonts CDN
  "font-src 'self' fonts.gstatic.com",
  // Images: self + data URIs + blob + HTTPS images
  "img-src 'self' data: blob: https:",
  // Connections: self + Vercel + Supabase + analytics + channel data sources
  "connect-src 'self' va.vercel-insights.com https://*.supabase.co https://openrouter.ai https://api.together.xyz https://api.packycodes.com https://4sapi.com https://api.147api.com https://api.apiyi.com https://api.aihubmix.com https://api.laozhang.ai https://api.ohmygpt.com https://api.linkapi.pro https://api.cubence.com https://api.i7relay.com https://hvoy.ai https://raw.githubusercontent.com",
  // Frames: deny all
  "frame-src 'none'",
  // Objects: deny all
  "object-src 'none'",
  // Base URI: same origin only
  "base-uri 'self'",
  // Form actions: same origin only
  "form-action 'self'",
  // Frame ancestors: deny embedding (clickjacking protection)
  "frame-ancestors 'none'",
  // Upgrade insecure requests in production
  process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
].filter(Boolean).join("; ");

const securityHeaders: Record<string, string> = {
  // === Content Security Policy ===
  "Content-Security-Policy": ContentSecurityPolicy,

  // === HTTP Strict Transport Security ===
  // 2 years max-age, include subdomains, preload
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

  // === Prevent MIME type sniffing ===
  "X-Content-Type-Options": "nosniff",

  // === Clickjacking protection ===
  "X-Frame-Options": "DENY",

  // === XSS Protection (legacy browsers) ===
  "X-XSS-Protection": "1; mode=block",

  // === Referrer Policy ===
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // === Permissions Policy - restrict browser APIs ===
  "Permissions-Policy": [
    "camera=()",
    "microphone=()",
    "geolocation=()",
    "payment=()",
    "usb=()",
    "magnetometer=()",
    "gyroscope=()",
    "accelerometer=()",
    "ambient-light-sensor=()",
    "autoplay=()",
    "encrypted-media=()",
    "picture-in-picture=()",
  ].join(", "),

  // === Cross-Origin policies ===
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",

  // === Cache control for API routes ===
  "Cache-Control": "public, max-age=0, must-revalidate",
};

const nextConfig: NextConfig = {
  // Turbopack root — use relative path for cross-platform compatibility (local + Vercel)
  turbopack: {
    root: ".",
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: Object.entries(securityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
      {
        // Cache static assets aggressively
        source: "/(.*)\\.(ico|png|jpg|jpeg|svg|gif|webp|woff2|woff|ttf|eot)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },

  // HTTPS enforcement handled by Vercel + HSTS headers

  // Powered-By header removal
  poweredByHeader: false,

  // Strict TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },


};

export default nextConfig;
