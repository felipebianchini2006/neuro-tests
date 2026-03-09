import { describe, expect, it } from "vitest";

import {
  buildSequenceStory,
  createSequenceSeedShuffle,
  isSequenceAnswerCorrect,
} from "@/lib/domain/sequence";

describe("sequence domain", () => {
  it("ignores cover images that are not part of the sortable sequence", () => {
    const story = buildSequenceStory("1 - CAP", [
      "/assets/sequence/1 - CAP/1 CAP.jpg",
      "/assets/sequence/1 - CAP/1.1 - CAP.jpg",
      "/assets/sequence/1 - CAP/1.2 - CAP.jpg",
      "/assets/sequence/1 - CAP/1.3 - CAP.jpg",
    ]);

    expect(story.frames.map((frame) => frame.label)).toEqual([
      "1.1 - CAP",
      "1.2 - CAP",
      "1.3 - CAP",
    ]);
    expect(story.correctOrder).toHaveLength(3);
  });

  it("sorts image frames using natural order for a story", () => {
    const story = buildSequenceStory("2 - CHASE", [
      "/assets/sequence/2 - CHASE/3 - CHASE.jpg",
      "/assets/sequence/2 - CHASE/1 - CHASE.jpg",
      "/assets/sequence/2 - CHASE/5 - CHASE.jpg",
      "/assets/sequence/2 - CHASE/2 - CHASE.jpg",
      "/assets/sequence/2 - CHASE/4 - CHASE.jpg",
      "/assets/sequence/2 - CHASE/CHASE.jpg",
    ]);

    expect(story.correctOrder).toEqual([
      "2-chase-1-chase-jpg",
      "2-chase-2-chase-jpg",
      "2-chase-3-chase-jpg",
      "2-chase-4-chase-jpg",
      "2-chase-5-chase-jpg",
    ]);
  });

  it("builds a deterministic shuffled order from a session seed", () => {
    const source = ["frame-a", "frame-b", "frame-c", "frame-d"];
    const shuffled = createSequenceSeedShuffle(
      source,
      "session-42",
    );
    const repeated = createSequenceSeedShuffle(
      source,
      "session-42",
    );

    expect(shuffled).toEqual(repeated);
    expect([...shuffled].sort()).toEqual([...source].sort());
    expect(shuffled).not.toEqual(source);
  });

  it("accepts only the exact correct answer order", () => {
    const story = buildSequenceStory("1 - CAP", [
      "/assets/sequence/1 - CAP/1.1 - CAP.jpg",
      "/assets/sequence/1 - CAP/1.2 - CAP.jpg",
      "/assets/sequence/1 - CAP/1.3 - CAP.jpg",
    ]);

    expect(isSequenceAnswerCorrect(story, story.correctOrder)).toBe(true);
    expect(
      isSequenceAnswerCorrect(story, [
        story.correctOrder[1],
        story.correctOrder[0],
        story.correctOrder[2],
      ]),
    ).toBe(false);
  });
});
