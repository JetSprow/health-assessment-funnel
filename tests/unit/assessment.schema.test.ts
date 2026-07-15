import { describe, expect, it } from "vitest";
import {
  completeAssessmentSchema,
  stepDefinitions,
} from "@/domain/assessment/assessment.schema";

const completeInput = {
  gender: "FEMALE" as const,
  goal: "LOSE_WEIGHT" as const,
  age: 30,
  heightCm: 165,
  weightKg: 70,
  targetWeightKg: 60,
  activityLevel: "MODERATE" as const,
};

describe("assessment schemas", () => {
  it("rejects extra fields in every incremental step payload", () => {
    expect(stepDefinitions.gender.schema.safeParse({ gender: "FEMALE", role: "admin" }).success).toBe(false);
    expect(stepDefinitions.age.schema.safeParse({ age: 30, unexpected: true }).success).toBe(false);
    expect(stepDefinitions.activity.schema.safeParse({ activityLevel: "MODERATE", calories: 0 }).success).toBe(false);
  });

  it("enforces numeric boundaries at the individual step", () => {
    expect(stepDefinitions.age.schema.safeParse({ age: 17 }).success).toBe(false);
    expect(stepDefinitions.age.schema.safeParse({ age: 80 }).success).toBe(true);
    expect(stepDefinitions.height.schema.safeParse({ heightCm: 231 }).success).toBe(false);
    expect(stepDefinitions.weight.schema.safeParse({ weightKg: Number.NaN }).success).toBe(false);
    expect(stepDefinitions["target-weight"].schema.safeParse({ targetWeightKg: 34.9 }).success).toBe(false);
  });

  it("enforces target direction when the complete assessment is submitted", () => {
    expect(completeAssessmentSchema.safeParse(completeInput).success).toBe(true);
    expect(completeAssessmentSchema.safeParse({ ...completeInput, targetWeightKg: 75 }).success).toBe(false);
    expect(completeAssessmentSchema.safeParse({ ...completeInput, goal: "GAIN_WEIGHT", targetWeightKg: 60 }).success).toBe(false);
    expect(completeAssessmentSchema.safeParse({ ...completeInput, goal: "MAINTAIN_WEIGHT", targetWeightKg: 73 }).success).toBe(false);
  });
});
