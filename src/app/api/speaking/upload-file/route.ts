import { NextRequest, NextResponse } from "next/server";

import { requireActiveStudentAndDb } from "@/lib/supabase/adminAuth";
import {
  assertAllowedSpeakingUpload,
  buildSpeakingStoragePath,
  normalizeSpeakingMimeType,
  SPEAKING_UPLOAD_MAX_MB,
  uploadSpeakingObject,
} from "@/lib/storage/r2";

export const runtime = "nodejs";
export const maxDuration = 60;

type SpeakingUploadTask = 2 | 3;

function badRequest(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const partieId = Number(formData.get("partieId"));
    const task = Number(formData.get("task")) as SpeakingUploadTask;
    const file = formData.get("file");

    if (!Number.isInteger(partieId) || partieId <= 0) {
      return badRequest("INVALID_PARTIE_ID");
    }
    if (task !== 2 && task !== 3) {
      return badRequest("INVALID_TASK");
    }
    if (!(file instanceof File)) {
      return badRequest("INVALID_FILE");
    }

    const mimeType = normalizeSpeakingMimeType(file.type || "video/webm");
    try {
      assertAllowedSpeakingUpload({ mimeType, sizeBytes: file.size });
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

    const storagePath = buildSpeakingStoragePath({
      userId: ctx.user.id,
      partieId,
      task,
      mimeType,
    });

    await uploadSpeakingObject({
      storagePath,
      mimeType,
      body: new Uint8Array(await file.arrayBuffer()),
    });

    return NextResponse.json({ storagePath });
  } catch (error) {
    console.error("[api/speaking/upload-file] error:", error);
    if (error instanceof Error && error.message === "R2_NOT_CONFIGURED") {
      return badRequest("R2_NOT_CONFIGURED", 500);
    }
    if (error instanceof Error && (error.message === "FORBIDDEN" || error.message === "DISABLED")) {
      return badRequest("FORBIDDEN", 403);
    }
    return badRequest("INTERNAL_ERROR", 500);
  }
}
