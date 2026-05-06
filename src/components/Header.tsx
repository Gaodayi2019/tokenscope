"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/context";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/lib/supabase";

export function Header() {
  const { locale, t, setLocale } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const navLinks = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.channels, href: "/channels" },
    { label: t.nav.free, href: "/free" },
    { label: t.nav.compare, href: "/compare" },
    { label: t.nav.guides, href: "/guides" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-card-border bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm">
              TS
            </div>
            <span className="text-lg font-bold text-foreground">
              Token<span className="text-primary">Scope</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
              className="rounded-lg border border-card-border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {locale === "zh" ? "EN" : "中文"}
            </button>

            {/* Auth Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">{user.email?.split("@")[0]}</span>
                  <button onClick={handleLogout} className="rounded-lg border border-card-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground">
                    {t.nav.logout}
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => { setAuthMode("login"); setAuthOpen(true); }} className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground">
                    {t.nav.login}
                  </button>
                  <button onClick={() => { setAuthMode("signup"); setAuthOpen(true); }} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark">
                    {t.nav.signup}
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden rounded-lg p-2 text-muted hover:bg-surface hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-card-border bg-bg-secondary px-4 pb-4 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-3 flex gap-2">
              {user ? (
                <>
                  <span className="flex-1 text-center text-sm text-muted py-2">{user.email?.split("@")[0]}</span>
                  <button onClick={handleLogout} className="flex-1 rounded-lg border border-card-border px-3 py-2 text-sm text-muted hover:text-foreground">
                    {t.nav.logout}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setAuthMode("login"); setAuthOpen(true); }} className="flex-1 rounded-lg border border-card-border px-3 py-2 text-sm text-muted hover:text-foreground">
                    {t.nav.login}
                  </button>
                  <button onClick={() => { setAuthMode("signup"); setAuthOpen(true); }} className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white">
                    {t.nav.signup}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </>
  );
}
