"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
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
    <div className="space-y-5">
      <section className="rounded-[1.7rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,252,245,0.88)_0%,rgba(239,229,210,0.72)_100%)] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--admin-strong)] text-white shadow-[0_12px_28px_var(--admin-strong-shadow)]">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[color:var(--muted)]">
              Acesso protegido
            </p>
            <h2 className="mt-2 text-[1.85rem] font-semibold tracking-[-0.045em] text-[color:var(--ink)]">
              Entrar no painel
            </h2>
            <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
              Use a senha configurada no ambiente para liberar o workspace
              interno e retomar o fluxo operacional.
            </p>
          </div>
        </div>
      </section>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label
          htmlFor="password"
          className="block rounded-[1.5rem] border border-[color:var(--line)] bg-white/70 p-4"
        >
          <span className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Senha do painel
          </span>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-3 h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--paper)] px-4 text-sm text-[color:var(--ink)] outline-none transition duration-200 focus:border-[rgba(50,111,93,0.4)] focus:ring-4 focus:ring-[rgba(50,111,93,0.12)]"
            placeholder="Digite a senha configurada no ambiente"
          />
        </label>

        {error ? (
          <p className="rounded-[1.35rem] border border-[rgba(180,71,49,0.24)] bg-[rgba(255,245,240,0.86)] px-4 py-3 text-sm font-medium text-[color:var(--danger)]">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-transparent bg-[color:var(--admin-strong)] px-5 text-sm font-semibold text-white transition duration-200 hover:bg-[color:var(--admin-strong-hover)] disabled:cursor-not-allowed disabled:border-[color:var(--admin-disabled-border)] disabled:bg-[color:var(--admin-disabled-surface)] disabled:text-[color:var(--admin-disabled-text)]"
          >
            {busy ? "Entrando..." : "Entrar"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex min-h-12 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/72 px-4 text-center text-xs font-medium text-[color:var(--ink-soft)] sm:w-[12rem]">
            Sessao segura
          </div>
        </div>
      </form>
    </div>
  );
}
