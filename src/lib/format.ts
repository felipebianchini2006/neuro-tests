export function formatElapsed(ms: number | null) {
  if (ms === null) {
    return "--:--";
  }

  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function getElapsedFromIso(startedAt: string | null, completedAt?: string | null) {
  if (!startedAt) {
    return null;
  }

  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  return Math.max(0, end - new Date(startedAt).getTime());
}
