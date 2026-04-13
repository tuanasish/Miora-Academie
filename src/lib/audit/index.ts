import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuditActor {
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
}

export interface AuditEventInput extends AuditActor {
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  targetLabel?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function logAuditEvent(db: SupabaseClient, input: AuditEventInput) {
  const { error } = await db.from("audit_logs").insert({
    actor_id: input.actorId ?? null,
    actor_email: input.actorEmail ?? null,
    actor_name: input.actorName ?? null,
    actor_role: input.actorRole ?? null,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    target_label: input.targetLabel ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`AUDIT_LOG_FAILED: ${error.message}`);
  }
}

export async function logAuditEventSafely(db: SupabaseClient, input: AuditEventInput) {
  try {
    await logAuditEvent(db, input);
  } catch (error) {
    console.error("[audit] failed to persist event:", {
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      error,
    });
  }
}
