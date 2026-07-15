import { beforeEach, describe, expect, it, vi } from "vitest";

const SESSION_ID = "d9cdf84d-0f20-41ed-8a99-b2ec5782b1e5";
const USER_ID = "0dcc2575-e0a7-43e9-b3fd-43f95c91de1e";

const state = vi.hoisted(() => ({
  session: {
    id: "d9cdf84d-0f20-41ed-8a99-b2ec5782b1e5",
    userId: "0dcc2575-e0a7-43e9-b3fd-43f95c91de1e",
    currentStep: 0,
    version: 0,
    status: "DRAFT",
  },
  profile: {} as Record<string, unknown>,
  events: new Map<string, { id: string; stepKey: string; payloadHash: string }>(),
}));

type FindEventArgs = { where: { assessmentSessionId_requestId: { requestId: string } } };
type UpdateSessionArgs = {
  where: { id: string; userId: string; version: number };
  data: { currentStep: number; version: { increment: number } };
};
type UpsertProfileArgs = { create: Record<string, unknown>; update: Record<string, unknown> };
type CreateEventArgs = { data: { requestId: string; stepKey: string; payloadHash: string } };

type StepTransaction = {
  stepEvent: {
    findUnique: (args: FindEventArgs) => Promise<{ id: string; stepKey: string; payloadHash: string } | null>;
    create: (args: CreateEventArgs) => Promise<{ id: string; stepKey: string; payloadHash: string }>;
  };
  assessmentSession: {
    findFirst: () => Promise<{ id: string; currentStep: number; version: number; status: string } | null>;
    updateMany: (args: UpdateSessionArgs) => Promise<{ count: number }>;
  };
  assessmentProfile: {
    upsert: (args: UpsertProfileArgs) => Promise<Record<string, unknown>>;
  };
};

function createTransaction(): StepTransaction {
  return {
    stepEvent: {
      findUnique: async (args) => state.events.get(args.where.assessmentSessionId_requestId.requestId) ?? null,
      create: async (args) => {
        const event = {
          id: `event-${state.events.size + 1}`,
          stepKey: args.data.stepKey,
          payloadHash: args.data.payloadHash,
        };
        state.events.set(args.data.requestId, event);
        return event;
      },
    },
    assessmentSession: {
      findFirst: async () => ({
        id: state.session.id,
        currentStep: state.session.currentStep,
        version: state.session.version,
        status: state.session.status,
      }),
      updateMany: async (args) => {
        if (
          args.where.id !== state.session.id ||
          args.where.userId !== state.session.userId ||
          args.where.version !== state.session.version
        ) {
          return { count: 0 };
        }
        state.session.currentStep = args.data.currentStep;
        state.session.version += args.data.version.increment;
        return { count: 1 };
      },
    },
    assessmentProfile: {
      upsert: async (args) => {
        const patch = Object.fromEntries(
          Object.entries(args.update).filter(([, value]) => value !== undefined),
        );
        state.profile = { ...state.profile, ...patch };
        return state.profile;
      },
    },
  };
}

vi.mock("@/server/anonymous-session", () => ({
  getAuthenticatedAnonymousUserId: async () => USER_ID,
}));

vi.mock("@/server/db", () => ({
  getPrisma: () => ({
    $transaction: async (callback: (transaction: StepTransaction) => Promise<unknown>) => callback(createTransaction()),
  }),
}));

import { PATCH } from "@/app/api/sessions/[sessionId]/steps/[stepKey]/route";

function saveStep(stepKey: string, requestId: string, version: number, data: Record<string, unknown>) {
  return PATCH(
    new Request(`http://localhost/api/sessions/${SESSION_ID}/steps/${stepKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, version, data }),
    }),
    { params: Promise.resolve({ sessionId: SESSION_ID, stepKey }) },
  );
}

beforeEach(() => {
  state.session.currentStep = 0;
  state.session.version = 0;
  state.session.status = "DRAFT";
  state.profile = {};
  state.events.clear();
});

describe("incremental step save route", () => {
  it("returns the original success for a duplicated request and rejects a different stale request", async () => {
    const first = await saveStep("gender", "gender-request-001", 0, { gender: "FEMALE" });
    expect(first.status).toBe(200);
    expect((await first.json()).data).toMatchObject({ version: 1, duplicated: false });

    const duplicate = await saveStep("gender", "gender-request-001", 0, { gender: "FEMALE" });
    expect(duplicate.status).toBe(200);
    expect((await duplicate.json()).data).toMatchObject({ version: 1, duplicated: true });

    const stale = await saveStep("goal", "goal-request-stale", 0, { goal: "LOSE_WEIGHT" });
    expect(stale.status).toBe(409);
    expect((await stale.json()).error.code).toBe("VERSION_CONFLICT");

    const conflictingReplay = await saveStep("gender", "gender-request-001", 1, { gender: "MALE" });
    expect(conflictingReplay.status).toBe(409);
    expect((await conflictingReplay.json()).error.code).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("accepts out-of-order saves while preserving the highest reached step", async () => {
    const activity = await saveStep("activity", "activity-request-001", 0, { activityLevel: "ACTIVE" });
    expect((await activity.json()).data).toMatchObject({ currentStep: 7, version: 1 });

    const gender = await saveStep("gender", "gender-request-002", 1, { gender: "MALE" });
    expect((await gender.json()).data).toMatchObject({ currentStep: 7, version: 2 });
    expect(state.profile).toMatchObject({ activityLevel: "ACTIVE", gender: "MALE" });
  });


  it("does not allow new answers after the assessment is completed", async () => {
    state.session.status = "COMPLETED";
    const response = await saveStep("gender", "completed-request-001", 0, { gender: "FEMALE" });
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("ASSESSMENT_COMPLETED");
  });

  it("allows only one of two concurrent writes using the same version", async () => {
    const responses = await Promise.all([
      saveStep("gender", "concurrent-request-a", 0, { gender: "FEMALE" }),
      saveStep("goal", "concurrent-request-b", 0, { goal: "LOSE_WEIGHT" }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(state.session.version).toBe(1);
    expect(state.events.size).toBe(1);
  });
});
