"use client";

import { Headphones } from "lucide-react";

import { AssignedExamListPage } from "@/components/exam/AssignedExamListPage";

export default function ListeningSeriesPage() {
  return (
    <AssignedExamListPage
      examType="listening"
      title="Compréhension de l'Oral"
      summary="35 phút · 39 câu hỏi"
      icon={Headphones}
      borderColorClass="border-[#e4ddd1]"
      accentColorClass="text-[#f05e23]"
      accentBgClass="bg-[#f05e23]/10"
      targetField="serie_id"
      buildHref={(targetId) => `/exam/listening/${targetId}`}
      renderTitle={(targetId, examLabel) => examLabel || `Série ${targetId}`}
      renderDetail={() => "39 questions · 35 min"}
    />
  );
}
