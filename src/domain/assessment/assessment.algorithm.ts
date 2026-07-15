import {
  completeAssessmentSchema,
  type AssessmentInput,
} from "./assessment.schema";

export const ALGORITHM_VERSION = "v1.0.0";
const MAX_PREDICTION_WEEKS = 260;

const activityMultipliers: Record<AssessmentInput["activityLevel"], number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

export type BmiCategory =
  | "UNDERWEIGHT"
  | "NORMAL"
  | "OVERWEIGHT"
  | "OBESE";

export type ProjectionPoint = {
  week: number;
  weightKg: number;
};

export type AssessmentCalculation = {
  bmi: number;
  bmiCategory: BmiCategory;
  recommendedCalories: number;
  targetDate: Date;
  projectionCurve: ProjectionPoint[];
  predictionCapped: boolean;
  algorithmVersion: typeof ALGORITHM_VERSION;
};

function round(value: number, decimals = 2): number {
  const multiplier = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
}

function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "UNDERWEIGHT";
  if (bmi < 25) return "NORMAL";
  if (bmi < 30) return "OVERWEIGHT";
  return "OBESE";
}

function addUtcWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + weeks * 7);
  return result;
}

export function calculateAssessment(
  rawInput: AssessmentInput,
  now = new Date(),
): AssessmentCalculation {
  const input = completeAssessmentSchema.parse(rawInput);
  const heightMeters = input.heightCm / 100;
  const bmi = round(input.weightKg / heightMeters ** 2);

  const sexAdjustment = input.gender === "MALE" ? 5 : -161;
  const basalMetabolicRate =
    10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + sexAdjustment;
  const maintenanceCalories =
    basalMetabolicRate * activityMultipliers[input.activityLevel];

  const calorieAdjustment =
    input.goal === "LOSE_WEIGHT" ? -500 : input.goal === "GAIN_WEIGHT" ? 300 : 0;
  const recommendedCalories = Math.round(
    Math.min(4500, Math.max(1200, maintenanceCalories + calorieAdjustment)),
  );

  const weightDifference = Math.abs(input.targetWeightKg - input.weightKg);
  const weeklyChange =
    input.goal === "LOSE_WEIGHT" ? 0.5 : input.goal === "GAIN_WEIGHT" ? 0.25 : 0;
  const rawWeeks = weeklyChange === 0 ? 0 : Math.ceil(weightDifference / weeklyChange);
  const predictionWeeks = Math.min(rawWeeks, MAX_PREDICTION_WEEKS);
  const predictionCapped = rawWeeks > MAX_PREDICTION_WEEKS;
  const direction = input.targetWeightKg >= input.weightKg ? 1 : -1;

  const projectionCurve = Array.from(
    { length: predictionWeeks + 1 },
    (_, week): ProjectionPoint => {
      if (week === predictionWeeks && !predictionCapped) {
        return { week, weightKg: round(input.targetWeightKg, 1) };
      }

      const projectedWeight = input.weightKg + direction * weeklyChange * week;
      return { week, weightKg: round(projectedWeight, 1) };
    },
  );

  return {
    bmi,
    bmiCategory: getBmiCategory(bmi),
    recommendedCalories,
    targetDate: addUtcWeeks(now, predictionWeeks),
    projectionCurve,
    predictionCapped,
    algorithmVersion: ALGORITHM_VERSION,
  };
}
