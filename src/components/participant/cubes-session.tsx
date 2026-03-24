"use client";

import { useMemo, useState } from "react";

import { RotateCw, Undo2 } from "lucide-react";

import { CubeFacePreview } from "@/components/shared/cube-face";
import type { CubeChallenge } from "@/lib/content/catalog";
import { rotateCubeFace, type CubePiece } from "@/lib/domain/cubes";
import type { SessionItemRecord } from "@/lib/server/session-repository";

type CubesSessionProps = {
  challenge: CubeChallenge;
  initialTray: CubePiece[];
  currentRecord?: SessionItemRecord;
  busy: boolean;
  onSubmit: (board: (CubePiece["face"] | null)[][]) => Promise<void>;
  onAdvance: () => Promise<void>;
};

function createEmptyBoard(size: number) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null as string | null),
  );
}

function removePieceFromBoard(board: (string | null)[][], pieceId: string) {
  return board.map((row) => row.map((cell) => (cell === pieceId ? null : cell)));
}

export function CubesSession({
  challenge,
  initialTray,
  currentRecord,
  busy,
  onSubmit,
  onAdvance,
}: CubesSessionProps) {
  const [pieces, setPieces] = useState(initialTray);
  const [board, setBoard] = useState<(string | null)[][]>(
    createEmptyBoard(challenge.gridSize),
  );
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  const pieceMap = useMemo(
    () => new Map(pieces.map((piece) => [piece.id, piece])),
    [pieces],
  );
  const selectedPiece = selectedPieceId ? pieceMap.get(selectedPieceId) ?? null : null;
  const placedPieceIds = new Set(board.flat().filter((cell): cell is string => cell !== null));
  const placedCount = placedPieceIds.size;

  const boardFaces = board.map((row) =>
    row.map((cell) => (cell ? pieceMap.get(cell)?.face ?? null : null)),
  );

  const placePiece = (pieceId: string, rowIndex: number, columnIndex: number) => {
    setBoard((current) => {
      const next = removePieceFromBoard(current, pieceId).map((row) => [...row]);
      next[rowIndex][columnIndex] = pieceId;
      return next;
    });
    setSelectedPieceId(pieceId);
  };

  const rotatePiece = (pieceId: string) => {
    setPieces((current) =>
      current.map((piece) =>
        piece.id === pieceId
          ? { ...piece, face: rotateCubeFace(piece.face) }
          : piece,
      ),
    );
  };

  const returnPieceToTray = (pieceId: string) => {
    setBoard((current) => removePieceFromBoard(current, pieceId).map((row) => [...row]));
    setSelectedPieceId(pieceId);
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
          Replique exatamente o padrão-alvo
        </p>
        <h2 className="text-2xl font-semibold text-[color:var(--ink)]">
          {challenge.title}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
          Arraste as peças para a grade ou selecione uma peça e clique na célula
          desejada. Gire a orientação quando necessário.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <article className="rounded-[1.8rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
                Modelo
              </p>
              <h3 className="text-lg font-semibold text-[color:var(--ink)]">
                Padrão-alvo
              </h3>
            </div>
            <span className="rounded-full bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-semibold text-[color:var(--ink-soft)]">
              {challenge.gridSize}x{challenge.gridSize}
            </span>
          </div>

          <div className="space-y-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
              Guia alinhada à grade
            </p>
            <div
              className="grid gap-2 rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--paper)] p-3"
              style={{ gridTemplateColumns: `repeat(${challenge.gridSize}, 1fr)` }}
            >
              {challenge.target.flatMap((row, rowIndex) =>
                row.map((face, columnIndex) => (
                  <CubeFacePreview
                    key={`guide-${rowIndex}-${columnIndex}`}
                    face={face}
                    testId="cube-guide-cell"
                    className="aspect-square"
                  />
                )),
              )}
            </div>
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
                Resposta
              </p>
              <h3 className="text-lg font-semibold text-[color:var(--ink)]">
                Sua montagem
              </h3>
            </div>
            <p className="text-sm text-[color:var(--ink-soft)]">
              {currentRecord?.isCorrect === true
                ? "Padrão correto."
                : currentRecord?.isCorrect === false
                  ? "Padrão incorreto."
                  : "Ainda não confirmado."}
            </p>
          </div>

          <div
            className="grid gap-2 sm:gap-3"
            style={{ gridTemplateColumns: `repeat(${challenge.gridSize}, 1fr)` }}
          >
            {board.flatMap((row, rowIndex) =>
              row.map((cell, columnIndex) => {
                const piece = cell ? pieceMap.get(cell) ?? null : null;
                const isSelected = selectedPieceId === cell && cell !== null;
                const canPlaceSelected = selectedPieceId !== null;

                return (
                  <button
                    key={`${rowIndex}-${columnIndex}`}
                    type="button"
                    aria-label={`Célula ${rowIndex + 1}-${columnIndex + 1}`}
                    draggable={cell !== null}
                    onDragStart={(event) => {
                      if (cell) event.dataTransfer.setData("text/plain", cell);
                    }}
                    onDoubleClick={() => {
                      if (cell) returnPieceToTray(cell);
                    }}
                    onClick={() => {
                      if (selectedPieceId) {
                        placePiece(selectedPieceId, rowIndex, columnIndex);
                      } else if (cell) {
                        setSelectedPieceId(cell);
                      }
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const droppedId = event.dataTransfer.getData("text/plain");
                      if (droppedId) {
                        placePiece(droppedId, rowIndex, columnIndex);
                      }
                    }}
                    className={[
                      "relative aspect-square rounded-[1.1rem] border p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition-all",
                      isSelected
                        ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-[0_0_0_3px_rgba(50,111,93,0.12)]"
                        : canPlaceSelected
                          ? "border-[color:var(--accent)]/45 bg-[color:var(--paper)]"
                          : "border-[color:var(--line-strong)] border-dashed bg-[color:var(--surface-strong)]",
                    ].join(" ")}
                  >
                    <CubeFacePreview face={piece?.face ?? null} className="aspect-square" />
                    {canPlaceSelected && !piece ? (
                      <span className="pointer-events-none absolute inset-x-2 bottom-2 rounded-full bg-white/82 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                        Posicionar
                      </span>
                    ) : null}
                  </button>
                );
              }),
            )}
          </div>
        </article>
      </div>

      <article className="rounded-[1.8rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
              Peças
            </p>
            <h3 className="text-lg font-semibold text-[color:var(--ink)]">
              Área de seleção
            </h3>
            <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
              {placedCount}/{pieces.length} posicionadas na grade.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectedPieceId && rotatePiece(selectedPieceId)}
              disabled={!selectedPieceId}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--line)] bg-white/70 px-4 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCw className="h-4 w-4" />
              Girar selecionada
            </button>
            <button
              type="button"
              onClick={() => selectedPieceId && returnPieceToTray(selectedPieceId)}
              disabled={!selectedPieceId}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--line)] bg-white/70 px-4 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--danger)] hover:text-[color:var(--danger)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" />
              Retirar da grade
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-[1.5rem] border border-[color:var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,241,230,0.92))] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
            Peça selecionada
          </p>
          {selectedPiece ? (
            <div className="mt-3 flex items-center gap-4">
              <div className="w-20 shrink-0 rounded-[1.25rem] border border-[color:var(--line)] bg-white p-2 shadow-[0_16px_32px_rgba(98,85,66,0.08)]">
                <CubeFacePreview face={selectedPiece.face} className="aspect-square" />
              </div>
              <p className="text-lg font-semibold text-[color:var(--ink)]">
                Peça {pieces.findIndex((piece) => piece.id === selectedPiece.id) + 1}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
              Selecione uma peça abaixo para posicioná-la na grade.
            </p>
          )}
        </div>

        <div
          className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const droppedId = event.dataTransfer.getData("text/plain");
            if (droppedId) {
              returnPieceToTray(droppedId);
            }
          }}
        >
          {pieces.map((piece, index) => {
            const isPlaced = placedPieceIds.has(piece.id);
            const isSelected = selectedPieceId === piece.id;

            return (
              <button
                key={piece.id}
                type="button"
                draggable
                aria-label={`Selecionar peça ${index + 1}`}
                aria-pressed={isSelected}
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", piece.id);
                }}
                onClick={() =>
                  setSelectedPieceId((current) => (current === piece.id ? null : piece.id))
                }
                onDoubleClick={() => rotatePiece(piece.id)}
                className={[
                  "group flex flex-col rounded-[1.4rem] border p-3 text-left shadow-[0_14px_28px_rgba(98,85,66,0.08)] transition-all",
                  isSelected
                    ? "border-[color:var(--accent)] bg-[linear-gradient(180deg,rgba(50,111,93,0.18),rgba(255,255,255,0.92))] shadow-[0_20px_36px_rgba(50,111,93,0.18)]"
                    : "border-[color:var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,239,227,0.9))] hover:-translate-y-0.5 hover:border-[color:var(--line-strong)]",
                  isPlaced && !isSelected && "opacity-75",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted)]">
                      Peça {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[color:var(--ink)]">
                      {isSelected ? "Selecionada" : isPlaced ? "Na grade" : "Disponível"}
                    </p>
                  </div>
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]",
                      isSelected
                        ? "bg-[color:var(--accent)] text-white"
                        : isPlaced
                          ? "bg-[color:var(--surface-strong)] text-[color:var(--ink-soft)]"
                          : "bg-white text-[color:var(--ink-soft)]",
                    ].join(" ")}
                  >
                    {isSelected ? "Ativa" : isPlaced ? "Usada" : "Livre"}
                  </span>
                </div>

                <div className="rounded-[1.2rem] border border-[color:var(--line)] bg-white/88 p-2">
                  <CubeFacePreview face={piece.face} className="aspect-square" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onSubmit(boardFaces)}
            disabled={busy}
            className="min-h-11 rounded-full bg-[color:var(--ink)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Confirmar montagem
          </button>
          <button
            type="button"
            onClick={onAdvance}
            disabled={busy || currentRecord?.isCorrect !== true}
            className="min-h-11 rounded-full border border-[color:var(--line-strong)] px-5 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próximo desafio
          </button>
        </div>
      </article>
    </section>
  );
}
