import Link from 'next/link';
import { getSubmissions } from '@/app/actions/submission.actions';
import { getStudents } from '@/app/actions/assignment.actions';
import { ADMIN_GRADE_MAX } from '@/lib/exam/adminGrading';
import { Headphones, BookOpen, PenLine, Mic, FileCheck, Clock } from 'lucide-react';
import { DeleteSubmissionButton } from '@/components/admin/DeleteSubmissionButton';
import { BulkDeleteSubmissionsButton } from '@/components/admin/BulkDeleteSubmissionsButton';

const TYPE_BADGE: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  listening: { label: 'Listening', Icon: Headphones, cls: 'bg-sky-100 text-sky-700' },
  reading:   { label: 'Reading',   Icon: BookOpen,   cls: 'bg-emerald-100 text-emerald-700' },
  writing:   { label: 'Writing',   Icon: PenLine,    cls: 'bg-violet-100 text-violet-700' },
  speaking:  { label: 'Speaking',  Icon: Mic,        cls: 'bg-rose-100 text-rose-700' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtTime(sec: number | null) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m${s.toString().padStart(2, '0')}s`;
}

function examRef(sub: { exam_type: string; serie_id: number | null; combinaison_id: number | null; partie_id: number | null }) {
  if (sub.exam_type === 'listening' || sub.exam_type === 'reading') return sub.serie_id ? `Série ${sub.serie_id}` : '—';
  if (sub.exam_type === 'writing') return sub.combinaison_id ? `Comb. ${sub.combinaison_id}` : '—';
  if (sub.exam_type === 'speaking') return sub.partie_id ? `Partie ${sub.partie_id}` : '—';
  return '—';
}

function scoreDisplay(sub: { exam_type: string; score: number | null; word_counts: { t1: number; t2: number; t3: number } | null; admin_score?: number | null }) {
  if (sub.exam_type === 'listening' || sub.exam_type === 'reading') {
    return sub.score !== null ? `${sub.score} pts` : '—';
  }
  if (sub.admin_score !== null && sub.admin_score !== undefined) {
    return `${sub.admin_score}/${ADMIN_GRADE_MAX}`;
  }
  if (sub.exam_type === 'writing' && sub.word_counts) {
    const total = sub.word_counts.t1 + sub.word_counts.t2 + sub.word_counts.t3;
    return `${total} mots`;
  }
  return '—';
}

function buildSubmissionsQuery(p: {
  type?: string;
  student?: string;
  from?: string;
  to?: string;
}): string {
  const sp = new URLSearchParams();
  if (p.type && p.type !== 'all') sp.set('type', p.type);
  if (p.student?.trim()) sp.set('student', p.student.trim());
  if (p.from?.trim()) sp.set('from', p.from.trim());
  if (p.to?.trim()) sp.set('to', p.to.trim());
  const s = sp.toString();
  return s ? `?${s}` : '';
}

interface PageProps {
  searchParams: Promise<{ type?: string; student?: string; from?: string; to?: string }>;
}

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filterType = params.type || 'all';
  const studentFilter = params.student?.trim() ?? '';
  const fromFilter = params.from?.trim() ?? '';
  const toFilter = params.to?.trim() ?? '';

  const [submissions, students] = await Promise.all([
    getSubmissions({
      exam_type: filterType,
      student_email: studentFilter || undefined,
      submitted_from: fromFilter || undefined,
      submitted_to: toFilter || undefined,
    }),
    getStudents(),
  ]);

  const studentOptions = students.filter((s) => s.role === 'student');
  const types = ['all', 'listening', 'reading', 'writing', 'speaking'] as const;

  const canBulkDelete =
    Boolean(studentFilter) || Boolean(fromFilter) || Boolean(toFilter);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-violet-600" /> Bài Nộp Của Học Viên
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Xem tất cả bài đã nộp · {submissions.length} bản ghi (tối đa 500 khi có lọc)
          </p>
        </div>
        <BulkDeleteSubmissionsButton
          examType={filterType}
          studentEmail={studentFilter}
          from={fromFilter}
          to={toFilter}
          listCount={submissions.length}
          canBulk={canBulkDelete}
        />
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 mb-4 bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
      >
        <input type="hidden" name="type" value={filterType} />
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500">Học viên</label>
          <select
            name="student"
            defaultValue={studentFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Tất cả</option>
            {studentOptions.map((s) => (
              <option key={s.id} value={s.email}>
                {s.full_name ? `${s.full_name} (${s.email})` : s.email}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500">Ngày nộp từ (GMT+7)</label>
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
        <Link
          href={filterType === 'all' ? '/admin/submissions' : `/admin/submissions?type=${filterType}`}
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 py-2"
        >
          Xóa lọc ngày &amp; học viên
        </Link>
      </form>

      <div className="flex gap-2 mb-6 flex-wrap">
        {types.map((t) => {
          const isActive = filterType === t;
          const badge = t === 'all' ? null : TYPE_BADGE[t];
          const BadgeIcon = badge?.Icon;
          const href =
            '/admin/submissions' +
            buildSubmissionsQuery({
              type: t === 'all' ? undefined : t,
              student: studentFilter,
              from: fromFilter,
              to: toFilter,
            });
          return (
            <Link
              key={t}
              href={href}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
              {t === 'all' ? 'Tất cả' : badge?.label}
            </Link>
          );
        })}
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileCheck className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700">Chưa có bài nộp nào khớp bộ lọc</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Học viên</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Loại</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Bài</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Kết quả</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Thời gian</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ngày nộp</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Trạng thái</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((sub) => {
                const badge = TYPE_BADGE[sub.exam_type] || TYPE_BADGE.listening;
                const BadgeIcon = badge.Icon;
                const graded = sub.graded_at !== null && sub.graded_at !== undefined;
                const detailHref = `/admin/submissions/${sub.id}`;
                const needsManualReview = sub.exam_type === 'writing' || sub.exam_type === 'speaking';
                return (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors align-middle">
                    <td className="p-0 align-middle">
                      <Link href={detailHref} className="block px-4 py-3 text-blue-600 font-medium hover:underline">
                        {sub.student_email}
                      </Link>
                    </td>
                    <td className="p-0 align-middle">
                      <Link href={detailHref} className="block px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge.cls}`}>
                          <BadgeIcon className="w-3 h-3" /> {badge.label}
                        </span>
                      </Link>
                    </td>
                    <td className="p-0 align-middle">
                      <Link href={detailHref} className="block px-4 py-3 font-medium text-gray-700">
                        {examRef(sub)}
                      </Link>
                    </td>
                    <td className="p-0 align-middle">
                      <Link href={detailHref} className="block px-4 py-3 font-semibold text-gray-800">
                        {scoreDisplay(sub)}
                      </Link>
                    </td>
                    <td className="p-0 align-middle">
                      <Link href={detailHref} className="flex items-center gap-1 px-4 py-3 text-gray-500">
                        <Clock className="w-3 h-3" /> {fmtTime(sub.time_spent_seconds)}
                      </Link>
                    </td>
                    <td className="p-0 align-middle">
                      <Link href={detailHref} className="block px-4 py-3 text-xs text-gray-500">
                        {fmtDate(sub.submitted_at)}
                      </Link>
                    </td>
                    <td className="p-0 align-middle">
                      <Link href={detailHref} className="flex min-h-[2.75rem] items-center px-4 py-3">
                        {graded ? (
                          <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            Đã chấm
                          </span>
                        ) : needsManualReview ? (
                          <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-600">
                            Chờ chấm
                          </span>
                        ) : (
                          <span className="shrink-0 whitespace-nowrap text-xs text-gray-400">Tự chấm</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right align-middle">
                      <DeleteSubmissionButton id={sub.id} />
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
