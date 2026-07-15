import { describe, expect, it } from "vitest";
import { createClientRequestId } from "@/lib/client-request-id";

describe("createClientRequestId", () => {
  it("uses native randomUUID when available", () => {
    const value = "11111111-2222-4333-8444-555555555555" as const;
    const cryptoApi = {
      randomUUID: () => value,
      getRandomValues: <T extends ArrayBufferView | null>(array: T) => array,
    };

    expect(createClientRequestId(cryptoApi)).toBe(value);
  });

  it("creates an RFC 4122 v4-shaped ID without randomUUID", () => {
    const cryptoApi = {
      getRandomValues: <T extends ArrayBufferView | null>(array: T) => {
        if (array instanceof Uint8Array) array.fill(0);
        return array;
      },
    };

    expect(createClientRequestId(cryptoApi)).toBe(
      "00000000-0000-4000-8000-000000000000",
    );
  });
});
