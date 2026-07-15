import { apiSuccess } from "@/server/api-response";

export function GET(): Response {
  return apiSuccess({
    status: "ok",
    service: "health-assessment-funnel",
    timestamp: new Date().toISOString(),
  });
}
