import type { CSSProperties } from "react";

import type { CubeFace } from "@/lib/domain/cubes";

const faceStyles: Record<CubeFace, CSSProperties["background"]> = {
  white: "#f4ecdb",
  red: "#b44731",
  "diag-tl":
    "linear-gradient(135deg, #b44731 0 50%, #f4ecdb 50% 100%)",
  "diag-tr":
    "linear-gradient(225deg, #b44731 0 50%, #f4ecdb 50% 100%)",
  "diag-br":
    "linear-gradient(315deg, #b44731 0 50%, #f4ecdb 50% 100%)",
  "diag-bl":
    "linear-gradient(45deg, #b44731 0 50%, #f4ecdb 50% 100%)",
};

type CubeFaceProps = {
  face: CubeFace | null;
  className?: string;
};

export function CubeFacePreview({ face, className }: CubeFaceProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        "rounded-[0.85rem] border border-[color:var(--line)] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        background: face ? faceStyles[face] : "rgba(140, 124, 104, 0.12)",
      }}
    />
  );
}
