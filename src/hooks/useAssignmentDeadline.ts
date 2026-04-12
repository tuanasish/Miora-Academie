'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDueDate, isDueDateOverdue } from '@/lib/exam/deadline';

type ExamType = 'listening' | 'reading' | 'writing' | 'speaking';

interface AssignmentDeadlineState {
  dueDate: string | null;
  formattedDueDate: string | null;
  isOverdue: boolean;
}

const EMPTY_STATE: AssignmentDeadlineState = {
  dueDate: null,
  formattedDueDate: null,
  isOverdue: false,
};

export function useAssignmentDeadline(examType: ExamType, targetId: number) {
  const [state, setState] = useState<AssignmentDeadlineState>(EMPTY_STATE);

  useEffect(() => {
    let cancelled = false;

    async function loadDeadline() {
      if (!Number.isInteger(targetId) || targetId <= 0) {
        if (!cancelled) setState(EMPTY_STATE);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        if (!cancelled) setState(EMPTY_STATE);
        return;
      }

      let query = supabase
        .from('exam_assignments')
        .select('due_date, assigned_at')
        .eq('student_email', user.email)
        .eq('exam_type', examType)
        .order('assigned_at', { ascending: false })
        .limit(1);

      if (examType === 'listening' || examType === 'reading') {
        query = query.eq('serie_id', targetId);
      } else if (examType === 'writing') {
        query = query.eq('combinaison_id', targetId);
      } else {
        query = query.eq('partie_id', targetId);
      }

      const { data } = await query;
      const dueDate = data?.[0]?.due_date ?? null;

      if (!cancelled) {
        setState({
          dueDate,
          formattedDueDate: formatDueDate(dueDate),
          isOverdue: isDueDateOverdue(dueDate),
        });
      }
    }

    void loadDeadline();

    return () => {
      cancelled = true;
    };
  }, [examType, targetId]);

  return state;
}
