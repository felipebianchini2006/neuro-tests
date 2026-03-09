import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { buildSequenceStory } from "@/lib/domain/sequence";

import { SequenceSession } from "./sequence-session";

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

describe("SequenceSession", () => {
  it("uses a stable aria-describedby id for sortable buttons", () => {
    const story = buildSequenceStory("1 - CAP", [
      "/assets/sequence/1 - CAP/1 CAP.jpg",
      "/assets/sequence/1 - CAP/1.1 - CAP.jpg",
      "/assets/sequence/1 - CAP/1.2 - CAP.jpg",
    ]);

    render(
      <SequenceSession
        story={story}
        promptFrameIds={story.correctOrder}
        busy={false}
        onSubmit={async () => {}}
        onAdvance={async () => {}}
      />,
    );

    const firstSortable = screen.getAllByRole("button", { name: /arraste/i })[0];

    expect(firstSortable).toHaveAttribute(
      "aria-describedby",
      "sequence-dnd-1-cap",
    );
  });
});
