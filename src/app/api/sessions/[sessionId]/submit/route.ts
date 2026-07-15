import { z } from "zod";
import { calculateAssessment } from "@/domain/assessment/assessment.algorithm";
import { completeAssessmentSchema } from "@/domain/assessment/assessment.schema";
import type { Prisma } from "@/generated/prisma/client";
import { getAuthenticatedAnonymousUserId } from "@/server/anonymous-session";
import { apiError, apiSuccess } from "@/server/api-response";
import { getPrisma } from "@/server/db";

const pathParamsSchema = z.object({ sessionId: z.string().uuid() });
const requestSchema = z
  .object({ version: z.number().int().nonnegative() })
  .strict();

class SessionNotFoundError extends Error {}
class VersionConflictError extends Error {}
class IncompleteAssessmentError extends Error {
  constructor(readonly details: unknown) {
    super("Assessment profile is incomplete or invalid");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  try {
    const parsedParams = pathParamsSchema.safeParse(await params);
    const rawBody: unknown = await request.json().catch(() => null);
    const parsedBody = requestSchema.safeParse(rawBody);

    if (!parsedParams.success || !parsedBody.success) {
      return apiError(
        400,
        "INVALID_REQUEST",
        "提交请求格式不正确。",
        !parsedBody.success
          ? parsedBody.error.flatten()
          : !parsedParams.success
            ? parsedParams.error.flatten()
            : undefined,
      );
    }

    const userId = await getAuthenticatedAnonymousUserId();
    if (!userId) {
      return apiError(401, "UNAUTHORIZED", "当前匿名会话无效或已过期。");
    }

    const { sessionId } = parsedParams.data;
    const prisma = getPrisma();
    const submitted = await prisma.$transaction(async (transaction) => {
      const session = await transaction.assessmentSession.findFirst({
        where: { id: sessionId, userId },
        select: {
          id: true,
          status: true,
          version: true,
          profile: true,
          result: { select: { id: true } },
        },
      });

      if (!session) throw new SessionNotFoundError();

      if (session.status === "COMPLETED" && session.result) {
        return {
          sessionId: session.id,
          status: session.status,
          version: session.version,
          duplicated: true,
        };
      }

      if (session.version !== parsedBody.data.version) {
        throw new VersionConflictError();
      }

      const profile = session.profile;
      const parsedProfile = completeAssessmentSchema.safeParse(
        profile
          ? {
              gender: profile.gender,
              goal: profile.goal,
              age: profile.age,
              heightCm: profile.heightCm?.toNumber(),
              weightKg: profile.weightKg?.toNumber(),
              targetWeightKg: profile.targetWeightKg?.toNumber(),
              activityLevel: profile.activityLevel,
            }
          : null,
      );

      if (!parsedProfile.success) {
        throw new IncompleteAssessmentError(parsedProfile.error.flatten());
      }

      const calculation = calculateAssessment(parsedProfile.data);
      const updateResult = await transaction.assessmentSession.updateMany({
        where: {
          id: session.id,
          userId,
          version: parsedBody.data.version,
        },
        data: {
          status: "COMPLETED",
          currentStep: 7,
          submittedAt: new Date(),
          version: { increment: 1 },
        },
      });

      if (updateResult.count !== 1) throw new VersionConflictError();

      await transaction.assessmentResult.upsert({
        where: { assessmentSessionId: session.id },
        create: {
          assessmentSessionId: session.id,
          bmi: calculation.bmi,
          bmiCategory: calculation.bmiCategory,
          recommendedCalories: calculation.recommendedCalories,
          targetDate: calculation.targetDate,
          projectionCurve: calculation.projectionCurve as Prisma.InputJsonValue,
          predictionCapped: calculation.predictionCapped,
          algorithmVersion: calculation.algorithmVersion,
        },
        update: {
          bmi: calculation.bmi,
          bmiCategory: calculation.bmiCategory,
          recommendedCalories: calculation.recommendedCalories,
          targetDate: calculation.targetDate,
          projectionCurve: calculation.projectionCurve as Prisma.InputJsonValue,
          predictionCapped: calculation.predictionCapped,
          algorithmVersion: calculation.algorithmVersion,
          calculatedAt: new Date(),
        },
      });

      return {
        sessionId: session.id,
        status: "COMPLETED" as const,
        version: session.version + 1,
        duplicated: false,
      };
    });

    return apiSuccess(submitted);
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return apiError(404, "SESSION_NOT_FOUND", "未找到对应的测评会话。");
    }
    if (error instanceof VersionConflictError) {
      return apiError(409, "VERSION_CONFLICT", "测评数据已变化，请恢复最新进度后重试。");
    }
    if (error instanceof IncompleteAssessmentError) {
      return apiError(422, "INCOMPLETE_ASSESSMENT", "请完成并检查全部七个步骤。", error.details);
    }
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(503, "DATABASE_NOT_CONFIGURED", "数据库尚未配置，请设置 DATABASE_URL。");
    }

    console.error("Failed to submit assessment", error);
    return apiError(500, "INTERNAL_ERROR", "生成测评结果失败。请稍后重试。");
  }
}
