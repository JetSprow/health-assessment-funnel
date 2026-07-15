import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getPrisma } from "./db";

const COOKIE_NAME = "health_assessment_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createAnonymousCredential(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export async function setAnonymousSessionCookie(
  userId: string,
  token: string,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${userId}.${token}`, {
    httpOnly: true,
    secure:
      process.env.COOKIE_SECURE === undefined
        ? process.env.NODE_ENV === "production"
        : process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    priority: "high",
  });
}

export async function getAuthenticatedAnonymousUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const credential = cookieStore.get(COOKIE_NAME)?.value;

  if (!credential) return null;

  const separatorIndex = credential.indexOf(".");
  if (separatorIndex <= 0) return null;

  const userId = credential.slice(0, separatorIndex);
  const token = credential.slice(separatorIndex + 1);
  if (!userId || !token) return null;

  const user = await getPrisma().user.findFirst({
    where: {
      id: userId,
      anonymousTokenHash: hashToken(token),
    },
    select: { id: true },
  });

  return user?.id ?? null;
}
