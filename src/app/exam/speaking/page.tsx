"use client";

import { Mic } from "lucide-react";

import { AssignedExamListPage } from "@/components/exam/AssignedExamListPage";

export default function SpeakingSelectionPage() {
  return (
    <AssignedExamListPage
      examType="speaking"
      title="Expression Orale"
      summary="7 phút · Tâche 2 + Tâche 3"
      icon={Mic}
      borderColorClass="border-slate-200"
      accentColorClass="text-rose-600"
      accentBgClass="bg-rose-100"
      targetField="partie_id"
      buildHref={(targetId) => `/exam/speaking/${targetId}`}
      renderTitle={(targetId, examLabel) => examLabel || `Partie ${targetId}`}
      renderDetail={() => "Tâche 2 + Tâche 3"}
    />
  );
}
