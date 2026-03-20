import { describe, expect, it } from "vitest";

import {
  contentCatalog,
  getAdultBatteryItemAt,
  getCubeChallengeAt,
  getCubeChallengeTeenAt,
  getItemTitle,
  getSequenceStoryAt,
  getTotalItems,
  validateSequenceAnswer,
  validateCubeTeenAnswer,
} from "@/lib/content/catalog";
import { generatedSequenceSources } from "@/lib/content/sequence-manifest.generated";
import { generatedPuzzleSources } from "@/lib/content/puzzle-manifest.generated";

describe("content catalog", () => {
  it("keeps the full sequence and cube challenge counts", () => {
    expect(contentCatalog.sequenceStories).toHaveLength(11);
    expect(contentCatalog.cubeChallenges).toHaveLength(9);
  });

  it("keeps the five Armar Objetos challenges wired into the catalog", () => {
    expect(generatedPuzzleSources).toHaveLength(5);
    expect(getTotalItems("puzzle")).toBe(5);
    expect(getItemTitle("puzzle", 0)).toBe("Homem");
    expect(getItemTitle("puzzle", 4)).toBe("Borboleta");
  });

  it("exposes the adult battery as the combined adult item count", () => {
    expect(getTotalItems("adult-battery")).toBe(25);
  });

  it("maps adult battery indexes across sequence, cubes, and puzzle sections", () => {
    expect(getAdultBatteryItemAt(0)).toEqual({
      section: "sequence",
      localIndex: 0,
    });
    expect(getAdultBatteryItemAt(10)).toEqual({
      section: "sequence",
      localIndex: 10,
    });
    expect(getAdultBatteryItemAt(11)).toEqual({
      section: "cubes",
      localIndex: 0,
    });
    expect(getAdultBatteryItemAt(19)).toEqual({
      section: "cubes",
      localIndex: 8,
    });
    expect(getAdultBatteryItemAt(20)).toEqual({
      section: "puzzle",
      localIndex: 0,
    });
    expect(getAdultBatteryItemAt(24)).toEqual({
      section: "puzzle",
      localIndex: 4,
    });
    expect(getAdultBatteryItemAt(25)).toBeNull();
  });

  it("returns section-aware titles for the adult battery", () => {
    expect(getItemTitle("adult-battery", 0)).toBe("1 - CAP");
    expect(getItemTitle("adult-battery", 11)).toBe("Cubos 1");
    expect(getItemTitle("adult-battery", 20)).toBe("Homem");
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
        ["white", "diag-tl"],
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
  const expectedTeenChallenges = [
    {
      imageSrc: "/assets/cubes-teen/3.jpg",
      gridSize: 2,
      target: [["white", "red"], ["red", "white"]],
    },
    {
      imageSrc: "/assets/cubes-teen/4.jpg",
      gridSize: 2,
      target: [["red", "diag-bl"], ["red", "red"]],
    },
    {
      imageSrc: "/assets/cubes-teen/5.jpg",
      gridSize: 2,
      target: [["diag-tl", "white"], ["diag-bl", "white"]],
    },
    {
      imageSrc: "/assets/cubes-teen/6.jpg",
      gridSize: 2,
      target: [["red", "red"], ["diag-tl", "diag-tr"]],
    },
    {
      imageSrc: "/assets/cubes-teen/7.jpg",
      gridSize: 2,
      target: [["diag-br", "diag-bl"], ["diag-tr", "diag-tl"]],
    },
    {
      imageSrc: "/assets/cubes-teen/8.jpg",
      gridSize: 2,
      target: [["red", "diag-bl"], ["diag-tr", "red"]],
    },
    {
      imageSrc: "/assets/cubes-teen/9.jpg",
      gridSize: 2,
      target: [["diag-bl", "diag-br"], ["diag-tl", "diag-tr"]],
    },
    {
      imageSrc: "/assets/cubes-teen/10.jpg",
      gridSize: 2,
      target: [["diag-tr", "diag-bl"], ["diag-tl", "diag-tr"]],
    },
    {
      imageSrc: "/assets/cubes-teen/11.jpg",
      gridSize: 3,
      target: [
        ["diag-br", "diag-bl", "diag-bl"],
        ["diag-br", "red", "diag-tl"],
        ["diag-tr", "diag-tr", "diag-tl"],
      ],
    },
    {
      imageSrc: "/assets/cubes-teen/12.jpg",
      gridSize: 3,
      target: [
        ["diag-tl", "diag-tr", "diag-tl"],
        ["diag-br", "diag-bl", "diag-br"],
        ["diag-tr", "diag-tr", "diag-tl"],
      ],
    },
    {
      imageSrc: "/assets/cubes-teen/13.jpg",
      gridSize: 3,
      target: [
        ["white", "red", "white"],
        ["white", "red", "white"],
        ["white", "diag-tl", "white"],
      ],
    },
    {
      imageSrc: "/assets/cubes-teen/14.jpg",
      gridSize: 3,
      target: [
        ["white", "diag-tl", "white"],
        ["diag-bl", "white", "diag-tr"],
        ["white", "diag-br", "white"],
      ],
    },
  ] as const;

  it("getTotalItems returns 12 for cubes-teen", () => {
    expect(getTotalItems("cubes-teen")).toBe(12);
  });

  it("keeps every adolescent challenge aligned with the client zip order and targets", () => {
    const teenChallenges = expectedTeenChallenges.map((_, index) =>
      getCubeChallengeTeenAt(index),
    );

    expect(
      teenChallenges.map((challenge) => ({
        imageSrc: challenge?.imageSrc,
        gridSize: challenge?.gridSize,
        target: challenge?.target,
      })),
    ).toEqual(expectedTeenChallenges);
  });

  it("getCubeChallengeTeenAt returns null for out-of-range index", () => {
    expect(getCubeChallengeTeenAt(12)).toBeNull();
    expect(getCubeChallengeTeenAt(-1)).toBeNull();
  });

  it("keeps the first corrected 2x2 challenge in checkerboard order", () => {
    expect(getCubeChallengeTeenAt(0)?.target).toEqual([
      ["white", "red"],
      ["red", "white"],
    ]);
  });

  it("keeps the corrected 8.jpg diagonal orientation", () => {
    expect(getCubeChallengeTeenAt(5)?.target).toEqual([
      ["red", "diag-bl"],
      ["diag-tr", "red"],
    ]);
  });

  it("validateCubeTeenAnswer returns false for wrong answer", () => {
    expect(validateCubeTeenAnswer(0, [["red", "white"], ["white", "red"]])).toBe(false);
  });

  it("validateCubeTeenAnswer returns true for a corrected 3x3 challenge", () => {
    expect(
      validateCubeTeenAnswer(11, [
        ["white", "diag-tl", "white"],
        ["diag-bl", "white", "diag-tr"],
        ["white", "diag-br", "white"],
      ]),
    ).toBe(true);
  });
});
