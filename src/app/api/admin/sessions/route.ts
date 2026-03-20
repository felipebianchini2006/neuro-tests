import { NextResponse } from "next/server";

import type { TestType } from "@/lib/content/catalog";
import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { getSessionRepository } from "@/lib/server/session-repository";

function getCreateSessionErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.message.includes("sessions_test_type_check")
  ) {
    return "Tipo de teste nao suportado pelo banco configurado. Aplique a migration mais recente de test types.";
  }

  return "Nao foi possivel criar a sessao.";
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    participantCode?: string;
    testType?: TestType;
  };

  if (!body.participantCode?.trim() || !body.testType) {
    return NextResponse.json(
      { error: "Preencha o identificador e o teste." },
      { status: 400 },
    );
  }

  try {
    const repository = getSessionRepository();
    const snapshot = await repository.createSession({
      participantCode: body.participantCode,
      testType: body.testType,
    });

    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: getCreateSessionErrorMessage(error) },
      { status: 500 },
    );
  }
}
