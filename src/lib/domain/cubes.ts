export type CubeFace =
  | "white"
  | "red"
  | "diag-tl"
  | "diag-tr"
  | "diag-br"
  | "diag-bl";

export type CubePiece = {
  id: string;
  face: CubeFace;
};

const rotationMap: Record<CubeFace, CubeFace> = {
  white: "white",
  red: "red",
  "diag-tl": "diag-tr",
  "diag-tr": "diag-br",
  "diag-br": "diag-bl",
  "diag-bl": "diag-tl",
};

function stableHash(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function rotateCubeFace(face: CubeFace, turns = 1): CubeFace {
  let current = face;
  const totalTurns = ((turns % 4) + 4) % 4;

  for (let index = 0; index < totalTurns; index += 1) {
    current = rotationMap[current];
  }

  return current;
}

export function buildCubeTray(target: CubeFace[][], seed: string): CubePiece[] {
  return target
    .flat()
    .map((face, index) => ({
      id: `${seed}-${index + 1}`,
      face,
    }))
    .sort(
      (left, right) =>
        stableHash(`${seed}:${left.id}`) - stableHash(`${seed}:${right.id}`),
    );
}

export function isCubeBoardCorrect(
  expected: CubeFace[][],
  actual: (CubeFace | null)[][],
) {
  if (expected.length !== actual.length) {
    return false;
  }

  return expected.every((row, rowIndex) => {
    if (row.length !== actual[rowIndex]?.length) {
      return false;
    }

    return row.every((cell, columnIndex) => actual[rowIndex][columnIndex] === cell);
  });
}
