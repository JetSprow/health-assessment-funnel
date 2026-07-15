import {
  createAnonymousCredential,
  setAnonymousSessionCookie,
} from "@/server/anonymous-session";
import { apiError, apiSuccess } from "@/server/api-response";
import { getPrisma } from "@/server/db";

export async function POST(): Promise<Response> {
  try {
    const prisma = getPrisma();
    const credential = createAnonymousCredential();

    const created = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: { anonymousTokenHash: credential.tokenHash },
        select: { id: true },
      });

      const session = await transaction.assessmentSession.create({
        data: { userId: user.id },
        select: {
          id: true,
          currentStep: true,
          status: true,
          version: true,
        },
      });

      return { user, session };
    });

    await setAnonymousSessionCookie(created.user.id, credential.token);

    return apiSuccess(
      {
        sessionId: created.session.id,
        currentStep: created.session.currentStep,
        status: created.session.status,
        version: created.session.version,
      },
      201,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(
        503,
        "DATABASE_NOT_CONFIGURED",
        "数据库尚未配置，请设置 DATABASE_URL。",
      );
    }

    console.error("Failed to create assessment session", error);
    return apiError(500, "INTERNAL_ERROR", "创建测评会话失败。请稍后重试。");
  }
}
