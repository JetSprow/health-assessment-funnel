import { z } from "zod";
import { getAuthenticatedAnonymousUserId } from "@/server/anonymous-session";
import { apiError, apiSuccess } from "@/server/api-response";
import { getPrisma } from "@/server/db";

const requestSchema = z
  .object({
    sessionId: z.string().uuid(),
    idempotencyKey: z.string().min(8).max(120),
  })
  .strict();

class SessionNotFoundError extends Error {}
class AssessmentNotCompletedError extends Error {}
class IdempotencyConflictError extends Error {}

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody: unknown = await request.json().catch(() => null);
    const parsedBody = requestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return apiError(400, "INVALID_REQUEST", "模拟支付请求格式不正确。", parsedBody.error.flatten());
    }

    const userId = await getAuthenticatedAnonymousUserId();
    if (!userId) {
      return apiError(401, "UNAUTHORIZED", "当前匿名会话无效或已过期。");
    }

    const prisma = getPrisma();
    const payment = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.paymentEvent.findUnique({
        where: { idempotencyKey: parsedBody.data.idempotencyKey },
        select: {
          id: true,
          userId: true,
          assessmentSessionId: true,
          status: true,
          processedAt: true,
        },
      });

      if (existing) {
        if (
          existing.userId !== userId ||
          existing.assessmentSessionId !== parsedBody.data.sessionId
        ) {
          throw new IdempotencyConflictError();
        }

        return {
          paymentId: existing.id,
          status: existing.status,
          subscriptionStatus: existing.status === "SUCCEEDED" ? "ACTIVE" : "INACTIVE",
          processedAt: existing.processedAt,
          duplicated: true,
        };
      }

      const session = await transaction.assessmentSession.findFirst({
        where: { id: parsedBody.data.sessionId, userId },
        select: { id: true, status: true, result: { select: { id: true } } },
      });
      if (!session) throw new SessionNotFoundError();
      if (session.status !== "COMPLETED" || !session.result) {
        throw new AssessmentNotCompletedError();
      }

      const now = new Date();
      const createdPayment = await transaction.paymentEvent.create({
        data: {
          userId,
          assessmentSessionId: session.id,
          idempotencyKey: parsedBody.data.idempotencyKey,
          status: "SUCCEEDED",
          processedAt: now,
          payload: { provider: "mock", amount: 0, currency: "CNY" },
        },
        select: { id: true, status: true, processedAt: true },
      });

      const existingSubscription = await transaction.subscription.findFirst({
        where: {
          userId,
          status: "ACTIVE",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { id: true },
      });

      if (existingSubscription) {
        await transaction.subscription.update({
          where: { id: existingSubscription.id },
          data: { source: "mock", startsAt: now, expiresAt: null },
        });
      } else {
        await transaction.subscription.create({
          data: {
            userId,
            status: "ACTIVE",
            source: "mock",
            startsAt: now,
          },
        });
      }

      return {
        paymentId: createdPayment.id,
        status: createdPayment.status,
        subscriptionStatus: "ACTIVE" as const,
        processedAt: createdPayment.processedAt,
        duplicated: false,
      };
    });

    return apiSuccess(payment, payment.duplicated ? 200 : 201);
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      return apiError(404, "SESSION_NOT_FOUND", "未找到对应的测评会话。");
    }
    if (error instanceof AssessmentNotCompletedError) {
      return apiError(409, "ASSESSMENT_NOT_COMPLETED", "请先完成测评，再解锁结果。");
    }
    if (error instanceof IdempotencyConflictError) {
      return apiError(409, "IDEMPOTENCY_CONFLICT", "该幂等键已用于其他支付请求。");
    }
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return apiError(503, "DATABASE_NOT_CONFIGURED", "数据库尚未配置，请设置 DATABASE_URL。");
    }

    console.error("Failed to process mock payment", error);
    return apiError(500, "INTERNAL_ERROR", "模拟支付失败。请稍后重试。");
  }
}
