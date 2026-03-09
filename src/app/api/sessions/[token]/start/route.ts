import { NextResponse } from "next/server";

import { buildParticipantSessionState } from "@/lib/server/participant-session-state";
import { getSessionRepository } from "@/lib/server/session-repository";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const { itemIndex } = (await request.json()) as { itemIndex?: number };

  if (typeof itemIndex !== "number") {
    return NextResponse.json({ error: "Item inválido." }, { status: 400 });
  }

  const snapshot = await getSessionRepository().startItem(token, itemIndex);

  if (!snapshot) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  return NextResponse.json(buildParticipantSessionState(snapshot));
}
