import type { PuzzleChallenge, PiecePlacement } from "@/lib/domain/puzzle";
import { isPuzzleComplete } from "@/lib/domain/puzzle";
import { generatedPuzzleSources } from "./puzzle-manifest.generated";

type PuzzleTargetPlacement = {
  targetCx: number;
  targetCy: number;
  targetRotation: number;
};

const puzzleBlueprints = [
  {
    id: "puzzle-homem",
    title: "Homem",
    targets: [
      { targetCx: 50, targetCy: 20, targetRotation: 0 },
      { targetCx: 50, targetCy: 50, targetRotation: 0 },
      { targetCx: 30, targetCy: 75, targetRotation: 0 },
      { targetCx: 70, targetCy: 75, targetRotation: 0 },
      { targetCx: 30, targetCy: 90, targetRotation: 0 },
      { targetCx: 70, targetCy: 90, targetRotation: 0 },
    ] satisfies PuzzleTargetPlacement[],
  },
  {
    id: "puzzle-perfil",
    title: "Perfil",
    targets: [
      { targetCx: 50, targetCy: 15, targetRotation: 0 },
      { targetCx: 30, targetCy: 40, targetRotation: 0 },
      { targetCx: 65, targetCy: 40, targetRotation: 0 },
      { targetCx: 20, targetCy: 65, targetRotation: 0 },
      { targetCx: 50, targetCy: 65, targetRotation: 0 },
      { targetCx: 75, targetCy: 65, targetRotation: 0 },
      { targetCx: 50, targetCy: 88, targetRotation: 0 },
    ] satisfies PuzzleTargetPlacement[],
  },
  {
    id: "puzzle-elefante",
    title: "Elefante",
    targets: [
      { targetCx: 50, targetCy: 20, targetRotation: 0 },
      { targetCx: 25, targetCy: 50, targetRotation: 0 },
      { targetCx: 60, targetCy: 50, targetRotation: 0 },
      { targetCx: 20, targetCy: 75, targetRotation: 0 },
      { targetCx: 50, targetCy: 80, targetRotation: 0 },
      { targetCx: 80, targetCy: 75, targetRotation: 0 },
    ] satisfies PuzzleTargetPlacement[],
  },
  {
    id: "puzzle-casa",
    title: "Casa",
    targets: [
      { targetCx: 50, targetCy: 15, targetRotation: 0 },
      { targetCx: 20, targetCy: 40, targetRotation: 0 },
      { targetCx: 50, targetCy: 40, targetRotation: 0 },
      { targetCx: 80, targetCy: 40, targetRotation: 0 },
      { targetCx: 20, targetCy: 65, targetRotation: 0 },
      { targetCx: 50, targetCy: 65, targetRotation: 0 },
      { targetCx: 80, targetCy: 65, targetRotation: 0 },
      { targetCx: 30, targetCy: 85, targetRotation: 0 },
      { targetCx: 70, targetCy: 85, targetRotation: 0 },
    ] satisfies PuzzleTargetPlacement[],
  },
  {
    id: "puzzle-borboleta",
    title: "Borboleta",
    targets: [
      { targetCx: 25, targetCy: 25, targetRotation: 0 },
      { targetCx: 75, targetCy: 25, targetRotation: 0 },
      { targetCx: 20, targetCy: 65, targetRotation: 0 },
      { targetCx: 80, targetCy: 65, targetRotation: 0 },
      { targetCx: 50, targetCy: 40, targetRotation: 0 },
      { targetCx: 50, targetCy: 70, targetRotation: 0 },
      { targetCx: 50, targetCy: 88, targetRotation: 0 },
    ] satisfies PuzzleTargetPlacement[],
  },
] as const;

const generatedPuzzleSourcesById = new Map(
  generatedPuzzleSources.map((challenge) => [challenge.challengeId, challenge]),
);

export const puzzleChallenges: PuzzleChallenge[] = puzzleBlueprints.map((blueprint) => {
  const generated = generatedPuzzleSourcesById.get(blueprint.id);
  if (!generated) {
    throw new Error(`Missing generated puzzle source for ${blueprint.id}.`);
  }

  if (generated.pieces.length !== blueprint.targets.length) {
    throw new Error(
      `Puzzle target count mismatch for ${blueprint.id}: ${generated.pieces.length} pieces but ${blueprint.targets.length} targets.`,
    );
  }

  return {
    id: blueprint.id,
    title: blueprint.title,
    sheetWidth: generated.sheetWidth,
    sheetHeight: generated.sheetHeight,
    pieces: generated.pieces.map((piece, index) => ({
      id: `${blueprint.id}-piece-${index + 1}`,
      pieceSrc: piece.pieceSrc,
      sourceBox: piece.sourceBox,
      renderWidthPct: piece.renderWidthPct,
      renderHeightPct: piece.renderHeightPct,
      targetCx: blueprint.targets[index].targetCx,
      targetCy: blueprint.targets[index].targetCy,
      targetRotation: blueprint.targets[index].targetRotation,
    })),
  };
});

export function getPuzzleChallengeAt(index: number): PuzzleChallenge | null {
  return puzzleChallenges[index] ?? null;
}

export function validatePuzzleAnswer(
  itemIndex: number,
  placements: PiecePlacement[],
): boolean {
  const challenge = getPuzzleChallengeAt(itemIndex);
  if (!challenge) return false;
  return isPuzzleComplete(placements, challenge.pieces, {
    positionTolerance: 8,
    rotationTolerance: 35,
  });
}
