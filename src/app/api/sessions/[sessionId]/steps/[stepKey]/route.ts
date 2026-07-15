import { createHash } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import {
  isStepKey,
  stepDefinitions,
} from "@/domain/assessment/assessment.schema";
import { getAuthenticatedAnonymousUserId } from "@/server/anonymous-session";
import { apiError, apiSuccess } from "@/server/api-response";
import { getPrisma } from "@/server/db";

const pathParamsSchema = z.object({
  sessionId: z.string().uuid(),
  stepKey: z.string().min(1),
});

const requestSchema = z
  .object({
    requestId: z.string().min(8).max(100),
    version: z.number().int().nonnegative(),
    data: z.unknown(),
  })
  .strict();

class SessionNotFoundError extends Error {}
class VersionConflictError extends Error {}
class AssessmentCompletedError extends Error {}
class IdempotencyConflictError extends Error {}

function hashPayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ sessionId: string; stepKey: string }>;
  },
): Promise<Response> {
  try {
    const parsedParams = pathParamsSchema.safeParse(await params);
    if (!parsedParams.success || !isStepKey(parsedParams.data.stepKey)) {
      return apiError(400, "INVALID_REQUEST", "Session 或步骤标识不正确。");
    }

    const rawBody: unknown = await request.json().catch(() => null);
    const parsedBody = requestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return apiError(
        400,
        "INVALID_REQUEST",
        "分步保存请求格式不正确。",
        parsedBody.error.flatten(),
      );
    }

    const { sessionId, stepKey } = parsedParams.data;
    const stepDefinition = stepDefinitions[stepKey];
    const parsedStepData = stepDefinition.schema.safeParse(parsedBody.data.data);
    if (!parsedStepData.success) {
      return apiError(
        422,
        "INVALID_REQUEST",
        "当前步骤的数据未通过校验。",
        parsedStepData.error.flatten(),
      );
    }

    const userId = await getAuthenticatedAnonymousUserId();
    if (!userId) {
      return apiError(401, "UNAUTHORIZED", "当前匿名会话无效或已过期。");
    }

    const payloadHash = hashPayload(parsedStepData.data);
    const prisma = getPrisma();
    const result = await prisma.$transaction(async (transaction) => {
      const existingEvent = await transaction.stepEvent.findUnique({
        where: {
          assessmentSessionId_requestId: {
            assessmentSessionId: sessionId,
            requestId: parsedBody.data.requestId,
          },
        },
        select: { id: true, stepKey: true, payloadHash: true },
      });

      const session = await transaction.assessmentSession.findFirst({
        where: { id: sessionId, userId },
        select: { id: true, currentStep: true, version: true, status: true },
      });

      if (!session) throw new SessionNotFoundError();

      if (existingEvent) {
        if (existingEvent.stepKey !== stepKey || existingEvent.payloadHash !== payloadHash) {
          throw new IdempotencyConflictError();
        }
        return { ...session, duplicated: true };
      }

      if (session.status === "COMPLETED") {
        throw new AssessmentCompletedError();
      }

      if (session.version !== parsedBody.data.version) {
        throw new VersionConflictError();
      }

      const profilePatch =
        parsedStepData.data as Prisma.AssessmentProfileUpdateInput;

      await transaction.assessmentProfile.upsert({
        where: { assessmentSessionId: sessionId },
        create: {
          assessmentSessionId: sessionId,
          ...profilePatch,
        } as Prisma.AssessmentProfileUncheckedCreateInput,
        update: profilePatch,
      });

      const nextStep = Math.max(session.currentStep, stepDefinition.index);
      const updateResult = await transaction.assessmentSession.updateMany({
        where: {
          id: sessionId,
          userId,
          version: parsedBody.data.version,
        },
        data: {
          currentStep: nextStep,
          version: { increment: 1 },
        },
      });

      if (updateResult.count !== 1) throw new VersionConflictError();

      await transaction.stepEvent.create({
        data: {
          assessmentSessionId: sessionId,
          stepKey,
          requestId: parsedBody.data.requestId,
          payload: parsedStepData.data as Prisma.InputJsonValue,
          payloadHash,
          clientVersion: parsedBody.data.version,
        },
      });

      return {
        id: session.id,
        status: session.status,
        currentStep: nextStep,
        version: session.version + 1,
        duplicated: false,
      };
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return apiError(404, "SESSION_NOT_FOUND", "未找到对应的测评会话。");
    }

    if (error instanceof AssessmentCompletedError) {
      return apiError(409, "ASSESSMENT_COMPLETED", "测评已完成，不能继续修改答案。");
    }

    if (error instanceof IdempotencyConflictError) {
      return apiError(409, "IDEMPOTENCY_CONFLICT", "相同 requestId 不能用于不同的步骤数据。");
    }

    if (error instanceof VersionConflictError) {
      return apiError(
        409,
        "VERSION_CONFLICT",
        "测评数据已被更新，请先恢复最新进度后再重试。",
      );
    }

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(
        503,
        "DATABASE_NOT_CONFIGURED",
        "数据库尚未配置，请设置 DATABASE_URL。",
      );
    }

    console.error("Failed to save assessment step", error);
    return apiError(500, "INTERNAL_ERROR", "保存测评步骤失败。请稍后重试。");
  }
}
