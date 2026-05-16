import { NextRequest, NextResponse } from "next/server";

import { requireActiveStudentAndDb } from "@/lib/supabase/adminAuth";
import {
  assertAllowedSpeakingUpload,
  buildSpeakingStoragePath,
  createSpeakingUploadUrl,
  normalizeSpeakingMimeType,
  SPEAKING_UPLOAD_MAX_MB,
} from "@/lib/storage/r2";

type SpeakingUploadTask = 2 | 3;

interface UploadUrlPayload {
  partieId?: number;
  task?: SpeakingUploadTask;
  mimeType?: string;
  sizeBytes?: number;
}

function badRequest(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as UploadUrlPayload;
    const partieId = Number(payload.partieId);
    const task = payload.task;
    const mimeType = payload.mimeType ?? "";
    const sizeBytes = Number(payload.sizeBytes);

    if (!Number.isInteger(partieId) || partieId <= 0) {
      return badRequest("INVALID_PARTIE_ID");
    }
    if (task !== 2 && task !== 3) {
      return badRequest("INVALID_TASK");
    }

    try {
      assertAllowedSpeakingUpload({ mimeType, sizeBytes });
    } catch (error) {
      if (error instanceof Error && error.message === "FILE_TOO_LARGE") {
        return badRequest(`FILE_TOO_LARGE_${SPEAKING_UPLOAD_MAX_MB}MB`, 413);
      }
      return badRequest(error instanceof Error ? error.message : "INVALID_UPLOAD");
    }

    const ctx = await requireActiveStudentAndDb();
    const { data: assignment, error: assignmentError } = await ctx.db
      .from("exam_assignments")
      .select("id")
      .eq("student_email", ctx.user.email ?? "")
      .eq("exam_type", "speaking")
      .eq("partie_id", partieId)
      .limit(1);

    if (assignmentError || !assignment || assignment.length === 0) {
      return badRequest("ASSIGNMENT_REQUIRED", 403);
    }

    const contentType = normalizeSpeakingMimeType(mimeType);
    const storagePath = buildSpeakingStoragePath({
      userId: ctx.user.id,
      partieId,
      task,
      mimeType: contentType,
    });
    const uploadUrl = await createSpeakingUploadUrl({
      storagePath,
      mimeType: contentType,
    });

    return NextResponse.json({
      uploadUrl,
      storagePath,
      method: "PUT",
      headers: { "Content-Type": contentType },
      expiresInSeconds: 900,
    });
  } catch (error) {
    console.error("[api/speaking/upload-url] error:", error);
    if (error instanceof Error && error.message === "R2_NOT_CONFIGURED") {
      return badRequest("R2_NOT_CONFIGURED", 500);
    }
    if (error instanceof Error && (error.message === "FORBIDDEN" || error.message === "DISABLED")) {
      return badRequest("FORBIDDEN", 403);
    }
    return badRequest("INTERNAL_ERROR", 500);
  }
}
