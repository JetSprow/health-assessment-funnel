import { describe, expect, it } from "vitest";
import {
  createFullResultDto,
  createPublicResultDto,
  type StoredAssessmentResult,
} from "@/domain/assessment/result-access";

const storedResult: StoredAssessmentResult = {
  bmi: 25.71,
  bmiCategory: "OVERWEIGHT",
  recommendedCalories: 1701,
  targetDate: new Date("2026-12-02T00:00:00.000Z"),
  projectionCurve: [
    { week: 0, weightKg: 70 },
    { week: 20, weightKg: 60 },
  ],
  predictionCapped: false,
  algorithmVersion: "v1.0.0",
  calculatedAt: new Date("2026-07-15T00:00:00.000Z"),
};

function collectKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (typeof value !== "object" || value === null) return [];

  return Object.entries(value).flatMap(([key, nested]) => [key, ...collectKeys(nested)]);
}

describe("assessment result access DTOs", () => {
  it("builds a public DTO without leaking any protected field recursively", () => {
    const dto = createPublicResultDto(storedResult);
    const keys = collectKeys(dto);

    expect(dto).toEqual({
      access: "LOCKED",
      subscriptionStatus: "INACTIVE",
      summary: { bmi: 25.71, category: "OVERWEIGHT" },
      lockedSections: ["recommendedCalories", "targetDate", "projectionCurve"],
    });
    expect(keys).not.toContain("recommendedCalories");
    expect(keys).not.toContain("targetDate");
    expect(keys).not.toContain("projectionCurve");
    expect(JSON.stringify(dto)).not.toContain("1701");
    expect(JSON.stringify(dto)).not.toContain("2026-12-02");
  });

  it("builds a full DTO with all member-only result fields", () => {
    const dto = createFullResultDto(storedResult);

    expect(dto.access).toBe("FULL");
    expect(dto.result.recommendedCalories).toBe(1701);
    expect(dto.result.targetDate).toBe("2026-12-02T00:00:00.000Z");
    expect(dto.result.projectionCurve).toHaveLength(2);
    expect(dto.result.algorithmVersion).toBe("v1.0.0");
  });

  it("drops malformed projection points instead of exposing arbitrary JSON", () => {
    const dto = createFullResultDto({
      ...storedResult,
      projectionCurve: [
        { week: 0, weightKg: 70 },
        { week: "bad", weightKg: 65, privateNote: "must not leak" },
      ],
    });

    expect(dto.result.projectionCurve).toEqual([{ week: 0, weightKg: 70 }]);
    expect(JSON.stringify(dto)).not.toContain("privateNote");
  });
});
