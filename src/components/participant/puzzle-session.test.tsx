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
        onAnswer={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /verificar/i })).toBeInTheDocument();
  });

  test("renders transparent piece images instead of recropping the full challenge sheet", () => {
    const challenge = puzzleChallenges[0];
    render(
      <PuzzleSession
        challenge={challenge}
        onAnswer={vi.fn()}
      />,
    );

    const pieceImages = screen.getAllByRole("presentation");
    expect(pieceImages).toHaveLength(challenge.pieces.length);
    expect(pieceImages[0]).toHaveAttribute(
      "src",
      expect.stringMatching(/\/assets\/puzzles\/generated\/puzzle-homem\/piece-1\.png$/),
    );
    expect(pieceImages).not.toContainEqual(
      expect.objectContaining({
        src: expect.stringContaining("/assets/puzzles/homem.jpg"),
      }),
    );
  });
});
