'use server';

import { requireAdminAndDb } from '@/lib/supabase/adminAuth';
import type { AuditLogRow } from '@/lib/audit';

export async function getAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  const { db } = await requireAdminAndDb();
  const safeLimit = Math.min(Math.max(limit, 1), 200);

  const { data, error } = await db
    .from('audit_logs')
    .select('id, actor_id, actor_email, actor_name, actor_role, action, target_type, target_id, target_label, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(`Lỗi lấy audit logs: ${error.message}`);
  }

  return (data ?? []) as AuditLogRow[];
}
