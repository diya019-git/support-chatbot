import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Bot, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || "/admin";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl2 bg-primary text-white">
            <Bot size={22} />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">SupportPilot</h1>
          <p className="mt-1 text-sm text-muted">Sign in to the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl2 border border-border bg-surface p-6 shadow-panel">
          <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="admin"
            autoComplete="username"
            required
          />

          <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-category-escalated/10 px-3 py-2 text-sm text-category-escalated">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Demo credentials: <span className="font-mono">admin / admin123</span> (full access) or{" "}
          <span className="font-mono">agent / agent123</span> (agent role)
        </p>
      </div>
    </div>
  );
}
