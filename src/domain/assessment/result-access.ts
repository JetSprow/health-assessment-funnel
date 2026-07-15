import type { BmiCategory, ProjectionPoint } from "./assessment.algorithm";

export const LOCKED_RESULT_SECTIONS = [
  "recommendedCalories",
  "targetDate",
  "projectionCurve",
] as const;

export type StoredAssessmentResult = {
  bmi: number;
  bmiCategory: string;
  recommendedCalories: number;
  targetDate: Date;
  projectionCurve: unknown;
  predictionCapped: boolean;
  algorithmVersion: string;
  calculatedAt: Date;
};

export type PublicAssessmentResultDto = {
  access: "LOCKED";
  subscriptionStatus: "INACTIVE";
  summary: {
    bmi: number;
    category: BmiCategory;
  };
  lockedSections: typeof LOCKED_RESULT_SECTIONS;
};

export type FullAssessmentResultDto = {
  access: "FULL";
  subscriptionStatus: "ACTIVE";
  result: {
    bmi: number;
    category: BmiCategory;
    recommendedCalories: number;
    targetDate: string;
    projectionCurve: ProjectionPoint[];
    predictionCapped: boolean;
    algorithmVersion: string;
    calculatedAt: string;
  };
};

function toBmiCategory(value: string): BmiCategory {
  if (
    value === "UNDERWEIGHT" ||
    value === "NORMAL" ||
    value === "OVERWEIGHT" ||
    value === "OBESE"
  ) {
    return value;
  }

  throw new Error(`Unsupported BMI category: ${value}`);
}

function toProjectionCurve(value: unknown): ProjectionPoint[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((point) => {
    if (
      typeof point === "object" &&
      point !== null &&
      "week" in point &&
      "weightKg" in point &&
      typeof point.week === "number" &&
      Number.isFinite(point.week) &&
      typeof point.weightKg === "number" &&
      Number.isFinite(point.weightKg)
    ) {
      return [{ week: point.week, weightKg: point.weightKg }];
    }

    return [];
  });
}

export function createPublicResultDto(
  stored: StoredAssessmentResult,
): PublicAssessmentResultDto {
  return {
    access: "LOCKED",
    subscriptionStatus: "INACTIVE",
    summary: {
      bmi: stored.bmi,
      category: toBmiCategory(stored.bmiCategory),
    },
    lockedSections: LOCKED_RESULT_SECTIONS,
  };
}

export function createFullResultDto(
  stored: StoredAssessmentResult,
): FullAssessmentResultDto {
  return {
    access: "FULL",
    subscriptionStatus: "ACTIVE",
    result: {
      bmi: stored.bmi,
      category: toBmiCategory(stored.bmiCategory),
      recommendedCalories: stored.recommendedCalories,
      targetDate: stored.targetDate.toISOString(),
      projectionCurve: toProjectionCurve(stored.projectionCurve),
      predictionCapped: stored.predictionCapped,
      algorithmVersion: stored.algorithmVersion,
      calculatedAt: stored.calculatedAt.toISOString(),
    },
  };
}
