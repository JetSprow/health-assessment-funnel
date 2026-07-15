import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { calculateAssessment } from "@/domain/assessment/assessment.algorithm";
import type { AssessmentInput } from "@/domain/assessment/assessment.schema";

const validInput: AssessmentInput = {
  gender: "FEMALE",
  goal: "LOSE_WEIGHT",
  age: 30,
  heightCm: 165,
  weightKg: 70,
  targetWeightKg: 60,
  activityLevel: "MODERATE",
};

const fixedNow = new Date("2026-07-15T00:00:00.000Z");

describe("calculateAssessment", () => {
  it("calculates a deterministic result for a valid weight-loss assessment", () => {
    const result = calculateAssessment(validInput, fixedNow);

    expect(result.bmi).toBe(25.71);
    expect(result.bmiCategory).toBe("OVERWEIGHT");
    expect(result.recommendedCalories).toBeGreaterThanOrEqual(1200);
    expect(result.projectionCurve).toHaveLength(21);
    expect(result.projectionCurve.at(-1)).toEqual({ week: 20, weightKg: 60 });
    expect(result.targetDate.toISOString()).toBe("2026-12-02T00:00:00.000Z");
    expect(result.algorithmVersion).toBe("v1.0.0");
  });

  it("returns a zero-week projection when maintaining the same weight", () => {
    const result = calculateAssessment(
      {
        ...validInput,
        goal: "MAINTAIN_WEIGHT",
        targetWeightKg: validInput.weightKg,
      },
      fixedNow,
    );

    expect(result.projectionCurve).toEqual([{ week: 0, weightKg: 70 }]);
    expect(result.targetDate).toEqual(fixedNow);
  });

  it("rejects a zero height", () => {
    expect(() =>
      calculateAssessment({ ...validInput, heightCm: 0 }, fixedNow),
    ).toThrow(ZodError);
  });

  it.each([
    ["missing age", { ...validInput, age: undefined }],
    ["missing height", { ...validInput, heightCm: undefined }],
    ["missing weight", { ...validInput, weightKg: undefined }],
    ["age below minimum", { ...validInput, age: 17 }],
    ["age above maximum", { ...validInput, age: 81 }],
    ["fractional age", { ...validInput, age: 30.5 }],
    ["height below minimum", { ...validInput, heightCm: 119.9 }],
    ["height above maximum", { ...validInput, heightCm: 230.1 }],
    ["weight below minimum", { ...validInput, weightKg: 34.9 }],
    ["weight above maximum", { ...validInput, weightKg: 300.1 }],
    ["NaN weight", { ...validInput, weightKg: Number.NaN }],
    ["infinite age", { ...validInput, age: Number.POSITIVE_INFINITY }],
  ])("rejects %s", (_caseName, input) => {
    expect(() =>
      calculateAssessment(input as AssessmentInput, fixedNow),
    ).toThrow(ZodError);
  });

  it("rejects a target weight that conflicts with the selected goal", () => {
    expect(() =>
      calculateAssessment(
        { ...validInput, goal: "GAIN_WEIGHT", targetWeightKg: 60 },
        fixedNow,
      ),
    ).toThrowError(/增重目标必须高于当前体重/);
  });

  it("caps very long projections instead of creating an unbounded curve", () => {
    const result = calculateAssessment(
      {
        ...validInput,
        goal: "GAIN_WEIGHT",
        weightKg: 35,
        targetWeightKg: 300,
      },
      fixedNow,
    );

    expect(result.predictionCapped).toBe(true);
    expect(result.projectionCurve).toHaveLength(261);
  });
});
