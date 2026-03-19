import type { SessionSnapshot } from "@/lib/server/session-repository";
import { readJsonResponse } from "./read-json-response";

export async function getSessionSnapshot(token: string) {
  const response = await fetch(`/api/sessions/${token}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar a sessão.");
  }

  const data = await readJsonResponse<{ snapshot: SessionSnapshot }>(response);
  if (!data?.snapshot) {
    throw new Error("Nao foi possivel carregar a sessao.");
  }

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

  const data = await readJsonResponse<T & { error?: string }>(response);

  if (!response.ok) {
    throw new Error(data?.error ?? "A acao falhou.");
  }

  if (!data) {
    throw new Error("A acao falhou.");
  }

  return data;
}
