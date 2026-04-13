'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Play, CheckCircle2, CalendarDays, Clock3 } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { formatDueDate, isDueDateOverdue } from '@/lib/exam/deadline';

type ExamType = 'listening' | 'reading' | 'writing' | 'speaking';
type TargetField = 'serie_id' | 'combinaison_id' | 'partie_id';
type FilterMode = 'all' | 'completed' | 'incomplete';

interface AssignedExamListPageProps {
  examType: ExamType;
  title: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
  borderColorClass: string;
  accentColorClass: string;
  accentBgClass: string;
  targetField: TargetField;
  buildHref: (targetId: number) => string;
  renderTitle: (targetId: number, examLabel: string | null) => string;
  renderDetail: (targetId: number) => string;
}

interface AssignmentRow {
  id: string;
  exam_label: string | null;
  due_date: string | null;
  note: string | null;
  assigned_at: string;
  serie_id: number | null;
  combinaison_id: number | null;
  partie_id: number | null;
}

interface SubmissionRow {
  serie_id: number | null;
  combinaison_id: number | null;
  partie_id: number | null;
}

export function AssignedExamListPage({
  examType,
  title,
  summary,
  icon: Icon,
  borderColorClass,
  accentColorClass,
  accentBgClass,
  targetField,
  buildHref,
  renderTitle,
  renderDetail,
}: AssignedExamListPageProps) {
  const supabase = createClient();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [completedTargets, setCompletedTargets] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('all');

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email) {
          if (active) setLoading(false);
          return;
        }

        const [{ data: assignmentRows }, { data: submissionRows }] = await Promise.all([
          supabase
            .from('exam_assignments')
            .select('id, exam_label, due_date, note, assigned_at, serie_id, combinaison_id, partie_id')
            .eq('student_email', user.email)
            .eq('exam_type', examType)
            .order('assigned_at', { ascending: false }),
          supabase
            .from('exam_submissions')
            .select('serie_id, combinaison_id, partie_id')
            .eq('student_email', user.email)
            .eq('exam_type', examType),
        ]);

        if (!active) return;

        const doneTargets = new Set<number>();
        for (const row of (submissionRows ?? []) as SubmissionRow[]) {
          const value = row[targetField];
          if (typeof value === 'number') {
            doneTargets.add(value);
          }
        }

        setAssignments((assignmentRows ?? []) as AssignmentRow[]);
        setCompletedTargets(doneTargets);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [examType, supabase, targetField]);

  const items = useMemo(() => {
    return assignments
      .map((assignment) => {
        const targetId = assignment[targetField];
        if (typeof targetId !== 'number') return null;
        const completed = completedTargets.has(targetId);
        const overdue = !completed && isDueDateOverdue(assignment.due_date);
        return {
          ...assignment,
          targetId,
          completed,
          overdue,
          dueDateLabel: formatDueDate(assignment.due_date),
        };
      })
      .filter(Boolean) as Array<
      AssignmentRow & {
        targetId: number;
        completed: boolean;
        overdue: boolean;
        dueDateLabel: string | null;
      }
    >;
  }, [assignments, completedTargets, targetField]);

  const filteredItems = items.filter((item) => {
    if (filter === 'completed') return item.completed;
    if (filter === 'incomplete') return !item.completed;
    return true;
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f3efe6]">
        <div className="w-10 h-10 border-4 border-[#f05e23]/30 border-t-[#f05e23] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3efe6]">
      <header className="bg-[#faf8f5] border-b border-[#e4ddd1] px-6 py-4 sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#3d3d3d] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour
          </Link>
          <span className="text-[#d7c9b8]">|</span>
          <div>
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${accentColorClass}`} />
              <h1 className="font-bold text-[#3d3d3d]">{title}</h1>
            </div>
            <p className="text-xs text-[#888] mt-0.5">
              {items.length} bài được giao · {summary}
            </p>
          </div>

          <div className="ml-auto flex items-center gap-1 bg-[#ede8dd] rounded-xl p-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-[#faf8f5] shadow-sm text-[#3d3d3d]' : 'text-[#888] hover:text-[#3d3d3d]'
              }`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-[#faf8f5] shadow-sm text-[#3d3d3d]'
                  : 'text-[#888] hover:text-[#3d3d3d]'
              }`}
            >
              Terminées
            </button>
            <button
              type="button"
              onClick={() => setFilter('incomplete')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'incomplete'
                  ? 'bg-[#faf8f5] shadow-sm text-[#3d3d3d]'
                  : 'text-[#888] hover:text-[#3d3d3d]'
              }`}
            >
              Non terminées
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-[#e4ddd1] bg-[#faf8f5] px-8 py-12 text-center">
            <Icon className={`mx-auto mb-4 h-10 w-10 ${accentColorClass}`} />
            <h2 className="text-lg font-bold text-[#3d3d3d]">
              {items.length === 0 ? 'Chưa có bài nào được giao' : 'Không có bài nào khớp bộ lọc'}
            </h2>
            <p className="mt-2 text-sm text-[#888]">
              {items.length === 0
                ? 'Giảng viên sẽ giao bài cho bạn tại đây.'
                : 'Thử đổi bộ lọc để xem các bài còn lại.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                href={buildHref(item.targetId)}
                className={`group relative bg-[#faf8f5] rounded-2xl border-2 p-5 hover:shadow-lg transition-all duration-200 ${
                  item.completed
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : `${borderColorClass} hover:border-[#f05e23]/40`
                }`}
              >
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      item.completed
                        ? 'bg-emerald-100 text-emerald-600'
                        : `${accentBgClass} ${accentColorClass}`
                    }`}
                  >
                    {item.completed ? <CheckCircle2 className="w-5 h-5" /> : item.targetId}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        item.completed
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-[#ede8dd] text-[#888]'
                      }`}
                    >
                      {item.completed ? 'Terminée ✓' : 'À faire'}
                    </span>
                    {item.overdue && (
                      <span className="text-[11px] font-semibold rounded-full bg-red-50 px-2 py-0.5 text-red-600">
                        Quá hạn
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-[#3d3d3d] mb-1">
                  {renderTitle(item.targetId, item.exam_label)}
                </h3>
                <p className="text-xs text-[#888]">{renderDetail(item.targetId)}</p>

                {item.note && (
                  <p className="mt-3 text-xs text-[#7a746b] line-clamp-2">
                    {item.note}
                  </p>
                )}

                <div className="mt-3 flex flex-col gap-1 text-[11px] text-[#888]">
                  {item.dueDateLabel && (
                    <span className={`inline-flex items-center gap-1 ${item.overdue ? 'text-red-600' : ''}`}>
                      <CalendarDays className="w-3.5 h-3.5" />
                      {item.dueDateLabel}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="w-3.5 h-3.5" />
                    Giao ngày {new Date(item.assigned_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div
                  className={`mt-4 flex items-center gap-2 text-sm font-semibold ${
                    item.completed ? 'text-emerald-600' : accentColorClass
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {item.completed ? 'Xem lại / làm lại' : 'Commencer'}
                </div>

                <div className="absolute inset-0 rounded-2xl bg-[#f05e23]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
