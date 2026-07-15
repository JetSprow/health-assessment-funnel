import { randomUUID } from "node:crypto";

export type ApiErrorCode =
  | "DATABASE_NOT_CONFIGURED"
  | "INVALID_REQUEST"
  | "SESSION_NOT_FOUND"
  | "UNAUTHORIZED"
  | "VERSION_CONFLICT"
  | "INCOMPLETE_ASSESSMENT"
  | "ASSESSMENT_NOT_COMPLETED"
  | "ASSESSMENT_COMPLETED"
  | "IDEMPOTENCY_CONFLICT"
  | "INTERNAL_ERROR";

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json(
    {
      data,
      meta: { requestId: randomUUID() },
    },
    { status },
  );
}

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): Response {
  return Response.json(
    {
      error: { code, message, ...(details === undefined ? {} : { details }) },
      meta: { requestId: randomUUID() },
    },
    { status },
  );
}
