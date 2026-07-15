-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'READY_TO_SUBMIT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "AssessmentGoal" AS ENUM ('LOSE_WEIGHT', 'GAIN_WEIGHT', 'MAINTAIN_WEIGHT');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "anonymous_token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_profiles" (
    "id" UUID NOT NULL,
    "assessment_session_id" UUID NOT NULL,
    "gender" "Gender",
    "goal" "AssessmentGoal",
    "age" INTEGER,
    "height_cm" DECIMAL(6,2),
    "weight_kg" DECIMAL(6,2),
    "target_weight_kg" DECIMAL(6,2),
    "activity_level" "ActivityLevel",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_results" (
    "id" UUID NOT NULL,
    "assessment_session_id" UUID NOT NULL,
    "bmi" DECIMAL(5,2) NOT NULL,
    "bmi_category" TEXT NOT NULL,
    "recommended_calories" INTEGER NOT NULL,
    "target_date" TIMESTAMP(3) NOT NULL,
    "projection_curve" JSONB NOT NULL,
    "prediction_capped" BOOLEAN NOT NULL DEFAULT false,
    "algorithm_version" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
    "source" TEXT NOT NULL DEFAULT 'mock',
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "assessment_session_id" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step_events" (
    "id" UUID NOT NULL,
    "assessment_session_id" UUID NOT NULL,
    "step_key" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "client_version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "step_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_anonymous_token_hash_key" ON "users"("anonymous_token_hash");

-- CreateIndex
CREATE INDEX "assessment_sessions_user_id_status_idx" ON "assessment_sessions"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_profiles_assessment_session_id_key" ON "assessment_profiles"("assessment_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_results_assessment_session_id_key" ON "assessment_results"("assessment_session_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_status_expires_at_idx" ON "subscriptions"("user_id", "status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_idempotency_key_key" ON "payment_events"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_events_user_id_status_idx" ON "payment_events"("user_id", "status");

-- CreateIndex
CREATE INDEX "payment_events_assessment_session_id_idx" ON "payment_events"("assessment_session_id");

-- CreateIndex
CREATE INDEX "step_events_assessment_session_id_step_key_idx" ON "step_events"("assessment_session_id", "step_key");

-- CreateIndex
CREATE UNIQUE INDEX "step_events_assessment_session_id_request_id_key" ON "step_events"("assessment_session_id", "request_id");

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_profiles" ADD CONSTRAINT "assessment_profiles_assessment_session_id_fkey" FOREIGN KEY ("assessment_session_id") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_assessment_session_id_fkey" FOREIGN KEY ("assessment_session_id") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_assessment_session_id_fkey" FOREIGN KEY ("assessment_session_id") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_events" ADD CONSTRAINT "step_events_assessment_session_id_fkey" FOREIGN KEY ("assessment_session_id") REFERENCES "assessment_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Domain guardrails that complement application-level Zod validation.
ALTER TABLE "assessment_sessions"
  ADD CONSTRAINT "assessment_sessions_current_step_check" CHECK ("current_step" BETWEEN 0 AND 7),
  ADD CONSTRAINT "assessment_sessions_version_check" CHECK ("version" >= 0);

ALTER TABLE "assessment_profiles"
  ADD CONSTRAINT "assessment_profiles_age_check" CHECK ("age" IS NULL OR "age" BETWEEN 18 AND 80),
  ADD CONSTRAINT "assessment_profiles_height_check" CHECK ("height_cm" IS NULL OR "height_cm" BETWEEN 120 AND 230),
  ADD CONSTRAINT "assessment_profiles_weight_check" CHECK ("weight_kg" IS NULL OR "weight_kg" BETWEEN 35 AND 300),
  ADD CONSTRAINT "assessment_profiles_target_weight_check" CHECK ("target_weight_kg" IS NULL OR "target_weight_kg" BETWEEN 35 AND 300);
