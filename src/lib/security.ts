// ============================================================
// TokenScope Security Constants & Utilities
// All security-related config in one place
// ============================================================

/** Password requirements */
export const PASSWORD_RULES = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  message: "密码至少12位，需包含大小写字母、数字和特殊字符",
} as const;

/** Session config */
export const SESSION_CONFIG = {
  maxAge: 24 * 60 * 60,      // 24 hours
  updateAge: 4 * 60 * 60,    // Refresh every 4 hours
  idleTimeout: 30 * 60,       // 30 min idle → require re-auth
} as const;

/** Review submission limits */
export const REVIEW_LIMITS = {
  perDay: 5,                   // Max 5 reviews per user per day
  minContentLength: 20,        // Min 20 chars
  maxContentLength: 2000,      // Max 2000 chars
  cooldownMinutes: 5,          // 5 min between reviews
} as const;

/** Allowed upload types (for future avatar upload) */
export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_UPLOAD_SIZE = 2 * 1024 * 1024; // 2MB

/** Input sanitization */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")          // Remove angle brackets
    .replace(/javascript:/gi, "")   // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "")     // Remove event handlers
    .trim()
    .slice(0, 5000);               // Max length safety
}

/** Email validation */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Password strength check */
export function checkPasswordStrength(password: string): {
  score: number;  // 0-4
  feedback: string;
} {
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const feedback = [
    "非常弱 — 请使用更复杂的密码",
    "弱 — 建议增加长度和特殊字符",
    "一般 — 可以更安全",
    "较强 — 安全性良好",
    "非常强 — 安全性优秀",
  ][Math.min(score, 4)];

  return { score: Math.min(score, 4), feedback };
}
