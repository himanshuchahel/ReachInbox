import {
  LayoutDashboard,
  Megaphone,
  Mail,
  Users,
  Search,
  Plug,
  Settings,
  Inbox,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  {
    title: "WORKSPACE",
    items: [
      { name: "Dashboard", path: "/", icon: LayoutDashboard },
      { name: "Campaigns", path: "/campaigns", icon: Megaphone },
      { name: "Emails", path: "/emails", icon: Mail },
      { name: "Senders", path: "/senders", icon: Users },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { name: "Search", path: "/search", icon: Search },
      { name: "Integrations", path: "/integrations", icon: Plug },
    ],
  },
  {
    title: "PREFERENCES",
    items: [
      { name: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/10 bg-[#111827] text-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500">
              <Inbox size={21} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">ReachInbox</h1>
              <p className="text-[10px] tracking-widest text-gray-400">
                EMAIL WORKSPACE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-7">
          {navigation.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-gray-500">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                          isActive
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-950/30"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`
                      }
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs font-medium">ReachInbox Workspace</p>
            <p className="mt-1 text-[11px] text-gray-400">
              Email scheduling made simple.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}