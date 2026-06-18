import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search } from "lucide-react";
import client from "../api/client";
import { statusMeta } from "../lib/categories";

const STATUSES = ["active", "escalated", "resolved"];

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [search, setSearch] = useState("");

  function load() {
    setLoading(true);
    client
      .get("/admin/chats")
      .then((res) => setSessions(res.data))
      .catch(() => setError("Couldn't load chat sessions."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (activeStatus !== "all" && s.status !== activeStatus) return false;
      if (search) {
        const term = search.toLowerCase();
        if (!s.user_name?.toLowerCase().includes(term) && !s.session_id.toLowerCase().includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [sessions, activeStatus, search]);

  const counts = useMemo(() => {
    const c = { all: sessions.length, active: 0, escalated: 0, resolved: 0 };
    sessions.forEach((s) => {
      c[s.status] = (c[s.status] || 0) + 1;
    });
    return c;
  }, [sessions]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Chat History</h1>
        <p className="mt-1 text-sm text-muted">Every conversation the assistant has had with a customer.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveStatus("all")}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              activeStatus === "all" ? "bg-primary text-white" : "border border-border text-ink hover:border-primary"
            }`}
          >
            All ({counts.all})
          </button>
          {STATUSES.map((s) => {
            const meta = statusMeta(s);
            const active = activeStatus === s;
            return (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition"
                style={
                  active
                    ? { backgroundColor: meta.color, color: "#fff" }
                    : { border: "1px solid #DCE4DC", color: "#1A2421" }
                }
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: active ? "#fff" : meta.color }} />
                {meta.label} ({counts[s] || 0})
              </button>
            );
          })}
        </div>
        <div className="relative ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or session ID..."
            className="w-64 rounded-full border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {error && <p className="text-sm text-category-escalated">{error}</p>}
      {loading ? (
        <p className="font-mono text-sm text-muted">Loading chats...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
          No conversations match this filter yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl2 border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Session ID</th>
                <th className="px-5 py-3 font-medium">Messages</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last activity</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const meta = statusMeta(s.status);
                return (
                  <tr key={s.session_id} className="border-b border-border last:border-b-0 hover:bg-bg">
                    <td className="px-5 py-3 font-medium text-ink">{s.user_name || "Guest"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{s.session_id.slice(0, 8)}...</td>
                    <td className="px-5 py-3 text-ink">{s.message_count}</td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDate(s.updated_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/admin/chats/${s.session_id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        View <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
