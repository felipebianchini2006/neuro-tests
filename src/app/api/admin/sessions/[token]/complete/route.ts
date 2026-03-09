import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { getSessionRepository } from "@/lib/server/session-repository";

export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const { token } = await context.params;
  const snapshot = await getSessionRepository().completeSession(token);

  if (!snapshot) {
    return NextResponse.json({ error: "Sessao nao encontrada." }, { status: 404 });
  }

  return NextResponse.json({ snapshot });
}
