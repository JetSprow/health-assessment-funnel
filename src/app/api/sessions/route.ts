import {
  createAnonymousCredential,
  getAuthenticatedAnonymousUserId,
  setAnonymousSessionCookie,
} from "@/server/anonymous-session";
import { apiError, apiSuccess } from "@/server/api-response";
import { getPrisma } from "@/server/db";

const sessionSelection = {
  id: true,
  currentStep: true,
  status: true,
  version: true,
} as const;

export async function POST(): Promise<Response> {
  try {
    const prisma = getPrisma();
    const existingUserId = await getAuthenticatedAnonymousUserId();

    if (existingUserId) {
      const existingSession = await prisma.assessmentSession.findFirst({
        where: { userId: existingUserId, status: "DRAFT" },
        orderBy: { updatedAt: "desc" },
        select: sessionSelection,
      });

      if (existingSession) {
        return apiSuccess({
          sessionId: existingSession.id,
          currentStep: existingSession.currentStep,
          status: existingSession.status,
          version: existingSession.version,
          resumed: true,
        });
      }

      const session = await prisma.assessmentSession.create({
        data: { userId: existingUserId },
        select: sessionSelection,
      });

      return apiSuccess(
        {
          sessionId: session.id,
          currentStep: session.currentStep,
          status: session.status,
          version: session.version,
          resumed: false,
        },
        201,
      );
    }

    const credential = createAnonymousCredential();
    const created = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: { anonymousTokenHash: credential.tokenHash },
        select: { id: true },
      });

      const session = await transaction.assessmentSession.create({
        data: { userId: user.id },
        select: sessionSelection,
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
        resumed: false,
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
