import { describe, expect, it, vi } from "vitest";

const SESSION_ID = "d9cdf84d-0f20-41ed-8a99-b2ec5782b1e5";
const USER_ID = "0dcc2575-e0a7-43e9-b3fd-43f95c91de1e";

vi.mock("@/server/anonymous-session", () => ({
  getAuthenticatedAnonymousUserId: async () => USER_ID,
}));

vi.mock("@/server/db", () => ({
  getPrisma: () => ({
    assessmentSession: {
      findFirst: async () => ({
        id: SESSION_ID,
        status: "DRAFT",
        currentStep: 5,
        version: 5,
        updatedAt: new Date("2026-07-15T00:00:00.000Z"),
        profile: {
          gender: "FEMALE",
          goal: "LOSE_WEIGHT",
          age: 30,
          heightCm: { toNumber: () => 165.5 },
          weightKg: { toNumber: () => 70.2 },
          targetWeightKg: null,
          activityLevel: null,
        },
      }),
    },
  }),
}));

import { GET } from "@/app/api/sessions/[sessionId]/progress/route";

describe("progress recovery route", () => {
  it("restores the saved version, step and JSON-safe profile values", async () => {
    const response = await GET(
      new Request("http://localhost/progress"),
      { params: Promise.resolve({ sessionId: SESSION_ID }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      id: SESSION_ID,
      currentStep: 5,
      version: 5,
      profile: {
        gender: "FEMALE",
        heightCm: 165.5,
        weightKg: 70.2,
        targetWeightKg: null,
      },
    });
  });
});
