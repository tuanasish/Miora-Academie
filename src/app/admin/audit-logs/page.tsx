import Link from 'next/link';
import { ShieldCheck, UserRound, Clock3, FileText } from 'lucide-react';

import { getAuditLogs } from '@/app/actions/audit.actions';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    'assignment.create': 'Giao bài',
    'assignment.bulk_create': 'Giao nhiều bài',
    'assignment.delete': 'Xóa bài đã giao',
    'assignment.bulk_delete': 'Xóa nhiều bài đã giao',
    'submission.create': 'Học viên nộp bài',
    'submission.grade': 'Giáo viên chấm bài',
    'submission.delete': 'Xóa bài nộp',
    'submission.bulk_delete': 'Xóa nhiều bài nộp',
    'teacher_student.assign': 'Gán học viên cho giáo viên',
    'teacher_student.remove': 'Gỡ học viên khỏi giáo viên',
  };
  return map[action] ?? action.replaceAll('.', ' / ');
}

const ACTION_GROUPS = [
  { value: '', label: 'Tất cả hoạt động' },
  { value: 'assignment.', label: 'Quản lý giao bài' },
  { value: 'submission.', label: 'Nộp / chấm bài' },
  { value: 'teacher_student.', label: 'Phân công lớp' },
];

interface PageProps {
  searchParams: Promise<{
    role?: string;
    actor_email?: string;
    action_group?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const role = params.role?.trim() ?? '';
  const actorEmail = params.actor_email?.trim() ?? '';
  const actionGroup = params.action_group?.trim() ?? '';
  const from = params.from?.trim() ?? '';
  const to = params.to?.trim() ?? '';

  const logs = await getAuditLogs(120, {
    actor_role: role || undefined,
    actor_email: actorEmail || undefined,
    action_prefix: actionGroup || undefined,
    created_from: from || undefined,
    created_to: to || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-600" /> Audit Log
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Theo dõi các thao tác quan trọng của admin và giáo viên.
        </p>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 bg-white rounded-2xl border border-gray-200 p-4"
      >
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-xs font-semibold text-gray-500">Vai trò</label>
          <select
            name="role"
            defaultValue={role}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Tất cả</option>
            <option value="teacher">Giáo viên</option>
            <option value="admin">Admin</option>
            <option value="student">Học viên</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[220px]">
          <label className="text-xs font-semibold text-gray-500">Email người thao tác</label>
          <input
            name="actor_email"
            defaultValue={actorEmail}
            placeholder="teacher@..."
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500">Nhóm hoạt động</label>
          <select
            name="action_group"
            defaultValue={actionGroup}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {ACTION_GROUPS.map((group) => (
              <option key={group.value || 'all'} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Từ ngày</label>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Đến ngày</label>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          Lọc
        </button>
        <Link
          href="/admin/audit-logs"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          Xóa lọc
        </Link>
      </form>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1.8fr] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <div className="flex items-center gap-2">
            <Clock3 className="w-4 h-4" /> Thời gian
          </div>
          <div className="flex items-center gap-2">
            <UserRound className="w-4 h-4" /> Người thao tác
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Hành động
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Đối tượng / Metadata
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            Chưa có audit event nào được ghi nhận.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[1.2fr_1fr_1fr_1.8fr] gap-4 px-5 py-4 text-sm text-gray-700"
              >
                <div className="text-gray-500">{formatDateTime(log.created_at)}</div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {log.actor_name?.trim() || log.actor_email || 'System'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {log.actor_role || 'system'}
                    {log.actor_email ? ` · ${log.actor_email}` : ''}
                  </p>
                </div>
                <div>
                  <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {actionLabel(log.action)}
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">{log.action}</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-gray-800">
                      {log.target_label || log.target_id || '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.target_type || 'target'}
                    </p>
                  </div>
                  <pre className="max-h-40 overflow-auto rounded-xl bg-gray-950 px-3 py-2 text-xs leading-5 text-gray-100">
                    {JSON.stringify(log.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
