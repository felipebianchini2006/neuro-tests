"use client";

import { useMemo, useState } from "react";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

import type { SequenceStory } from "@/lib/domain/sequence";
import type { SessionItemRecord } from "@/lib/server/session-repository";

type SequenceSessionProps = {
  story: SequenceStory;
  promptFrameIds: string[];
  currentRecord?: SessionItemRecord;
  busy: boolean;
  onSubmit: (answer: string[]) => Promise<void>;
  onAdvance: () => Promise<void>;
};

function SortableFrameCard({
  id,
  src,
  label,
  position,
  outcome,
}: {
  id: string;
  src: string;
  label: string;
  position: number;
  outcome: boolean | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={[
        "rounded-[1.6rem] border bg-[color:var(--surface)] p-3 shadow-[0_18px_32px_rgba(34,29,22,0.08)]",
        outcome === true && "border-[color:var(--success)]",
        outcome === false && "border-[color:var(--danger)]",
        !outcome && "border-[color:var(--line)]",
        isDragging && "opacity-70",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="flex w-full flex-col gap-3 text-left"
        {...attributes}
        {...listeners}
      >
        <div className="relative aspect-[5/4] overflow-hidden rounded-[1.2rem] bg-[color:var(--surface-strong)]">
          <Image
            src={src}
            alt={label}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={position < 2}
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-1 pb-1">
          <span className="text-sm font-semibold text-[color:var(--ink-soft)]">
            Posição {position}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
            Arraste
          </span>
        </div>
      </button>
    </article>
  );
}

export function SequenceSession({
  story,
  promptFrameIds,
  currentRecord,
  busy,
  onSubmit,
  onAdvance,
}: SequenceSessionProps) {
  const [orderedIds, setOrderedIds] = useState(promptFrameIds);
  const dndContextId = `sequence-dnd-${story.id}`;

  const frameMap = useMemo(
    () => new Map(story.frames.map((frame) => [frame.id, frame])),
    [story.frames],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setOrderedIds((current) => {
      const oldIndex = current.indexOf(String(active.id));
      const newIndex = current.indexOf(String(over.id));
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.25em] text-[color:var(--muted)]">
          Organize as cenas na ordem correta
        </p>
        <h2 className="text-2xl font-semibold text-[color:var(--ink)]">
          {story.title}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-[color:var(--ink-soft)]">
          Sem pistas visuais. Reordene as imagens e confirme apenas quando estiver
          seguro.
        </p>
      </header>

      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {orderedIds.map((frameId, index) => {
              const frame = frameMap.get(frameId);
              if (!frame) {
                return null;
              }

              return (
                <SortableFrameCard
                  key={frame.id}
                  id={frame.id}
                  src={frame.src}
                  label={frame.label}
                  position={index + 1}
                  outcome={currentRecord?.isCorrect ?? null}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-col gap-3 rounded-[1.6rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--ink)]">
            {currentRecord?.isCorrect === true
              ? "Sequência correta."
              : currentRecord?.isCorrect === false
                ? "Sequência incorreta."
                : "Ainda não confirmada."}
          </p>
          <p className="text-sm text-[color:var(--ink-soft)]">
            {currentRecord?.isCorrect
              ? "Você pode avançar para a próxima história."
              : "Arraste as imagens até formar a ordem final e clique em confirmar."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onSubmit(orderedIds)}
            disabled={busy}
            className="min-h-11 rounded-full bg-[color:var(--ink)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Confirmar ordem
          </button>
          <button
            type="button"
            onClick={onAdvance}
            disabled={busy || currentRecord?.isCorrect !== true}
            className="min-h-11 rounded-full border border-[color:var(--line-strong)] px-5 text-sm font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--surface-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próxima história
          </button>
        </div>
      </div>
    </section>
  );
}
