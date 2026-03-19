import { describe, expect, it } from "vitest";

import {
  contentCatalog,
  getCubeChallengeAt,
  getCubeChallengeTeenAt,
  getSequenceStoryAt,
  getTotalItems,
  validateSequenceAnswer,
  validateCubeTeenAnswer,
} from "@/lib/content/catalog";
import { generatedSequenceSources } from "@/lib/content/sequence-manifest.generated";

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

  it("matches the visible cube patterns for all challenge images", () => {
    expect(contentCatalog.cubeChallenges.map((challenge) => challenge.target)).toEqual([
      [
        ["diag-br", "diag-bl"],
        ["red", "red"],
      ],
      [
        ["white", "diag-bl"],
        ["diag-tr", "white"],
      ],
      [
        ["diag-br", "red"],
        ["red", "diag-tl"],
      ],
      [
        ["diag-tl", "diag-tr"],
        ["diag-tr", "diag-tl"],
      ],
      [
        ["diag-bl", "white", "diag-tl"],
        ["white", "red", "white"],
        ["diag-br", "white", "diag-tr"],
      ],
      [
        ["diag-bl", "diag-tr", "diag-bl"],
        ["diag-tr", "diag-bl", "diag-tr"],
        ["diag-bl", "diag-tr", "diag-bl"],
      ],
      [
        ["diag-bl", "diag-br", "diag-tl"],
        ["diag-tl", "diag-tr", "diag-bl"],
        ["diag-br", "diag-bl", "diag-tr"],
      ],
      [
        ["diag-br", "red", "diag-bl"],
        ["red", "diag-tl", "white"],
        ["diag-tr", "white", "diag-br"],
      ],
      [
        ["diag-br", "red", "diag-bl"],
        ["red", "white", "red"],
        ["diag-tr", "red", "diag-tl"],
      ],
    ]);
  });

  it("keeps the first CAP story limited to the three sortable frames", () => {
    expect(getSequenceStoryAt(0)?.frames.map((frame) => frame.label)).toEqual([
      "1.1 - CAP",
      "1.2 - CAP",
      "1.3 - CAP",
    ]);
  });

  it("stores the CAP guide image outside of the sortable frame list", () => {
    expect(generatedSequenceSources[0].frameSources).toEqual([
      "/assets/sequence/1%20-%20CAP/1.1%20%20-%20CAP.jpg",
      "/assets/sequence/1%20-%20CAP/1.2%20-%20CAP.jpg",
      "/assets/sequence/1%20-%20CAP/1.3%20-%20CAP.jpg",
    ]);
  });

  it("uses only the isolated HUNT frame files when they are provided", () => {
    expect(generatedSequenceSources[4].frameSources).toEqual([
      "/assets/sequence/5%20-%20HUNT/4.jpg",
      "/assets/sequence/5%20-%20HUNT/3.jpg",
      "/assets/sequence/5%20-%20HUNT/2.jpg",
      "/assets/sequence/5%20-%20HUNT/5.png",
    ]);
  });

  it("keeps every sequence story in the same order shown by its guide image", () => {
    const storyOrders = Object.fromEntries(
      contentCatalog.sequenceStories.map((story) => [
        story.title,
        story.frames.map((frame) => frame.label),
      ]),
    );

    expect(storyOrders).toEqual({
      "1 - CAP": ["1.1 - CAP", "1.2 - CAP", "1.3 - CAP"],
      "2 - CHASE": ["1 - CHASE", "2 - CHASE", "3 - CHASE", "4 - CHASE", "5 - CHASE"],
      "3 - BAKE": ["1", "2", "3", "4"],
      "4 - OPENS": ["2", "4", "1", "3", "5"],
      "5 - HUNT": ["4", "3", "2", "5"],
      "6 - DREAMS": ["2D", "4R", "3E", "1A", "5M"],
      "7 - CLEAM": ["3", "5", "4", "2", "1"],
      "8 - CHOIR": ["4", "3", "1", "5", "2"],
      "9 - LUNCH": ["2", "5", "1", "4", "3"],
      "10 - SHARK": ["5", "1", "3", "2", "4"],
      "11 - SAMUEL": ["5", "4", "3", "1", "2", "6"],
    });
  });

  it("accepts the guide-image order for CHOIR", () => {
    const story = getSequenceStoryAt(7);

    expect(story).not.toBeNull();
    expect(validateSequenceAnswer(7, story!.correctOrder)).toBe(true);
    expect(story!.frames.map((frame) => frame.label)).toEqual([
      "4",
      "3",
      "1",
      "5",
      "2",
    ]);
  });

  it("accepts both clinically valid HUNT orderings", () => {
    const story = getSequenceStoryAt(4);

    expect(story).not.toBeNull();
    expect(validateSequenceAnswer(4, story!.correctOrder)).toBe(true);
    expect(
      validateSequenceAnswer(4, [
        "5-hunt-4-jpg",
        "5-hunt-3-jpg",
        "5-hunt-5-png",
        "5-hunt-2-jpg",
      ]),
    ).toBe(true);
  });
});

describe("cubes-teen catalog", () => {
  it("getTotalItems returns 12 for cubes-teen", () => {
    expect(getTotalItems("cubes-teen")).toBe(12);
  });

  it("challenges 0-7 (images 3-10) are 2x2", () => {
    for (let i = 0; i <= 7; i++) {
      const c = getCubeChallengeTeenAt(i);
      expect(c?.gridSize, `challenge ${i}`).toBe(2);
      expect(c?.target).toHaveLength(2);
      expect(c?.target[0]).toHaveLength(2);
    }
  });

  it("challenges 8-11 (images 11-14) are 3x3", () => {
    for (let i = 8; i <= 11; i++) {
      const c = getCubeChallengeTeenAt(i);
      expect(c?.gridSize, `challenge ${i}`).toBe(3);
      expect(c?.target).toHaveLength(3);
      expect(c?.target[0]).toHaveLength(3);
    }
  });

  it("getCubeChallengeTeenAt returns null for out-of-range index", () => {
    expect(getCubeChallengeTeenAt(12)).toBeNull();
    expect(getCubeChallengeTeenAt(-1)).toBeNull();
  });

  it("validateCubeTeenAnswer returns false for wrong answer", () => {
    // challenge 0 target is [["white","red"],["red","white"]]
    // wrong board:
    expect(validateCubeTeenAnswer(0, [["red", "white"], ["white", "red"]])).toBe(false);
  });

  it("validateCubeTeenAnswer returns true for correct answer", () => {
    // challenge 0: [["white","red"],["red","white"]]
    expect(validateCubeTeenAnswer(0, [["white", "red"], ["red", "white"]])).toBe(true);
  });
});
