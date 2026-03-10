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

  it("marks a session as completed and prevents further mutations", async () => {
    vi.useFakeTimers();
    const repository = getSessionRepository();

    vi.setSystemTime(new Date("2026-03-09T12:00:00.000Z"));
    const created = await repository.createSession({
      participantCode: "Paciente C",
      testType: "sequence",
    });

    vi.setSystemTime(new Date("2026-03-09T12:00:05.000Z"));
    const started = await repository.startItem(created.session.token, 0);
    expect(started?.session.status).toBe("in_progress");

    vi.setSystemTime(new Date("2026-03-09T12:00:10.000Z"));
    const completed = await repository.completeSession(created.session.token);

    expect(completed?.session.status).toBe("completed");
    expect(completed?.session.completedAt).toBe("2026-03-09T12:00:10.000Z");

    const answeredAfterCompletion = await repository.recordAnswer({
      token: created.session.token,
      itemIndex: 0,
      answerPayload: ["ignored"],
      isCorrect: true,
    });
    const restartedAfterCompletion = await repository.startItem(
      created.session.token,
      1,
    );
    const advancedAfterCompletion = await repository.advanceSession(
      created.session.token,
    );

    expect(answeredAfterCompletion).toEqual(completed);
    expect(restartedAfterCompletion).toEqual(completed);
    expect(advancedAfterCompletion).toEqual(completed);

    vi.useRealTimers();
  });

  it("deletes all completed sessions without removing open ones", async () => {
    vi.useFakeTimers();
    const repository = getSessionRepository();

    vi.setSystemTime(new Date("2026-03-09T12:00:00.000Z"));
    const openSession = await repository.createSession({
      participantCode: "Paciente Aberto",
      testType: "sequence",
    });

    vi.setSystemTime(new Date("2026-03-09T12:00:01.000Z"));
    const firstCompleted = await repository.createSession({
      participantCode: "Paciente Encerrado 1",
      testType: "sequence",
    });

    vi.setSystemTime(new Date("2026-03-09T12:00:02.000Z"));
    const secondCompleted = await repository.createSession({
      participantCode: "Paciente Encerrado 2",
      testType: "cubes",
    });

    await repository.completeSession(firstCompleted.session.token);
    await repository.completeSession(secondCompleted.session.token);

    const deletedCount = await repository.deleteCompletedSessions();
    const sessions = await repository.listSessions();

    expect(deletedCount).toBe(2);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.token).toBe(openSession.session.token);
    expect(sessions[0]?.status).toBe("pending");

    vi.useRealTimers();
  });
});
