import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PuzzleSession } from "./puzzle-session";
import { puzzleChallenges } from "@/lib/content/puzzle-catalog";

describe("PuzzleSession", () => {
  test("renders all pieces for Borboleta (7 pieces)", () => {
    const challenge = puzzleChallenges[4]; // Borboleta
    render(
      <PuzzleSession
        challenge={challenge}
        currentIndex={4}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getAllByTestId("puzzle-piece")).toHaveLength(7);
  });

  test("renders submit button", () => {
    const challenge = puzzleChallenges[0];
    render(
      <PuzzleSession
        challenge={challenge}
        currentIndex={0}
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /verificar/i })).toBeInTheDocument();
  });
});
