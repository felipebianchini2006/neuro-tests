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

    expect(screen.getByText("Paciente A")).toBeInTheDocument();
    expect(screen.getByText("Paciente B")).toBeInTheDocument();
    expect(screen.getByText(/\/p\/token-a/)).toBeInTheDocument();
    expect(screen.getByText(/\/p\/token-b/)).toBeInTheDocument();
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
      expect(screen.getByText("Paciente A")).toBeInTheDocument();
      expect(screen.getByText("Paciente B")).toBeInTheDocument();
    });

    expect(screen.getByText(/\/p\/token-a/)).toBeInTheDocument();
    expect(screen.getByText(/\/p\/token-b/)).toBeInTheDocument();
  });
});
