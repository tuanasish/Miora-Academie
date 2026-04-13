"use client";

import { BookOpen } from "lucide-react";

import { AssignedExamListPage } from "@/components/exam/AssignedExamListPage";

export default function ReadingSeriesPage() {
  return (
    <AssignedExamListPage
      examType="reading"
      title="Compréhension de l'Écrit"
      summary="60 phút · 39 câu hỏi"
      icon={BookOpen}
      borderColorClass="border-[#e4ddd1]"
      accentColorClass="text-[#f05e23]"
      accentBgClass="bg-[#f05e23]/10"
      targetField="serie_id"
      buildHref={(targetId) => `/exam/reading/${targetId}`}
      renderTitle={(targetId, examLabel) => examLabel || `Série ${targetId}`}
      renderDetail={() => "39 questions · 60 min"}
    />
  );
}
