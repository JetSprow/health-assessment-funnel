import { beforeEach, describe, expect, it, vi } from "vitest";

const SESSION_ID = "d9cdf84d-0f20-41ed-8a99-b2ec5782b1e5";
const USER_ID = "0dcc2575-e0a7-43e9-b3fd-43f95c91de1e";

const state = vi.hoisted(() => ({
  active: false,
  payment: null as null | {
    id: string;
    userId: string;
    assessmentSessionId: string;
    status: "SUCCEEDED";
    processedAt: Date;
  },
  submitIncomplete: false,
  sessionUpdateCount: 0,
}));

type Transaction = {
  paymentEvent: {
    findUnique: () => Promise<typeof state.payment>;
    create: () => Promise<{ id: string; status: "SUCCEEDED"; processedAt: Date }>;
  };
  assessmentSession: {
    findFirst: () => Promise<Record<string, unknown>>;
    updateMany: () => Promise<{ count: number }>;
  };
  subscription: {
    findFirst: () => Promise<{ id: string } | null>;
    update: () => Promise<Record<string, never>>;
    create: () => Promise<Record<string, never>>;
  };
  assessmentResult: {
    upsert: () => Promise<Record<string, never>>;
  };
};

function resultRecord() {
  return {
    id: "result-1",
    assessmentSessionId: SESSION_ID,
    bmi: { toNumber: () => 25.71 },
    bmiCategory: "OVERWEIGHT",
    recommendedCalories: 1701,
    targetDate: new Date("2026-12-02T00:00:00.000Z"),
    projectionCurve: [{ week: 0, weightKg: 70 }, { week: 20, weightKg: 60 }],
    predictionCapped: false,
    algorithmVersion: "v1.0.0",
    calculatedAt: new Date("2026-07-15T00:00:00.000Z"),
  };
}

function sessionRecord(): Record<string, unknown> {
  if (state.submitIncomplete) {
    return {
      id: SESSION_ID,
      status: "DRAFT",
      version: 0,
      profile: null,
      result: null,
    };
  }

  return {
    id: SESSION_ID,
    userId: USER_ID,
    status: "COMPLETED",
    version: 8,
    result: resultRecord(),
  };
}

function transaction(): Transaction {
  return {
    paymentEvent: {
      findUnique: async () => state.payment,
      create: async () => {
        const processedAt = new Date("2026-07-15T01:00:00.000Z");
        state.payment = {
          id: "payment-1",
          userId: USER_ID,
          assessmentSessionId: SESSION_ID,
          status: "SUCCEEDED",
          processedAt,
        };
        return { id: "payment-1", status: "SUCCEEDED", processedAt };
      },
    },
    assessmentSession: {
      findFirst: async () => sessionRecord(),
      updateMany: async () => {
        state.sessionUpdateCount += 1;
        return { count: 1 };
      },
    },
    subscription: {
      findFirst: async () => (state.active ? { id: "subscription-1" } : null),
      update: async () => {
        state.active = true;
        return {};
      },
      create: async () => {
        state.active = true;
        return {};
      },
    },
    assessmentResult: {
      upsert: async () => ({}),
    },
  };
}

vi.mock("@/server/anonymous-session", () => ({
  getAuthenticatedAnonymousUserId: async () => USER_ID,
}));

vi.mock("@/server/db", () => ({
  getPrisma: () => ({
    $transaction: async (callback: (tx: Transaction) => Promise<unknown>) => callback(transaction()),
    assessmentSession: { findFirst: async () => sessionRecord() },
    subscription: { findFirst: async () => (state.active ? { id: "subscription-1" } : null) },
  }),
}));

import { POST as pay } from "@/app/api/pay/route";
import { GET as getResult } from "@/app/api/sessions/[sessionId]/result/route";
import { POST as submit } from "@/app/api/sessions/[sessionId]/submit/route";

function routeContext() {
  return { params: Promise.resolve({ sessionId: SESSION_ID }) };
}

beforeEach(() => {
  state.active = false;
  state.payment = null;
  state.submitIncomplete = false;
  state.sessionUpdateCount = 0;
});

describe("payment and result route transition", () => {
  it("changes a redacted result to full access after payment and keeps payment idempotent", async () => {
    const lockedResponse = await getResult(new Request("http://localhost/result"), routeContext());
    const lockedBody = await lockedResponse.json();
    expect(lockedResponse.status).toBe(200);
    expect(lockedBody.data.access).toBe("LOCKED");
    expect(lockedBody.data.result).toBeUndefined();
    expect(lockedBody.data.summary.recommendedCalories).toBeUndefined();

    const paymentBody = JSON.stringify({ sessionId: SESSION_ID, idempotencyKey: "payment-demo-001" });
    const firstPayment = await pay(new Request("http://localhost/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: paymentBody }));
    expect(firstPayment.status).toBe(201);
    expect((await firstPayment.json()).data.duplicated).toBe(false);

    const duplicatePayment = await pay(new Request("http://localhost/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: paymentBody }));
    expect(duplicatePayment.status).toBe(200);
    expect((await duplicatePayment.json()).data.duplicated).toBe(true);

    const fullResponse = await getResult(new Request("http://localhost/result"), routeContext());
    const fullBody = await fullResponse.json();
    expect(fullBody.data.access).toBe("FULL");
    expect(fullBody.data.result.recommendedCalories).toBe(1701);
    expect(fullBody.data.result.projectionCurve).toHaveLength(2);
  });

  it("rejects submit when the persisted profile is incomplete", async () => {
    state.submitIncomplete = true;

    const response = await submit(
      new Request("http://localhost/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: 0 }),
      }),
      routeContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("INCOMPLETE_ASSESSMENT");
    expect(state.sessionUpdateCount).toBe(0);
  });
});
