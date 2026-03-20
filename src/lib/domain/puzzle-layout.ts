import type { PiecePlacement, PuzzleChallenge, PuzzlePieceDefinition } from "./puzzle";

type Edge = "top" | "right" | "bottom" | "left";

const EDGE_SEQUENCE: Edge[] = ["top", "right", "bottom", "left"];
const OUTER_MIN = 20;
const OUTER_MAX = 80;
const CANVAS_GUTTER = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function interpolate(min: number, max: number, fraction: number) {
  if (min >= max) return min;
  return min + (max - min) * fraction;
}

function hashString(value: string) {
  let hash = 2166136261;

  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function canFitOutsideSafeZone(piece: PuzzlePieceDefinition, edge: Edge) {
  const halfWidth = piece.renderWidthPct / 2;
  const halfHeight = piece.renderHeightPct / 2;

  if (edge === "top") {
    return halfHeight + CANVAS_GUTTER <= OUTER_MIN;
  }

  if (edge === "bottom") {
    return 100 - halfHeight - CANVAS_GUTTER >= OUTER_MAX;
  }

  if (edge === "left") {
    return halfWidth + CANVAS_GUTTER <= OUTER_MIN;
  }

  return 100 - halfWidth - CANVAS_GUTTER >= OUTER_MAX;
}

function chooseEdge(piece: PuzzlePieceDefinition, preferredEdgeIndex: number) {
  for (let offset = 0; offset < EDGE_SEQUENCE.length; offset += 1) {
    const edge = EDGE_SEQUENCE[(preferredEdgeIndex + offset) % EDGE_SEQUENCE.length];
    if (canFitOutsideSafeZone(piece, edge)) {
      return edge;
    }
  }

  return EDGE_SEQUENCE[preferredEdgeIndex % EDGE_SEQUENCE.length];
}

function buildEdgeBandPosition(
  challengeId: string,
  edge: Edge,
  piece: PuzzlePieceDefinition,
  slotFraction: number,
): PiecePlacement {
  const halfWidth = piece.renderWidthPct / 2;
  const halfHeight = piece.renderHeightPct / 2;
  const minX = halfWidth + CANVAS_GUTTER;
  const maxX = 100 - halfWidth - CANVAS_GUTTER;
  const minY = halfHeight + CANVAS_GUTTER;
  const maxY = 100 - halfHeight - CANVAS_GUTTER;
  const bandSeed =
    (hashString(`${challengeId}:${piece.id}:${edge}`) % 1000) / 999;

  if (edge === "top") {
    const safeMaxY = Math.min(maxY, OUTER_MIN - CANVAS_GUTTER);

    return {
      cx: clamp(interpolate(minX, maxX, slotFraction), minX, maxX),
      cy:
        safeMaxY >= minY
          ? interpolate(minY, safeMaxY, bandSeed)
          : minY,
      rotation: 0,
    };
  }

  if (edge === "bottom") {
    const safeMinY = Math.max(minY, OUTER_MAX + CANVAS_GUTTER);

    return {
      cx: clamp(interpolate(minX, maxX, slotFraction), minX, maxX),
      cy:
        maxY >= safeMinY
          ? interpolate(safeMinY, maxY, bandSeed)
          : maxY,
      rotation: 0,
    };
  }

  if (edge === "left") {
    const safeMaxX = Math.min(maxX, OUTER_MIN - CANVAS_GUTTER);

    return {
      cx:
        safeMaxX >= minX
          ? interpolate(minX, safeMaxX, bandSeed)
          : minX,
      cy: clamp(interpolate(minY, maxY, slotFraction), minY, maxY),
      rotation: 0,
    };
  }

  const safeMinX = Math.max(minX, OUTER_MAX + CANVAS_GUTTER);

  return {
    cx:
      maxX >= safeMinX
        ? interpolate(safeMinX, maxX, bandSeed)
        : maxX,
    cy: clamp(interpolate(minY, maxY, slotFraction), minY, maxY),
    rotation: 0,
  };
}

export function buildInitialPuzzlePlacements(
  challenge: PuzzleChallenge,
): PiecePlacement[] {
  const piecesByEdge = new Map<Edge, Array<{ piece: PuzzlePieceDefinition; index: number }>>(
    EDGE_SEQUENCE.map((edge) => [edge, []]),
  );

  challenge.pieces.forEach((piece, index) => {
    const edge = chooseEdge(piece, index % EDGE_SEQUENCE.length);
    piecesByEdge.get(edge)?.push({ piece, index });
  });

  const placements: PiecePlacement[] = new Array(challenge.pieces.length);

  for (const edge of EDGE_SEQUENCE) {
    const entries = piecesByEdge.get(edge) ?? [];
    if (entries.length === 0) continue;

    const slotFractions = entries.map((_, slotIndex) => (slotIndex + 1) / (entries.length + 1));
    const slotOffset = hashString(`${challenge.id}:${edge}`) % entries.length;

    entries.forEach((entry, slotIndex) => {
      const slotFraction = slotFractions[(slotIndex + slotOffset) % entries.length];
      placements[entry.index] = buildEdgeBandPosition(
        challenge.id,
        edge,
        entry.piece,
        slotFraction,
      );
    });
  }

  return placements;
}
