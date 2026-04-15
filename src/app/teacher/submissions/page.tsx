import Link from 'next/link';
import {
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  FileCheck,
  Clock,
} from 'lucide-react';

import { ADMIN_GRADE_MAX } from '@/lib/exam/adminGrading';
import { getTeacherStudents, getTeacherSubmissions } from '@/app/actions/teacher.actions';

const TYPE_BADGE: Record<
  string,
  { label: string; Icon: React.ComponentType<{ className?: string }>; cls: string }
> = {
  listening: { label: 'Listening', Icon: Headphones, cls: 'bg-sky-100 text-sky-700' },
  reading: { label: 'Reading', Icon: BookOpen, cls: 'bg-emerald-100 text-emerald-700' },
  writing: { label: 'Writing', Icon: PenLine, cls: 'bg-violet-100 text-violet-700' },
  speaking: { label: 'Speaking', Icon: Mic, cls: 'bg-rose-100 text-rose-700' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtTime(sec: number | null) {
  if (!sec) return '—';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}m${seconds.toString().padStart(2, '0')}s`;
}

function examRef(sub: {
  exam_type: string;
  serie_id: number | null;
  combinaison_id: number | null;
  partie_id: number | null;
}) {
  if (sub.exam_type === 'listening' || sub.exam_type === 'reading') {
    return sub.serie_id ? `Série ${sub.serie_id}` : '—';
  }
  if (sub.exam_type === 'writing') {
    return sub.combinaison_id ? `Comb. ${sub.combinaison_id}` : '—';
  }
  if (sub.exam_type === 'speaking') {
    return sub.partie_id ? `Partie ${sub.partie_id}` : '—';
  }
  return '—';
}

function scoreDisplay(sub: {
  exam_type: string;
  score: number | null;
  word_counts: { t1: number; t2: number; t3: number } | null;
  admin_score?: number | null;
}) {
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

function buildSubmissionsQuery(p: { type?: string; student?: string }) {
  const sp = new URLSearchParams();
  if (p.type && p.type !== 'all') sp.set('type', p.type);
  if (p.student?.trim()) sp.set('student', p.student.trim());
  const query = sp.toString();
  return query ? `?${query}` : '';
}

interface PageProps {
  searchParams: Promise<{ type?: string; student?: string }>;
}

export default async function TeacherSubmissionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filterType = params.type || 'all';
  const studentFilter = params.student?.trim() ?? '';

  const [students, submissions] = await Promise.all([
    getTeacherStudents(),
    getTeacherSubmissions({
      exam_type: filterType,
      student_email: studentFilter || undefined,
    }),
  ]);

  if (students.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
          <FileCheck className="w-6 h-6 text-violet-600" /> Chấm Bài
        </h1>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileCheck className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700">Chưa có học viên nào được phân công</p>
          <p className="text-sm text-gray-400 mt-1">Hãy liên hệ admin để được gán học viên.</p>
        </div>
      </div>
    );
  }

  const types = ['all', 'listening', 'reading', 'writing', 'speaking'] as const;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-violet-600" /> Chấm Bài
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Bài nộp từ học viên trong lớp của bạn · {submissions.length} bản ghi
        </p>
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
            <option value="">Tất cả lớp</option>
            {students.map((student) => (
              <option key={student.id} value={student.email}>
                {student.full_name ? `${student.full_name} (${student.email})` : student.email}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-900"
        >
          Lọc
        </button>
        <Link
          href={filterType === 'all' ? '/teacher/submissions' : `/teacher/submissions?type=${filterType}`}
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 py-2"
        >
          Xóa bộ lọc
        </Link>
      </form>

      <div className="flex gap-2 mb-6 flex-wrap">
        {types.map((type) => {
          const isActive = filterType === type;
          const badge = type === 'all' ? null : TYPE_BADGE[type];
          const BadgeIcon = badge?.Icon;
          const href =
            '/teacher/submissions' +
            buildSubmissionsQuery({
              type: type === 'all' ? undefined : type,
              student: studentFilter,
            });
          return (
            <Link
              key={type}
              href={href}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
              {type === 'all' ? 'Tất cả' : badge?.label}
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
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Học viên</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Loại</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Bài</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Kết quả</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Thời gian</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ngày nộp</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((submission) => {
                const badge = TYPE_BADGE[submission.exam_type] || TYPE_BADGE.listening;
                const BadgeIcon = badge.Icon;
                const graded =
                  submission.graded_at !== null && submission.graded_at !== undefined;
                const detailHref = `/teacher/submissions/${submission.id}`;
                const needsManualReview =
                  submission.exam_type === 'writing' || submission.exam_type === 'speaking';
                const unread = submission.teacher_viewed_at === null || submission.teacher_viewed_at === undefined;

                return (
                  <tr
                    key={submission.id}
                    className={`transition-colors align-middle ${
                      unread ? 'bg-gray-100/80' : 'bg-white'
                    } hover:bg-gray-50`}
                  >
                    <td className="p-0 align-middle">
                      <Link
                        href={detailHref}
                        className={`block px-4 py-3 text-blue-600 hover:underline ${
                          unread ? 'font-semibold' : 'font-medium'
                        }`}
                      >
                        {submission.student_email}
                      </Link>
                    </td>
                    <td className="p-0 align-middle">
                      <Link href={detailHref} className="block px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge.cls}`}
                        >
                          <BadgeIcon className="w-3 h-3" /> {badge.label}
                        </span>
                      </Link>
                    </td>
                    <td className="p-0 align-middle">
                      <Link href={detailHref} className={`block px-4 py-3 text-gray-700 ${unread ? 'font-semibold' : 'font-medium'}`}>
                        {examRef(submission)}
                      </Link>
                    </td>
                    <td className="p-0 align-middle">
                      <Link href={detailHref} className={`block px-4 py-3 text-gray-800 ${unread ? 'font-bold' : 'font-semibold'}`}>
                        {scoreDisplay(submission)}
                      </Link>
                    </td>
                    <td className="p-0 align-middle">
                      <Link
                        href={detailHref}
                        className={`flex items-center gap-1 px-4 py-3 text-gray-500 ${unread ? 'font-semibold' : ''}`}
                      >
                        <Clock className="w-3 h-3" /> {fmtTime(submission.time_spent_seconds)}
                      </Link>
                    </td>
                    <td className="p-0 align-middle">
                      <Link href={detailHref} className={`block px-4 py-3 text-xs text-gray-500 ${unread ? 'font-semibold' : ''}`}>
                        {fmtDate(submission.submitted_at)}
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
                          <span className="shrink-0 whitespace-nowrap text-xs text-gray-400">
                            Tự chấm
                          </span>
                        )}
                      </Link>
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
