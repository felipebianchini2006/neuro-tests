import { describe, expect, it } from "vitest";

import { generatedPuzzleSources } from "@/lib/content/puzzle-manifest.generated";

describe("generated puzzle manifest", () => {
  it("keeps all five Armar Objetos challenges with the expected piece counts", () => {
    expect(
      [...generatedPuzzleSources]
        .map((entry) => [entry.challengeId, entry.pieces.length] as const)
        .sort(([leftId], [rightId]) => leftId.localeCompare(rightId)),
    ).toEqual([
      ["puzzle-borboleta", 7],
      ["puzzle-casa", 9],
      ["puzzle-elefante", 6],
      ["puzzle-homem", 6],
      ["puzzle-perfil", 7],
    ]);
  });

  it("stores non-empty piece crops with positive render dimensions", () => {
    for (const challenge of generatedPuzzleSources) {
      expect(challenge.sheetWidth).toBeGreaterThan(0);
      expect(challenge.sheetHeight).toBeGreaterThan(0);

      for (const piece of challenge.pieces) {
        expect(piece.pieceSrc).toMatch(
          /^\/assets\/puzzles\/generated\/[^/]+\/piece-\d+\.png$/,
        );
        expect(piece.sourceBox.width).toBeGreaterThan(0);
        expect(piece.sourceBox.height).toBeGreaterThan(0);
        expect(piece.renderWidthPct).toBeGreaterThan(0);
        expect(piece.renderHeightPct).toBeGreaterThan(0);
      }
    }
  });
});
