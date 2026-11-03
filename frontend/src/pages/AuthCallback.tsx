
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  const handled = useRef(false);

  const [message, setMessage] = useState(
    "Completing Google login..."
  );

  useEffect(() => {
    // Prevent React StrictMode duplicate execution
    if (handled.current) return;

    handled.current = true;

    const params = new URLSearchParams(
      window.location.hash.replace(/^#/, "")
    );

    const token = params.get("token");

    if (!token) {
      setMessage("Authentication failed. Please login again.");

      navigate("/login?error=missing_token", {
        replace: true,
      });

      return;
    }

    try {
      localStorage.setItem("reachinbox_token", token);

      // Verify token was stored
      const savedToken = localStorage.getItem("reachinbox_token");

      if (!savedToken) {
        throw new Error("Token storage failed");
      }

      // Remove token from browser URL
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      setMessage("Login successful! Redirecting to dashboard...");

      navigate("/", { replace: true });

    } catch (error) {
      console.error("Authentication storage failed:", error);

      localStorage.removeItem("reachinbox_token");

      navigate("/login?error=token_storage_failed", {
        replace: true,
      });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-xl border bg-white p-8 text-center shadow-sm">

        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

        <h2 className="text-xl font-semibold text-slate-900">
          ReachInbox
        </h2>

        <p className="mt-3 text-sm text-slate-500">
          {message}
        </p>

      </div>
    </div>
  );
}
