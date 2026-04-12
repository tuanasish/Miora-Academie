import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Headphones } from "lucide-react";

import McqSubmissionReview from "@/components/exam/McqSubmissionReview";
import { getSubmissionIfOwner } from "@/app/actions/submission.actions";
import { getMcqQuestionsForSerie } from "@/lib/exam/loadMcqExamData";
import { storedAnswersToIndices } from "@/lib/exam/mcqAnswers";
import { getWritingCombinaison, getSpeakingPartie } from '@/lib/exam/loadExamPrompts';
import { parseWritingReviewMarkup, plainTextToReviewHtml } from '@/lib/exam/writingReview';
import { ADMIN_GRADE_MAX } from '@/lib/exam/adminGrading';
import { submissionWithSpeakingPlaybackUrls } from '@/lib/supabase/signSpeakingSubmissionUrl';
import { PenLine, Mic, Clock, Download, FileText, AlignLeft, MessageSquare } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardSubmissionReviewPage({ params }: PageProps) {
  const { id } = await params;
  const subRaw = await getSubmissionIfOwner(id);
  if (!subRaw) notFound();
  const sub = await submissionWithSpeakingPlaybackUrls(subRaw);

  const maxScore = 
    sub.exam_type === "listening" ? 699 : 
    sub.exam_type === "reading" ? 699 : 
    ADMIN_GRADE_MAX;

  const MetaIcon = 
    sub.exam_type === "listening" ? Headphones : 
    sub.exam_type === "reading" ? BookOpen :
    sub.exam_type === "writing" ? PenLine : Mic;

  const metaColor = 
    sub.exam_type === "listening" ? "text-sky-600" : 
    sub.exam_type === "reading" ? "text-emerald-600" :
    sub.exam_type === "writing" ? "text-violet-600" : "text-rose-600";

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

  const writingTasks = sub.exam_type === 'writing'
    ? [
        { key: 't1' as const, label: 'Tâche 1', text: sub.writing_task1 ?? '', wc: sub.word_counts?.t1, time: sub.task_times?.t1, range: '60-120' },
        { key: 't2' as const, label: 'Tâche 2', text: sub.writing_task2 ?? '', wc: sub.word_counts?.t2, time: sub.task_times?.t2, range: '120-150' },
        { key: 't3' as const, label: 'Tâche 3', text: sub.writing_task3 ?? '', wc: sub.word_counts?.t3, time: sub.task_times?.t3, range: '120-180' },
      ]
    : [];
  const writingReview = sub.exam_type === 'writing' && sub.notes ? parseWritingReviewMarkup(sub.notes) : null;

  function fmtTimePassed(sec: number | null | undefined) {
    if (!sec) return "";
    return `${Math.floor(sec / 60)}m${sec % 60}s`;
  }

  return (
    <div className="min-h-screen bg-[#f3efe6] pb-12">
      <div className="bg-[#faf8f5] border-b border-[#e4ddd1] px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-[#f05e23] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <MetaIcon className={`w-8 h-8 ${metaColor}`} />
            <div>
              <h1 className="font-display font-bold text-xl text-[#3d3d3d]">
                Xem lại bài làm — {sub.exam_type === "writing" && sub.combinaison_id ? `Combinaison ${sub.combinaison_id}` : sub.exam_type === "speaking" && sub.partie_id ? `Partie ${sub.partie_id}` : sub.serie_id ? `Série ${sub.serie_id}` : "Test"}
              </h1>
              <p className="text-xs text-[#888] mt-0.5">
                {sub.exam_type === "listening" ? "Compréhension orale" : sub.exam_type === "reading" ? "Compréhension écrite" : sub.exam_type === "writing" ? "Expression écrite" : "Expression orale"} ·{" "}
                {fmtDate(sub.submitted_at)}
              </p>
            </div>
            
            {/* Display Score */}
            <div className="ml-auto flex items-center gap-2">
              {sub.admin_score !== null && sub.admin_score !== undefined ? (
                <span className="text-sm font-bold text-violet-700 bg-white/80 px-3 py-1 rounded-full border border-violet-200">
                  {sub.admin_score}/{maxScore}
                </span>
              ) : sub.score !== null && sub.score !== undefined ? (
                <span className="text-sm font-bold text-emerald-600 bg-white/80 px-3 py-1 rounded-full border border-emerald-200">
                  {sub.score}/{maxScore}
                </span>
              ) : (
                <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  Chờ chấm điểm
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* MCQ Details */}
        {(sub.exam_type === "listening" || sub.exam_type === "reading") && mcqQuestions && (
          <McqSubmissionReview
            questions={mcqQuestions}
            userAnswerByQuestionId={storedAnswersToIndices(sub.answers)}
            variant="full"
            title="Correction"
            animateRows={false}
          />
        )}

        {/* Global Feedback from Admin */}
        {sub.admin_feedback && (
          <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-6 mb-6">
            <h3 className="flex items-center gap-2 font-bold text-violet-800 mb-2">
              <MessageSquare className="w-5 h-5" /> 
              Đánh giá chung từ Giảng viên
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{sub.admin_feedback}</p>
          </div>
        )}

        {/* WRITING Details */}
        {sub.exam_type === 'writing' && (
          <div className="space-y-6">
            {writingTasks.map((t, i) => {
              const sujetText = writingPrompt
                ? i === 0 ? writingPrompt.tache1Sujet
                  : i === 1 ? writingPrompt.tache2Sujet
                  : writingPrompt.tache3Titre
                : null;
              const doc1 = i === 2 ? writingPrompt?.tache3Document1 : null;
              const doc2 = i === 2 ? writingPrompt?.tache3Document2 : null;
              
              const reviewForTask = writingReview?.tasks[t.key];

              return (
                <div key={i} className="bg-white rounded-2xl border border-[#e4ddd1] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#3d3d3d] text-lg">{t.label}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        (t.wc || 0) >= parseInt(t.range.split('-')[0]) ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {t.wc || 0} mots (obj. {t.range})
                      </span>
                      {t.time !== undefined && (
                        <span className="text-xs text-[#888] font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {fmtTimePassed(t.time)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Original Exam Prompt */}
                  {sujetText && (
                    <div className="bg-[#faf8f5] border border-[#e4ddd1] rounded-xl p-4 mb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <AlignLeft className="w-4 h-4 text-[#888]" />
                        <span className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Sujet — {t.label}</span>
                      </div>
                      <p className="text-sm text-[#3d3d3d] leading-relaxed font-medium">{sujetText}</p>
                      
                      {(doc1 || doc2) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          {doc1 && (
                            <div className="bg-white border border-[#e4ddd1] rounded-lg p-3">
                              <p className="text-xs font-extrabold text-emerald-700 mb-1.5">Document POUR</p>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{doc1}</p>
                            </div>
                          )}
                          {doc2 && (
                            <div className="bg-white border border-[#e4ddd1] rounded-lg p-3">
                              <p className="text-xs font-extrabold text-red-600 mb-1.5">Document CONTRE</p>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{doc2}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin corrected answer or raw student answer */}
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Chi tiết bài làm</p>
                    {reviewForTask && reviewForTask.length > 0 ? (
                      <div 
                        className="prose prose-sm max-w-none text-blue-900 leading-relaxed prose-headings:text-blue-900 prose-p:text-blue-900"
                        dangerouslySetInnerHTML={{ __html: plainTextToReviewHtml(reviewForTask) }}
                      />
                    ) : (
                      <p className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">
                        {t.text || <span className="italic text-blue-600/80">Pas de réponse</span>}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SPEAKING Details */}
        {sub.exam_type === 'speaking' && (
          <div className="space-y-6">
            {[
              { label: 'Tâche 2 — Roleplay', url: sub.speaking_task1_video_url, sujet: speakingT2 },
              { label: 'Tâche 3 — Débat', url: sub.speaking_task2_video_url, sujet: speakingT3 },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e4ddd1] p-6 shadow-sm">
                <h3 className="font-bold text-[#3d3d3d] text-lg mb-4 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-rose-500" /> {t.label}
                </h3>

                {/* Original Exam Sujet */}
                {t.sujet && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Sujet d&apos;examen</span>
                    </div>
                    <p className="text-sm text-emerald-950 leading-relaxed font-semibold">{t.sujet.title}</p>
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

                {/* Student Recording */}
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">Bản ghi âm</p>
                  {t.url ? (
                    <div className="space-y-3">
                      <audio controls preload="metadata" className="w-full h-12">
                        <source src={t.url} />
                      </audio>
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Tải file gốc
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-600/80 italic">Pas d&apos;enregistrement</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
