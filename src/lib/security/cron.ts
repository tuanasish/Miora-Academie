import { timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET_NOT_CONFIGURED" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || !safeEqual(token, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
