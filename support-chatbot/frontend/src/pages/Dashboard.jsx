import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { MessagesSquare, Activity, AlertTriangle, CheckCircle2, Percent } from "lucide-react";
import client from "../api/client";
import { categoryMeta } from "../lib/categories";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl2 border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}1A`, color: accent }}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    client
      .get("/admin/analytics")
      .then((res) => setData(res.data))
      .catch(() => setError("Couldn't load analytics."));
  }, []);

  if (error) return <p className="text-sm text-category-escalated">{error}</p>;
  if (!data) return <p className="font-mono text-sm text-muted">Loading analytics...</p>;

  const categoryData = Object.entries(data.category_breakdown || {}).map(([key, value]) => ({
    key,
    name: categoryMeta(key).label,
    value,
    color: categoryMeta(key).color,
  }));

  const timeData = (data.chats_over_time || []).map((d) => ({
    date: formatDate(d.date),
    count: d.count,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">An overview of chatbot activity and performance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={MessagesSquare} label="Total chats" value={data.total_chats} accent="#1F4D45" />
        <StatCard icon={Activity} label="Active" value={data.active_chats} accent="#3B7DD8" />
        <StatCard icon={AlertTriangle} label="Escalated" value={data.escalated_chats} accent="#D9455A" />
        <StatCard icon={CheckCircle2} label="Resolved" value={data.resolved_chats} accent="#2FA66B" />
        <StatCard icon={Percent} label="Auto-resolve rate" value={`${data.success_rate}%`} accent="#E2A33B" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Chats over time */}
        <div className="rounded-xl2 border border-border bg-surface p-5">
          <p className="font-display text-sm font-semibold text-ink">Chats started, last 7 days</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="chatGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F4D45" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#1F4D45" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE4DC" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#5E6E69" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#5E6E69" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#1F4D45" strokeWidth={2} fill="url(#chatGradient)" name="Chats" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="rounded-xl2 border border-border bg-surface p-5">
          <p className="font-display text-sm font-semibold text-ink">Replies by category</p>
          <div className="mt-4 h-64">
            {categoryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted">No chats yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DCE4DC" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#5E6E69" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#1A2421" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Replies">
                    {categoryData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top questions */}
      <div className="mt-6 rounded-xl2 border border-border bg-surface p-5">
        <p className="font-display text-sm font-semibold text-ink">Most-asked questions</p>
        {data.top_questions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No questions matched yet &mdash; chat with the assistant to see data here.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {data.top_questions.map((q, i) => {
              const meta = categoryMeta(q.category);
              return (
                <div key={q.faq_id} className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-ink">{q.question}</p>
                      <span
                        className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold text-ink">{q.hits}{"\u00D7"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
