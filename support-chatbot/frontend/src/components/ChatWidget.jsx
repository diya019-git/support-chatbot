import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import client from "../api/client";
import { categoryMeta } from "../lib/categories";

const WELCOME_MESSAGE = {
  sender: "bot",
  message:
    "Hi! \uD83D\uDC4B I'm your virtual support assistant. Ask me about your order, refunds, " +
    "your account, or any technical issue \u2014 I'll do my best to help, and connect you with " +
    "a human if I can't.",
  category: "general",
};

function TypingBubble() {
  return (
    <div className="flex animate-bubble-in items-center gap-1 self-start rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-1.5 w-1.5 rounded-full bg-muted"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.sender === "user";
  const meta = categoryMeta(msg.category);

  return (
    <div className={`flex animate-bubble-in flex-col gap-1 ${isUser ? "items-end self-end" : "items-start self-start"}`}>
      <div
        className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-primary text-white"
            : "rounded-bl-sm border border-border bg-surface text-ink"
        }`}
      >
        {msg.message}
      </div>
      {!isUser && msg.category && (
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
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [sessionId, setSessionId] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("sp_chat_session") : null
  );
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Restore a previous conversation, if one exists.
  useEffect(() => {
    if (!sessionId) return;
    client
      .get(`/chat/${sessionId}`)
      .then((res) => {
        if (res.data?.messages?.length) {
          setMessages([WELCOME_MESSAGE, ...res.data.messages]);
          setEscalated(res.data.status === "escalated");
        }
      })
      .catch(() => {
        localStorage.removeItem("sp_chat_session");
        setSessionId(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("sp:open-chat", handler);
    return () => window.removeEventListener("sp:open-chat", handler);
  }, []);

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { sender: "user", message: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await client.post("/chat", { session_id: sessionId, message: text });
      const { session_id, response, status } = res.data;

      if (!sessionId) {
        setSessionId(session_id);
        localStorage.setItem("sp_chat_session", session_id);
      }

      setMessages((prev) => [
        ...prev,
        { sender: "bot", message: response.message, category: response.category },
      ]);
      setEscalated(status === "escalated");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          message: "Sorry, I couldn't reach the support server. Please try again shortly.",
          category: "general",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="animate-panel-in fixed bottom-24 right-4 z-50 flex h-[min(34rem,calc(100vh-7rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl2 border border-border bg-surface shadow-panel sm:right-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <MessageCircle size={18} />
              </div>
              <div>
                <p className="font-display text-sm font-semibold leading-tight">Support Assistant</p>
                <p className="flex items-center gap-1.5 text-xs text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online &mdash; usually replies instantly
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-bg px-4 py-4">
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <MessageBubble key={i} msg={m} />
              ))}
              {loading && <TypingBubble />}
            </div>
          </div>

          {/* Escalation banner */}
          {escalated && (
            <div className="border-t border-category-escalated/20 bg-category-escalated/10 px-4 py-2 text-xs font-medium text-category-escalated">
              This conversation has been flagged for a human agent. They'll pick it up here shortly.
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border bg-surface p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full border border-border bg-bg px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary-dark shadow-panel transition hover:bg-accent-dark hover:scale-105 sm:right-6 sm:bottom-6"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && escalated && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-category-escalated text-[10px] font-bold text-white">
            !
          </span>
        )}
      </button>
    </>
  );
}
