import { describe, test, expect } from "vitest";
import { isPieceInPosition, isPuzzleComplete } from "./puzzle";

const TOLERANCES = { positionTolerance: 8, rotationTolerance: 35 };

describe("isPieceInPosition", () => {
  test("exactly at target passes", () => {
    expect(
      isPieceInPosition(
        { cx: 50, cy: 50, rotation: 0 },
        { targetCx: 50, targetCy: 50 },
        TOLERANCES,
      ),
    ).toBe(true);
  });

  test("within position tolerance passes", () => {
    expect(
      isPieceInPosition(
        { cx: 55, cy: 55, rotation: 0 },
        { targetCx: 50, targetCy: 50 },
        TOLERANCES,
      ),
    ).toBe(true); // dist ≈ 7.07, within 8
  });

  test("outside position tolerance fails", () => {
    expect(
      isPieceInPosition(
        { cx: 80, cy: 80, rotation: 0 },
        { targetCx: 50, targetCy: 50 },
        TOLERANCES,
      ),
    ).toBe(false);
  });

  test("within rotation tolerance passes", () => {
    expect(
      isPieceInPosition(
        { cx: 50, cy: 50, rotation: 30 },
        { targetCx: 50, targetCy: 50 },
        TOLERANCES,
      ),
    ).toBe(true);
  });

  test("outside rotation tolerance fails", () => {
    expect(
      isPieceInPosition(
        { cx: 50, cy: 50, rotation: 50 },
        { targetCx: 50, targetCy: 50 },
        TOLERANCES,
      ),
    ).toBe(false);
  });

  test("rotation 360 is same as 0", () => {
    expect(
      isPieceInPosition(
        { cx: 50, cy: 50, rotation: 360 },
        { targetCx: 50, targetCy: 50 },
        TOLERANCES,
      ),
    ).toBe(true);
  });

  test("rotation -10 is within tolerance", () => {
    expect(
      isPieceInPosition(
        { cx: 50, cy: 50, rotation: -10 },
        { targetCx: 50, targetCy: 50 },
        TOLERANCES,
      ),
    ).toBe(true);
  });
});

describe("isPuzzleComplete", () => {
  test("all pieces in position passes", () => {
    const placements = [
      { cx: 30, cy: 30, rotation: 10 },
      { cx: 70, cy: 70, rotation: -5 },
    ];
    const targets = [
      { targetCx: 30, targetCy: 30 },
      { targetCx: 70, targetCy: 70 },
    ];
    expect(isPuzzleComplete(placements, targets, TOLERANCES)).toBe(true);
  });

  test("one piece out of position fails", () => {
    const placements = [
      { cx: 30, cy: 30, rotation: 0 },
      { cx: 90, cy: 90, rotation: 0 }, // wrong
    ];
    const targets = [
      { targetCx: 30, targetCy: 30 },
      { targetCx: 70, targetCy: 70 },
    ];
    expect(isPuzzleComplete(placements, targets, TOLERANCES)).toBe(false);
  });

  test("empty puzzle is complete", () => {
    expect(isPuzzleComplete([], [], TOLERANCES)).toBe(true);
  });
});
