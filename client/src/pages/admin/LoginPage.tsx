import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../lib/api";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ username: username.trim().toLowerCase(), password });
      setLocation("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Inloggen mislukt");
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-display text-2xl">Atelier</div>
          <div className="script-accent text-3xl leading-none -mt-1">Boterbloem</div>
          <div className="tag mt-3">Admin</div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Gebruikersnaam</label>
            <input
              className="input"
              type="text"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Wachtwoord</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-sm text-burgundy">{error}</div>}
          <button type="submit" disabled={login.isPending} className="btn-gold w-full">
            {login.isPending ? "Inloggen…" : "Inloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}
