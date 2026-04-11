import Link from 'next/link';
import { getSubmission, gradeSubmission } from '@/app/actions/submission.actions';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  listening: { label: 'Compréhension Orale', icon: '🎧', color: 'text-sky-600' },
  reading:   { label: 'Compréhension Écrite', icon: '📖', color: 'text-emerald-600' },
  writing:   { label: 'Expression Écrite',    icon: '✍️', color: 'text-violet-600' },
  speaking:  { label: 'Expression Orale',     icon: '🎤', color: 'text-rose-600' },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtTime(sec: number | null) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const sub = await getSubmission(id);
  if (!sub) notFound();

  const meta = TYPE_META[sub.exam_type];
  const examRef =
    sub.exam_type === 'writing'
      ? `Combinaison ${sub.combinaison_id}`
      : sub.exam_type === 'speaking'
        ? `Partie ${sub.partie_id}`
        : `Série ${sub.serie_id}`;

  const isGradable = sub.exam_type === 'writing' || sub.exam_type === 'speaking';
  const isGraded = sub.graded_at !== null && sub.graded_at !== undefined;

  async function handleGrade(formData: FormData) {
    'use server';
    const score = parseFloat(formData.get('admin_score') as string);
    const feedback = (formData.get('admin_feedback') as string) || '';
    await gradeSubmission(id, score, feedback);
    revalidatePath(`/admin/submissions/${id}`);
  }

  return (
    <div>
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/submissions"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          ← Quay lại
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-2xl font-bold text-gray-800">
          {meta.icon} Chi Tiết Bài Nộp
        </h1>
        {isGraded && (
          <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full ml-auto">
            ✅ Đã chấm
          </span>
        )}
      </div>

      {/* Meta Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Học viên</p>
            <p className="text-sm font-medium text-gray-800">{sub.student_email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Loại bài thi</p>
            <p className={`text-sm font-bold ${meta.color}`}>{meta.icon} {meta.label}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Bài</p>
            <p className="text-sm font-medium text-gray-800">{examRef}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Ngày nộp</p>
            <p className="text-sm text-gray-600">{fmtDate(sub.submitted_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          {(sub.exam_type === 'listening' || sub.exam_type === 'reading') && (
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Điểm</p>
              <p className="text-2xl font-bold text-gray-800">
                {sub.score !== null ? sub.score : '—'}
                <span className="text-sm font-normal text-gray-400 ml-1">
                  / {sub.exam_type === 'listening' ? 39 : 29}
                </span>
              </p>
            </div>
          )}
          {isGraded && (
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Điểm Admin</p>
              <p className="text-2xl font-bold text-violet-600">
                {sub.admin_score}<span className="text-sm font-normal text-gray-400 ml-1">/ 25</span>
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Thời gian</p>
            <p className="text-lg font-semibold text-gray-700">{fmtTime(sub.time_spent_seconds)}</p>
          </div>
          {isGraded && (
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Chấm bởi</p>
              <p className="text-sm text-gray-600">{sub.graded_by}</p>
              <p className="text-[10px] text-gray-400">{sub.graded_at ? fmtDate(sub.graded_at) : ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Admin Feedback (if graded) */}
      {isGraded && sub.admin_feedback && (
        <div className="bg-violet-50 rounded-xl border border-violet-200 p-5 mb-6">
          <p className="text-xs text-violet-600 font-semibold uppercase mb-2">💬 Nhận xét của Admin</p>
          <p className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed">{sub.admin_feedback}</p>
        </div>
      )}

      {/* Writing Detail */}
      {sub.exam_type === 'writing' && (
        <div className="space-y-4 mb-6">
          {[
            { label: 'Tâche 1', text: sub.writing_task1, wc: sub.word_counts?.t1, time: sub.task_times?.t1, range: '60-120' },
            { label: 'Tâche 2', text: sub.writing_task2, wc: sub.word_counts?.t2, time: sub.task_times?.t2, range: '120-150' },
            { label: 'Tâche 3', text: sub.writing_task3, wc: sub.word_counts?.t3, time: sub.task_times?.t3, range: '120-180' },
          ].map((t, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800">{t.label}</h3>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    (t.wc || 0) >= parseInt(t.range.split('-')[0]) ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {t.wc || 0} mots (obj. {t.range})
                  </span>
                  {t.time !== undefined && (
                    <span className="text-xs text-gray-400 font-mono">⏱ {fmtTime(t.time)}</span>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {t.text || <span className="italic text-gray-400">Pas de réponse</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Speaking Detail */}
      {sub.exam_type === 'speaking' && (
        <div className="space-y-4 mb-6">
          {[
            { label: 'Tâche 2 — Roleplay', url: sub.speaking_task1_video_url },
            { label: 'Tâche 3 — Débat', url: sub.speaking_task2_video_url },
          ].map((t, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-3">{t.label}</h3>
              {t.url ? (
                <audio controls src={t.url} className="w-full h-12" />
              ) : (
                <p className="text-sm text-gray-400 italic">Pas d&apos;enregistrement</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Listening/Reading Detail — Answers */}
      {(sub.exam_type === 'listening' || sub.exam_type === 'reading') && sub.answers && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-3">Réponses ({Object.keys(sub.answers).length} questions)</h3>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {Object.entries(sub.answers).map(([qId, ans], i) => (
              <div key={qId} className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-400">Q{i + 1}</p>
                <p className="text-sm font-bold text-gray-800">{ans}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {sub.notes && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
          <p className="text-xs text-amber-600 font-semibold uppercase mb-1">Notes</p>
          <p className="text-sm text-amber-800">{sub.notes}</p>
        </div>
      )}

      {/* ===== GRADING FORM (Writing/Speaking only) ===== */}
      {isGradable && (
        <div className="bg-white rounded-xl border-2 border-violet-200 p-6">
          <h3 className="font-bold text-gray-800 mb-1">
            {isGraded ? '✏️ Sửa điểm' : '🎯 Chấm điểm'}
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {sub.exam_type === 'writing'
              ? 'Chấm theo thang DELF B2: 25 điểm (Tâche 1: 5pts, Tâche 2: 10pts, Tâche 3: 10pts)'
              : 'Chấm theo thang DELF B2: 25 điểm (Tâche 2: 10pts, Tâche 3: 15pts)'}
          </p>

          <form action={handleGrade} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Điểm <span className="text-gray-400 font-normal">/ 25</span>
                </label>
                <input
                  type="number"
                  name="admin_score"
                  min={0}
                  max={25}
                  step={0.5}
                  defaultValue={sub.admin_score ?? ''}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-lg font-bold text-gray-800 focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none"
                  placeholder="0 - 25"
                />
              </div>
              <div className="flex items-end">
                <div className="text-xs text-gray-400 space-y-0.5">
                  {sub.exam_type === 'writing' ? (
                    <>
                      <p>• Tâche 1 (synthèse): max 5 pts</p>
                      <p>• Tâche 2 (essai): max 10 pts</p>
                      <p>• Tâche 3 (opinion): max 10 pts</p>
                    </>
                  ) : (
                    <>
                      <p>• Tâche 2 (roleplay): max 10 pts</p>
                      <p>• Tâche 3 (débat): max 15 pts</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nhận xét <span className="text-gray-400 font-normal">(tùy chọn)</span>
              </label>
              <textarea
                name="admin_feedback"
                rows={4}
                defaultValue={sub.admin_feedback ?? ''}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-800 focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none resize-y"
                placeholder="Nhận xét chi tiết cho học viên... (sẽ hiển thị trên dashboard của họ)"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {isGraded ? '💾 Cập nhật điểm' : '✅ Xác nhận chấm điểm'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
