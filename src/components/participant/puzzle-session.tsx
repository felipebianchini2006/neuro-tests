"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { RotateCw } from "lucide-react";

import { buildInitialPuzzlePlacements } from "@/lib/domain/puzzle-layout";
import type { PuzzleChallenge, PiecePlacement } from "@/lib/domain/puzzle";
import type { SessionItemRecord } from "@/lib/server/session-repository";

type PuzzleSessionProps = {
  challenge: PuzzleChallenge;
  currentRecord?: SessionItemRecord;
  busy?: boolean;
  onAnswer: (placements: PiecePlacement[]) => void;
  onAdvance?: () => Promise<void>;
};

export function PuzzleSession({
  challenge,
  currentRecord,
  busy = false,
  onAnswer,
  onAdvance,
}: PuzzleSessionProps) {
  const [placements, setPlacements] = useState<PiecePlacement[]>(() =>
    buildInitialPuzzlePlacements(challenge),
  );
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    idx: number;
    startClientX: number;
    startClientY: number;
    startCx: number;
    startCy: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, idx: number) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setSelectedIdx(idx);
      dragRef.current = {
        idx,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startCx: placements[idx].cx,
        startCy: placements[idx].cy,
      };
    },
    [placements],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dx = ((e.clientX - drag.startClientX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startClientY) / rect.height) * 100;

    setPlacements((prev) =>
      prev.map((p, i) =>
        i === drag.idx
          ? {
              ...p,
              cx: Math.max(2, Math.min(98, drag.startCx + dx)),
              cy: Math.max(2, Math.min(98, drag.startCy + dy)),
            }
          : p,
      ),
    );
  }, []);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const rotatePiece = useCallback((idx: number) => {
    setPlacements((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, rotation: (p.rotation + 45) % 360 } : p)),
    );
  }, []);

  const handleSubmit = () => {
    onAnswer(placements);
  };

  const isCorrect = currentRecord?.isCorrect === true;
  const showAdvance = isCorrect && onAdvance;
  const canvasRatio = (challenge.sheetHeight / challenge.sheetWidth) * 100;

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full touch-none overflow-hidden rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] shadow-[0_20px_40px_rgba(34,29,22,0.08)]"
        style={{ paddingBottom: `${canvasRatio}%` }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="absolute inset-0">
          {/* Puzzle pieces */}
          {challenge.pieces.map((piece, idx) => {
            const placement = placements[idx];
            const isSelected = selectedIdx === idx;

            return (
              <div
                key={piece.id}
                data-testid="puzzle-piece"
                style={{
                  position: "absolute",
                  left: `${placement.cx}%`,
                  top: `${placement.cy}%`,
                  width: `${piece.renderWidthPct}%`,
                  height: `${piece.renderHeightPct}%`,
                  transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                  cursor: "grab",
                  touchAction: "none",
                  zIndex: isSelected ? 10 : 1,
                  outline: isSelected ? "2px solid var(--accent)" : undefined,
                  outlineOffset: "2px",
                  willChange: "transform",
                  boxShadow: isSelected
                    ? "0 0 0 3px rgba(50,111,93,0.16)"
                    : "0 8px 18px rgba(34,29,22,0.12)",
                }}
                onPointerDown={(e) => handlePointerDown(e, idx)}
              >
                <Image
                  src={piece.pieceSrc}
                  fill
                  unoptimized
                  sizes={`${Math.max(piece.renderWidthPct, 12)}vw`}
                  style={{
                    userSelect: "none",
                    pointerEvents: "none",
                    objectFit: "contain",
                  }}
                  alt=""
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {selectedIdx !== null && (
          <button
            type="button"
            onClick={() => rotatePiece(selectedIdx)}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 text-sm font-medium text-[color:var(--ink-soft)] transition duration-200 hover:border-[rgba(50,111,93,0.3)] hover:text-[color:var(--ink)]"
          >
            <RotateCw className="h-4 w-4" />
            Girar peça
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          {showAdvance ? (
            <button
              type="button"
              onClick={onAdvance}
              disabled={busy}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.2rem] border border-[rgba(50,111,93,0.24)] bg-[color:var(--accent)] px-6 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(50,111,93,0.22)] transition duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próximo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.2rem] border border-[rgba(50,111,93,0.24)] bg-[color:var(--accent)] px-6 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(50,111,93,0.22)] transition duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Verificando..." : "Verificar"}
            </button>
          )}
        </div>
      </div>

      {currentRecord?.isCorrect === false && (
        <p className="text-sm text-[color:var(--danger)]">
          Não está certo ainda. Tente reposicionar as peças e verificar novamente.
        </p>
      )}
    </section>
  );
}
