import { getAuthenticatedAnonymousUserId } from "@/server/anonymous-session";
import { apiError, apiSuccess } from "@/server/api-response";
import { getPrisma } from "@/server/db";

export async function GET(): Promise<Response> {
  try {
    const userId = await getAuthenticatedAnonymousUserId();

    if (!userId) {
      return apiSuccess({ currentSession: null });
    }

    const session = await getPrisma().assessmentSession.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
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
      return apiSuccess({ currentSession: null });
    }

    return apiSuccess({
      currentSession: {
        ...session,
        profile: session.profile
          ? {
              ...session.profile,
              heightCm: session.profile.heightCm?.toNumber() ?? null,
              weightKg: session.profile.weightKg?.toNumber() ?? null,
              targetWeightKg:
                session.profile.targetWeightKg?.toNumber() ?? null,
            }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(
        503,
        "DATABASE_NOT_CONFIGURED",
        "数据库尚未配置，请设置 DATABASE_URL。",
      );
    }

    console.error("Failed to find current assessment session", error);
    return apiError(500, "INTERNAL_ERROR", "暂时无法找到上次的测评进度。");
  }
}
