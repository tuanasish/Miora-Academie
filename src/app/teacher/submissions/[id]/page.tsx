import Link from 'next/link';
import { getTeacherAccessibleSubmission, markSubmissionTeacherViewed } from '@/app/actions/submission.actions';
import { gradeTeacherSubmission } from '@/app/actions/teacher.actions';
import GradeSubmitButton from '@/components/admin/GradeSubmitButton';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import McqSubmissionReview from '@/components/exam/McqSubmissionReview';
import WritingInlineReviewFields from '@/components/admin/WritingInlineReviewFields';
import { getMcqQuestionsForSerie } from '@/lib/exam/loadMcqExamData';
import { storedAnswersToIndices } from '@/lib/exam/mcqAnswers';
import { ADMIN_GRADE_MAX, TCF_GRADE_BANDS } from '@/lib/exam/adminGrading';
import { getWritingCombinaison, getSpeakingPartie } from '@/lib/exam/loadExamPrompts';
import {
  parseWritingReviewMarkup,
  plainTextToReviewHtml,
  serializeWritingReviewMarkup,
} from '@/lib/exam/writingReview';
import {
  Headphones, BookOpen, PenLine, Mic, ArrowLeft, CheckCircle, MessageSquare,
  Clock, Target, Download, AlignLeft, FileText,
} from 'lucide-react';
import { submissionWithSpeakingPlaybackUrls } from '@/lib/supabase/signSpeakingSubmissionUrl';

const TYPE_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = {
  listening: { label: 'Compréhension Orale', Icon: Headphones, color: 'text-sky-600' },
  reading:   { label: 'Compréhension Écrite', Icon: BookOpen,   color: 'text-emerald-600' },
  writing:   { label: 'Expression Écrite',    Icon: PenLine,    color: 'text-violet-600' },
  speaking:  { label: 'Expression Orale',     Icon: Mic,        color: 'text-rose-600' },
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
  searchParams: Promise<{ saved?: string; error?: string }>;
}

export default async function TeacherSubmissionDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const subRaw = await getTeacherAccessibleSubmission(id);
  if (!subRaw) notFound();
  // Mark as "opened" for teacher inbox styling
  await markSubmissionTeacherViewed(id);

  const sub = await submissionWithSpeakingPlaybackUrls(subRaw);
  const submission = sub;
  const errorBannerMessage =
    query.error === 'forbidden'
      ? 'Bạn không có quyền chấm bài này.'
      : query.error
        ? 'Không thể lưu kết quả chấm. Vui lòng thử lại.'
        : null;

  const mcqQuestions =
    (sub.exam_type === 'listening' || sub.exam_type === 'reading') && sub.serie_id != null
      ? await getMcqQuestionsForSerie(sub.exam_type, sub.serie_id)
      : null;

  const writingPrompt =
    sub.exam_type === 'writing' && sub.combinaison_id != null
      ? await getWritingCombinaison(sub.combinaison_id)
      : null;

  const speakingPrompt =
    sub.exam_type === 'speaking' && sub.partie_id != null
      ? await getSpeakingPartie(sub.partie_id)
      : null;
  const speakingT2 = speakingPrompt?.sujets.find((s) => s.tache === 2) ?? null;
  const speakingT3 = speakingPrompt?.sujets.find((s) => s.tache === 3) ?? null;

  const meta = TYPE_META[sub.exam_type];
  const examRef =
    sub.exam_type === 'writing'
      ? `Combinaison ${sub.combinaison_id}`
      : sub.exam_type === 'speaking'
        ? `Partie ${sub.partie_id}`
        : `Série ${sub.serie_id}`;

  const isGradable = sub.exam_type === 'writing' || sub.exam_type === 'speaking';
  const isGraded = sub.graded_at !== null && sub.graded_at !== undefined;
  const writingTasks = sub.exam_type === 'writing'
    ? [
        { key: 't1' as const, label: 'Tâche 1', text: sub.writing_task1 ?? '', wc: sub.word_counts?.t1, time: sub.task_times?.t1, range: '60-120' },
        { key: 't2' as const, label: 'Tâche 2', text: sub.writing_task2 ?? '', wc: sub.word_counts?.t2, time: sub.task_times?.t2, range: '120-150' },
        { key: 't3' as const, label: 'Tâche 3', text: sub.writing_task3 ?? '', wc: sub.word_counts?.t3, time: sub.task_times?.t3, range: '120-180' },
      ]
    : [];
  const writingReview = sub.exam_type === 'writing' ? parseWritingReviewMarkup(sub.notes) : null;
  const visibleNotes = sub.exam_type === 'writing' && writingReview ? null : sub.notes;

  async function handleGrade(formData: FormData) {
    'use server';
    let errorCode: 'forbidden' | 'save_failed' | null = null;

    try {
      const score = parseFloat(formData.get('admin_score') as string);
      const feedback = (formData.get('admin_feedback') as string) || '';
      const reviewNotes = (() => {
        if (submission.exam_type !== 'writing') return undefined;

        const originalTasks = {
          t1: plainTextToReviewHtml(submission.writing_task1),
          t2: plainTextToReviewHtml(submission.writing_task2),
          t3: plainTextToReviewHtml(submission.writing_task3),
        };

        const mode = (formData.get('writing_review_mode') as string) || 'editing';
        let suggestions;
        try {
          const rawSuggestions = formData.get('writing_review_suggestions');
          if (rawSuggestions) suggestions = JSON.parse(rawSuggestions as string);
        } catch {}

        const submittedTasks = {
          t1: (formData.get('writing_review_t1_html') as string) || writingReview?.tasks.t1 || originalTasks.t1,
          t2: (formData.get('writing_review_t2_html') as string) || writingReview?.tasks.t2 || originalTasks.t2,
          t3: (formData.get('writing_review_t3_html') as string) || writingReview?.tasks.t3 || originalTasks.t3,
        };

        const hasCustomReview = (['t1', 't2', 't3'] as const).some((taskKey) => submittedTasks[taskKey] !== originalTasks[taskKey]);
        const hasSuggestions = suggestions && (suggestions.t1?.length > 0 || suggestions.t2?.length > 0 || suggestions.t3?.length > 0);

        if (!hasCustomReview && !hasSuggestions) return null;

        return serializeWritingReviewMarkup(submittedTasks, mode as 'editing' | 'suggesting', suggestions);
      })();
      await gradeTeacherSubmission(id, score, feedback, reviewNotes);
    } catch (error) {
      errorCode = error instanceof Error && error.message === 'FORBIDDEN' ? 'forbidden' : 'save_failed';
    }

    if (errorCode) {
      redirect(`/teacher/submissions/${id}?error=${errorCode}`);
    }

    revalidatePath(`/teacher/submissions/${id}`);
    redirect(`/teacher/submissions/${id}?saved=1`);
  }

  return (
    <div>
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/teacher/submissions"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <meta.Icon className={`w-6 h-6 ${meta.color}`} /> Chi Tiết Bài Nộp
        </h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {isGraded && (
            <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Đã chấm
            </span>
          )}
        </div>
      </div>

      {query.saved === '1' && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">Đã lưu điểm và nhận xét thành công.</p>
        </div>
      )}
      {errorBannerMessage && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-800">{errorBannerMessage}</p>
        </div>
      )}

      {/* Meta Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Học viên</p>
            <p className="text-sm font-medium text-gray-800">{sub.student_email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Loại bài thi</p>
            <p className={`text-sm font-bold ${meta.color} flex items-center gap-1.5`}><meta.Icon className="w-4 h-4" /> {meta.label}</p>
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
                <span className="text-sm font-normal text-gray-400 ml-1">/ 699</span>
              </p>
            </div>
          )}
          {isGraded && (
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Điểm chấm</p>
              <p className="text-2xl font-bold text-violet-600">
                {sub.admin_score}<span className="text-sm font-normal text-gray-400 ml-1">/ {ADMIN_GRADE_MAX}</span>
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
          <p className="text-xs text-violet-600 font-semibold uppercase mb-2 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Nhận xét</p>
          <p className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed">{sub.admin_feedback}</p>
        </div>
      )}

      {/* Writing Detail */}
      {sub.exam_type === 'writing' && (
        <div className="space-y-4 mb-6">
          {writingTasks.map((t, i) => {
            const sujetText = writingPrompt
              ? i === 0 ? writingPrompt.tache1Sujet
                : i === 1 ? writingPrompt.tache2Sujet
                : writingPrompt.tache3Titre
              : null;
            const doc1 = i === 2 ? writingPrompt?.tache3Document1 : null;
            const doc2 = i === 2 ? writingPrompt?.tache3Document2 : null;

            return (
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
                      <span className="text-xs text-gray-400 font-mono flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtTime(t.time)}</span>
                    )}
                  </div>
                </div>

                {sujetText && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlignLeft className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Sujet — {t.label}</span>
                      <span className="ml-auto text-[11px] text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">obj. {t.range} mots</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">{sujetText}</p>
                    {(doc1 || doc2) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {doc1 && (
                          <div className="bg-white border border-amber-200 rounded-lg p-3">
                            <p className="text-xs font-extrabold text-emerald-700 mb-1.5">Document POUR</p>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{doc1}</p>
                          </div>
                        )}
                        {doc2 && (
                          <div className="bg-white border border-amber-200 rounded-lg p-3">
                            <p className="text-xs font-extrabold text-red-600 mb-1.5">Document CONTRE</p>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{doc2}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2">Bài làm</p>
                  <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">
                    {t.text || <span className="italic text-blue-600/80">Pas de réponse</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Speaking Detail */}
      {sub.exam_type === 'speaking' && (
        <div className="space-y-4 mb-6">
          {[
            { label: 'Tâche 2 — Roleplay', url: sub.speaking_task1_video_url, sujet: speakingT2 },
            { label: 'Tâche 3 — Débat', url: sub.speaking_task2_video_url, sujet: speakingT3 },
          ].map((t, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Mic className="w-4 h-4 text-rose-500" /> {t.label}</h3>

              {t.sujet && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Sujet d&apos;examen</span>
                  </div>
                  <p className="text-sm text-emerald-950 leading-relaxed font-medium">{t.sujet.title}</p>
                  {t.sujet.question && (
                    <div className="mt-3 border-t border-emerald-100 pt-3">
                      <p className="text-xs text-emerald-600 font-semibold mb-1">Questions guide :</p>
                      <p className="text-sm text-emerald-900 whitespace-pre-line leading-relaxed">{t.sujet.question}</p>
                    </div>
                  )}
                  {t.sujet.description && (
                    <p className="text-xs text-emerald-700/80 italic mt-2">{t.sujet.description}</p>
                  )}
                </div>
              )}

              <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 space-y-2">
                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Bài làm</p>
                {t.url ? (
                  <>
                    <audio controls preload="metadata" className="w-full h-12">
                      <source src={t.url} />
                    </audio>
                    <a href={t.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" /> Tải file gốc</span>
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-blue-600/80 italic">Pas d&apos;enregistrement</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Listening/Reading — MCQ correction */}
      {(sub.exam_type === 'listening' || sub.exam_type === 'reading') && sub.answers && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          {mcqQuestions && mcqQuestions.length > 0 ? (
            <McqSubmissionReview
              questions={mcqQuestions}
              userAnswerByQuestionId={storedAnswersToIndices(sub.answers)}
              variant="full"
              title="Correction détaillée"
              titleClassName="font-bold text-gray-800 mb-3"
            />
          ) : (
            <>
              <h3 className="font-bold text-gray-800 mb-3">
                Réponses ({Object.keys(sub.answers).length} questions)
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {Object.entries(sub.answers)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([qId, ans], i) => (
                    <div key={qId} className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-400">Q{i + 1}</p>
                      <p className="text-sm font-bold text-gray-800">{ans}</p>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Notes */}
      {visibleNotes && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
          <p className="text-xs text-amber-600 font-semibold uppercase mb-1">Notes</p>
          <p className="text-sm text-amber-800">{visibleNotes}</p>
        </div>
      )}

      {/* ===== GRADING FORM (Writing/Speaking only) ===== */}
      {isGradable && (
        <div className="bg-white rounded-xl border-2 border-violet-200 p-6">
          <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-500" />
            {isGraded ? 'Sửa điểm' : 'Chấm điểm'}
          </h3>
          <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/80 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-violet-900">Chấm theo thang TCF / {ADMIN_GRADE_MAX}</p>
                <p className="mt-1 text-xs leading-relaxed text-violet-700">
                  Nhập tổng điểm cuối cùng, rồi đối chiếu nhanh với các mốc trình độ và NCLC dưới đây.
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                7 mốc tham chiếu
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {TCF_GRADE_BANDS.map((band) => (
                <div key={band.range} className="rounded-xl border border-violet-200 bg-white/90 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-500">{band.range} điểm</p>
                  <p className="mt-1 text-sm font-bold text-gray-800">{band.level}</p>
                  <p className="text-[11px] text-gray-500">{band.nclc}</p>
                </div>
              ))}
            </div>
          </div>

          <form action={handleGrade} className="mt-4 space-y-4">
            {sub.exam_type === 'writing' && (
              <WritingInlineReviewFields
                fields={writingTasks.map((task) => ({
                  key: task.key,
                  label: task.label,
                  originalHtml: plainTextToReviewHtml(task.text),
                  initialHtml: writingReview?.tasks[task.key] ?? plainTextToReviewHtml(task.text),
                }))}
              />
            )}

            <div className="max-w-md">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Điểm tổng <span className="text-gray-400 font-normal">/ {ADMIN_GRADE_MAX}</span>
              </label>
              <input
                type="number"
                name="admin_score"
                min={0}
                max={ADMIN_GRADE_MAX}
                step={1}
                inputMode="numeric"
                defaultValue={sub.admin_score ?? ''}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-lg font-bold text-gray-800 focus:ring-2 focus:ring-violet-300 focus:border-violet-400 outline-none"
                placeholder={`0 - ${ADMIN_GRADE_MAX}`}
              />
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
                placeholder="Nhận xét chi tiết cho học viên..."
              />
            </div>

            <GradeSubmitButton isGraded={isGraded} />
          </form>
        </div>
      )}
    </div>
  );
}
