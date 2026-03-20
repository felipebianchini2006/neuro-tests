import { describe, expect, test } from "vitest";

import { puzzleChallenges } from "@/lib/content/puzzle-catalog";

import { isPuzzleComplete } from "./puzzle";
import { buildInitialPuzzlePlacements } from "./puzzle-layout";

describe("puzzle-layout", () => {
  test("spreads pieces along the edges instead of using their source centers", () => {
    const challenge = puzzleChallenges[0];

    const placements = buildInitialPuzzlePlacements(challenge);

    expect(placements).toHaveLength(challenge.pieces.length);
    expect(placements.every((placement) => placement.rotation === 0)).toBe(true);

    placements.forEach((placement, index) => {
      const piece = challenge.pieces[index];
      const sourceCx =
        ((piece.sourceBox.x + piece.sourceBox.width / 2) / challenge.sheetWidth) * 100;
      const sourceCy =
        ((piece.sourceBox.y + piece.sourceBox.height / 2) / challenge.sheetHeight) * 100;

      expect(placement.cx).not.toBeCloseTo(sourceCx, 6);
      expect(placement.cy).not.toBeCloseTo(sourceCy, 6);
    });
  });

  test("keeps every initial piece outside the central safe zone", () => {
    const challenge = puzzleChallenges[4];

    const placements = buildInitialPuzzlePlacements(challenge);

    expect(
      placements.every(
        (placement) =>
          placement.cx <= 20 ||
          placement.cx >= 80 ||
          placement.cy <= 20 ||
          placement.cy >= 80,
      ),
    ).toBe(true);
  });

  test("is deterministic per challenge and never starts solved", () => {
    const challenge = puzzleChallenges[2];

    const first = buildInitialPuzzlePlacements(challenge);
    const repeated = buildInitialPuzzlePlacements(challenge);

    expect(repeated).toEqual(first);
    expect(
      isPuzzleComplete(first, challenge.pieces, {
        positionTolerance: 8,
        rotationTolerance: 35,
      }),
    ).toBe(false);
  });
});
