import { notFound } from "next/navigation";

import { SessionPlayer } from "@/components/participant/session-player";
import { getSessionRepository } from "@/lib/server/session-repository";

export default async function ParticipantPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const snapshot = await getSessionRepository().getSessionByToken(token);

  if (!snapshot) {
    notFound();
  }

  return <SessionPlayer initialSnapshot={snapshot} />;
}
