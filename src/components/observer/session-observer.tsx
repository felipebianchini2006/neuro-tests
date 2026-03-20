"use client";

import { useEffect, useEffectEvent, useState } from "react";

import {
  Activity,
  CircleCheck,
  Clock3,
  Link2,
  TimerReset,
} from "lucide-react";

import { getSessionSnapshot } from "@/lib/client/api";
import { createSessionChannel } from "@/lib/client/session-channel";
import { getItemTitle } from "@/lib/content/catalog";
import { formatElapsed, getElapsedFromIso } from "@/lib/format";
import type { SessionSnapshot } from "@/lib/server/session-repository";

type SessionObserverProps = {
  initialSnapshot: SessionSnapshot;
};

export function SessionObserver({ initialSnapshot }: SessionObserverProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const sessionLabel =
    snapshot.session.testType === "sequence"
      ? "Arranjo de Figuras"
      : snapshot.session.testType === "adult-battery"
        ? "Bateria Adulta"
        : snapshot.session.testType === "puzzle"
          ? "Armar Objetos"
          : "Cubos";

  const refreshSnapshot = useEffectEvent(async () => {
    const nextSnapshot = await getSessionSnapshot(snapshot.session.token);
    setSnapshot(nextSnapshot);
  });

  useEffect(() => {
    const channel = createSessionChannel(snapshot.session.token);
    if (channel) {
      channel
        .on("broadcast", { event: "session-updated" }, (payload) => {
          const nextSnapshot = (payload.payload as { snapshot?: SessionSnapshot })
            .snapshot;
          if (nextSnapshot) {
            setSnapshot(nextSnapshot);
          }
        })
        .subscribe();
    }

    const intervalId = window.setInterval(() => {
      void refreshSnapshot();
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
      if (channel) {
        void channel.unsubscribe();
      }
    };
  }, [snapshot.session.token]);

  const totalElapsed = formatElapsed(
    getElapsedFromIso(snapshot.session.startedAt, snapshot.session.completedAt),
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[0_20px_40px_rgba(34,29,22,0.08)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
              Observação da sessão
            </p>
            <h1 className="text-3xl font-semibold text-[color:var(--ink)]">
              {snapshot.session.participantCode}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
              {sessionLabel} • status {snapshot.session.status.replaceAll("_", " ")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.4rem] bg-[color:var(--surface-strong)] p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                <Activity className="h-4 w-4" />
                Item atual
              </p>
              <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">
                {snapshot.session.status === "completed"
                  ? "Concluído"
                  : getItemTitle(
                      snapshot.session.testType,
                      snapshot.session.currentItemIndex,
                    )}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[color:var(--surface-strong)] p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                <Clock3 className="h-4 w-4" />
                Tempo total
              </p>
              <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">
                {totalElapsed}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[color:var(--surface-strong)] p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                <CircleCheck className="h-4 w-4" />
                Itens corretos
              </p>
              <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">
                {snapshot.items.filter((item) => item.isCorrect).length}/
                {snapshot.session.totalItems}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[color:var(--surface-strong)] p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                <TimerReset className="h-4 w-4" />
                Última etapa
              </p>
              <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">
                {snapshot.items.at(-1)?.answeredAt
                  ? new Date(snapshot.items.at(-1)!.answeredAt!).toLocaleTimeString(
                      "pt-BR",
                    )
                  : "--"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[0_20px_40px_rgba(34,29,22,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
              Linha do tempo
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[color:var(--ink)]">
              Progresso por item
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] px-3 py-2 text-xs font-medium text-[color:var(--ink-soft)]">
            <Link2 className="h-4 w-4" />
            Atualização contínua
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {Array.from({ length: snapshot.session.totalItems }, (_, itemIndex) => {
            const record = snapshot.items.find((item) => item.itemIndex === itemIndex);
            const state =
              record?.isCorrect === true
                ? "Correto"
                : record?.isCorrect === false
                  ? "Incorreto"
                  : itemIndex === snapshot.session.currentItemIndex &&
                      snapshot.session.status !== "completed"
                    ? "Em andamento"
                    : "Pendente";

            return (
              <article
                key={itemIndex}
                className="grid gap-4 rounded-[1.4rem] border border-[color:var(--line)] bg-[color:var(--paper)] p-4 md:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    Item {itemIndex + 1}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">
                    {getItemTitle(snapshot.session.testType, itemIndex)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    Estado
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">
                    {state}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    Tentativas
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">
                    {record?.attempts ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    Tempo do item
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">
                    {formatElapsed(record?.elapsedMs ?? null)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
