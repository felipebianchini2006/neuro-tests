import {
  getCubeChallengeAt,
  getCubeTrayForSession,
  getPromptSequenceFrames,
  getSequenceStoryAt,
  type CubeChallenge,
} from "@/lib/content/catalog";
import type { CubePiece } from "@/lib/domain/cubes";
import type { SequenceStory } from "@/lib/domain/sequence";

import type { SessionSnapshot } from "./session-repository";

export type ParticipantCurrentItem =
  | {
      kind: "sequence";
      story: SequenceStory;
      promptFrameIds: string[];
    }
  | {
      kind: "cubes";
      challenge: CubeChallenge;
      initialTray: CubePiece[];
    }
  | null;

export type ParticipantSessionState = {
  snapshot: SessionSnapshot;
  currentItem: ParticipantCurrentItem;
};

export function buildParticipantSessionState(
  snapshot: SessionSnapshot,
): ParticipantSessionState {
  const currentIndex = Math.min(
    snapshot.session.currentItemIndex,
    snapshot.session.totalItems - 1,
  );

  if (snapshot.session.testType === "sequence") {
    const story = getSequenceStoryAt(currentIndex);

    return {
      snapshot,
      currentItem: story
        ? {
            kind: "sequence",
            story,
            promptFrameIds: getPromptSequenceFrames(
              story,
              snapshot.session.token,
            ).map((frame) => frame.id),
          }
        : null,
    };
  }

  const challenge = getCubeChallengeAt(currentIndex);

  return {
    snapshot,
    currentItem: challenge
      ? {
          kind: "cubes",
          challenge,
          initialTray: getCubeTrayForSession(challenge, snapshot.session.token),
        }
      : null,
  };
}
