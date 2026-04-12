import { readFile } from "fs/promises";
import path from "path";

import type { McqReviewQuestion } from "@/components/exam/McqSubmissionReview";

type ListeningJson = {
  data: {
    tests: { testNumber: number; questions: McqReviewQuestion[] }[];
  };
};

type ReadingJson = {
  data: { tests: { testNumber: number; questions: McqReviewQuestion[] }[] };
};

async function readListeningJson(): Promise<ListeningJson> {
  const p = path.join(process.cwd(), "public", "data", "listening.json");
  const raw = await readFile(p, "utf-8");
  return JSON.parse(raw) as ListeningJson;
}

async function readReadingJson(): Promise<ReadingJson> {
  const p = path.join(process.cwd(), "public", "data", "reading.json");
  const raw = await readFile(p, "utf-8");
  return JSON.parse(raw) as ReadingJson;
}

export async function getMcqQuestionsForSerie(
  examType: "listening" | "reading",
  serieId: number,
): Promise<McqReviewQuestion[] | null> {
  const json = examType === "listening" ? await readListeningJson() : await readReadingJson();
  const test = json.data.tests.find((t) => t.testNumber === serieId);
  if (!test) return null;
  return test.questions;
}
