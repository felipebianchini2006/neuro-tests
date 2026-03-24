import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CubeChallenge } from "@/lib/content/catalog";
import type { CubePiece } from "@/lib/domain/cubes";

import { CubesSession } from "./cubes-session";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
  }) => {
    const imgProps = { ...props };
    delete imgProps.fill;
    delete imgProps.priority;

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img {...imgProps} alt={imgProps.alt ?? ""} />
    );
  },
}));

const challenge: CubeChallenge = {
  id: "cubes-01",
  title: "Cubos 1",
  gridSize: 2,
  imageSrc: "/assets/cubes/1.jpg",
  target: [
    ["diag-br", "diag-bl"],
    ["red", "red"],
  ],
};

const initialTray: CubePiece[] = [
  { id: "a", face: "diag-br" },
  { id: "b", face: "diag-bl" },
  { id: "c", face: "red" },
  { id: "d", face: "red" },
];

const diamondChallenge: CubeChallenge = {
  id: "cubes-09",
  title: "Cubos 9",
  gridSize: 3,
  imageSrc: "/assets/cubes/9.jpg",
  displayLayout: "diamond",
  target: [
    ["red", "diag-br", "diag-bl"],
    ["diag-br", "white", "red"],
    ["diag-tr", "red", "red"],
  ],
};

const diamondTray: CubePiece[] = [
  { id: "p1", face: "red" },
  { id: "p2", face: "diag-br" },
  { id: "p3", face: "diag-bl" },
  { id: "p4", face: "diag-br" },
  { id: "p5", face: "white" },
  { id: "p6", face: "red" },
  { id: "p7", face: "diag-tr" },
  { id: "p8", face: "red" },
  { id: "p9", face: "red" },
];

describe("CubesSession", () => {
  it("renders an aligned guide grid for the expected cube layout", () => {
    render(
      <CubesSession
        challenge={challenge}
        initialTray={initialTray}
        busy={false}
        onSubmit={async () => {}}
        onAdvance={async () => {}}
      />,
    );

    expect(screen.getAllByTestId("cube-guide-cell")).toHaveLength(4);
  });

  it("keeps only the aligned target guide visible", () => {
    render(
      <CubesSession
        challenge={challenge}
        initialTray={initialTray}
        busy={false}
        onSubmit={async () => {}}
        onAdvance={async () => {}}
      />,
    );

    expect(screen.queryByText("Referência original")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Cubos 1 modelo")).not.toBeInTheDocument();
  });

  it("makes the white face visually distinct from an empty cell", () => {
    const whiteChallenge: CubeChallenge = {
      ...challenge,
      target: [
        ["white", "diag-bl"],
        ["red", "red"],
      ],
    };

    render(
      <CubesSession
        challenge={whiteChallenge}
        initialTray={initialTray}
        busy={false}
        onSubmit={async () => {}}
        onAdvance={async () => {}}
      />,
    );

    const whiteGuideCell = screen.getAllByTestId("cube-guide-cell")[0];
    const emptyBoardCell = screen.getAllByRole("button")[0].querySelector("[data-face='empty']");

    expect(whiteGuideCell).toHaveAttribute("data-face", "white");
    expect(whiteGuideCell.getAttribute("style")).toContain("linear-gradient");
    expect(emptyBoardCell?.getAttribute("style")).not.toContain("linear-gradient");
  });

  it("shows the selected piece in a dedicated panel before placement", () => {
    render(
      <CubesSession
        challenge={challenge}
        initialTray={initialTray}
        busy={false}
        onSubmit={async () => {}}
        onAdvance={async () => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /selecionar peça 1/i }));

    expect(screen.getByText("Peça selecionada")).toBeInTheDocument();
    expect(screen.getAllByText(/peça 1/i).length).toBeGreaterThanOrEqual(1);
  });
  it("renders Cubos 9 in diamond layout for both guide and response grids", () => {
    render(
      <CubesSession
        challenge={diamondChallenge}
        initialTray={diamondTray}
        busy={false}
        onSubmit={async () => {}}
        onAdvance={async () => {}}
      />,
    );

    expect(screen.getByTestId("cube-guide-grid")).toHaveAttribute("data-layout", "diamond");
    expect(screen.getByTestId("cube-response-grid")).toHaveAttribute(
      "data-layout",
      "diamond",
    );
    expect(screen.getAllByTestId("cube-guide-cell")).toHaveLength(9);
  });
});
