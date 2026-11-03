import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/campaigns": "Campaigns",
  "/campaigns/new": "Create Campaign",
  "/emails": "Emails",
  "/senders": "Senders",
  "/search": "Search",
  "/integrations": "Integrations",
  "/settings": "Settings",
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle =
    pageTitles[location.pathname] || "ReachInbox";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-muted lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div>
              <h2 className="text-sm font-semibold">{pageTitle}</h2>
              <p className="hidden text-xs text-muted-foreground sm:block">
                ReachInbox / {pageTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/search"
              aria-label="Search emails"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Search size={19} />
            </Link>

            <button
              aria-label="Notifications"
              className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Bell size={19} />
            </button>

            <div className="h-7 w-px bg-border" />

            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                HI
              </div>

              <span className="hidden text-sm font-medium sm:block">
                Account
              </span>

              <ChevronDown
                size={15}
                className="hidden text-muted-foreground sm:block"
              />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}