import { NavLink, Outlet } from "react-router-dom";
import { Bot, LayoutDashboard, HelpCircle, MessagesSquare, Users, LogOut, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/chats", label: "Chat History", icon: MessagesSquare },
  { to: "/admin/faqs", label: "FAQ Management", icon: HelpCircle },
  { to: "/admin/users", label: "User Management", icon: Users, adminOnly: true },
];

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col bg-primary text-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <Bot size={18} />
          </div>
          <span className="font-display text-base font-bold">SupportPilot</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-6 py-2.5 text-sm font-medium text-white/70 transition hover:text-white"
        >
          <ExternalLink size={16} />
          View customer site
        </a>

        <div className="m-3 mt-1 rounded-lg bg-white/10 p-3">
          <p className="text-sm font-semibold">{user?.username}</p>
          <p className="font-mono text-xs uppercase tracking-wide text-white/60">{user?.role}</p>
          <button
            onClick={logout}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-white/80 transition hover:text-white"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
