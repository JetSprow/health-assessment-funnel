import { z } from "zod";
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

    const session = await getPrisma().assessmentSession.findFirst({
      where: { id: sessionId.data, userId },
      select: {
        id: true,
        status: true,
        currentStep: true,
        version: true,
        profile: {
          select: {
            gender: true,
            goal: true,
            age: true,
            heightCm: true,
            weightKg: true,
            targetWeightKg: true,
            activityLevel: true,
          },
        },
        updatedAt: true,
      },
    });

    if (!session) {
      return apiError(404, "SESSION_NOT_FOUND", "未找到对应的测评会话。");
    }

    return apiSuccess({
      ...session,
      profile: session.profile
        ? {
            ...session.profile,
            heightCm: session.profile.heightCm?.toNumber() ?? null,
            weightKg: session.profile.weightKg?.toNumber() ?? null,
            targetWeightKg: session.profile.targetWeightKg?.toNumber() ?? null,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(
        503,
        "DATABASE_NOT_CONFIGURED",
        "数据库尚未配置，请设置 DATABASE_URL。",
      );
    }

    console.error("Failed to restore assessment progress", error);
    return apiError(500, "INTERNAL_ERROR", "恢复测评进度失败。请稍后重试。");
  }
}
