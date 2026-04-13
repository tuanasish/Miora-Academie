"use client";

import { PenLine } from "lucide-react";

import { AssignedExamListPage } from "@/components/exam/AssignedExamListPage";

export default function WritingSelectionPage() {
  return (
    <AssignedExamListPage
      examType="writing"
      title="Expression Écrite"
      summary="60 phút · 3 tâches"
      icon={PenLine}
      borderColorClass="border-slate-200"
      accentColorClass="text-violet-600"
      accentBgClass="bg-violet-100"
      targetField="combinaison_id"
      buildHref={(targetId) => `/exam/writing/${targetId}`}
      renderTitle={(targetId, examLabel) => examLabel || `Combinaison ${targetId}`}
      renderDetail={() => "3 tâches · 60 min"}
    />
  );
}
