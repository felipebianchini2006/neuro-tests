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
});
