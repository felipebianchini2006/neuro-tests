import type { PuzzleChallenge, PiecePlacement } from "@/lib/domain/puzzle";
import { isPuzzleComplete } from "@/lib/domain/puzzle";

// Piece definitions are stubs — clipPolygon/naturalW/naturalH will be filled in
// when the examiner verifies piece shapes against the verso scans.
// For now pieces use empty polygon stubs so the component can render.

export const puzzleChallenges: PuzzleChallenge[] = [
  {
    id: "puzzle-homem",
    title: "Homem",
    imageSrc: "/assets/puzzles/homem.jpg",
    pieces: [
      { id: "homem-1", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 20, naturalW: 40, naturalH: 35 },
      { id: "homem-2", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 50, naturalW: 45, naturalH: 30 },
      { id: "homem-3", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 30, targetCy: 75, naturalW: 25, naturalH: 35 },
      { id: "homem-4", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 70, targetCy: 75, naturalW: 25, naturalH: 35 },
      { id: "homem-5", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 30, targetCy: 90, naturalW: 20, naturalH: 20 },
      { id: "homem-6", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 70, targetCy: 90, naturalW: 20, naturalH: 20 },
    ],
  },
  {
    id: "puzzle-perfil",
    title: "Perfil",
    imageSrc: "/assets/puzzles/perfil.jpg",
    pieces: [
      { id: "perfil-1", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 15, naturalW: 45, naturalH: 30 },
      { id: "perfil-2", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 30, targetCy: 40, naturalW: 35, naturalH: 35 },
      { id: "perfil-3", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 65, targetCy: 40, naturalW: 35, naturalH: 35 },
      { id: "perfil-4", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 20, targetCy: 65, naturalW: 30, naturalH: 30 },
      { id: "perfil-5", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 65, naturalW: 30, naturalH: 30 },
      { id: "perfil-6", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 75, targetCy: 65, naturalW: 30, naturalH: 30 },
      { id: "perfil-7", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 88, naturalW: 55, naturalH: 25 },
    ],
  },
  {
    id: "puzzle-elefante",
    title: "Elefante",
    imageSrc: "/assets/puzzles/elefante.jpg",
    pieces: [
      { id: "elefante-1", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 20, naturalW: 50, naturalH: 35 },
      { id: "elefante-2", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 25, targetCy: 50, naturalW: 35, naturalH: 35 },
      { id: "elefante-3", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 60, targetCy: 50, naturalW: 40, naturalH: 35 },
      { id: "elefante-4", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 20, targetCy: 75, naturalW: 25, naturalH: 30 },
      { id: "elefante-5", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 80, naturalW: 30, naturalH: 25 },
      { id: "elefante-6", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 80, targetCy: 75, naturalW: 25, naturalH: 30 },
    ],
  },
  {
    id: "puzzle-casa",
    title: "Casa",
    imageSrc: "/assets/puzzles/casa.jpg",
    pieces: [
      { id: "casa-1", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 15, naturalW: 60, naturalH: 25 },
      { id: "casa-2", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 20, targetCy: 40, naturalW: 30, naturalH: 30 },
      { id: "casa-3", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 40, naturalW: 30, naturalH: 30 },
      { id: "casa-4", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 80, targetCy: 40, naturalW: 30, naturalH: 30 },
      { id: "casa-5", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 20, targetCy: 65, naturalW: 30, naturalH: 25 },
      { id: "casa-6", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 65, naturalW: 30, naturalH: 25 },
      { id: "casa-7", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 80, targetCy: 65, naturalW: 30, naturalH: 25 },
      { id: "casa-8", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 30, targetCy: 85, naturalW: 35, naturalH: 20 },
      { id: "casa-9", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 70, targetCy: 85, naturalW: 35, naturalH: 20 },
    ],
  },
  {
    id: "puzzle-borboleta",
    title: "Borboleta",
    imageSrc: "/assets/puzzles/borboleta.jpg",
    pieces: [
      { id: "borboleta-1", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 25, targetCy: 25, naturalW: 40, naturalH: 45 },
      { id: "borboleta-2", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 75, targetCy: 25, naturalW: 40, naturalH: 45 },
      { id: "borboleta-3", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 20, targetCy: 65, naturalW: 35, naturalH: 40 },
      { id: "borboleta-4", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 80, targetCy: 65, naturalW: 35, naturalH: 40 },
      { id: "borboleta-5", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 40, naturalW: 20, naturalH: 50 },
      { id: "borboleta-6", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 70, naturalW: 25, naturalH: 30 },
      { id: "borboleta-7", clipPolygon: "0,0 100,0 100,100 0,100", targetCx: 50, targetCy: 88, naturalW: 30, naturalH: 20 },
    ],
  },
];

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
