import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminDashboard } from "./admin-dashboard";

function buildSessionRecord(participantCode: string, token: string) {
  const timestamp = "2026-03-09T12:00:00.000Z";

  return {
    id: `session-${token}`,
    token,
    participantCode,
    testType: "sequence" as const,
    status: "pending" as const,
    currentItemIndex: 0,
    totalItems: 3,
    startedAt: null,
    completedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe("AdminDashboard", () => {
  it("renders preloaded sessions from the server", () => {
    render(
      <AdminDashboard
        persistentStoreEnabled
        initialSessions={[
          buildSessionRecord("Paciente A", "token-a"),
          buildSessionRecord("Paciente B", "token-b"),
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Paciente A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Paciente B/i })).toBeInTheDocument();
    expect(screen.getByText(/\/p\/token-a/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Paciente B/i }));

    expect(screen.getByRole("heading", { name: "Paciente B" })).toBeInTheDocument();
    expect(screen.getByText(/\/p\/token-b/)).toBeInTheDocument();
  });

  it("moves a session to the completed tab when it is ended from the dashboard", async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.endsWith("/api/admin/sessions/token-a/complete")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            snapshot: {
              session: {
                ...buildSessionRecord("Paciente A", "token-a"),
                status: "completed" as const,
                completedAt: "2026-03-09T12:05:00.000Z",
                updatedAt: "2026-03-09T12:05:00.000Z",
              },
              items: [],
            },
          }),
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AdminDashboard
        persistentStoreEnabled
        initialSessions={[buildSessionRecord("Paciente A", "token-a")]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Encerrar sessao/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: /Sessoes encerradas/i }),
      ).toHaveAttribute("aria-selected", "true");
    });

    expect(screen.getByRole("heading", { name: "Paciente A" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Encerrar sessao/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps older links visible when a new session is created", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        snapshot: {
          session: buildSessionRecord("Paciente B", "token-b"),
          items: [],
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AdminDashboard
        persistentStoreEnabled={false}
        initialSessions={[buildSessionRecord("Paciente A", "token-a")]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Ex.: Paciente 08-03 / R.B."), {
      target: { value: "Paciente B" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Criar sess/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Paciente A/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Paciente B" })).toBeInTheDocument();
    });

    expect(screen.getByText(/\/p\/token-b/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Paciente A/i }));

    expect(screen.getByRole("heading", { name: "Paciente A" })).toBeInTheDocument();
    expect(screen.getByText(/\/p\/token-a/)).toBeInTheDocument();
  });

  it("shows completed sessions only after switching to the completed tab", () => {
    render(
      <AdminDashboard
        persistentStoreEnabled={false}
        initialSessions={[
          buildSessionRecord("Paciente A", "token-a"),
          {
            ...buildSessionRecord("Paciente Encerrado", "token-c"),
            status: "completed",
            completedAt: "2026-03-09T12:10:00.000Z",
            updatedAt: "2026-03-09T12:10:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.queryByText("Paciente Encerrado")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Sessoes encerradas/i }));

    expect(
      screen.getByRole("heading", { name: "Paciente Encerrado" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Paciente A")).not.toBeInTheDocument();
  });

  it("keeps the compact creation area labels visible", () => {
    render(
      <AdminDashboard
        persistentStoreEnabled
        initialSessions={[buildSessionRecord("Paciente A", "token-a")]}
      />,
    );

    expect(screen.getByText("Workspace clinico")).toBeInTheDocument();
    expect(screen.getByText("Nova sessao")).toBeInTheDocument();
    expect(screen.getByText("Identificador do avaliado")).toBeInTheDocument();
    expect(screen.getByText("Tipo de teste")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Criar sess/i })).toBeInTheDocument();
  });
});
