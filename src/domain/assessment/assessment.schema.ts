import { z } from "zod";

export const genderSchema = z.enum(["MALE", "FEMALE"]);
export const goalSchema = z.enum([
  "LOSE_WEIGHT",
  "GAIN_WEIGHT",
  "MAINTAIN_WEIGHT",
]);
export const activityLevelSchema = z.enum([
  "SEDENTARY",
  "LIGHT",
  "MODERATE",
  "ACTIVE",
  "VERY_ACTIVE",
]);

const finiteNumber = z.number().finite();

export const completeAssessmentSchema = z
  .object({
    gender: genderSchema,
    goal: goalSchema,
    age: finiteNumber.int().min(18).max(80),
    heightCm: finiteNumber.min(120).max(230),
    weightKg: finiteNumber.min(35).max(300),
    targetWeightKg: finiteNumber.min(35).max(300),
    activityLevel: activityLevelSchema,
  })
  .strict()
  .superRefine((input, context) => {
    if (input.goal === "LOSE_WEIGHT" && input.targetWeightKg >= input.weightKg) {
      context.addIssue({
        code: "custom",
        path: ["targetWeightKg"],
        message: "减重目标必须低于当前体重",
      });
    }

    if (input.goal === "GAIN_WEIGHT" && input.targetWeightKg <= input.weightKg) {
      context.addIssue({
        code: "custom",
        path: ["targetWeightKg"],
        message: "增重目标必须高于当前体重",
      });
    }

    if (
      input.goal === "MAINTAIN_WEIGHT" &&
      Math.abs(input.targetWeightKg - input.weightKg) > 2
    ) {
      context.addIssue({
        code: "custom",
        path: ["targetWeightKg"],
        message: "保持体重目标与当前体重的差值不能超过 2kg",
      });
    }
  });

export type AssessmentInput = z.infer<typeof completeAssessmentSchema>;

export const stepDefinitions = {
  gender: {
    index: 1,
    schema: z.object({ gender: genderSchema }).strict(),
  },
  goal: {
    index: 2,
    schema: z.object({ goal: goalSchema }).strict(),
  },
  age: {
    index: 3,
    schema: z.object({ age: finiteNumber.int().min(18).max(80) }).strict(),
  },
  height: {
    index: 4,
    schema: z.object({ heightCm: finiteNumber.min(120).max(230) }).strict(),
  },
  weight: {
    index: 5,
    schema: z.object({ weightKg: finiteNumber.min(35).max(300) }).strict(),
  },
  "target-weight": {
    index: 6,
    schema: z.object({ targetWeightKg: finiteNumber.min(35).max(300) }).strict(),
  },
  activity: {
    index: 7,
    schema: z.object({ activityLevel: activityLevelSchema }).strict(),
  },
} as const;

export type StepKey = keyof typeof stepDefinitions;

export function isStepKey(value: string): value is StepKey {
  return value in stepDefinitions;
}
