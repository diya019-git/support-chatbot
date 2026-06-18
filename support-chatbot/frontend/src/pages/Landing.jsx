import { Link } from "react-router-dom";
import { Package, RotateCcw, UserCircle, Wrench, HelpCircle, Bot, BarChart3, ShieldCheck } from "lucide-react";
import ChatWidget from "../components/ChatWidget";
import { CATEGORY_META } from "../lib/categories";

const CATEGORY_ICONS = {
  order_status: Package,
  refund: RotateCcw,
  account: UserCircle,
  technical: Wrench,
  general: HelpCircle,
};

const CATEGORY_EXAMPLES = {
  order_status: "\u201CWhere is my order?\u201D",
  refund: "\u201CWhat's your refund policy?\u201D",
  account: "\u201CHow do I reset my password?\u201D",
  technical: "\u201CThe app keeps crashing.\u201D",
  general: "\u201CWhat are your support hours?\u201D",
};

const TRANSCRIPT = [
  { sender: "user", text: "Hey, where is my order? It's been 5 days." },
  {
    sender: "bot",
    category: "order_status",
    text: "You can track your order from 'My Orders'. Share your order ID and I'll check the latest status.",
  },
  { sender: "user", text: "It's #48213. Also, can I get a refund if it's late?" },
  {
    sender: "bot",
    category: "refund",
    text: "Refunds are available within 7 days of delivery for unused items in original packaging.",
  },
];

function MockTranscript() {
  return (
    <div className="w-full rounded-xl2 border border-border bg-surface p-4 shadow-panel sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
          <Bot size={16} />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-ink">Support Assistant</p>
          <p className="text-xs text-muted">Live preview</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {TRANSCRIPT.map((m, i) => {
          const isUser = m.sender === "user";
          const meta = m.category ? CATEGORY_META[m.category] : null;
          return (
            <div key={i} className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  isUser
                    ? "rounded-br-sm bg-primary text-white"
                    : "rounded-bl-sm border border-border bg-bg text-ink"
                }`}
              >
                {m.text}
              </div>
              {meta && (
                <span
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: meta.bg, color: meta.color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                  {meta.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Bot size={18} />
            </div>
            <span className="font-display text-lg font-bold text-ink">SupportPilot</span>
          </div>
          <Link
            to="/admin/login"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition hover:border-primary hover:text-primary"
          >
            Admin login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-10">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            24/7 automated support
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] text-ink sm:text-5xl">
            Answers before your team even sees the ticket.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
            SupportPilot answers the questions you hear every day &mdash; order status, refunds,
            account help, and technical issues &mdash; then hands anything it can't solve straight
            to your team, with full context attached.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => window.dispatchEvent(new Event("sp:open-chat"))}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-primary-dark transition hover:bg-accent-dark"
            >
              Try the assistant
            </button>
            <Link
              to="/admin/login"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
            >
              View admin dashboard
            </Link>
          </div>
        </div>
        <MockTranscript />
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="font-display text-2xl font-bold text-ink">What it can handle today</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Every reply is tagged with one of five categories, so your team can see exactly what
          customers are asking about &mdash; in the chat, and on the analytics dashboard.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const Icon = CATEGORY_ICONS[key];
            return (
              <div key={key} className="rounded-xl2 border border-border bg-surface p-5">
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: meta.bg, color: meta.color }}
                >
                  <Icon size={18} />
                </div>
                <p className="font-display text-sm font-semibold text-ink">{meta.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{CATEGORY_EXAMPLES[key]}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 rounded-xl2 border border-border bg-surface p-8 sm:grid-cols-3">
          <div>
            <Bot className="text-primary" size={22} />
            <p className="mt-3 font-display text-sm font-semibold text-ink">Instant FAQ matching</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              A lightweight NLP engine matches each question to the right knowledge-base answer
              &mdash; no rigid keyword lists required.
            </p>
          </div>
          <div>
            <ShieldCheck className="text-primary" size={22} />
            <p className="mt-3 font-display text-sm font-semibold text-ink">Smart escalation</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              When the assistant isn't confident, the conversation is flagged for a human agent
              automatically &mdash; nothing falls through the cracks.
            </p>
          </div>
          <div>
            <BarChart3 className="text-primary" size={22} />
            <p className="mt-3 font-display text-sm font-semibold text-ink">Built-in analytics</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Track chat volume, resolution rate, and your most-asked questions from a single
              admin dashboard.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted">
        SupportPilot &mdash; AI customer support chatbot demo.
      </footer>

      <ChatWidget />
    </div>
  );
}
