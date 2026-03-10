import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/server/admin-auth";
import { getSessionRepository } from "@/lib/server/session-repository";

export async function DELETE() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const deletedCount = await getSessionRepository().deleteCompletedSessions();

  return NextResponse.json({ deletedCount });
}
