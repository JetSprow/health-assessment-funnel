import { apiError, apiSuccess } from "@/server/api-response";
import { getPrisma } from "@/server/db";

export async function GET(): Promise<Response> {
  try {
    await getPrisma().$queryRaw`SELECT 1`;

    return apiSuccess({
      status: "ok",
      service: "health-assessment-funnel",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed", error);
    return apiError(503, "INTERNAL_ERROR", "Service is not ready.");
  }
}
