import type { SessionSnapshot } from "@/lib/server/session-repository";

export async function getSessionSnapshot(token: string) {
  const response = await fetch(`/api/sessions/${token}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar a sessão.");
  }

  const data = (await response.json()) as { snapshot: SessionSnapshot };
  return data.snapshot;
}

export async function postSessionAction<T>(
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "A ação falhou.");
  }

  return data;
}
