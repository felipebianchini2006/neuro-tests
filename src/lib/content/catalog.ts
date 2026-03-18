import {
  buildCubeTray,
  isCubeBoardCorrect,
  type CubeFace,
  type CubePiece,
} from "@/lib/domain/cubes";
import { puzzleChallenges } from "./puzzle-catalog";
import {
  buildSequenceStory,
  createSequenceSeedShuffle,
  isSequenceAnswerCorrect,
  type SequenceStory,
} from "@/lib/domain/sequence";

import { generatedSequenceSources } from "./sequence-manifest.generated";

export type TestType = "sequence" | "cubes" | "cubes-teen" | "puzzle";

export type CubeChallenge = {
  id: string;
  title: string;
  gridSize: 2 | 3;
  imageSrc: string;
  target: CubeFace[][];
};

const sequenceStories = generatedSequenceSources.map((entry) =>
  buildSequenceStory(entry.title, [...entry.frameSources]),
);

// CHASE has two clinically valid orderings (photos 1 and 2 from client reference).
// Primary order (1-2-3-4-5) is set via manifest; the alternative (1-2-4-3-5) is patched here.
const chaseStory = sequenceStories.find((s) => s.id === "2-chase");
if (chaseStory) {
  chaseStory.alternativeOrders = [
    [
      "2-chase-1-chase-jpg",
      "2-chase-2-chase-jpg",
      "2-chase-4-chase-jpg",
      "2-chase-3-chase-jpg",
      "2-chase-5-chase-jpg",
    ],
  ];
}

const cubeChallenges: CubeChallenge[] = [
  {
    id: "cubes-01",
    title: "Cubos 1",
    gridSize: 2,
    imageSrc: "/assets/cubes/1.jpg",
    target: [
      ["diag-br", "diag-bl"],
      ["red", "red"],
    ],
  },
  {
    id: "cubes-02",
    title: "Cubos 2",
    gridSize: 2,
    imageSrc: "/assets/cubes/2.jpg",
    target: [
      ["white", "diag-bl"],
      ["diag-tr", "white"],
    ],
  },
  {
    id: "cubes-03",
    title: "Cubos 3",
    gridSize: 2,
    imageSrc: "/assets/cubes/3.jpg",
    target: [
      ["diag-br", "red"],
      ["red", "diag-tl"],
    ],
  },
  {
    id: "cubes-04",
    title: "Cubos 4",
    gridSize: 2,
    imageSrc: "/assets/cubes/4.jpg",
    target: [
      ["diag-tl", "diag-tr"],
      ["diag-tr", "diag-tl"],
    ],
  },
  {
    id: "cubes-05",
    title: "Cubos 5",
    gridSize: 3,
    imageSrc: "/assets/cubes/5.jpg",
    target: [
      ["diag-bl", "white", "diag-tl"],
      ["white", "red", "white"],
      ["diag-br", "white", "diag-tr"],
    ],
  },
  {
    id: "cubes-06",
    title: "Cubos 6",
    gridSize: 3,
    imageSrc: "/assets/cubes/6.jpg",
    target: [
      ["diag-bl", "diag-tr", "diag-bl"],
      ["diag-tr", "diag-bl", "diag-tr"],
      ["diag-bl", "diag-tr", "diag-bl"],
    ],
  },
  {
    id: "cubes-07",
    title: "Cubos 7",
    gridSize: 3,
    imageSrc: "/assets/cubes/7.jpg",
    target: [
      ["diag-bl", "diag-br", "diag-tl"],
      ["diag-tl", "diag-tr", "diag-bl"],
      ["diag-br", "diag-bl", "diag-tr"],
    ],
  },
  {
    id: "cubes-08",
    title: "Cubos 8",
    gridSize: 3,
    imageSrc: "/assets/cubes/8.jpg",
    target: [
      ["diag-br", "red", "diag-bl"],
      ["red", "diag-tl", "white"],
      ["diag-tr", "white", "diag-br"],
    ],
  },
  {
    id: "cubes-09",
    title: "Cubos 9",
    gridSize: 3,
    imageSrc: "/assets/cubes/9.jpg",
    target: [
      ["red", "red", "diag-tl"],
      ["red", "white", "diag-tl"],
      ["diag-tr", "white", "red"],
    ],
  },
];

const cubeChallengesTeen: CubeChallenge[] = [
  {
    id: "cubes-teen-01",
    title: "Cubos A1",
    gridSize: 2,
    imageSrc: "/assets/cubes-teen/3.jpg",
    target: [["white", "red"], ["red", "white"]],
  },
  {
    id: "cubes-teen-02",
    title: "Cubos A2",
    gridSize: 2,
    imageSrc: "/assets/cubes-teen/4.jpg",
    target: [["red", "diag-bl"], ["red", "red"]],
  },
  {
    id: "cubes-teen-03",
    title: "Cubos A3",
    gridSize: 2,
    imageSrc: "/assets/cubes-teen/5.jpg",
    target: [["diag-tl", "white"], ["diag-bl", "white"]],
  },
  {
    id: "cubes-teen-04",
    title: "Cubos A4",
    gridSize: 2,
    imageSrc: "/assets/cubes-teen/6.jpg",
    target: [["red", "red"], ["diag-tl", "diag-tr"]],
  },
  {
    id: "cubes-teen-05",
    title: "Cubos A5",
    gridSize: 2,
    imageSrc: "/assets/cubes-teen/7.jpg",
    target: [["diag-br", "diag-bl"], ["diag-tr", "diag-tl"]],
  },
  {
    id: "cubes-teen-06",
    title: "Cubos A6",
    gridSize: 2,
    imageSrc: "/assets/cubes-teen/8.jpg",
    target: [["red", "diag-tl"], ["diag-br", "red"]],
  },
  {
    id: "cubes-teen-07",
    title: "Cubos A7",
    gridSize: 2,
    imageSrc: "/assets/cubes-teen/9.jpg",
    target: [["diag-bl", "diag-br"], ["diag-tl", "diag-tr"]],
  },
  {
    id: "cubes-teen-08",
    title: "Cubos A8",
    gridSize: 2,
    imageSrc: "/assets/cubes-teen/10.jpg",
    target: [["diag-tr", "diag-bl"], ["diag-tl", "diag-tr"]],
  },
  {
    id: "cubes-teen-09",
    title: "Cubos A9",
    gridSize: 3,
    imageSrc: "/assets/cubes-teen/11.jpg",
    target: [
      ["diag-br", "diag-bl", "diag-bl"],
      ["diag-br", "red", "diag-tl"],
      ["diag-tr", "diag-tr", "diag-tl"],
    ],
  },
  {
    id: "cubes-teen-10",
    title: "Cubos A10",
    gridSize: 3,
    imageSrc: "/assets/cubes-teen/12.jpg",
    target: [
      ["diag-tl", "diag-tr", "diag-tl"],
      ["diag-br", "diag-bl", "diag-br"],
      ["diag-tr", "diag-tr", "diag-tl"],
    ],
  },
  {
    id: "cubes-teen-11",
    title: "Cubos A11",
    gridSize: 3,
    imageSrc: "/assets/cubes-teen/13.jpg",
    target: [
      ["red", "diag-tl", "white"],
      ["diag-tr", "white", "white"],
      ["diag-tr", "white", "white"],
    ],
  },
  {
    id: "cubes-teen-12",
    title: "Cubos A12",
    gridSize: 3,
    imageSrc: "/assets/cubes-teen/14.jpg",
    target: [
      ["diag-br", "red", "diag-bl"],
      ["red", "white", "red"],
      ["diag-tr", "red", "diag-tl"],
    ],
  },
];

export function getCubeChallengeTeenAt(index: number) {
  return cubeChallengesTeen[index] ?? null;
}

export function validateCubeTeenAnswer(
  itemIndex: number,
  board: (CubeFace | null)[][],
) {
  const challenge = getCubeChallengeTeenAt(itemIndex);
  if (!challenge) return false;
  return isCubeBoardCorrect(challenge.target, board);
}

export function getTotalItems(testType: TestType) {
  if (testType === "sequence") return sequenceStories.length;
  if (testType === "cubes-teen") return cubeChallengesTeen.length;
  if (testType === "puzzle") return puzzleChallenges.length;
  return cubeChallenges.length;
}

export function getSequenceStoryAt(index: number) {
  return sequenceStories[index] ?? null;
}

export function getCubeChallengeAt(index: number) {
  return cubeChallenges[index] ?? null;
}

export function getPromptSequenceFrames(story: SequenceStory, sessionToken: string) {
  const promptOrder = createSequenceSeedShuffle(story.correctOrder, sessionToken);

  return promptOrder
    .map((frameId) => story.frames.find((frame) => frame.id === frameId) ?? null)
    .filter((frame): frame is SequenceStory["frames"][number] => frame !== null);
}

export function getCubeTrayForSession(
  challenge: CubeChallenge,
  sessionToken: string,
): CubePiece[] {
  return buildCubeTray(challenge.target, `${sessionToken}:${challenge.id}`);
}

export function validateSequenceAnswer(itemIndex: number, answer: string[]) {
  const story = getSequenceStoryAt(itemIndex);
  if (!story) {
    return false;
  }

  return isSequenceAnswerCorrect(story, answer);
}

export function validateCubeAnswer(
  itemIndex: number,
  board: (CubeFace | null)[][],
) {
  const challenge = getCubeChallengeAt(itemIndex);
  if (!challenge) {
    return false;
  }

  return isCubeBoardCorrect(challenge.target, board);
}

export function getItemTitle(testType: TestType, itemIndex: number) {
  if (testType === "sequence") {
    return getSequenceStoryAt(itemIndex)?.title ?? `Historia ${itemIndex + 1}`;
  }

  if (testType === "cubes-teen") {
    return getCubeChallengeTeenAt(itemIndex)?.title ?? `Cubos A${itemIndex + 1}`;
  }

  if (testType === "puzzle") {
    return puzzleChallenges[itemIndex]?.title ?? `Quebra-Cabeça ${itemIndex + 1}`;
  }

  return getCubeChallengeAt(itemIndex)?.title ?? `Cubos ${itemIndex + 1}`;
}

export const contentCatalog = {
  sequenceStories,
  cubeChallenges,
};
