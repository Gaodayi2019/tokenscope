"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";

type Mode = "login" | "signup" | "forgotPassword";
type ResultState = { type: "success" | "error"; message: string } | null;

export function AuthModal({ open, onClose, initialMode = "login" }: { open: boolean; onClose: () => void; initialMode?: "login" | "signup" }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState>(null);
  const [signupEmail, setSignupEmail] = useState("");

  useEffect(() => { setMode(initialMode); }, [initialMode]);

  if (!open) return null;

  function clearState() {
    setResult(null);
    setEmail("");
    setPassword("");
    setSignupEmail("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { signUp, signIn, resetPassword } = await import("@/lib/api");
      if (mode === "forgotPassword") {
        await resetPassword(email);
        setResult({ type: "success", message: t.auth.resetPasswordSent });
      } else if (mode === "signup") {
        await signUp(email, password);
        setSignupEmail(email);
        setResult({ type: "success", message: t.auth.signupSuccess });
      } else {
        await signIn(email, password);
        setResult({ type: "success", message: t.auth.loginSuccess });
        setTimeout(onClose, 800);
      }
    } catch (err: any) {
      const msg = err?.message || "";
      let translated = t.auth.failed;
      if (msg.includes("Invalid login credentials")) translated = t.auth.invalidCredentials;
      else if (msg.includes("already registered")) translated = t.auth.alreadyRegistered;
      else if (msg.includes("Email not confirmed")) translated = t.auth.emailNotConfirmed;
      else if (msg.includes("Password should be")) translated = t.auth.passwordTooShort;
      else if (msg.includes("rate limit") || msg.includes("too many")) translated = t.auth.rateLimited;
      setResult({ type: "error", message: translated });
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "github" | "google") {
    setLoading(true);
    setResult(null);
    try {
      const { signInWithProvider } = await import("@/lib/api");
      await signInWithProvider(provider);
    } catch (err: any) {
      setResult({ type: "error", message: err?.message || t.auth.failed });
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!signupEmail) return;
    setLoading(true);
    try {
      const { resendVerification } = await import("@/lib/api");
      await resendVerification(signupEmail);
      setResult({ type: "success", message: t.auth.verificationResent });
    } catch (err: any) {
      setResult({ type: "error", message: err?.message || t.auth.failed });
    } finally {
      setLoading(false);
    }
  }

  const showOAuth = mode === "login" || mode === "signup";
  const showResend = mode === "signup" && result?.type === "success" && signupEmail;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card-bg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 text-center">
          <h2 className="text-xl font-bold text-foreground">
            {mode === "forgotPassword" ? t.auth.forgotPassword : mode === "login" ? t.auth.login : t.auth.signup}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {mode === "forgotPassword" ? t.auth.forgotPasswordHint : t.auth.signupHint}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder={t.auth.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-card-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {mode !== "forgotPassword" && (
            <input
              type="password"
              required
              minLength={6}
              placeholder={t.auth.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-card-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? t.auth.processing : mode === "forgotPassword" ? t.auth.sendResetLink : mode === "login" ? t.auth.login : t.auth.signup}
          </button>
        </form>

        {result && (
          <p className={`mt-3 text-center text-sm ${result.type === "success" ? "text-green-400" : "text-red-400"}`}>
            {result.message}
          </p>
        )}

        {showResend && (
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-primary/30 bg-primary/10 py-2 text-sm text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          >
            {t.auth.resendVerification}
          </button>
        )}

        {showOAuth && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-card-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card-bg px-2 text-muted">{t.auth.orContinueWith}</span></div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleOAuth("github")}
                disabled={loading}
                className="flex-1 rounded-xl border border-card-border bg-surface py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50"
              >
                GitHub
              </button>
              <button
                onClick={() => handleOAuth("google")}
                disabled={loading}
                className="flex-1 rounded-xl border border-card-border bg-surface py-2.5 text-sm text-foreground transition-colors hover:bg-surface-hover disabled:opacity-50"
              >
                Google
              </button>
            </div>
          </>
        )}

        <div className="mt-4 space-y-2 text-center text-sm text-muted">
          {mode === "login" && (
            <button onClick={() => { setMode("forgotPassword"); clearState(); }} className="text-primary hover:underline">
              {t.auth.forgotPassword}
            </button>
          )}
          {mode === "forgotPassword" && (
            <button onClick={() => { setMode("login"); clearState(); }} className="text-primary hover:underline">
              {t.auth.backToLogin}
            </button>
          )}
          <p>
            {mode === "login" ? t.auth.noAccount : mode === "signup" ? t.auth.hasAccount : ""}
            {" "}
            {(mode === "login" || mode === "signup") && (
              <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); clearState(); }} className="text-primary hover:underline">
                {mode === "login" ? t.auth.signup : t.auth.login}
              </button>
            )}
          </p>
        </div>

        <button onClick={onClose} className="mt-3 block mx-auto text-xs text-muted hover:text-foreground">
          {t.auth.close}
        </button>
      </div>
    </div>
  );
}
