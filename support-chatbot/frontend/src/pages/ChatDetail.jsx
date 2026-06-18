import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import client from "../api/client";
import { categoryMeta, statusMeta } from "../lib/categories";

const STATUS_OPTIONS = ["active", "escalated", "resolved"];

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  function load() {
    client
      .get(`/admin/chats/${sessionId}`)
      .then((res) => setSession(res.data))
      .catch(() => setError("Couldn't load this conversation."));
  }

  useEffect(load, [sessionId]);

  async function handleStatusChange(status) {
    setUpdating(true);
    try {
      const res = await client.put(`/admin/chats/${sessionId}/status`, { status });
      setSession((prev) => ({ ...prev, status: res.data.status }));
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this conversation? This can't be undone.")) return;
    await client.delete(`/admin/chats/${sessionId}`);
    navigate("/admin/chats");
  }

  if (error) return <p className="text-sm text-category-escalated">{error}</p>;
  if (!session) return <p className="font-mono text-sm text-muted">Loading conversation...</p>;

  const meta = statusMeta(session.status);

  return (
    <div>
      <Link to="/admin/chats" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <ArrowLeft size={15} />
        Back to chat history
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{session.user_name || "Guest"}</h1>
          <p className="mt-1 font-mono text-xs text-muted">
            Session {session.session_id} &middot; started {formatDate(session.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: meta.bg, color: meta.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
            {meta.label}
          </span>
          <button
            onClick={handleDelete}
            className="rounded-full border border-border p-2 text-muted transition hover:border-category-escalated hover:text-category-escalated"
            aria-label="Delete conversation"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Status controls */}
      <div className="mb-6 flex items-center gap-2 rounded-xl2 border border-border bg-surface p-3">
        <span className="px-2 text-sm font-medium text-muted">Set status:</span>
        {STATUS_OPTIONS.map((s) => {
          const m = statusMeta(s);
          const active = session.status === s;
          return (
            <button
              key={s}
              disabled={updating}
              onClick={() => handleStatusChange(s)}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium transition disabled:opacity-60"
              style={
                active
                  ? { backgroundColor: m.color, color: "#fff" }
                  : { border: "1px solid #DCE4DC", color: "#1A2421" }
              }
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Transcript */}
      <div className="rounded-xl2 border border-border bg-surface p-5">
        <div className="flex flex-col gap-4">
          {session.messages.map((m) => {
            const isUser = m.sender === "user";
            const cMeta = m.category ? categoryMeta(m.category) : null;
            return (
              <div key={m.id} className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? "rounded-br-sm bg-primary text-white"
                      : "rounded-bl-sm border border-border bg-bg text-ink"
                  }`}
                >
                  {m.message}
                </div>
                <div className="flex items-center gap-2 px-1 text-xs text-muted">
                  <span>{formatDate(m.timestamp)}</span>
                  {cMeta && (
                    <span
                      className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ backgroundColor: cMeta.bg, color: cMeta.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cMeta.color }} />
                      {cMeta.label}
                    </span>
                  )}
                  {m.confidence != null && (
                    <span className="font-mono">conf {Math.round(m.confidence * 100)}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
