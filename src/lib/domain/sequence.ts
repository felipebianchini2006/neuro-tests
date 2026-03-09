export type SequenceStory = {
  id: string;
  title: string;
  frames: {
    id: string;
    src: string;
    label: string;
  }[];
  correctOrder: string[];
};

const naturalCollator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});

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
  return segments.at(-1) ?? src;
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
  const sorted = [...frameSources].sort((left, right) =>
    naturalCollator.compare(getFileName(left), getFileName(right)),
  );

  const frames = sorted.map((src) => {
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

export function createSequenceSeedShuffle(frameIds: string[], seed: string) {
  return [...frameIds].sort((left, right) => {
    const leftWeight = stableHash(`${seed}:${left}`);
    const rightWeight = stableHash(`${seed}:${right}`);
    return leftWeight - rightWeight;
  });
}

export function isSequenceAnswerCorrect(
  story: SequenceStory,
  answer: string[],
) {
  if (answer.length !== story.correctOrder.length) {
    return false;
  }

  return story.correctOrder.every((frameId, index) => frameId === answer[index]);
}
