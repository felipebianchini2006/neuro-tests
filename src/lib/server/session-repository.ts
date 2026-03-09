import { randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

import { getTotalItems, type TestType } from "@/lib/content/catalog";

export type SessionStatus = "pending" | "in_progress" | "completed";

export type SessionRecord = {
  id: string;
  token: string;
  participantCode: string;
  testType: TestType;
  status: SessionStatus;
  currentItemIndex: number;
  totalItems: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionItemRecord = {
  id: string;
  sessionId: string;
  itemIndex: number;
  startedAt: string | null;
  answeredAt: string | null;
  elapsedMs: number | null;
  attempts: number;
  isCorrect: boolean | null;
  answerPayload: unknown | null;
};

export type SessionSnapshot = {
  session: SessionRecord;
  items: SessionItemRecord[];
};

export type CreateSessionInput = {
  participantCode: string;
  testType: TestType;
};

export type SessionRepository = {
  createSession(input: CreateSessionInput): Promise<SessionSnapshot>;
  listSessions(): Promise<SessionRecord[]>;
  getSessionByToken(token: string): Promise<SessionSnapshot | null>;
  startItem(token: string, itemIndex: number): Promise<SessionSnapshot | null>;
  recordAnswer(input: {
    token: string;
    itemIndex: number;
    answerPayload: unknown;
    isCorrect: boolean;
  }): Promise<SessionSnapshot | null>;
  advanceSession(token: string): Promise<SessionSnapshot | null>;
};

type MemoryStore = {
  sessions: Map<string, SessionRecord>;
  items: Map<string, Map<number, SessionItemRecord>>;
};

const memoryStore = getMemoryStore();

function getMemoryStore() {
  const globalStore = globalThis as typeof globalThis & {
    __neuroTestsMemoryStore?: MemoryStore;
  };

  if (!globalStore.__neuroTestsMemoryStore) {
    globalStore.__neuroTestsMemoryStore = {
      sessions: new Map(),
      items: new Map(),
    };
  }

  return globalStore.__neuroTestsMemoryStore;
}

function createToken() {
  return randomBytes(20).toString("hex");
}

function createId(prefix: string) {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function mapSnapshot(
  session: SessionRecord,
  items: Iterable<SessionItemRecord>,
): SessionSnapshot {
  return {
    session,
    items: [...items].sort((left, right) => left.itemIndex - right.itemIndex),
  };
}

function sortSessionsByCreatedAtDesc(sessions: Iterable<SessionRecord>) {
  return [...sessions].sort((left, right) => {
    const createdDifference =
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();

    if (createdDifference !== 0) {
      return createdDifference;
    }

    const updatedDifference =
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();

    if (updatedDifference !== 0) {
      return updatedDifference;
    }

    return right.token.localeCompare(left.token);
  });
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function mapSessionRow(row: Record<string, unknown>): SessionRecord {
  return {
    id: String(row.id),
    token: String(row.token),
    participantCode: String(row.participant_code),
    testType: row.test_type as TestType,
    status: row.status as SessionStatus,
    currentItemIndex: Number(row.current_item_index),
    totalItems: Number(row.total_items),
    startedAt: (row.started_at as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapItemRow(row: Record<string, unknown>): SessionItemRecord {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    itemIndex: Number(row.item_index),
    startedAt: (row.started_at as string | null) ?? null,
    answeredAt: (row.answered_at as string | null) ?? null,
    elapsedMs: (row.elapsed_ms as number | null) ?? null,
    attempts: Number(row.attempts),
    isCorrect: (row.is_correct as boolean | null) ?? null,
    answerPayload: row.answer_payload ?? null,
  };
}

const memoryRepository: SessionRepository = {
  async createSession(input) {
    const timestamp = nowIso();
    const session: SessionRecord = {
      id: createId("session"),
      token: createToken(),
      participantCode: input.participantCode.trim(),
      testType: input.testType,
      status: "pending",
      currentItemIndex: 0,
      totalItems: getTotalItems(input.testType),
      startedAt: null,
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    memoryStore.sessions.set(session.token, session);
    memoryStore.items.set(session.id, new Map());

    return mapSnapshot(session, []);
  },

  async listSessions() {
    return sortSessionsByCreatedAtDesc(memoryStore.sessions.values());
  },

  async getSessionByToken(token) {
    const session = memoryStore.sessions.get(token);
    if (!session) {
      return null;
    }

    return mapSnapshot(session, memoryStore.items.get(session.id)?.values() ?? []);
  },

  async startItem(token, itemIndex) {
    const session = memoryStore.sessions.get(token);
    if (!session) {
      return null;
    }

    const timestamp = nowIso();
    const itemMap = memoryStore.items.get(session.id) ?? new Map();
    const existing = itemMap.get(itemIndex);

    if (session.status === "pending") {
      session.status = "in_progress";
      session.startedAt = timestamp;
    }

    session.updatedAt = timestamp;
    memoryStore.sessions.set(token, session);

    itemMap.set(
      itemIndex,
      existing ?? {
        id: createId("item"),
        sessionId: session.id,
        itemIndex,
        startedAt: timestamp,
        answeredAt: null,
        elapsedMs: null,
        attempts: 0,
        isCorrect: null,
        answerPayload: null,
      },
    );

    memoryStore.items.set(session.id, itemMap);
    return mapSnapshot(session, itemMap.values());
  },

  async recordAnswer(input) {
    const session = memoryStore.sessions.get(input.token);
    if (!session) {
      return null;
    }

    const itemMap = memoryStore.items.get(session.id) ?? new Map();
    const timestamp = nowIso();
    const existing =
      itemMap.get(input.itemIndex) ??
      ({
        id: createId("item"),
        sessionId: session.id,
        itemIndex: input.itemIndex,
        startedAt: timestamp,
        answeredAt: null,
        elapsedMs: null,
        attempts: 0,
        isCorrect: null,
        answerPayload: null,
      } satisfies SessionItemRecord);

    const startedAt = existing.startedAt ?? timestamp;
    const elapsedMs = Math.max(
      0,
      new Date(timestamp).getTime() - new Date(startedAt).getTime(),
    );

    itemMap.set(input.itemIndex, {
      ...existing,
      startedAt,
      answeredAt: timestamp,
      elapsedMs,
      attempts: existing.attempts + 1,
      isCorrect: input.isCorrect,
      answerPayload: input.answerPayload,
    });

    session.updatedAt = timestamp;
    memoryStore.sessions.set(input.token, session);
    memoryStore.items.set(session.id, itemMap);

    return mapSnapshot(session, itemMap.values());
  },

  async advanceSession(token) {
    const session = memoryStore.sessions.get(token);
    if (!session) {
      return null;
    }

    const itemMap = memoryStore.items.get(session.id) ?? new Map();
    const current = itemMap.get(session.currentItemIndex);

    if (!current?.isCorrect) {
      return mapSnapshot(session, itemMap.values());
    }

    const timestamp = nowIso();
    const nextIndex = session.currentItemIndex + 1;

    session.currentItemIndex = nextIndex;
    session.updatedAt = timestamp;

    if (nextIndex >= session.totalItems) {
      session.status = "completed";
      session.completedAt = timestamp;
    }

    memoryStore.sessions.set(token, session);
    return mapSnapshot(session, itemMap.values());
  },
};

const supabaseRepository: SessionRepository = {
  async createSession(input) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return memoryRepository.createSession(input);
    }

    const payload = {
      token: createToken(),
      participant_code: input.participantCode.trim(),
      test_type: input.testType,
      status: "pending",
      current_item_index: 0,
      total_items: getTotalItems(input.testType),
    };

    const { data, error } = await supabase
      .from("sessions")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return {
      session: mapSessionRow(data),
      items: [],
    };
  },

  async listSessions() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return memoryRepository.listSessions();
    }

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapSessionRow(row));
  },

  async getSessionByToken(token) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return memoryRepository.getSessionByToken(token);
    }

    const { data: sessionRow, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("token", token)
      .single();

    if (sessionError || !sessionRow) {
      return null;
    }

    const { data: itemRows, error: itemsError } = await supabase
      .from("session_items")
      .select("*")
      .eq("session_id", sessionRow.id)
      .order("item_index", { ascending: true });

    if (itemsError) {
      throw itemsError;
    }

    return {
      session: mapSessionRow(sessionRow),
      items: (itemRows ?? []).map((row) => mapItemRow(row)),
    };
  },

  async startItem(token, itemIndex) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return memoryRepository.startItem(token, itemIndex);
    }

    const snapshot = await this.getSessionByToken(token);
    if (!snapshot) {
      return null;
    }

    const timestamp = nowIso();

    if (snapshot.session.status === "pending") {
      const { error } = await supabase
        .from("sessions")
        .update({
          status: "in_progress",
          started_at: timestamp,
          updated_at: timestamp,
        })
        .eq("id", snapshot.session.id);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("sessions")
        .update({ updated_at: timestamp })
        .eq("id", snapshot.session.id);

      if (error) {
        throw error;
      }
    }

    const existing = snapshot.items.find((item) => item.itemIndex === itemIndex);
    if (!existing) {
      const { error } = await supabase.from("session_items").insert({
        session_id: snapshot.session.id,
        item_index: itemIndex,
        started_at: timestamp,
        attempts: 0,
      });

      if (error) {
        throw error;
      }
    }

    return this.getSessionByToken(token);
  },

  async recordAnswer(input) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return memoryRepository.recordAnswer(input);
    }

    const snapshot = await this.getSessionByToken(input.token);
    if (!snapshot) {
      return null;
    }

    const timestamp = nowIso();
    const existing = snapshot.items.find((item) => item.itemIndex === input.itemIndex);
    const startedAt = existing?.startedAt ?? timestamp;
    const elapsedMs = Math.max(
      0,
      new Date(timestamp).getTime() - new Date(startedAt).getTime(),
    );

    const payload = {
      session_id: snapshot.session.id,
      item_index: input.itemIndex,
      started_at: startedAt,
      answered_at: timestamp,
      elapsed_ms: elapsedMs,
      attempts: (existing?.attempts ?? 0) + 1,
      is_correct: input.isCorrect,
      answer_payload: input.answerPayload,
    };

    const { error } = await supabase
      .from("session_items")
      .upsert(payload, { onConflict: "session_id,item_index" });

    if (error) {
      throw error;
    }

    const { error: sessionError } = await supabase
      .from("sessions")
      .update({ updated_at: timestamp })
      .eq("id", snapshot.session.id);

    if (sessionError) {
      throw sessionError;
    }

    return this.getSessionByToken(input.token);
  },

  async advanceSession(token) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return memoryRepository.advanceSession(token);
    }

    const snapshot = await this.getSessionByToken(token);
    if (!snapshot) {
      return null;
    }

    const current = snapshot.items.find(
      (item) => item.itemIndex === snapshot.session.currentItemIndex,
    );

    if (!current?.isCorrect) {
      return snapshot;
    }

    const timestamp = nowIso();
    const nextIndex = snapshot.session.currentItemIndex + 1;
    const isCompleted = nextIndex >= snapshot.session.totalItems;

    const { error } = await supabase
      .from("sessions")
      .update({
        current_item_index: nextIndex,
        status: isCompleted ? "completed" : snapshot.session.status,
        completed_at: isCompleted ? timestamp : snapshot.session.completedAt,
        updated_at: timestamp,
      })
      .eq("id", snapshot.session.id);

    if (error) {
      throw error;
    }

    return this.getSessionByToken(token);
  },
};

export function getSessionRepository(): SessionRepository {
  return getSupabaseClient() ? supabaseRepository : memoryRepository;
}
