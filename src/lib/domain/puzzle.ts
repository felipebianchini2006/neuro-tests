export type PuzzlePieceDefinition = {
  id: string;
  pieceSrc: string;
  sourceBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Center of piece in assembled image as % of canvas width */
  targetCx: number;
  /** Center of piece in assembled image as % of canvas height */
  targetCy: number;
  /** Rotation required at the solved position */
  targetRotation: number;
  /** Rendered bounding box width as % of canvas width */
  renderWidthPct: number;
  /** Rendered bounding box height as % of canvas height */
  renderHeightPct: number;
};

export type PuzzleChallenge = {
  id: string;
  title: string;
  sheetWidth: number;
  sheetHeight: number;
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
  target: Pick<PuzzlePieceDefinition, "targetCx" | "targetCy" | "targetRotation">,
  tolerances: Tolerances,
): boolean {
  const dx = placement.cx - target.targetCx;
  const dy = placement.cy - target.targetCy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const placementRotation = ((placement.rotation % 360) + 360) % 360;
  const targetRotation = ((target.targetRotation % 360) + 360) % 360;
  const rawRotationDiff = Math.abs(placementRotation - targetRotation);
  const rotDiff = Math.min(rawRotationDiff, 360 - rawRotationDiff);

  return dist <= tolerances.positionTolerance && rotDiff <= tolerances.rotationTolerance;
}

export function isPuzzleComplete(
  placements: PiecePlacement[],
  targets: Pick<PuzzlePieceDefinition, "targetCx" | "targetCy" | "targetRotation">[],
  tolerances: Tolerances,
): boolean {
  return placements.every((p, i) => isPieceInPosition(p, targets[i], tolerances));
}
