import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSessionRepository } from "./session-repository";

describe("session-repository", () => {
  beforeEach(() => {
    const globalStore = globalThis as typeof globalThis & {
      __neuroTestsMemoryStore?: {
        sessions: Map<string, unknown>;
        items: Map<string, unknown>;
      };
    };

    globalStore.__neuroTestsMemoryStore?.sessions.clear();
    globalStore.__neuroTestsMemoryStore?.items.clear();

    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("lists created sessions in reverse chronological order", async () => {
    vi.useFakeTimers();
    const repository = getSessionRepository();

    vi.setSystemTime(new Date("2026-03-09T12:00:00.000Z"));
    await repository.createSession({
      participantCode: "Paciente A",
      testType: "sequence",
    });

    vi.setSystemTime(new Date("2026-03-09T12:00:01.000Z"));
    await repository.createSession({
      participantCode: "Paciente B",
      testType: "cubes",
    });

    const sessions = await repository.listSessions();

    expect(sessions).toHaveLength(2);
    expect(sessions[0]?.participantCode).toBe("Paciente B");
    expect(sessions[1]?.participantCode).toBe("Paciente A");

    vi.useRealTimers();
  });
});
