"use client";

import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

import type { SessionSnapshot } from "@/lib/server/session-repository";

let browserClient:
  | ReturnType<typeof createClient>
  | null
  | undefined;

function getBrowserSupabaseClient() {
  if (browserClient !== undefined) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return browserClient;
}

export function createSessionChannel(token: string) {
  const client = getBrowserSupabaseClient();
  if (!client) {
    return null;
  }

  return client.channel(`session:${token}`, {
    config: {
      broadcast: { self: true },
    },
  });
}

export async function broadcastSessionSnapshot(
  channel: RealtimeChannel | null,
  snapshot: SessionSnapshot,
) {
  if (!channel) {
    return;
  }

  await channel.send({
    type: "broadcast",
    event: "session-updated",
    payload: { snapshot },
  });
}
