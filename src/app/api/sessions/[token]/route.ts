import { NextResponse } from "next/server";

import { getSessionRepository } from "@/lib/server/session-repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const repository = getSessionRepository();
  const snapshot = await repository.getSessionByToken(token);

  if (!snapshot) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ snapshot });
}
