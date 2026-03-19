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
          testType: "puzzle",
        }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error:
        "Tipo de teste nao suportado pelo banco configurado. Aplique a migration 002_add_test_types.sql.",
    });
  });
});
