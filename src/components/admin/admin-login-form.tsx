"use client";

import { useState } from "react";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Falha no login.");
      }

      window.location.reload();
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : "Falha no login.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-[color:var(--ink)]"
        >
          Senha do painel
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--paper)] px-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)]"
          placeholder="Digite a senha configurada no ambiente"
        />
      </div>

      {error ? (
        <p className="text-sm font-medium text-[color:var(--danger)]">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="min-h-11 rounded-full bg-[color:var(--ink)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Entrar
      </button>
    </form>
  );
}
