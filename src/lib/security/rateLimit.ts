import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

interface ConsumeRateLimitInput {
  bucket: string;
  maxAttempts: number;
  windowSeconds: number;
}

interface ConsumeRateLimitRow {
  allowed: boolean;
  retry_after_seconds: number;
  attempts: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  attempts: number;
  remaining: number;
  limit: number;
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor
      .split(",")
      .map((value) => value.trim())
      .find(Boolean);

    if (firstIp) {
      return firstIp;
    }
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export function buildRateLimitBucket(scope: string, value: string) {
  const hash = createHash("sha256").update(`${scope}:${value}`).digest("hex");
  return `${scope}:${hash}`;
}

export async function consumeRateLimit(
  db: SupabaseClient,
  input: ConsumeRateLimitInput,
): Promise<RateLimitResult> {
  const { data, error } = await db.rpc("consume_auth_rate_limit", {
    p_bucket: input.bucket,
    p_max_attempts: input.maxAttempts,
    p_window_seconds: input.windowSeconds,
  });

  if (error) {
    throw new Error(`RATE_LIMIT_RPC_FAILED: ${error.message}`);
  }

  const row = Array.isArray(data) ? (data[0] as ConsumeRateLimitRow | undefined) : undefined;
  if (!row) {
    throw new Error("RATE_LIMIT_RPC_EMPTY");
  }

  const attempts = Number(row.attempts ?? 0);
  return {
    allowed: Boolean(row.allowed),
    retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
    attempts,
    remaining: Math.max(0, input.maxAttempts - attempts),
    limit: input.maxAttempts,
  };
}
