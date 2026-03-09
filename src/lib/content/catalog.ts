import {
  buildCubeTray,
  isCubeBoardCorrect,
  type CubeFace,
  type CubePiece,
} from "@/lib/domain/cubes";
import {
  buildSequenceStory,
  createSequenceSeedShuffle,
  isSequenceAnswerCorrect,
  type SequenceStory,
} from "@/lib/domain/sequence";

import { generatedSequenceSources } from "./sequence-manifest.generated";

export type TestType = "sequence" | "cubes";

export type CubeChallenge = {
  id: string;
  title: string;
  gridSize: 2 | 3;
  target: CubeFace[][];
};

const sequenceStories = generatedSequenceSources.map((entry) =>
  buildSequenceStory(entry.title, [...entry.frameSources]),
);

const cubeChallenges: CubeChallenge[] = [
  {
    id: "cubes-01-diamond",
    title: "Cubos 1",
    gridSize: 2,
    target: [
      ["diag-tl", "diag-tr"],
      ["diag-bl", "diag-br"],
    ],
  },
  {
    id: "cubes-02-checker",
    title: "Cubos 2",
    gridSize: 2,
    target: [
      ["red", "white"],
      ["white", "red"],
    ],
  },
  {
    id: "cubes-03-pinwheel",
    title: "Cubos 3",
    gridSize: 2,
    target: [
      ["diag-tr", "diag-br"],
      ["diag-tl", "diag-bl"],
    ],
  },
  {
    id: "cubes-04-frame",
    title: "Cubos 4",
    gridSize: 3,
    target: [
      ["diag-tl", "red", "diag-tr"],
      ["white", "white", "white"],
      ["diag-bl", "red", "diag-br"],
    ],
  },
  {
    id: "cubes-05-zigzag",
    title: "Cubos 5",
    gridSize: 3,
    target: [
      ["diag-tr", "white", "diag-tl"],
      ["red", "diag-br", "red"],
      ["diag-bl", "white", "diag-br"],
    ],
  },
  {
    id: "cubes-06-arrow",
    title: "Cubos 6",
    gridSize: 3,
    target: [
      ["white", "diag-tl", "white"],
      ["diag-bl", "red", "diag-tr"],
      ["white", "diag-br", "white"],
    ],
  },
  {
    id: "cubes-07-bar",
    title: "Cubos 7",
    gridSize: 3,
    target: [
      ["white", "red", "white"],
      ["diag-tl", "diag-tr", "diag-tl"],
      ["white", "red", "white"],
    ],
  },
  {
    id: "cubes-08-cross",
    title: "Cubos 8",
    gridSize: 3,
    target: [
      ["diag-tl", "white", "diag-tr"],
      ["white", "red", "white"],
      ["diag-bl", "white", "diag-br"],
    ],
  },
  {
    id: "cubes-09-target",
    title: "Cubos 9",
    gridSize: 3,
    target: [
      ["red", "diag-tl", "red"],
      ["diag-tr", "white", "diag-bl"],
      ["red", "diag-br", "red"],
    ],
  },
];

export function getTotalItems(testType: TestType) {
  return testType === "sequence" ? sequenceStories.length : cubeChallenges.length;
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
    return getSequenceStoryAt(itemIndex)?.title ?? `História ${itemIndex + 1}`;
  }

  return getCubeChallengeAt(itemIndex)?.title ?? `Cubos ${itemIndex + 1}`;
}

export const contentCatalog = {
  sequenceStories,
  cubeChallenges,
};
