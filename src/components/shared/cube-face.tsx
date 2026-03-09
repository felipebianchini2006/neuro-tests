import type { CSSProperties } from "react";

import type { CubeFace } from "@/lib/domain/cubes";

const faceStyles: Record<CubeFace, CSSProperties> = {
  white: {
    background:
      "radial-gradient(circle at 25% 25%, rgba(140, 124, 104, 0.18) 0 7%, transparent 8%), #f8f5ec",
    backgroundSize: "0.8rem 0.8rem",
  },
  red: {
    background: "#b44731",
  },
  "diag-tl": {
    background: "linear-gradient(135deg, #b44731 0 50%, #f8f5ec 50% 100%)",
  },
  "diag-tr": {
    background: "linear-gradient(225deg, #b44731 0 50%, #f8f5ec 50% 100%)",
  },
  "diag-br": {
    background: "linear-gradient(315deg, #b44731 0 50%, #f8f5ec 50% 100%)",
  },
  "diag-bl": {
    background: "linear-gradient(45deg, #b44731 0 50%, #f8f5ec 50% 100%)",
  },
};

type CubeFaceProps = {
  face: CubeFace | null;
  className?: string;
  testId?: string;
};

export function CubeFacePreview({ face, className, testId }: CubeFaceProps) {
  return (
    <div
      aria-hidden="true"
      data-face={face ?? "empty"}
      data-testid={testId}
      className={[
        "rounded-[0.85rem] border border-[color:var(--line)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...(face
          ? faceStyles[face]
          : { background: "rgba(140, 124, 104, 0.12)" }),
      }}
    />
  );
}
