"use client";

import {
  type ReactNode,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  Boxes,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  ExternalLink,
  LayoutGrid,
  LogOut,
  Plus,
  Search,
  Target,
  UserRound,
  XCircle,
} from "lucide-react";

import type { TestType } from "@/lib/content/catalog";
import {
  broadcastSessionSnapshot,
  createSessionChannel,
} from "@/lib/client/session-channel";
import type {
  SessionRecord,
  SessionSnapshot,
  SessionStatus,
} from "@/lib/server/session-repository";

type AdminDashboardProps = {
  initialSessions: SessionRecord[];
  persistentStoreEnabled: boolean;
};

type SessionTab = "open" | "completed";

const surfaceCard =
  "rounded-[1.6rem] border border-[color:var(--line)] bg-[color:var(--surface)] shadow-[0_18px_38px_rgba(49,40,28,0.06)]";
const inputClass =
  "h-11 w-full rounded-[1rem] border border-[color:var(--line)] bg-white/72 px-4 text-sm text-[color:var(--ink)] outline-none transition duration-200 focus:border-[rgba(50,111,93,0.38)] focus:ring-4 focus:ring-[rgba(50,111,93,0.12)]";
const primaryButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] border border-transparent bg-[color:var(--admin-strong)] px-5 text-sm font-semibold text-white transition duration-200 hover:bg-[color:var(--admin-strong-hover)] disabled:cursor-not-allowed disabled:border-[color:var(--admin-disabled-border)] disabled:bg-[color:var(--admin-disabled-surface)] disabled:text-[color:var(--admin-disabled-text)]";

function buildSessionUrl(origin: string, kind: "p" | "o", token: string) {
  const basePath = `/${kind}/${token}`;
  return origin ? `${origin}${basePath}` : basePath;
}

function getTestTypeLabel(testType: TestType) {
  return testType === "sequence" ? "Arranjo de Figuras" : "Cubos";
}

function getSessionStatusLabel(status: SessionStatus) {
  if (status === "completed") return "Encerrada";
  if (status === "in_progress") return "Em andamento";
  return "Pendente";
}

function getStatusClasses(status: SessionStatus) {
  if (status === "completed") {
    return "border-[rgba(43,110,91,0.18)] bg-[rgba(43,110,91,0.12)] text-[color:var(--success)]";
  }
  if (status === "in_progress") {
    return "border-[rgba(150,113,56,0.18)] bg-[rgba(190,152,87,0.12)] text-[#6c4d26]";
  }
  return "border-[color:var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--ink-soft)]";
}

function getSessionBucket(session: SessionRecord): SessionTab {
  return session.status === "completed" ? "completed" : "open";
}

function getCompletedItems(session: SessionRecord) {
  return session.status === "completed"
    ? session.totalItems
    : Math.min(session.currentItemIndex + 1, session.totalItems);
}

function getProgressLabel(session: SessionRecord) {
  return `${getCompletedItems(session)}/${session.totalItems}`;
}

function getProgressRatio(session: SessionRecord) {
  return `${(getCompletedItems(session) / Math.max(session.totalItems, 1)) * 100}%`;
}

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) return "Ainda nao iniciada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function getInitialSelectedTab(sessions: SessionRecord[]): SessionTab {
  return sessions.some((session) => getSessionBucket(session) === "open")
    ? "open"
    : "completed";
}

function getInitialSelectedSessionToken(
  sessions: SessionRecord[],
  tab: SessionTab,
) {
  return sessions.find((session) => getSessionBucket(session) === tab)?.token ?? null;
}

function OverviewCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone: "warning" | "success" | "accent";
}) {
  const toneClass =
    tone === "warning"
      ? "bg-[rgba(190,152,87,0.14)] text-[#7b5b2f]"
      : tone === "success"
        ? "bg-[rgba(43,110,91,0.12)] text-[color:var(--success)]"
        : "bg-[color:var(--accent-soft)] text-[color:var(--accent)]";

  return (
    <article className={`${surfaceCard} p-4`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[color:var(--muted)]">{label}</p>
          <p className="mt-1 truncate text-[1.8rem] font-semibold tracking-[-0.04em] text-[color:var(--ink)]">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] ${toneClass}`}
        >
          {icon}
        </span>
      </div>
    </article>
  );
}

function LinkCard({
  title,
  description,
  href,
  actionLabel,
  onCopy,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  onCopy: () => Promise<void>;
  icon: ReactNode;
}) {
  return (
    <section className="rounded-[1.3rem] border border-[color:var(--line)] bg-[rgba(255,255,255,0.42)] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
          {icon}
        </span>
        <div>
          <p className="font-medium text-[color:var(--ink)]">{title}</p>
          <p className="text-sm text-[color:var(--muted)]">{description}</p>
        </div>
      </div>

      <p className="mt-4 rounded-[0.9rem] border border-[color:var(--line)] bg-white/72 px-3 py-3 font-mono text-xs leading-6 text-[color:var(--ink-soft)]">
        {href}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[color:var(--admin-strong)] px-4 text-sm font-semibold text-white transition duration-200 hover:bg-[color:var(--admin-strong-hover)]"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir
        </a>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--line)] bg-white/76 px-4 text-sm font-semibold text-[color:var(--ink)] transition duration-200 hover:border-[rgba(50,111,93,0.24)]"
        >
          <Copy className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>
    </section>
  );
}

export function AdminDashboard({
  initialSessions,
  persistentStoreEnabled,
}: AdminDashboardProps) {
  const [participantCode, setParticipantCode] = useState("");
  const [testType, setTestType] = useState<TestType>("sequence");
  const [createPending, setCreatePending] = useState(false);
  const [closingToken, setClosingToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sessions, setSessions] = useState<SessionRecord[]>(initialSessions);
  const [selectedTab, setSelectedTab] = useState<SessionTab>(() =>
    getInitialSelectedTab(initialSessions),
  );
  const [selectedSessionToken, setSelectedSessionToken] = useState<string | null>(
    getInitialSelectedSessionToken(initialSessions, getInitialSelectedTab(initialSessions)),
  );

  const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLowerCase());
  const modeLabel = persistentStoreEnabled ? "Supabase ativo" : "Memoria local";

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const openSessions = useMemo(
    () => sessions.filter((session) => getSessionBucket(session) === "open"),
    [sessions],
  );
  const completedSessions = useMemo(
    () => sessions.filter((session) => getSessionBucket(session) === "completed"),
    [sessions],
  );

  const visibleSessions = useMemo(() => {
    const source = selectedTab === "completed" ? completedSessions : openSessions;
    if (!deferredSearchTerm) return source;

    return source.filter((session) =>
      `${session.participantCode} ${session.token}`
        .toLowerCase()
        .includes(deferredSearchTerm),
    );
  }, [completedSessions, deferredSearchTerm, openSessions, selectedTab]);

  useEffect(() => {
    if (!visibleSessions.length) return;
    if (!visibleSessions.some((session) => session.token === selectedSessionToken)) {
      setSelectedSessionToken(visibleSessions[0]?.token ?? null);
    }
  }, [selectedSessionToken, visibleSessions]);

  const selectedSession =
    visibleSessions.find((session) => session.token === selectedSessionToken) ?? null;

  const createSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatePending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantCode, testType }),
      });
      const data = (await response.json()) as { error?: string; snapshot?: SessionSnapshot };
      if (!response.ok || !data.snapshot) {
        throw new Error(data.error ?? "Nao foi possivel criar a sessao.");
      }

      const snapshot = data.snapshot;
      setSessions((current) => [
        snapshot.session,
        ...current.filter((session) => session.token !== snapshot.session.token),
      ]);
      setParticipantCode("");
      setSearchTerm("");
      setSelectedTab("open");
      setSelectedSessionToken(snapshot.session.token);
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : "Nao foi possivel criar a sessao.",
      );
    } finally {
      setCreatePending(false);
    }
  };

  const completeSession = async (token: string) => {
    setClosingToken(token);
    setError(null);

    try {
      const response = await fetch(`/api/admin/sessions/${token}/complete`, {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string; snapshot?: SessionSnapshot };
      if (!response.ok || !data.snapshot) {
        throw new Error(data.error ?? "Nao foi possivel encerrar a sessao.");
      }

      const snapshot = data.snapshot;
      setSessions((current) => [
        snapshot.session,
        ...current.filter((session) => session.token !== snapshot.session.token),
      ]);
      setSelectedTab("completed");
      setSelectedSessionToken(snapshot.session.token);

      await broadcastSessionSnapshot(createSessionChannel(token), snapshot);
    } catch (completionError) {
      setError(
        completionError instanceof Error
          ? completionError.message
          : "Nao foi possivel encerrar a sessao.",
      );
    } finally {
      setClosingToken(null);
    }
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
  };

  const participantUrl = selectedSession
    ? buildSessionUrl(origin, "p", selectedSession.token)
    : "";
  const observerUrl = selectedSession
    ? buildSessionUrl(origin, "o", selectedSession.token)
    : "";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[color:var(--line)] bg-[rgba(252,249,242,0.88)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[96rem] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[color:var(--line)] bg-white/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Workspace clinico
              </span>
              <span className="rounded-full border border-[rgba(50,111,93,0.18)] bg-[color:var(--accent-soft)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">
                {modeLabel}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
                <Activity className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-[color:var(--ink)] sm:text-xl">
                  Painel clinico
                </h1>
                <p className="text-xs text-[color:var(--muted)] sm:text-sm">
                  Controle de sessoes e acompanhamento operacional
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              window.location.reload();
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--line)] bg-white/84 px-4 text-sm font-semibold text-[color:var(--ink)] transition duration-200 hover:border-[rgba(50,111,93,0.28)]"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {error ? (
          <p className="mb-4 rounded-[1.35rem] border border-[rgba(180,71,49,0.18)] bg-[rgba(255,245,240,0.9)] px-4 py-3 text-sm font-medium text-[color:var(--danger)]">
            {error}
          </p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          <OverviewCard
            label="Em aberto"
            value={openSessions.length}
            icon={<Clock3 className="h-5 w-5" />}
            tone="warning"
          />
          <OverviewCard
            label="Encerradas"
            value={completedSessions.length}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="success"
          />
          <OverviewCard
            label="Selecionada"
            value={selectedSession?.participantCode ?? "-"}
            icon={<Target className="h-5 w-5" />}
            tone="accent"
          />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <section className={`${surfaceCard} p-5`}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[0.95rem] bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
                  <Plus className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[color:var(--ink)]">
                    Nova sessao
                  </h2>
                  <p className="text-sm text-[color:var(--muted)]">
                    Registre um avaliado e libere o fluxo.
                  </p>
                </div>
              </div>

              <form className="mt-5 space-y-4" onSubmit={createSession}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[color:var(--ink)]">
                    Identificador do avaliado
                  </span>
                  <span className="relative block">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                    <input
                      id="participant-code"
                      value={participantCode}
                      onChange={(event) => setParticipantCode(event.target.value)}
                      placeholder="Ex.: Paciente 08-03 / R.B."
                      className={`${inputClass} pl-10`}
                    />
                  </span>
                </label>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-[color:var(--ink)]">
                    Tipo de teste
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: "sequence" as const,
                        label: "Arranjo",
                        icon: <LayoutGrid className="h-4 w-4" />,
                      },
                      {
                        id: "cubes" as const,
                        label: "Cubos",
                        icon: <Boxes className="h-4 w-4" />,
                      },
                    ].map((option) => {
                      const isActive = testType === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setTestType(option.id)}
                          className={[
                            "flex min-h-12 items-center justify-center gap-2 rounded-[1rem] border px-3 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(50,111,93,0.12)]",
                            isActive
                              ? "border-[rgba(50,111,93,0.3)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                              : "border-[color:var(--line)] bg-white/62 text-[color:var(--ink-soft)] hover:border-[rgba(50,111,93,0.22)]",
                          ].join(" ")}
                        >
                          {option.icon}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="rounded-[1rem] bg-[rgba(255,255,255,0.56)] px-3 py-3 text-xs leading-6 text-[color:var(--ink-soft)]">
                  A sessao criada entra direto na fila ativa e fica pronta para
                  abertura do link.
                </p>

                <button
                  type="submit"
                  disabled={createPending}
                  className={`${primaryButtonClass} w-full`}
                >
                  <Plus className="h-4 w-4" />
                  {createPending ? "Criando..." : "Criar sessao"}
                </button>
              </form>
            </section>

            <section className={`${surfaceCard} p-5`}>
              <p className="text-sm font-semibold text-[color:var(--ink)]">Sessoes</p>
              <h3 className="mt-1 text-lg font-semibold text-[color:var(--ink)]">
                Navegacao rapida
              </h3>
              <label className="relative mt-4 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por nome ou token"
                  className={`${inputClass} pl-10`}
                />
              </label>

              <div role="tablist" aria-label="Navegacao das sessoes" className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { id: "open" as const, label: "Sessoes em aberto", count: openSessions.length },
                  {
                    id: "completed" as const,
                    label: "Sessoes encerradas",
                    count: completedSessions.length,
                  },
                ].map((tab) => {
                  const isActive = selectedTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      type="button"
                      aria-selected={isActive}
                      onClick={() => {
                        startTransition(() => {
                          setSelectedTab(tab.id);
                          setSearchTerm("");
                        });
                      }}
                      className={[
                        "min-h-11 rounded-[1rem] px-3 py-2 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(50,111,93,0.12)]",
                        isActive
                          ? "bg-[color:var(--admin-strong)] text-white"
                          : "bg-[rgba(255,255,255,0.58)] text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
                      ].join(" ")}
                    >
                      {tab.label} {tab.count}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2 lg:max-h-[30rem] lg:overflow-y-auto lg:pr-1">
                {visibleSessions.length > 0 ? (
                  visibleSessions.map((session) => {
                    const isSelected = session.token === selectedSession?.token;

                    return (
                      <button
                        key={session.token}
                        type="button"
                        onClick={() => setSelectedSessionToken(session.token)}
                        className={[
                          "w-full rounded-[1rem] border p-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(50,111,93,0.12)]",
                          isSelected
                            ? "border-[rgba(50,111,93,0.28)] bg-[color:var(--accent-soft)]"
                            : "border-[color:var(--line)] bg-[rgba(255,255,255,0.46)] hover:border-[rgba(50,111,93,0.2)]",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {session.testType === "sequence" ? (
                                <LayoutGrid className="h-4 w-4 text-[color:var(--accent)]" />
                              ) : (
                                <Boxes className="h-4 w-4 text-[color:var(--accent)]" />
                              )}
                              <span className="truncate font-medium text-[color:var(--ink)]">
                                {session.participantCode}
                              </span>
                            </div>
                          </div>
                          <span
                            className={[
                              "rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold",
                              getStatusClasses(session.status),
                            ].join(" ")}
                          >
                            {getSessionStatusLabel(session.status)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--ink-soft)]">
                          <span>Progresso {getProgressLabel(session)}</span>
                          <span className="font-mono">#{session.token.slice(0, 8)}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--surface-strong)]">
                          <div
                            className="h-full rounded-full bg-[color:var(--admin-strong)]"
                            style={{ width: getProgressRatio(session) }}
                          />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-[1rem] border border-dashed border-[color:var(--line)] bg-[rgba(255,255,255,0.46)] px-4 py-10 text-center text-sm text-[color:var(--ink-soft)]">
                    Nenhuma sessao encontrada nessa aba.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-2">
            {selectedSession ? (
              <section className={`${surfaceCard} p-5`}>
                <div className="flex flex-col gap-4 border-b border-[color:var(--line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold",
                          getStatusClasses(selectedSession.status),
                        ].join(" ")}
                      >
                        {getSessionStatusLabel(selectedSession.status)}
                      </span>
                      <span className="inline-flex rounded-full border border-[rgba(50,111,93,0.18)] bg-[color:var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--accent)]">
                        {getTestTypeLabel(selectedSession.testType)}
                      </span>
                    </div>
                    <h2 className="mt-3 break-words text-[2rem] font-semibold tracking-[-0.05em] text-[color:var(--ink)]">
                      {selectedSession.participantCode}
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-[color:var(--ink-soft)]">
                      <span className="font-mono">{selectedSession.token}</span>
                      <button
                        type="button"
                        onClick={() => copyText(selectedSession.token)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/70 text-[color:var(--ink-soft)] transition duration-200 hover:border-[rgba(50,111,93,0.24)]"
                        aria-label="Copiar token"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </p>
                  </div>

                  <div className="w-full max-w-xs">
                    <div className="flex items-center justify-between text-sm text-[color:var(--ink-soft)]">
                      <span>Progresso da sessao</span>
                      <span className="font-medium text-[color:var(--ink)]">
                        {getProgressLabel(selectedSession)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--surface-strong)]">
                      <div
                        className="h-full rounded-full bg-[color:var(--admin-strong)]"
                        style={{ width: getProgressRatio(selectedSession) }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 pt-5 md:grid-cols-2">
                  <LinkCard
                    title="Link do avaliado"
                    description="Fluxo limpo para aplicacao do teste."
                    href={participantUrl}
                    actionLabel="Copiar link"
                    onCopy={() => copyText(participantUrl)}
                    icon={<UserRound className="h-4 w-4" />}
                  />
                  <LinkCard
                    title="Link do observador"
                    description="Acompanhamento em paralelo da sessao."
                    href={observerUrl}
                    actionLabel="Copiar acompanhamento"
                    onCopy={() => copyText(observerUrl)}
                    icon={<Eye className="h-4 w-4" />}
                  />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Criada em", formatTimestamp(selectedSession.createdAt)],
                    ["Atualizada em", formatTimestamp(selectedSession.updatedAt)],
                    ["Inicio", formatTimestamp(selectedSession.startedAt)],
                    ["Modo", modeLabel],
                  ].map(([label, value]) => (
                    <article
                      key={label}
                      className="rounded-[1.2rem] border border-[color:var(--line)] bg-[rgba(255,255,255,0.42)] px-4 py-4"
                    >
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        {label}
                      </p>
                      <p className="mt-2 text-sm font-medium text-[color:var(--ink)]">
                        {value}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
                  <section className="rounded-[1.3rem] border border-[color:var(--line)] bg-[rgba(255,255,255,0.42)] p-4">
                    <p className="text-sm font-semibold text-[color:var(--ink)]">
                      Fluxo operacional
                    </p>
                    <div className="mt-4 space-y-3">
                      {[
                        "Criar e identificar a sessao",
                        "Abrir o link do avaliado ou observador",
                        "Encerrar e mover para historico",
                      ].map((step, index) => (
                        <div key={step} className="flex items-center gap-3 text-sm text-[color:var(--ink-soft)]">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-xs font-semibold text-[color:var(--accent)]">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[1.3rem] border border-[color:var(--line)] bg-[color:var(--admin-strong-surface)] p-4 text-white shadow-[0_16px_34px_var(--admin-strong-shadow)]">
                    <p className="text-sm font-semibold">Controle da sessao</p>
                    <p className="mt-2 text-sm leading-6 text-white/72">
                      Ao encerrar, a sessao migra para a aba de encerradas e bloqueia
                      novas respostas do participante.
                    </p>
                    <div className="mt-4">
                      {selectedSession.status !== "completed" ? (
                        <button
                          type="button"
                          onClick={() => completeSession(selectedSession.token)}
                          disabled={closingToken === selectedSession.token}
                          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[1rem] border border-[rgba(255,255,255,0.12)] bg-white/10 px-5 text-sm font-semibold text-white transition duration-200 hover:bg-white/14 disabled:cursor-not-allowed disabled:border-[color:var(--admin-disabled-border)] disabled:bg-[rgba(255,255,255,0.18)] disabled:text-white/70"
                        >
                          <XCircle className="h-4 w-4" />
                          {closingToken === selectedSession.token
                            ? "Encerrando..."
                            : "Encerrar sessao"}
                        </button>
                      ) : (
                        <div className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[1rem] border border-[rgba(255,255,255,0.12)] bg-white/10 px-5 text-sm font-semibold text-white">
                          <CheckCircle2 className="h-4 w-4" />
                          Sessao encerrada
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </section>
            ) : (
              <div className="flex min-h-[32rem] items-center justify-center rounded-[1.7rem] border border-dashed border-[color:var(--line)] bg-[rgba(255,255,255,0.46)] px-6 text-center text-sm text-[color:var(--ink-soft)]">
                Selecione uma sessao para visualizar detalhes, abrir os links e agir
                sobre o atendimento.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
