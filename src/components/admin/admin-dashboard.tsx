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
  Menu,
  Puzzle,
  Plus,
  Search,
  Target,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";

import type { TestType } from "@/lib/content/catalog";
import {
  broadcastSessionSnapshot,
  createSessionChannel,
} from "@/lib/client/session-channel";
import { readJsonResponse } from "@/lib/client/read-json-response";
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
  "rounded-xl border border-[color:var(--line)] bg-white shadow-sm";
const inputClass =
  "h-10 w-full rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-secondary)] px-3.5 text-sm text-[color:var(--ink)] outline-none transition duration-150 focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[rgba(29,78,216,0.12)]";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-transparent bg-[color:var(--ink)] px-4 text-sm font-semibold text-white transition duration-150 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40";

function buildSessionUrl(origin: string, kind: "p" | "o", token: string) {
  const basePath = `/${kind}/${token}`;
  return origin ? `${origin}${basePath}` : basePath;
}

function getTestTypeLabel(testType: TestType) {
  if (testType === "sequence") return "Arranjo de Figuras";
  if (testType === "adult-battery") return "Bateria Adulta";
  if (testType === "cubes-teen") return "Cubos (Adolescente)";
  if (testType === "puzzle") return "Armar Objetos";
  return "Cubos";
}

function getSessionStatusLabel(status: SessionStatus) {
  if (status === "completed") return "Encerrada";
  if (status === "in_progress") return "Em andamento";
  return "Pendente";
}

function getStatusClasses(status: SessionStatus) {
  if (status === "completed") {
    return "border-[rgba(21,128,61,0.2)] bg-[color:var(--success-soft)] text-[color:var(--success)]";
  }
  if (status === "in_progress") {
    return "border-[rgba(146,64,14,0.2)] bg-[color:var(--warning-soft)] text-[color:var(--warning)]";
  }
  return "border-[color:var(--line)] bg-[color:var(--surface-secondary)] text-[color:var(--ink-soft)]";
}

function getSessionBucket(session: SessionRecord): SessionTab {
  return session.status === "completed" ? "completed" : "open";
}

const creatableTestTypeOptions = [
  {
    id: "sequence" as const,
    label: "Arranjo",
    icon: <LayoutGrid className="h-3.5 w-3.5" />,
  },
  {
    id: "cubes" as const,
    label: "Cubos",
    icon: <Boxes className="h-3.5 w-3.5" />,
  },
  {
    id: "adult-battery" as const,
    label: "Bateria Adulta",
    icon: <Target className="h-3.5 w-3.5" />,
  },
  {
    id: "cubes-teen" as const,
    label: "Adolescente",
    icon: <Boxes className="h-3.5 w-3.5" />,
  },
];

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
    <section className={`${surfaceCard} p-4`}>
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
          {icon}
        </span>
        <div>
          <p className="text-sm font-medium text-[color:var(--ink)]">{title}</p>
          <p className="text-xs text-[color:var(--muted)]">{description}</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface-secondary)] px-2.5 py-2.5">
        <p className="break-all font-mono text-xs leading-5 text-[color:var(--ink-soft)]">
          {href}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[color:var(--ink)] px-3 text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(15,23,42,0.12)] transition duration-150 hover:bg-slate-800 hover:text-white [&_svg]:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir
        </a>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-white px-3 text-sm font-semibold text-[color:var(--ink)] transition duration-150 hover:border-slate-300"
        >
          <Copy className="h-3.5 w-3.5" />
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
  const [clearCompletedPending, setClearCompletedPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    if (visibleSessions.length > 0) {
      if (!visibleSessions.some((session) => session.token === selectedSessionToken)) {
        setSelectedSessionToken(visibleSessions[0]?.token ?? null);
      }
      return;
    }

    const sessionsInSelectedTab =
      selectedTab === "completed" ? completedSessions : openSessions;

    if (!sessionsInSelectedTab.length) {
      const fallbackTab = openSessions.length > 0 ? "open" : "completed";
      if (fallbackTab !== selectedTab) {
        startTransition(() => {
          setSelectedTab(fallbackTab);
          setSelectedSessionToken(getInitialSelectedSessionToken(sessions, fallbackTab));
        });
        return;
      }
    }

    if (selectedSessionToken !== null) {
      setSelectedSessionToken(null);
    }
  }, [
    completedSessions,
    openSessions,
    selectedSessionToken,
    selectedTab,
    sessions,
    visibleSessions,
  ]);

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
      const data = await readJsonResponse<{ error?: string; snapshot?: SessionSnapshot }>(
        response,
      );
      if (!response.ok || !data?.snapshot) {
        throw new Error(data?.error ?? "Nao foi possivel criar a sessao.");
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
      const data = await readJsonResponse<{ error?: string; snapshot?: SessionSnapshot }>(
        response,
      );
      if (!response.ok || !data?.snapshot) {
        throw new Error(data?.error ?? "Nao foi possivel encerrar a sessao.");
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

  const deleteCompletedSessions = async () => {
    setClearCompletedPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/sessions/completed", {
        method: "DELETE",
      });
      const data = await readJsonResponse<{ deletedCount?: number; error?: string }>(
        response,
      );
      if (!response.ok || typeof data?.deletedCount !== "number") {
        throw new Error(data?.error ?? "Nao foi possivel limpar o historico.");
      }

      setSessions((current) =>
        current.filter((session) => getSessionBucket(session) !== "completed"),
      );
      setSearchTerm("");
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Nao foi possivel limpar o historico.",
      );
    } finally {
      setClearCompletedPending(false);
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
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Topbar */}
      <header className="sticky top-0 z-20 h-[52px] border-b border-[color:var(--line)] bg-white">
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--ink)] text-white">
              <Activity className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-[color:var(--ink)]">
              Painel clinico
            </span>
            <span className="hidden rounded-full border border-[color:var(--line)] bg-[color:var(--surface-secondary)] px-2.5 py-1 text-[0.65rem] font-semibold text-[color:var(--muted)] sm:inline">
              Workspace clinico
            </span>
            <span className="hidden rounded-full border border-[rgba(29,78,216,0.2)] bg-[color:var(--accent-soft)] px-2.5 py-1 text-[0.65rem] font-semibold text-[color:var(--accent)] lg:inline">
              {modeLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--line)] bg-white text-[color:var(--ink-soft)] transition duration-150 hover:bg-[color:var(--surface-secondary)] md:hidden"
              aria-label="Sessoes"
            >
              <Menu className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                window.location.reload();
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[color:var(--line)] bg-white px-3 text-sm font-semibold text-[color:var(--ink)] transition duration-150 hover:bg-[color:var(--surface-secondary)]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-h-[calc(100vh-52px)]">
        {/* Sidebar */}
        <aside
          className={[
            "w-80 shrink-0 space-y-4 overflow-y-auto border-r border-[color:var(--line)] bg-white p-4",
            sidebarOpen
              ? "fixed inset-y-[52px] left-0 z-30 shadow-xl"
              : "hidden",
            "md:static md:block md:inset-auto md:z-auto md:shadow-none",
          ].join(" ")}
        >
          {error ? (
            <p className="rounded-lg border border-[rgba(180,71,49,0.18)] bg-[rgba(255,245,240,0.9)] px-3 py-2.5 text-xs font-medium text-[color:var(--danger)]">
              {error}
            </p>
          ) : null}

          {/* Stats chips */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(29,78,216,0.2)] bg-[color:var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--accent)]">
              <Clock3 className="h-3.5 w-3.5" />
              {openSessions.length} Abertas
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(21,128,61,0.2)] bg-[color:var(--success-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--success)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {completedSessions.length} Encerradas
            </span>
            {selectedSession && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-secondary)] px-3 py-1.5 text-xs font-semibold text-[color:var(--ink-soft)]">
                <Target className="h-3.5 w-3.5" />
                {selectedSession.participantCode}
              </span>
            )}
          </div>

          {/* Create card */}
          <section className={surfaceCard}>
            <div className="rounded-t-xl bg-[color:var(--ink)] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                  <Plus className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-white">Nova sessao</h2>
                  <p className="text-xs text-white/60">Registre e libere o fluxo</p>
                </div>
              </div>
            </div>

            <form className="space-y-4 p-5" onSubmit={createSession}>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[color:var(--ink-soft)]">
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

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[color:var(--ink-soft)]">
                  Tipo de teste
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {creatableTestTypeOptions.map((option) => {
                    const isActive = testType === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTestType(option.id)}
                        className={[
                          "flex min-h-10 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(29,78,216,0.2)]",
                          isActive
                            ? "border-[rgba(29,78,216,0.3)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]"
                            : "border-[color:var(--line)] bg-[color:var(--surface-secondary)] text-[color:var(--ink-soft)] hover:border-slate-300",
                        ].join(" ")}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

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

          {/* Session list */}
          <section className={surfaceCard}>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[color:var(--ink)]">Sessoes</h3>
                {selectedTab === "completed" && (
                  <button
                    type="button"
                    onClick={deleteCompletedSessions}
                    disabled={clearCompletedPending || completedSessions.length === 0}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgba(180,71,49,0.2)] bg-[rgba(255,245,240,0.9)] px-2.5 text-xs font-semibold text-[color:var(--danger)] transition duration-150 hover:bg-[rgba(255,240,232,0.96)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {clearCompletedPending ? "Excluindo..." : "Excluir encerradas"}
                  </button>
                )}
              </div>

              <label className="relative mt-3 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por nome ou token"
                  className={`${inputClass} pl-10`}
                />
              </label>

              <div
                role="tablist"
                aria-label="Navegacao das sessoes"
                className="mt-3 grid grid-cols-2 gap-1.5"
              >
                {[
                  {
                    id: "open" as const,
                    label: "Sessoes em aberto",
                    count: openSessions.length,
                  },
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
                        "min-h-9 rounded-lg px-3 py-2 text-xs font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(29,78,216,0.2)]",
                        isActive
                          ? "bg-[color:var(--ink)] text-white"
                          : "bg-[color:var(--surface-secondary)] text-[color:var(--ink-soft)] hover:text-[color:var(--ink)]",
                      ].join(" ")}
                    >
                      {tab.label} {tab.count}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 max-h-[28rem] space-y-1.5 overflow-y-auto pr-0.5">
                {visibleSessions.length > 0 ? (
                  visibleSessions.map((session) => {
                    const isSelected = session.token === selectedSession?.token;

                    return (
                      <button
                        key={session.token}
                        type="button"
                        onClick={() => setSelectedSessionToken(session.token)}
                        className={[
                          "w-full rounded-lg border p-3 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(29,78,216,0.2)]",
                          isSelected
                            ? "border-[#bae6fd] bg-[#f0f9ff]"
                            : "border-transparent bg-[color:var(--surface-secondary)] hover:border-[color:var(--line)]",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            {session.testType === "sequence" ? (
                              <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
                            ) : session.testType === "adult-battery" ? (
                              <Target className="h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
                            ) : session.testType === "cubes" || session.testType === "cubes-teen" ? (
                              <Boxes className="h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
                            ) : session.testType === "puzzle" ? (
                              <Puzzle className="h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
                            ) : null}
                            <span className="truncate text-sm font-medium text-[color:var(--ink)]">
                              {session.participantCode}
                            </span>
                          </div>
                          <span
                            className={[
                              "shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold",
                              getStatusClasses(session.status),
                            ].join(" ")}
                          >
                            {getSessionStatusLabel(session.status)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-[color:var(--muted)]">
                          <span>Progresso {getProgressLabel(session)}</span>
                          <span className="font-mono">#{session.token.slice(0, 8)}</span>
                        </div>
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[color:var(--line)]">
                          <div
                            className="h-full rounded-full bg-[color:var(--accent)]"
                            style={{ width: getProgressRatio(session) }}
                          />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-[color:var(--line)] px-4 py-8 text-center text-xs text-[color:var(--muted)]">
                    Nenhuma sessao encontrada nessa aba.
                  </div>
                )}
              </div>
            </div>
          </section>
        </aside>

        {/* Main panel */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {selectedSession ? (
            <div className="space-y-4">
              {/* Detail header */}
              <section className={`${surfaceCard} p-5`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          getStatusClasses(selectedSession.status),
                        ].join(" ")}
                      >
                        {getSessionStatusLabel(selectedSession.status)}
                      </span>
                      <span className="inline-flex rounded-full border border-[rgba(29,78,216,0.2)] bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--accent)]">
                        {getTestTypeLabel(selectedSession.testType)}
                      </span>
                    </div>
                    <h2 className="mt-3 break-words text-2xl font-semibold tracking-tight text-[color:var(--ink)]">
                      {selectedSession.participantCode}
                    </h2>
                    <p className="mt-1.5 flex items-center gap-2 text-sm text-[color:var(--muted)]">
                      <span className="font-mono text-xs">{selectedSession.token}</span>
                      <button
                        type="button"
                        onClick={() => copyText(selectedSession.token)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[color:var(--line)] bg-white text-[color:var(--muted)] transition duration-150 hover:border-slate-300"
                        aria-label="Copiar token"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:w-56">
                    <div>
                      <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                        <span>Progresso da sessao</span>
                        <span className="font-semibold text-[color:var(--ink)]">
                          {getProgressLabel(selectedSession)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[color:var(--line)]">
                        <div
                          className="h-full rounded-full bg-[color:var(--accent)]"
                          style={{ width: getProgressRatio(selectedSession) }}
                        />
                      </div>
                    </div>

                    {selectedSession.status !== "completed" ? (
                      <button
                        type="button"
                        onClick={() => completeSession(selectedSession.token)}
                        disabled={closingToken === selectedSession.token}
                        className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-[rgba(180,71,49,0.2)] bg-[rgba(255,245,240,0.9)] px-4 text-sm font-semibold text-[color:var(--danger)] transition duration-150 hover:bg-[rgba(255,240,232,0.96)] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10"
                      >
                        <XCircle className="h-4 w-4" />
                        {closingToken === selectedSession.token
                          ? "Encerrando..."
                          : "Encerrar sessao"}
                      </button>
                    ) : (
                      <div className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-[rgba(21,128,61,0.2)] bg-[color:var(--success-soft)] px-4 text-sm font-semibold text-[color:var(--success)] sm:min-h-10">
                        <CheckCircle2 className="h-4 w-4" />
                        Sessao encerrada
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* URL cards */}
              <div className="grid gap-4 md:grid-cols-2">
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

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {[
                  ["Criada em", formatTimestamp(selectedSession.createdAt)],
                  ["Atualizada em", formatTimestamp(selectedSession.updatedAt)],
                  ["Inicio", formatTimestamp(selectedSession.startedAt)],
                  ["Modo", modeLabel],
                ].map(([label, value]) => (
                  <article
                    key={label}
                    className="rounded-lg border border-[color:var(--line)] bg-white px-4 py-3.5"
                  >
                    <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-[color:var(--muted)]">
                      {label}
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-[color:var(--ink)]">
                      {value}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[32rem] items-center justify-center rounded-xl border border-dashed border-[color:var(--line)] px-6 text-center text-sm text-[color:var(--muted)]">
              Selecione uma sessao para visualizar detalhes, abrir os links e agir
              sobre o atendimento.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
