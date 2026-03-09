import { NextResponse } from "next/server";

import { buildParticipantSessionState } from "@/lib/server/participant-session-state";
import { getSessionRepository } from "@/lib/server/session-repository";

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const snapshot = await getSessionRepository().advanceSession(token);

  if (!snapshot) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  return NextResponse.json(buildParticipantSessionState(snapshot));
}
