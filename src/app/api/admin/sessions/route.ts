import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { getSessionRepository } from "@/lib/server/session-repository";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    participantCode?: string;
    testType?: "sequence" | "cubes";
  };

  if (!body.participantCode?.trim() || !body.testType) {
    return NextResponse.json(
      { error: "Preencha o identificador e o teste." },
      { status: 400 },
    );
  }

  const repository = getSessionRepository();
  const snapshot = await repository.createSession({
    participantCode: body.participantCode,
    testType: body.testType,
  });

  return NextResponse.json({ snapshot });
}
