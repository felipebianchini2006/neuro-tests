export type SequenceStory = {
  id: string;
  title: string;
  frames: {
    id: string;
    src: string;
    label: string;
  }[];
  correctOrder: string[];
  alternativeOrders?: string[][];
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getFileName(src: string) {
  const segments = src.split("/");
  const fileName = segments.at(-1) ?? src;

  try {
    return decodeURIComponent(fileName).replace(/\s+/g, " ").trim();
  } catch {
    return fileName.replace(/\s+/g, " ").trim();
  }
}

function getFileLabel(src: string) {
  return getFileName(src).replace(/\.[^.]+$/, "");
}

function isSortableSequenceFrame(label: string) {
  return /^\d+(?:\.\d+)?(?:[A-Za-z])?(?:\s*-\s*.*)?$/.test(label.trim());
}

function stableHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function buildSequenceStory(
  title: string,
  frameSources: string[],
): SequenceStory {
  const filteredFrameSources = frameSources.filter((src) =>
    isSortableSequenceFrame(getFileLabel(src)),
  );
  const sources =
    filteredFrameSources.length > 0 ? filteredFrameSources : [...frameSources];

  const frames = sources.map((src) => {
    const fileName = getFileName(src);
    return {
      id: slugify(`${title}-${fileName}`),
      src,
      label: fileName.replace(/\.[^.]+$/, ""),
    };
  });

  return {
    id: slugify(title),
    title,
    frames,
    correctOrder: frames.map((frame) => frame.id),
  };
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSequenceSeedShuffle(frameIds: string[], seed: string) {
  if (frameIds.length < 2) {
    return [...frameIds];
  }

  const rng = mulberry32(stableHash(seed));
  const shuffled = [...frameIds];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Enforce a derangement: no position may coincide with the correct order.
  // Sort-by-hash and even uniform Fisher-Yates produce the correct order (or
  // near-correct orders with several fixed points) often enough to leak the
  // answer to participants. A pass-through that swaps any matching position
  // forward guarantees every slot differs from the input.
  for (let i = 0; i < shuffled.length; i += 1) {
    if (shuffled[i] === frameIds[i]) {
      const swapWith = (i + 1) % shuffled.length;
      [shuffled[i], shuffled[swapWith]] = [shuffled[swapWith], shuffled[i]];
    }
  }

  return shuffled;
}

export function isSequenceAnswerCorrect(
  story: SequenceStory,
  answer: string[],
) {
  const allValid = [story.correctOrder, ...(story.alternativeOrders ?? [])];
  return allValid.some(
    (order) =>
      answer.length === order.length &&
      order.every((frameId, index) => frameId === answer[index]),
  );
}
