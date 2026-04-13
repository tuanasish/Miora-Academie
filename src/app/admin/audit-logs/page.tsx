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
  return action.replaceAll('.', ' / ');
}

export default async function AuditLogsPage() {
  const logs = await getAuditLogs(120);

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
