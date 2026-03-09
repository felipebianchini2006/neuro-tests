"use client";

import { useEffect, useMemo, useState } from "react";

import { Copy, LogOut, MonitorPlay, UserRound } from "lucide-react";

import type { TestType } from "@/lib/content/catalog";
import type {
  SessionRecord,
  SessionSnapshot,
} from "@/lib/server/session-repository";

type AdminDashboardProps = {
  initialSessions: SessionRecord[];
  persistentStoreEnabled: boolean;
};

function buildSessionUrl(origin: string, kind: "p" | "o", token: string) {
  const basePath = `/${kind}/${token}`;
  return origin ? `${origin}${basePath}` : basePath;
}

function getTestTypeLabel(testType: TestType) {
  return testType === "sequence" ? "Arranjo de Figuras" : "Cubos";
}

function getSessionStatusLabel(status: SessionRecord["status"]) {
  if (status === "completed") {
    return "Concluída";
  }

  if (status === "in_progress") {
    return "Em andamento";
  }

  return "Pendente";
}

export function AdminDashboard({
  initialSessions,
  persistentStoreEnabled,
}: AdminDashboardProps) {
  const [participantCode, setParticipantCode] = useState("");
  const [testType, setTestType] = useState<TestType>("sequence");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [sessions, setSessions] = useState<SessionRecord[]>(initialSessions);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const modeLabel = useMemo(
    () => (persistentStoreEnabled ? "Supabase" : "Memória local"),
    [persistentStoreEnabled],
  );

  const createSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ participantCode, testType }),
      });

      const data = (await response.json()) as {
        error?: string;
        snapshot?: SessionSnapshot;
      };

      if (!response.ok || !data.snapshot) {
        throw new Error(data.error ?? "Não foi possível criar a sessão.");
      }

      setSessions((current) => [
        data.snapshot.session,
        ...current.filter((session) => session.token !== data.snapshot!.session.token),
      ]);
      setParticipantCode("");
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : "Não foi possível criar a sessão.",
      );
    } finally {
      setBusy(false);
    }
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[0_20px_40px_rgba(34,29,22,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
              Nova aplicação
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
              Gerar link de sessão
            </h1>
          </div>
          <span className="rounded-full bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[color:var(--ink-soft)]">
            Armazenamento: {modeLabel}
          </span>
        </div>

        <form className="mt-6 space-y-5" onSubmit={createSession}>
          <div className="space-y-2">
            <label
              htmlFor="participant-code"
              className="text-sm font-medium text-[color:var(--ink)]"
            >
              Identificador do avaliado
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
              <input
                id="participant-code"
                value={participantCode}
                onChange={(event) => setParticipantCode(event.target.value)}
                placeholder="Ex.: Paciente 08-03 / R.B."
                className="h-12 w-full rounded-2xl border border-[color:var(--line)] bg-[color:var(--paper)] pl-11 pr-4 text-sm text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-[color:var(--ink)]">Tipo de teste</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTestType("sequence")}
                className={[
                  "rounded-[1.4rem] border p-4 text-left transition",
                  testType === "sequence"
                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                    : "border-[color:var(--line)] bg-[color:var(--paper)]",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-[color:var(--ink)]">
                  Arranjo de Figuras
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                  Histórias com imagens embaralhadas para ordenar.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setTestType("cubes")}
                className={[
                  "rounded-[1.4rem] border p-4 text-left transition",
                  testType === "cubes"
                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                    : "border-[color:var(--line)] bg-[color:var(--paper)]",
                ].join(" ")}
              >
                <p className="text-sm font-semibold text-[color:var(--ink)]">Cubos</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                  Montagem de padrões bicolores em grades 2x2 e 3x3.
                </p>
              </button>
            </div>
          </div>

          {error ? (
            <p className="text-sm font-medium text-[color:var(--danger)]">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy}
              className="min-h-11 rounded-full bg-[color:var(--ink)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Criar sessão
            </button>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                window.location.reload();
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--line)] px-5 text-sm font-semibold text-[color:var(--ink)]"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[0_20px_40px_rgba(34,29,22,0.08)]">
        <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
          Sessões criadas
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
          {sessions.length > 0
            ? `${sessions.length} ${sessions.length === 1 ? "sessão no painel" : "sessões no painel"}`
            : "Nenhuma sessão gerada ainda"}
        </h2>

        {sessions.length > 0 ? (
          <div className="mt-6 space-y-4">
            {sessions.map((session) => {
              const participantUrl = buildSessionUrl(origin, "p", session.token);
              const observerUrl = buildSessionUrl(origin, "o", session.token);

              return (
                <article
                  key={session.token}
                  className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--paper)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                        {getTestTypeLabel(session.testType)}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[color:var(--ink)]">
                        {session.participantCode}
                      </h3>
                    </div>
                    <span className="rounded-full bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[color:var(--ink-soft)]">
                      {getSessionStatusLabel(session.status)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                        Link do avaliado
                      </p>
                      <p className="mt-2 break-all text-sm text-[color:var(--ink)]">
                        {participantUrl}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(buildSessionUrl(window.location.origin, "p", session.token))
                        }
                        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--line)] px-4 text-sm font-semibold text-[color:var(--ink)]"
                      >
                        <Copy className="h-4 w-4" />
                        Copiar link
                      </button>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                        Link do observador
                      </p>
                      <p className="mt-2 break-all text-sm text-[color:var(--ink)]">
                        {observerUrl}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(buildSessionUrl(window.location.origin, "o", session.token))
                        }
                        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--line)] px-4 text-sm font-semibold text-[color:var(--ink)]"
                      >
                        <MonitorPlay className="h-4 w-4" />
                        Copiar acompanhamento
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-[color:var(--line)] bg-[color:var(--paper)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
            O painel lista as sessões criadas no armazenamento atual. Depois você
            compartilha o link do avaliado e acompanha em tempo real pelo link do
            observador.
          </div>
        )}
      </section>
    </div>
  );
}
