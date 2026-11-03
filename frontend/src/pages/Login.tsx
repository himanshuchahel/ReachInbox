import { useState } from "react";
import axios from "axios";
import { Mail } from "lucide-react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError("");

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      // Backend se Google OAuth URL fetch karo
      const response = await axios.get(`${apiUrl}/auth/google`);

      const authUrl = response.data.authUrl;

      if (!authUrl) {
        throw new Error("Google authentication URL not received");
      }

      // Browser ko Google OAuth page par redirect karo
      window.location.assign(authUrl);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message || "Unable to connect to Google."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      }

      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-5">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Mail size={28} />
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">ReachInbox</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Smart email scheduling and campaign management.
          </p>
        </div>

        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.77 7.18l7.73 6C44.4 37.97 46.98 31.72 46.98 24.55Z" />
            <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.45-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
          </svg>

          {loading ? "Connecting to Google..." : "Continue with Google"}
        </button>

        {error && (
          <p className="mt-4 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secure authentication powered by Google OAuth.
        </p>
      </div>
    </main>
  );
}