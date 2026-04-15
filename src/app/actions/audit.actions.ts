'use server';

import { requireAdminAndDb } from '@/lib/supabase/adminAuth';
import type { AuditLogRow } from '@/lib/audit';

export interface AuditLogFilters {
  actor_role?: string | null;
  actor_email?: string | null;
  action_prefix?: string | null;
  created_from?: string | null;
  created_to?: string | null;
}

export async function getAuditLogs(
  limit = 100,
  filters?: AuditLogFilters,
): Promise<AuditLogRow[]> {
  const { db } = await requireAdminAndDb();
  const safeLimit = Math.min(Math.max(limit, 1), 200);

  let query = db
    .from('audit_logs')
    .select('id, actor_id, actor_email, actor_name, actor_role, action, target_type, target_id, target_label, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (filters?.actor_role?.trim()) {
    query = query.eq('actor_role', filters.actor_role.trim());
  }
  if (filters?.actor_email?.trim()) {
    query = query.ilike('actor_email', `%${filters.actor_email.trim()}%`);
  }
  if (filters?.action_prefix?.trim()) {
    query = query.ilike('action', `${filters.action_prefix.trim()}%`);
  }
  if (filters?.created_from?.trim()) {
    query = query.gte('created_at', `${filters.created_from.trim()}T00:00:00.000+07:00`);
  }
  if (filters?.created_to?.trim()) {
    query = query.lte('created_at', `${filters.created_to.trim()}T23:59:59.999+07:00`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Lỗi lấy audit logs: ${error.message}`);
  }

  return (data ?? []) as AuditLogRow[];
}
