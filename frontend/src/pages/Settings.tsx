import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Shield, User } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);

  const logout = () => {
    localStorage.removeItem("reachinbox_token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your account preferences.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <User size={21} />
          <div>
            <h2 className="font-semibold">Account</h2>
            <p className="text-sm text-muted-foreground">
              Your ReachInbox account information.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">Authentication</p>
          <p className="mt-1 text-sm font-medium">Google OAuth</p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <Bell size={21} />
          <div>
            <h2 className="font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Manage dashboard notification preferences.
            </p>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-center justify-between">
          <span className="text-sm">Enable notifications</span>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            className="size-4 accent-primary"
          />
        </label>
      </section>

      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <Shield size={21} />
          <div>
            <h2 className="font-semibold">Security</h2>
            <p className="text-sm text-muted-foreground">
              Your session is secured using JWT authentication.
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="mt-5 flex items-center gap-2 rounded-lg border border-destructive/30 px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
        >
          <LogOut size={16} /> Sign out
        </button>
      </section>
    </div>
  );
}