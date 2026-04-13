import Link from 'next/link';
import {
  ClipboardList,
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  Plus,
  Inbox,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';

import { formatDueDate, isDueDateOverdue } from '@/lib/exam/deadline';
import { getTeacherAssignments, type Assignment } from '@/app/actions/assignment.actions';

const EXAM_META: Record<
  string,
  { label: string; color: string; bg: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  listening: { label: 'Compréhension Orale', color: 'text-sky-700', bg: 'bg-sky-100', Icon: Headphones },
  reading: { label: 'Compréhension Écrite', color: 'text-emerald-700', bg: 'bg-emerald-100', Icon: BookOpen },
  writing: { label: 'Expression Écrite', color: 'text-violet-700', bg: 'bg-violet-100', Icon: PenLine },
  speaking: { label: 'Expression Orale', color: 'text-rose-700', bg: 'bg-rose-100', Icon: Mic },
};

function getExamTarget(assignment: Assignment): string {
  if (assignment.exam_type === 'listening' || assignment.exam_type === 'reading') {
    return assignment.serie_id ? `Série ${assignment.serie_id}` : '—';
  }
  if (assignment.exam_type === 'writing') {
    return assignment.combinaison_id ? `Combinaison ${assignment.combinaison_id}` : '—';
  }
  if (assignment.exam_type === 'speaking') {
    return assignment.partie_id ? `Partie ${assignment.partie_id}` : '—';
  }
  return '—';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface PageProps {
  searchParams: Promise<{ student?: string; from?: string; to?: string }>;
}

export default async function TeacherAssignmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const studentFilter = params.student?.trim() ?? '';
  const fromFilter = params.from?.trim() ?? '';
  const toFilter = params.to?.trim() ?? '';

  const assignments = await getTeacherAssignments({
    student_email: studentFilter || undefined,
    assigned_from: fromFilter || undefined,
    assigned_to: toFilter || undefined,
  });

  const studentOptions = Array.from(new Set(assignments.map((assignment) => assignment.student_email))).sort();

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" /> Giao Bài Cho Lớp Của Tôi
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý bài đã giao cho học viên được admin phân công · {assignments.length} bản ghi
          </p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Giao bài mới
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 mb-4 bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
      >
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500">Học viên</label>
          <select
            name="student"
            defaultValue={studentFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Tất cả lớp</option>
            {studentOptions.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Ngày giao từ (GMT+7)</label>
          <input
            type="date"
            name="from"
            defaultValue={fromFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Đến</label>
          <input
            type="date"
            name="to"
            defaultValue={toFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-900"
        >
          Áp dụng lọc
        </button>
        <Link href="/teacher/assignments" className="text-sm font-semibold text-gray-500 hover:text-gray-800 py-2">
          Xóa lọc
        </Link>
      </form>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700">Chưa có bài nào được giao</p>
          <p className="text-sm text-gray-400 mt-1">Nhấn “Giao bài mới” để bắt đầu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Học viên</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Loại</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Bài</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Hạn nộp</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ngày giao</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((assignment) => {
                const meta = EXAM_META[assignment.exam_type] || EXAM_META.listening;
                const MetaIcon = meta.Icon;
                const overdue = isDueDateOverdue(assignment.due_date);
                const dueDateLabel = formatDueDate(assignment.due_date, 'fr-FR');

                return (
                  <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{assignment.student_email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${meta.bg} ${meta.color}`}>
                        <MetaIcon className="w-3 h-3" /> {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-700">
                        {assignment.exam_label || getExamTarget(assignment)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {dueDateLabel ? (
                        <span className={`text-xs font-semibold flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-orange-600'}`}>
                          {overdue && <AlertTriangle className="w-3 h-3" />}
                          {dueDateLabel}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(assignment.assigned_at)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {assignment.note ? (
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {assignment.note}
                        </span>
                      ) : (
                        '—'
                      )}
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
