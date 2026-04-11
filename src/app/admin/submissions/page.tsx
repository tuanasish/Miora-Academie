import Link from 'next/link';
import { getSubmissions } from '@/app/actions/submission.actions';

const TYPE_BADGE: Record<string, { label: string; icon: string; cls: string }> = {
  listening: { label: 'Listening', icon: '🎧', cls: 'bg-sky-100 text-sky-700' },
  reading:   { label: 'Reading',   icon: '📖', cls: 'bg-emerald-100 text-emerald-700' },
  writing:   { label: 'Writing',   icon: '✍️', cls: 'bg-violet-100 text-violet-700' },
  speaking:  { label: 'Speaking',  icon: '🎤', cls: 'bg-rose-100 text-rose-700' },
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
    return `${sub.admin_score}/25`;
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
          <h1 className="text-2xl font-bold text-gray-800">📝 Bài Nộp Của Học Viên</h1>
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
          return (
            <Link
              key={t}
              href={t === 'all' ? '/admin/submissions' : `/admin/submissions?type=${t}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? 'Tất cả' : `${badge?.icon} ${badge?.label}`}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Học viên</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Loại</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Bài</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Kết quả</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Thời gian</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Ngày nộp</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.map((sub) => {
              const badge = TYPE_BADGE[sub.exam_type];
              return (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">{sub.student_email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge?.cls}`}>
                      {badge?.icon} {badge?.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700 font-medium">{examRef(sub)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-gray-800">{scoreDisplay(sub)}</p>
                    {(sub.exam_type === 'writing' || sub.exam_type === 'speaking') && (
                      sub.graded_at
                        ? <span className="text-[10px] font-bold text-emerald-600">✅ Đã chấm</span>
                        : <span className="text-[10px] text-orange-500">⏳ Chưa chấm</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-500">{fmtTime(sub.time_spent_seconds)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs text-gray-400">{fmtDate(sub.submitted_at)}</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/submissions/${sub.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      Xem chi tiết →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {submissions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="font-semibold">Chưa có bài nộp nào</p>
            <p className="text-sm mt-1">Học viên sẽ xuất hiện ở đây khi nộp bài</p>
          </div>
        )}
      </div>
    </div>
  );
}
