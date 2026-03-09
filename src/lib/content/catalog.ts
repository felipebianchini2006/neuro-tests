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
  imageSrc: string;
  target: CubeFace[][];
};

const sequenceStories = generatedSequenceSources.map((entry) =>
  buildSequenceStory(entry.title, [...entry.frameSources]),
);

const cubeChallenges: CubeChallenge[] = [
  {
    id: "cubes-01",
    title: "Cubos 1",
    gridSize: 2,
    imageSrc: "/assets/cubes/1.jpg",
    target: [
      ["diag-tl", "white"],
      ["diag-tr", "white"],
    ],
  },
  {
    id: "cubes-02",
    title: "Cubos 2",
    gridSize: 2,
    imageSrc: "/assets/cubes/2.jpg",
    target: [
      ["white", "diag-tl"],
      ["diag-tr", "white"],
    ],
  },
  {
    id: "cubes-03",
    title: "Cubos 3",
    gridSize: 2,
    imageSrc: "/assets/cubes/3.jpg",
    target: [
      ["diag-tl", "diag-tr"],
      ["diag-tr", "white"],
    ],
  },
  {
    id: "cubes-04",
    title: "Cubos 4",
    gridSize: 2,
    imageSrc: "/assets/cubes/4.jpg",
    target: [
      ["diag-tl", "white"],
      ["white", "white"],
    ],
  },
  {
    id: "cubes-05",
    title: "Cubos 5",
    gridSize: 3,
    imageSrc: "/assets/cubes/5.jpg",
    target: [
      ["diag-tl", "white", "diag-tl"],
      ["white", "red", "white"],
      ["diag-tr", "white", "diag-tr"],
    ],
  },
  {
    id: "cubes-06",
    title: "Cubos 6",
    gridSize: 3,
    imageSrc: "/assets/cubes/6.jpg",
    target: [
      ["diag-tr", "diag-tr", "diag-tl"],
      ["diag-tr", "diag-tr", "diag-tr"],
      ["diag-tl", "diag-tr", "diag-tl"],
    ],
  },
  {
    id: "cubes-07",
    title: "Cubos 7",
    gridSize: 3,
    imageSrc: "/assets/cubes/7.jpg",
    target: [
      ["diag-tl", "diag-tr", "diag-tl"],
      ["diag-tl", "diag-tr", "diag-tl"],
      ["diag-tr", "diag-tl", "diag-tr"],
    ],
  },
  {
    id: "cubes-08",
    title: "Cubos 8",
    gridSize: 3,
    imageSrc: "/assets/cubes/8.jpg",
    target: [
      ["white", "diag-tl", "diag-tr"],
      ["white", "diag-tr", "diag-tl"],
      ["white", "diag-tr", "white"],
    ],
  },
  {
    id: "cubes-09",
    title: "Cubos 9",
    gridSize: 3,
    imageSrc: "/assets/cubes/9.jpg",
    target: [
      ["diag-tl", "diag-tl", "white"],
      ["diag-tl", "diag-tr", "white"],
      ["diag-tr", "diag-tl", "white"],
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
    return getSequenceStoryAt(itemIndex)?.title ?? `Historia ${itemIndex + 1}`;
  }

  return getCubeChallengeAt(itemIndex)?.title ?? `Cubos ${itemIndex + 1}`;
}

export const contentCatalog = {
  sequenceStories,
  cubeChallenges,
};
