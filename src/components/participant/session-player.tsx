"use client";

import { useEffect, useState } from "react";

import { CircleAlert } from "lucide-react";

import { getItemTitle } from "@/lib/content/catalog";
import { postSessionAction } from "@/lib/client/api";
import {
  broadcastSessionSnapshot,
  createSessionChannel,
} from "@/lib/client/session-channel";
import type { ParticipantSessionState } from "@/lib/server/participant-session-state";

import { CubesSession } from "./cubes-session";
import { PuzzleSession } from "./puzzle-session";
import { SequenceSession } from "./sequence-session";

type SessionPlayerProps = {
  initialState: ParticipantSessionState;
};

export function SessionPlayer({ initialState }: SessionPlayerProps) {
  const [playerState, setPlayerState] = useState(initialState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snapshot = playerState.snapshot;

  const currentIndex = Math.min(
    snapshot.session.currentItemIndex,
    snapshot.session.totalItems - 1,
  );
  const currentRecord = snapshot.items.find((item) => item.itemIndex === currentIndex);

  const currentItem = playerState.currentItem;
  const sequenceStory = currentItem?.kind === "sequence" ? currentItem.story : null;
  const cubeChallenge = currentItem?.kind === "cubes" ? currentItem.challenge : null;
  const puzzleChallenge = currentItem?.kind === "puzzle" ? currentItem.challenge : null;

  useEffect(() => {
    const channel = createSessionChannel(snapshot.session.token);
    if (!channel || snapshot.session.status === "completed") {
      return;
    }

    channel.subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [snapshot.session.status, snapshot.session.token]);

  useEffect(() => {
    if (snapshot.session.status === "completed") {
      return;
    }

    const channel = createSessionChannel(snapshot.session.token);
    void postSessionAction<ParticipantSessionState>(
      `/api/sessions/${snapshot.session.token}/start`,
      { itemIndex: currentIndex },
    ).then(async (response) => {
      setPlayerState(response);
      await broadcastSessionSnapshot(channel, response.snapshot);
    }).catch((err) => {
      console.error("Failed to start item:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar item");
    });
  }, [currentIndex, snapshot.session.status, snapshot.session.token]);

  const submit = async (answerPayload: unknown) => {
    setBusy(true);
    setError(null);

    try {
      const response = await postSessionAction<
        ParticipantSessionState & { isCorrect: boolean }
      >(`/api/sessions/${snapshot.session.token}/answer`, {
        itemIndex: currentIndex,
        answerPayload,
      });

      setPlayerState(response);
      await broadcastSessionSnapshot(
        createSessionChannel(snapshot.session.token),
        response.snapshot,
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível confirmar a resposta.",
      );
    } finally {
      setBusy(false);
    }
  };

  const advance = async () => {
    setBusy(true);
    setError(null);

    try {
      const response = await postSessionAction<ParticipantSessionState>(
        `/api/sessions/${snapshot.session.token}/advance`,
      );
      setPlayerState(response);
      await broadcastSessionSnapshot(
        createSessionChannel(snapshot.session.token),
        response.snapshot,
      );
    } catch (advanceError) {
      setError(
        advanceError instanceof Error
          ? advanceError.message
          : "Não foi possível avançar.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (snapshot.session.status === "completed") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-6 px-4 py-12 sm:px-6">
        <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-8 text-center shadow-[0_25px_50px_rgba(34,29,22,0.1)]">
          <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
            Sessão concluída
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[color:var(--ink)]">
            Teste finalizado
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
            Todas as tarefas deste link foram concluídas. O profissional já pode
            acompanhar o resultado na tela de observação.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[0_20px_40px_rgba(34,29,22,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
              Aplicação em andamento
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
              {snapshot.session.testType === "sequence"
                ? "Arranjo de Figuras"
                : snapshot.session.testType === "cubes-teen"
                  ? "Cubos (Adolescente)"
                  : snapshot.session.testType === "puzzle"
                    ? "Armar Objetos"
                    : "Cubos"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
              Item {Math.min(currentIndex + 1, snapshot.session.totalItems)} de{" "}
              {snapshot.session.totalItems}:{" "}
              {getItemTitle(snapshot.session.testType, currentIndex)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Participante
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">
                {snapshot.session.participantCode}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[color:var(--surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Progresso
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">
                {currentIndex + 1}/{snapshot.session.totalItems}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-[color:var(--surface-strong)] p-4 col-span-2 sm:col-span-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Tentativas
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">
                {currentRecord?.attempts ?? 0}
              </p>
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--danger)] bg-[color:var(--danger-soft)] px-4 py-2 text-sm font-medium text-[color:var(--danger)]">
          <CircleAlert className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      {snapshot.session.testType === "sequence" && sequenceStory ? (
        <SequenceSession
          key={`${snapshot.session.token}:${sequenceStory.id}`}
          story={sequenceStory}
          promptFrameIds={
            currentItem?.kind === "sequence" ? currentItem.promptFrameIds : []
          }
          currentRecord={currentRecord}
          busy={busy}
          onSubmit={submit}
          onAdvance={advance}
        />
      ) : null}

      {(snapshot.session.testType === "cubes" ||
        snapshot.session.testType === "cubes-teen") &&
      cubeChallenge ? (
        <CubesSession
          key={`${snapshot.session.token}:${cubeChallenge.id}`}
          challenge={cubeChallenge}
          initialTray={
            currentItem?.kind === "cubes" ? currentItem.initialTray : []
          }
          currentRecord={currentRecord}
          busy={busy}
          onSubmit={submit}
          onAdvance={advance}
        />
      ) : null}

      {snapshot.session.testType === "puzzle" && puzzleChallenge ? (
        <PuzzleSession
          key={`${snapshot.session.token}:${puzzleChallenge.id}`}
          challenge={puzzleChallenge}
          currentRecord={currentRecord}
          busy={busy}
          onAnswer={submit}
          onAdvance={advance}
        />
      ) : null}
    </main>
  );
}
