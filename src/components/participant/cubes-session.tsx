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
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${challenge.gridSize}, 1fr)` }}
          >
            {challenge.target.flatMap((row, rowIndex) =>
              row.map((face, columnIndex) => (
                <CubeFacePreview
                  key={`${rowIndex}-${columnIndex}`}
                  face={face}
                  className="aspect-square"
                />
              )),
            )}
          </div>
        </article>

        <article className="rounded-[1.8rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
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
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${challenge.gridSize}, 1fr)` }}
          >
            {board.flatMap((row, rowIndex) =>
              row.map((cell, columnIndex) => {
                const piece = cell ? pieceMap.get(cell) ?? null : null;
                const isSelected = selectedPieceId === cell && cell !== null;

                return (
                  <button
                    key={`${rowIndex}-${columnIndex}`}
                    type="button"
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
                      "relative aspect-square rounded-[1rem] border border-dashed p-1 transition",
                      isSelected
                        ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                        : "border-[color:var(--line-strong)] bg-[color:var(--surface-strong)]",
                    ].join(" ")}
                  >
                    <CubeFacePreview face={piece?.face ?? null} className="aspect-square" />
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
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectedPieceId && rotatePiece(selectedPieceId)}
              disabled={!selectedPieceId}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--line)] px-4 text-sm font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCw className="h-4 w-4" />
              Girar selecionada
            </button>
            <button
              type="button"
              onClick={() => selectedPieceId && returnPieceToTray(selectedPieceId)}
              disabled={!selectedPieceId}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--line)] px-4 text-sm font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" />
              Retirar da grade
            </button>
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const droppedId = event.dataTransfer.getData("text/plain");
            if (droppedId) {
              returnPieceToTray(droppedId);
            }
          }}
        >
          {pieces.map((piece) => {
            const isPlaced = board.some((row) => row.includes(piece.id));
            const isSelected = selectedPieceId === piece.id;

            return (
              <button
                key={piece.id}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", piece.id);
                }}
                onClick={() => setSelectedPieceId(piece.id)}
                onDoubleClick={() => rotatePiece(piece.id)}
                className={[
                  "rounded-[1.2rem] border p-2 transition",
                  isSelected
                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                    : "border-[color:var(--line)] bg-[color:var(--paper)]",
                  isPlaced && "opacity-55",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <CubeFacePreview face={piece.face} className="aspect-square" />
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
