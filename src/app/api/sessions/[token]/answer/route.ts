import { NextResponse } from "next/server";

import {
  validateCubeAnswer,
  validateSequenceAnswer,
} from "@/lib/content/catalog";
import { getSessionRepository } from "@/lib/server/session-repository";

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const repository = getSessionRepository();
  const existing = await repository.getSessionByToken(token);

  if (!existing) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  const body = (await request.json()) as {
    itemIndex?: number;
    answerPayload?: unknown;
  };

  if (typeof body.itemIndex !== "number") {
    return NextResponse.json({ error: "Item inválido." }, { status: 400 });
  }

  const isCorrect =
    existing.session.testType === "sequence"
      ? validateSequenceAnswer(
          body.itemIndex,
          Array.isArray(body.answerPayload) ? (body.answerPayload as string[]) : [],
        )
      : validateCubeAnswer(
          body.itemIndex,
          Array.isArray(body.answerPayload)
            ? (body.answerPayload as (import("@/lib/domain/cubes").CubeFace | null)[][])
            : [],
        );

  const snapshot = await repository.recordAnswer({
    token,
    itemIndex: body.itemIndex,
    answerPayload: body.answerPayload ?? null,
    isCorrect,
  });

  if (!snapshot) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ snapshot, isCorrect });
}
