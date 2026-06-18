import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import client from "../api/client";
import { CATEGORIES, categoryMeta } from "../lib/categories";

const EMPTY_FORM = { category: "general", question: "", answer: "", keywords: "" };

function FaqModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-lg rounded-xl2 border border-border bg-surface p-6 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">{isEdit ? "Edit FAQ" : "Add FAQ"}</h2>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:bg-bg hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryMeta(c).label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Question</label>
            <input
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              required
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. How do I reset my password?"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Answer</label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              required
              rows={4}
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="The reply the chatbot will send."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Keywords <span className="text-muted">(comma separated, helps matching)</span>
            </label>
            <input
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="reset password, forgot password, can't log in"
            />
          </div>

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
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add FAQ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FAQManagement() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | {} (new) | faq (edit)

  function load() {
    setLoading(true);
    client
      .get("/admin/faqs")
      .then((res) => setFaqs(res.data))
      .catch(() => setError("Couldn't load FAQs."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    return faqs.filter((f) => {
      if (activeCategory !== "all" && f.category !== activeCategory) return false;
      if (search && !`${f.question} ${f.answer} ${f.keywords}`.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [faqs, activeCategory, search]);

  async function handleSave(form) {
    if (form.id) {
      const res = await client.put(`/admin/faqs/${form.id}`, form);
      setFaqs((prev) => prev.map((f) => (f.id === form.id ? res.data : f)));
    } else {
      const res = await client.post("/admin/faqs", form);
      setFaqs((prev) => [...prev, res.data]);
    }
    setModal(null);
  }

  async function handleDelete(faq) {
    if (!window.confirm(`Delete "${faq.question}"? This can't be undone.`)) return;
    await client.delete(`/admin/faqs/${faq.id}`);
    setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">FAQ Management</h1>
          <p className="mt-1 text-sm text-muted">
            The chatbot matches incoming questions against this knowledge base.
          </p>
        </div>
        <button
          onClick={() => setModal(EMPTY_FORM)}
          className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-primary-dark transition hover:bg-accent-dark"
        >
          <Plus size={16} />
          Add FAQ
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              activeCategory === "all" ? "bg-primary text-white" : "border border-border text-ink hover:border-primary"
            }`}
          >
            All ({faqs.length})
          </button>
          {CATEGORIES.map((c) => {
            const meta = categoryMeta(c);
            const count = faqs.filter((f) => f.category === c).length;
            const active = activeCategory === c;
            return (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition"
                style={
                  active
                    ? { backgroundColor: meta.color, color: "#fff" }
                    : { border: "1px solid #DCE4DC", color: "#1A2421" }
                }
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: active ? "#fff" : meta.color }} />
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
        <div className="relative ml-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs..."
            className="w-56 rounded-full border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {error && <p className="text-sm text-category-escalated">{error}</p>}
      {loading ? (
        <p className="font-mono text-sm text-muted">Loading FAQs...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
          No FAQs match this filter yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((faq) => {
            const meta = categoryMeta(faq.category);
            return (
              <div key={faq.id} className="rounded-xl2 border border-border bg-surface p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span
                      className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      {meta.label}
                    </span>
                    <p className="font-display text-sm font-semibold text-ink">{faq.question}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{faq.answer}</p>
                    {faq.keywords && (
                      <p className="mt-2 font-mono text-xs text-muted">keywords: {faq.keywords}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => setModal(faq)}
                      className="rounded-full p-2 text-muted transition hover:bg-bg hover:text-primary"
                      aria-label="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(faq)}
                      className="rounded-full p-2 text-muted transition hover:bg-bg hover:text-category-escalated"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && <FaqModal initial={modal} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}
