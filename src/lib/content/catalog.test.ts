import { describe, expect, it } from "vitest";

import { contentCatalog, getCubeChallengeAt } from "@/lib/content/catalog";

describe("content catalog", () => {
  it("keeps the full sequence and cube challenge counts", () => {
    expect(contentCatalog.sequenceStories).toHaveLength(11);
    expect(contentCatalog.cubeChallenges).toHaveLength(9);
  });

  it("uses the real cube image assets for every challenge", () => {
    const imageSources = contentCatalog.cubeChallenges.map(
      (challenge) => challenge.imageSrc,
    );

    expect(imageSources).toEqual([
      "/assets/cubes/1.jpg",
      "/assets/cubes/2.jpg",
      "/assets/cubes/3.jpg",
      "/assets/cubes/4.jpg",
      "/assets/cubes/5.jpg",
      "/assets/cubes/6.jpg",
      "/assets/cubes/7.jpg",
      "/assets/cubes/8.jpg",
      "/assets/cubes/9.jpg",
    ]);
  });

  it("maps the first four cube challenges to 2x2 and the remaining to 3x3", () => {
    expect(getCubeChallengeAt(0)?.gridSize).toBe(2);
    expect(getCubeChallengeAt(3)?.gridSize).toBe(2);
    expect(getCubeChallengeAt(4)?.gridSize).toBe(3);
    expect(getCubeChallengeAt(8)?.gridSize).toBe(3);
  });
});
