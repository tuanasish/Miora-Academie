import Link from 'next/link';
import { getAssignments, deleteAssignment, type Assignment } from '@/app/actions/assignment.actions';

const EXAM_META: Record<string, { label: string; color: string; bg: string }> = {
  listening: { label: 'Compréhension Orale', color: 'text-sky-700', bg: 'bg-sky-100' },
  reading: { label: 'Compréhension Écrite', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  writing: { label: 'Expression Écrite', color: 'text-violet-700', bg: 'bg-violet-100' },
  speaking: { label: 'Expression Orale', color: 'text-rose-700', bg: 'bg-rose-100' },
};

function getExamTarget(a: Assignment): string {
  if (a.exam_type === 'listening' || a.exam_type === 'reading') {
    return a.serie_id ? `Série ${a.serie_id}` : '—';
  }
  if (a.exam_type === 'writing') {
    return a.combinaison_id ? `Combinaison ${a.combinaison_id}` : '—';
  }
  if (a.exam_type === 'speaking') {
    return a.partie_id ? `Partie ${a.partie_id}` : '—';
  }
  return '—';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isOverdue(due: string | null): boolean {
  if (!due) return false;
  return new Date(due) < new Date();
}

export default async function AdminAssignmentsPage() {
  const assignments = await getAssignments();

  async function handleDelete(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    await deleteAssignment(id);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 Gán Bài Luyện Thi</h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý bài tập được gán cho học viên · {assignments.length} assignments
          </p>
        </div>
        <Link
          href="/admin/assignments/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          + Gán bài mới
        </Link>
      </div>

      {/* Table */}
      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <span className="text-4xl block mb-3">📭</span>
          <p className="font-semibold text-gray-700">Chưa có bài nào được gán</p>
          <p className="text-sm text-gray-400 mt-1">Nhấn "Gán bài mới" để bắt đầu</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Học viên</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Loại</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Bài</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Hạn nộp</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ngày gán</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Người gán</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((a) => {
                const meta = EXAM_META[a.exam_type] || EXAM_META.listening;
                const overdue = isOverdue(a.due_date);

                return (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    {/* Student */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{a.student_email}</p>
                      {a.note && (
                        <p className="text-xs text-gray-400 mt-0.5 italic truncate max-w-[200px]">
                          💬 {a.note}
                        </p>
                      )}
                    </td>
                    {/* Exam type badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    {/* Target */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-700">
                        {a.exam_label || getExamTarget(a)}
                      </span>
                    </td>
                    {/* Due date */}
                    <td className="px-4 py-3">
                      {a.due_date ? (
                        <span className={`text-xs font-semibold ${overdue ? 'text-red-600' : 'text-orange-600'}`}>
                          {overdue && '⚠️ '}{fmtDate(a.due_date)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    {/* Assigned at */}
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {fmtDate(a.assigned_at)}
                    </td>
                    {/* Assigned by */}
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {a.assigner_name || a.assigner_email || '—'}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <form action={handleDelete}>
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                          onClick={(e) => {
                            if (!confirm('Xóa assignment này?')) e.preventDefault();
                          }}
                        >
                          🗑 Xóa
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
