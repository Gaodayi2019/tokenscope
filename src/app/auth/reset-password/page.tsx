"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useI18n } from "@/i18n/context";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // After clicking the email reset link, Supabase redirects here with a valid session
    const client = createSupabaseBrowserClient();
    client.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      setResult({ type: "error", message: t.auth.passwordMinLength });
      return;
    }
    if (password !== confirmPassword) {
      setResult({ type: "error", message: t.auth.passwordMismatch });
      return;
    }

    setLoading(true);
    setResult(null);

    const client = createSupabaseBrowserClient();
    const { error } = await client.auth.updateUser({ password });

    if (error) {
      setResult({ type: "error", message: error.message });
    } else {
      setResult({ type: "success", message: t.auth.passwordResetSuccess });
    }
    setLoading(false);
  };

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-white mb-2">
            {t.auth.resetPassword}
          </h1>
          <p className="text-gray-400 text-sm">
            {t.auth.resetPasswordLinkExpired}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl p-8 border border-gray-800">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🔒</div>
          <h1 className="text-xl font-bold text-white">
            {t.auth.resetPassword}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t.auth.enterNewPassword}
          </p>
        </div>

        {result && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              result.type === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {result.message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t.auth.newPassword}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t.auth.passwordPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t.auth.confirmPassword}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t.auth.confirmPasswordPlaceholder}
            />
          </div>

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "..." : t.auth.resetPassword}
          </button>
        </div>
      </div>
    </div>
  );
}
