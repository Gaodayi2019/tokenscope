import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================================
// TokenScope Security Proxy
// - Rate limiting (in-memory, per-IP)
// - Bot / suspicious request filtering
// - Security headers enforcement
// - API route protection
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiter (resets on deploy — fine for MVP)
const rateLimitMap = new Map<string, RateLimitEntry>();

// Rate limit config per route type
const RATE_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
  // API routes: 60 requests per minute
  api: { windowMs: 60_000, maxRequests: 60 },
  // Auth routes: 5 attempts per 15 minutes
  auth: { windowMs: 15 * 60_000, maxRequests: 5 },
  // Review submission: 3 per 5 minutes
  review: { windowMs: 5 * 60_000, maxRequests: 3 },
  // General pages: 120 per minute
  default: { windowMs: 60_000, maxRequests: 120 },
};

// Known bad user agents (bots / scanners)
const BLOCKED_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /dirbuster/i,
  /gobuster/i,
  /wfuzz/i,
  /burpsuite/i,
  /hydra/i,
  /metasploit/i,
  /zgrab/i,
  /nuclei/i,
  /crawlergo/i,
];

// Suspicious path patterns
const BLOCKED_PATH_PATTERNS = [
  /\.env/i,
  /\.git/i,
  /wp-admin/i,
  /wp-login/i,
  /xmlrpc\.php/i,
  /phpmyadmin/i,
  /adminer/i,
  /\.htaccess/i,
  /\.DS_Store/i,
  /config\.(yml|yaml|json|ini)/i,
  /debug/i,
  /console/i,
  /actuator/i,
  /\.well-known\/security\.txt/i,
];

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getRateLimitCategory(pathname: string): string {
  if (pathname.startsWith("/api/auth")) return "auth";
  if (pathname.startsWith("/api/review")) return "review";
  if (pathname.startsWith("/api/")) return "api";
  return "default";
}

function checkRateLimit(ip: string, category: string): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[category] || RATE_LIMITS.default;
  const key = `${ip}:${category}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > config.maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true };
}

// Cleanup old entries periodically (prevent memory leak)
if (typeof globalThis !== "undefined") {
  const _interval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, 60_000);
  // Don't let the interval prevent process exit
  if (_interval.unref) _interval.unref();
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";
  const ip = getClientIP(request);

  // ── 1. Block suspicious paths ──
  for (const pattern of BLOCKED_PATH_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse(null, { status: 404 });
    }
  }

  // ── 2. Block known attack tools ──
  for (const pattern of BLOCKED_UA_PATTERNS) {
    if (pattern.test(userAgent)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ── 3. Block requests without User-Agent (likely bots) ──
  if (!userAgent.trim()) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── 4. SQL injection detection in query params ──
  const sqlPatterns = /(\b(union|select|insert|update|delete|drop|alter|exec|execute)\b.*\b(from|into|table|database|where)\b|--|;--|\/\*|\*\/|xp_|sp_)/i;
  const queryString = searchParams.toString();
  if (sqlPatterns.test(queryString) || sqlPatterns.test(pathname)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // ── 5. XSS detection in query params ──
  const xssPatterns = /(<script|javascript:|on\w+\s*=|eval\(|expression\(|data:text\/html)/i;
  if (xssPatterns.test(queryString)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // ── 6. Rate limiting ──
  const category = getRateLimitCategory(pathname);
  const { allowed, retryAfter } = checkRateLimit(ip, category);
  if (!allowed) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter || 60),
        "X-RateLimit-Limit": String(RATE_LIMITS[category]?.maxRequests || 120),
        "X-RateLimit-Remaining": "0",
      },
    });
  }

  // ── 7. Add security headers to response ──
  const response = NextResponse.next();
  response.headers.set("X-Request-ID", crypto.randomUUID());
  response.headers.set("X-Content-Type-Options", "nosniff");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
