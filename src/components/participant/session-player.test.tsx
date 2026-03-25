import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ParticipantSessionState } from "@/lib/server/participant-session-state";

import { SessionPlayer } from "./session-player";
import { postSessionAction } from "@/lib/client/api";

vi.mock("@/lib/client/api", () => ({
  postSessionAction: vi.fn(),
}));

vi.mock("@/lib/client/session-channel", () => ({
  broadcastSessionSnapshot: vi.fn(),
  createSessionChannel: vi.fn(() => null),
}));

function buildParticipantState(
  testType: "cubes" | "cubes-teen",
): ParticipantSessionState {
  const timestamp = "2026-03-09T12:00:00.000Z";

  return {
    snapshot: {
      session: {
        id: `session-${testType}`,
        token: `token-${testType}`,
        participantCode: "Paciente Cubos",
        testType,
        status: "pending",
        currentItemIndex: 0,
        totalItems: 1,
        startedAt: null,
        completedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      items: [],
    },
    currentItem: null,
  };
}

describe("SessionPlayer", () => {
  it("shows the original title for the adolescent cube session", () => {
    const state = buildParticipantState("cubes-teen");
    vi.mocked(postSessionAction).mockResolvedValueOnce(state);

    render(<SessionPlayer initialState={state} />);

    expect(
      screen.getByRole("heading", { name: "Cubos (Adolescente)" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Cubos (Adulto)" }),
    ).not.toBeInTheDocument();
  });

  it("shows the original title for the standard cube session", () => {
    const state = buildParticipantState("cubes");
    vi.mocked(postSessionAction).mockResolvedValueOnce(state);

    render(<SessionPlayer initialState={state} />);

    expect(screen.getByRole("heading", { name: "Cubos" })).toBeInTheDocument();
  });
});
