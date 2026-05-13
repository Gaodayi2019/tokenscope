"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthStatus = "loading" | "success" | "error";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const client = createSupabaseBrowserClient();

      // Check for OAuth error params
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      const errorDescription = params.get("error_description");

      if (errorParam) {
        setStatus("error");
        setErrorMessage(errorDescription || errorParam);
        setTimeout(() => {
          window.location.href = `/?auth_error=${encodeURIComponent(errorDescription || errorParam)}`;
        }, 3000);
        return;
      }

      // Check for PKCE code in query params (OAuth flow)
      const code = params.get("code");
      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus("error");
          setErrorMessage(error.message);
          setTimeout(() => {
            window.location.href = `/?auth_error=${encodeURIComponent(error.message)}`;
          }, 3000);
          return;
        }

        setStatus("success");
        const next = params.get("next") || "/";
        setTimeout(() => {
          window.location.href = next;
        }, 500);
        return;
      }

      // Implicit flow: access_token in hash fragment (email confirmation)
      // @supabase/supabase-js with detectSessionInUrl=true should auto-process this.
      // The createBrowserClient sets detectSessionInUrl=true by default in browser.
      // Give it a moment to process the hash fragment.
      try {
        // First, try to get the session — the library may have already processed it
        const { data: { session }, error: sessionError } = await client.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          setStatus("success");
          // Clear the hash fragment for cleanliness
          window.location.hash = "";
          setTimeout(() => {
            window.location.href = "/";
          }, 500);
          return;
        }

        // Session not found yet — manually parse hash fragment as fallback
        // Format: #access_token=xxx&refresh_token=yyy&type=signup
        const hash = window.location.hash.substring(1); // remove #
        if (hash && hash.includes("access_token")) {
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            // Use the session directly
            const { data, error: setUserError } = await client.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setUserError) {
              throw setUserError;
            }

            if (data.session) {
              setStatus("success");
              window.location.hash = "";
              setTimeout(() => {
                window.location.href = "/";
              }, 500);
              return;
            }
          }
        }

        // No code, no hash session — truly failed
        setStatus("error");
        setErrorMessage("No authentication data found. Please try signing up again.");
        setTimeout(() => {
          window.location.href = "/?auth_error=auth_callback_failed";
        }, 3000);
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Authentication failed");
        setTimeout(() => {
          window.location.href = `/?auth_error=${encodeURIComponent(err.message || "auth_failed")}`;
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin h-10 w-10 mx-auto mb-4 border-4 border-indigo-500 border-t-transparent rounded-full" />
            <h1 className="text-xl font-bold text-white mb-2">
              Verifying...
            </h1>
            <p className="text-gray-400 text-sm">
              Please wait while we verify your account.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-white mb-2">
              Verified!
            </h1>
            <p className="text-gray-400 text-sm">
              Redirecting you now...
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-red-400 text-sm">
              {errorMessage}
            </p>
            <p className="text-gray-500 text-xs mt-3">
              Redirecting to home page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
