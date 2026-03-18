export type PuzzlePieceDefinition = {
  id: string;
  /** SVG polygon points as "x,y x,y ..." where coordinates are % of assembled image dimensions */
  clipPolygon: string;
  /** Center of piece in assembled image as % of canvas width */
  targetCx: number;
  /** Center of piece in assembled image as % of canvas height */
  targetCy: number;
  /** Bounding box width as % of canvas width */
  naturalW: number;
  /** Bounding box height as % of canvas height */
  naturalH: number;
};

export type PuzzleChallenge = {
  id: string;
  title: string;
  imageSrc: string;
  pieces: PuzzlePieceDefinition[];
};

export type PiecePlacement = {
  /** Current center x as % of canvas width */
  cx: number;
  /** Current center y as % of canvas height */
  cy: number;
  /** Rotation in degrees */
  rotation: number;
};

type Tolerances = {
  positionTolerance: number; // % of canvas
  rotationTolerance: number; // degrees
};

export function isPieceInPosition(
  placement: PiecePlacement,
  target: Pick<PuzzlePieceDefinition, "targetCx" | "targetCy">,
  tolerances: Tolerances,
): boolean {
  const dx = placement.cx - target.targetCx;
  const dy = placement.cy - target.targetCy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Normalize rotation to [0, 360) then find shortest arc
  const rotNorm = ((placement.rotation % 360) + 360) % 360;
  const rotDiff = Math.min(rotNorm, 360 - rotNorm);

  return dist <= tolerances.positionTolerance && rotDiff <= tolerances.rotationTolerance;
}

export function isPuzzleComplete(
  placements: PiecePlacement[],
  targets: Pick<PuzzlePieceDefinition, "targetCx" | "targetCy">[],
  tolerances: Tolerances,
): boolean {
  return placements.every((p, i) => isPieceInPosition(p, targets[i], tolerances));
}
