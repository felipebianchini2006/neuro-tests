import { notFound } from "next/navigation";

import { SessionObserver } from "@/components/observer/session-observer";
import { getSessionRepository } from "@/lib/server/session-repository";

export default async function ObserverPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const snapshot = await getSessionRepository().getSessionByToken(token);

  if (!snapshot) {
    notFound();
  }

  return <SessionObserver initialSnapshot={snapshot} />;
}
