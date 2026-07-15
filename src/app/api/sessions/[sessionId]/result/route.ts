import { z } from "zod";
import {
  createFullResultDto,
  createPublicResultDto,
  type StoredAssessmentResult,
} from "@/domain/assessment/result-access";
import { getAuthenticatedAnonymousUserId } from "@/server/anonymous-session";
import { apiError, apiSuccess } from "@/server/api-response";
import { getPrisma } from "@/server/db";

const sessionIdSchema = z.string().uuid();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  try {
    const { sessionId: rawSessionId } = await params;
    const sessionId = sessionIdSchema.safeParse(rawSessionId);
    if (!sessionId.success) {
      return apiError(400, "INVALID_REQUEST", "sessionId 格式不正确。");
    }

    const userId = await getAuthenticatedAnonymousUserId();
    if (!userId) {
      return apiError(401, "UNAUTHORIZED", "当前匿名会话无效或已过期。");
    }

    const prisma = getPrisma();
    const [session, activeSubscription] = await Promise.all([
      prisma.assessmentSession.findFirst({
        where: { id: sessionId.data, userId },
        select: {
          id: true,
          status: true,
          result: true,
        },
      }),
      prisma.subscription.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true },
      }),
    ]);

    if (!session) {
      return apiError(404, "SESSION_NOT_FOUND", "未找到对应的测评会话。");
    }
    if (session.status !== "COMPLETED" || !session.result) {
      return apiError(409, "ASSESSMENT_NOT_COMPLETED", "请先完成测评，再查看结果。");
    }

    const stored: StoredAssessmentResult = {
      ...session.result,
      bmi: session.result.bmi.toNumber(),
    };

    return apiSuccess(
      activeSubscription
        ? createFullResultDto(stored)
        : createPublicResultDto(stored),
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(503, "DATABASE_NOT_CONFIGURED", "数据库尚未配置，请设置 DATABASE_URL。");
    }

    console.error("Failed to load assessment result", error);
    return apiError(500, "INTERNAL_ERROR", "读取测评结果失败。请稍后重试。");
  }
}
