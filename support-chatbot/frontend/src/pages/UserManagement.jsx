import { useEffect, useState } from "react";
import { Plus, Trash2, X, ShieldCheck, Headset } from "lucide-react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = { username: "", password: "", role: "agent" };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function NewUserModal({ onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onCreate(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't create user.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-sm rounded-xl2 border border-border bg-surface p-6 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Add team member</h2>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:bg-bg hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={4}
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="agent">Agent &mdash; chats &amp; FAQs only</option>
              <option value="admin">Admin &mdash; full access</option>
            </select>
          </div>

          {error && <p className="text-sm text-category-escalated">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink transition hover:border-primary hover:text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  function load() {
    setLoading(true);
    client
      .get("/auth/users")
      .then((res) => setUsers(res.data))
      .catch(() => setError("Couldn't load users."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(form) {
    const res = await client.post("/auth/users", form);
    setUsers((prev) => [...prev, res.data]);
  }

  async function handleDelete(u) {
    if (!window.confirm(`Remove ${u.username}? They will no longer be able to log in.`)) return;
    await client.delete(`/auth/users/${u.id}`);
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">User Management</h1>
          <p className="mt-1 text-sm text-muted">Manage who can access the support dashboard.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-primary-dark transition hover:bg-accent-dark"
        >
          <Plus size={16} />
          Add team member
        </button>
      </div>

      {error && <p className="text-sm text-category-escalated">{error}</p>}
      {loading ? (
        <p className="font-mono text-sm text-muted">Loading users...</p>
      ) : (
        <div className="overflow-hidden rounded-xl2 border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-bg">
                  <td className="px-5 py-3 font-medium text-ink">
                    {u.username}
                    {u.id === currentUser?.id && <span className="ml-2 text-xs text-muted">(you)</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 text-ink">
                      {u.role === "admin" ? <ShieldCheck size={14} className="text-primary" /> : <Headset size={14} className="text-muted" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted">{formatDate(u.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="rounded-full p-2 text-muted transition hover:bg-bg hover:text-category-escalated"
                        aria-label="Remove user"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <NewUserModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </div>
  );
}
