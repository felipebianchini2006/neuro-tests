import { describe, expect, it } from "vitest";

import { getPromptSequenceFrames, getSequenceStoryAt } from "@/lib/content/catalog";

import { buildParticipantSessionState } from "./participant-session-state";
import type { SessionSnapshot } from "./session-repository";

describe("participant session state", () => {
  it("builds the current sequence item from the server catalog", () => {
    const snapshot: SessionSnapshot = {
      session: {
        id: "session-1",
        token: "token-123",
        participantCode: "Paciente",
        testType: "sequence",
        status: "in_progress",
        currentItemIndex: 1,
        totalItems: 11,
        startedAt: null,
        completedAt: null,
        createdAt: "2026-03-09T12:00:00.000Z",
        updatedAt: "2026-03-09T12:00:00.000Z",
      },
      items: [],
    };

    const state = buildParticipantSessionState(snapshot);
    const story = getSequenceStoryAt(1);

    expect(state.currentItem?.kind).toBe("sequence");
    expect(state.currentItem?.story.title).toBe("2 - CHASE");
    expect(state.currentItem?.promptFrameIds).toEqual(
      getPromptSequenceFrames(story!, snapshot.session.token).map((frame) => frame.id),
    );
  });

  it("builds the first sequence item for the adult battery", () => {
    const snapshot: SessionSnapshot = {
      session: {
        id: "session-adult-1",
        token: "adult-token-1",
        participantCode: "Paciente",
        testType: "adult-battery",
        status: "in_progress",
        currentItemIndex: 0,
        totalItems: 25,
        startedAt: null,
        completedAt: null,
        createdAt: "2026-03-09T12:00:00.000Z",
        updatedAt: "2026-03-09T12:00:00.000Z",
      },
      items: [],
    };

    const state = buildParticipantSessionState(snapshot);
    const story = getSequenceStoryAt(0);

    expect(state.currentItem?.kind).toBe("sequence");
    expect(state.currentItem?.story.title).toBe("1 - CAP");
    expect(state.currentItem?.promptFrameIds).toEqual(
      getPromptSequenceFrames(story!, snapshot.session.token).map((frame) => frame.id),
    );
  });

  it("switches to cubes after the sequence section in the adult battery", () => {
    const snapshot: SessionSnapshot = {
      session: {
        id: "session-adult-2",
        token: "adult-token-2",
        participantCode: "Paciente",
        testType: "adult-battery",
        status: "in_progress",
        currentItemIndex: 11,
        totalItems: 25,
        startedAt: null,
        completedAt: null,
        createdAt: "2026-03-09T12:00:00.000Z",
        updatedAt: "2026-03-09T12:00:00.000Z",
      },
      items: [],
    };

    const state = buildParticipantSessionState(snapshot);

    expect(state.currentItem?.kind).toBe("cubes");
    expect(state.currentItem?.challenge.title).toBe("Cubos 1");
    expect(state.currentItem?.initialTray).toHaveLength(4);
  });

  it("switches to puzzle after the cubes section in the adult battery", () => {
    const snapshot: SessionSnapshot = {
      session: {
        id: "session-adult-3",
        token: "adult-token-3",
        participantCode: "Paciente",
        testType: "adult-battery",
        status: "in_progress",
        currentItemIndex: 20,
        totalItems: 25,
        startedAt: null,
        completedAt: null,
        createdAt: "2026-03-09T12:00:00.000Z",
        updatedAt: "2026-03-09T12:00:00.000Z",
      },
      items: [],
    };

    const state = buildParticipantSessionState(snapshot);

    expect(state.currentItem?.kind).toBe("puzzle");
    expect(state.currentItem?.challenge.title).toBe("Homem");
  });
});
