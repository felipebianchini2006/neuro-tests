import { beforeEach, describe, expect, it, vi } from "vitest";

const isAdminAuthenticated = vi.fn();
const createSession = vi.fn();

vi.mock("@/lib/server/admin-auth", () => ({
  isAdminAuthenticated,
}));

vi.mock("@/lib/server/session-repository", () => ({
  getSessionRepository: () => ({
    createSession,
  }),
}));

describe("POST /api/admin/sessions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    isAdminAuthenticated.mockResolvedValue(true);
  });

  it("creates an adult battery session through the admin API", async () => {
    createSession.mockResolvedValue({
      session: {
        id: "session-adult",
        token: "adult-token",
        participantCode: "Rangel",
        testType: "adult-battery",
        status: "pending",
        currentItemIndex: 0,
        totalItems: 25,
        startedAt: null,
        completedAt: null,
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T10:00:00.000Z",
      },
      items: [],
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantCode: "Rangel",
          testType: "adult-battery",
        }),
      }),
    );

    expect(createSession).toHaveBeenCalledWith({
      participantCode: "Rangel",
      testType: "adult-battery",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      snapshot: {
        session: {
          id: "session-adult",
          token: "adult-token",
          participantCode: "Rangel",
          testType: "adult-battery",
          status: "pending",
          currentItemIndex: 0,
          totalItems: 25,
          startedAt: null,
          completedAt: null,
          createdAt: "2026-03-20T10:00:00.000Z",
          updatedAt: "2026-03-20T10:00:00.000Z",
        },
        items: [],
      },
    });
  });

  it("rejects puzzle sessions because Armar Objetos is disabled", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantCode: "Rangel",
          testType: "puzzle",
        }),
      }),
    );

    expect(createSession).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Armar Objetos esta desativado no momento.",
    });
  });

  it("returns a helpful JSON error when Supabase rejects an unsupported test type", async () => {
    createSession.mockRejectedValue(
      new Error(
        'new row for relation "sessions" violates check constraint "sessions_test_type_check"',
      ),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantCode: "Rangel",
          testType: "adult-battery",
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error:
        "Tipo de teste nao suportado pelo banco configurado. Aplique a migration mais recente de test types.",
    });
  });
});
