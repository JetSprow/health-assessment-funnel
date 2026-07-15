import { beforeEach, describe, expect, it, vi } from "vitest";

const SESSION_ID = "d9cdf84d-0f20-41ed-8a99-b2ec5782b1e5";
const USER_ID = "0dcc2575-e0a7-43e9-b3fd-43f95c91de1e";

const state = vi.hoisted(() => ({
  authenticated: true,
  createCount: 0,
}));

vi.mock("@/server/anonymous-session", () => ({
  createAnonymousCredential: () => ({ token: "token", tokenHash: "hash" }),
  getAuthenticatedAnonymousUserId: async () =>
    state.authenticated ? USER_ID : null,
  setAnonymousSessionCookie: async () => undefined,
}));

const session = {
  id: SESSION_ID,
  status: "DRAFT",
  currentStep: 4,
  version: 4,
  updatedAt: new Date("2026-07-16T00:00:00.000Z"),
  profile: {
    gender: "FEMALE",
    goal: "LOSE_WEIGHT",
    age: 30,
    heightCm: { toNumber: () => 165.5 },
    weightKg: null,
    targetWeightKg: null,
    activityLevel: null,
  },
};

vi.mock("@/server/db", () => ({
  getPrisma: () => ({
    assessmentSession: {
      findFirst: async () => session,
      create: async () => {
        state.createCount += 1;
        return session;
      },
    },
    $transaction: async () => {
      throw new Error("A transaction should not be needed for an existing user");
    },
  }),
}));

import { GET as getCurrentSession } from "@/app/api/sessions/current/route";
import { POST as startSession } from "@/app/api/sessions/route";

beforeEach(() => {
  state.authenticated = true;
  state.createCount = 0;
});

describe("current assessment recovery", () => {
  it("returns the latest saved session and JSON-safe profile using the anonymous cookie", async () => {
    const response = await getCurrentSession();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.currentSession).toMatchObject({
      id: SESSION_ID,
      status: "DRAFT",
      currentStep: 4,
      version: 4,
      profile: {
        gender: "FEMALE",
        age: 30,
        heightCm: 165.5,
        weightKg: null,
      },
    });
  });

  it("returns an empty current session for a new browser", async () => {
    state.authenticated = false;

    const response = await getCurrentSession();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.currentSession).toBeNull();
  });

  it("reuses an unfinished session instead of creating a new one", async () => {
    const response = await startSession();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      sessionId: SESSION_ID,
      currentStep: 4,
      status: "DRAFT",
      version: 4,
      resumed: true,
    });
    expect(state.createCount).toBe(0);
  });
});
