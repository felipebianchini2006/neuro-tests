import { describe, expect, it } from "vitest";

import {
  buildCubeTray,
  isCubeBoardCorrect,
  rotateCubeFace,
  type CubeFace,
} from "@/lib/domain/cubes";

describe("cubes domain", () => {
  it("rotates diagonal faces clockwise and keeps solids unchanged", () => {
    expect(rotateCubeFace("diag-tl")).toBe("diag-tr");
    expect(rotateCubeFace("diag-tr")).toBe("diag-br");
    expect(rotateCubeFace("white")).toBe("white");
    expect(rotateCubeFace("red")).toBe("red");
  });

  it("builds a tray with the same piece inventory as the target board", () => {
    const target: CubeFace[][] = [
      ["diag-tl", "diag-tr"],
      ["white", "red"],
    ];

    const tray = buildCubeTray(target, "challenge-1");

    expect(tray.map((piece) => piece.face).sort()).toEqual([
      "diag-tl",
      "diag-tr",
      "red",
      "white",
    ]);
    expect(tray).toHaveLength(4);
  });

  it("validates the board only when every cell matches the expected face", () => {
    const target: CubeFace[][] = [
      ["diag-tl", "diag-tr"],
      ["white", "red"],
    ];

    expect(
      isCubeBoardCorrect(target, [
        ["diag-tl", "diag-tr"],
        ["white", "red"],
      ]),
    ).toBe(true);

    expect(
      isCubeBoardCorrect(target, [
        ["diag-tl", "diag-br"],
        ["white", "red"],
      ]),
    ).toBe(false);
  });
});
