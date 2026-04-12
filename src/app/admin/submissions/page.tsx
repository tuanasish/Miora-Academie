import Link from 'next/link';
import { getSubmissions } from '@/app/actions/submission.actions';
import { ADMIN_GRADE_MAX } from '@/lib/exam/adminGrading';
import { Headphones, BookOpen, PenLine, Mic, FileCheck, Clock, ArrowRight } from 'lucide-react';

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

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function AdminSubmissionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filterType = params.type || 'all';
  const submissions = await getSubmissions({ exam_type: filterType });

  const types = ['all', 'listening', 'reading', 'writing', 'speaking'];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-violet-600" /> Bài Nộp Của Học Viên
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Xem tất cả bài đã nộp · {submissions.length} bài
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {types.map((t) => {
          const isActive = filterType === t;
          const badge = t === 'all' ? null : TYPE_BADGE[t];
          const BadgeIcon = badge?.Icon;
          return (
            <Link
              key={t}
              href={t === 'all' ? '/admin/submissions' : `/admin/submissions?type=${t}`}
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

      {/* Table */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FileCheck className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700">Chưa có bài nộp nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
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
              {submissions.map((sub) => {
                const badge = TYPE_BADGE[sub.exam_type] || TYPE_BADGE.listening;
                const BadgeIcon = badge.Icon;
                const graded = sub.graded_at !== null && sub.graded_at !== undefined;
                const detailHref = `/admin/submissions/${sub.id}`;
                const needsManualReview = sub.exam_type === 'writing' || sub.exam_type === 'speaking';
                return (
                  <tr key={sub.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="p-0">
                      <Link href={detailHref} className="block px-4 py-3 text-blue-600 font-medium hover:underline">
                        {sub.student_email}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={detailHref} className="block px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge.cls}`}>
                          <BadgeIcon className="w-3 h-3" /> {badge.label}
                        </span>
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={detailHref} className="block px-4 py-3 font-medium text-gray-700">
                        {examRef(sub)}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={detailHref} className="block px-4 py-3 font-semibold text-gray-800">
                        {scoreDisplay(sub)}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={detailHref} className="flex items-center gap-1 px-4 py-3 text-gray-500">
                        <Clock className="w-3 h-3" /> {fmtTime(sub.time_spent_seconds)}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={detailHref} className="block px-4 py-3 text-xs text-gray-500">
                        {fmtDate(sub.submitted_at)}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={detailHref} className="flex items-center justify-between gap-3 px-4 py-3">
                        {graded ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Đã chấm</span>
                        ) : needsManualReview ? (
                          <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Chờ chấm</span>
                        ) : (
                          <span className="text-xs text-gray-400">Tự chấm</span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 opacity-0 transition-opacity group-hover:opacity-100">
                          {needsManualReview ? (graded ? 'Mở bài chấm' : 'Chấm bài') : 'Mở bài'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
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
