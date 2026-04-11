import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "public", "data");

const VALID_TYPES = ["listening", "reading", "writing", "speaking"] as const;
type ExamType = (typeof VALID_TYPES)[number];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") as ExamType | null;

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type. Use: listening, reading, writing, speaking" }, { status: 400 });
  }

  try {
    const raw = await readFile(path.join(DATA_DIR, `${type}.json`), "utf-8");
    const json = JSON.parse(raw);

    // ── Listening / Reading: optionally filter by serie ──
    if (type === "listening" || type === "reading") {
      const serie = searchParams.get("serie");
      if (serie) {
        const test = json.data.tests.find((t: { testNumber: number }) => t.testNumber === Number(serie));
        if (!test) return NextResponse.json({ error: `Série ${serie} not found` }, { status: 404 });
        return NextResponse.json({ type, serie: Number(serie), questions: test.questions });
      }
      // Return summary only (no questions) for list view
      const summary = json.data.tests.map((t: { testNumber: number; slug?: string; questions: unknown[] }) => ({
        testNumber: t.testNumber,
        slug: t.slug,
        questionCount: t.questions.length,
      }));
      return NextResponse.json({ type, totalSeries: summary.length, series: summary });
    }

    // ── Writing: optionally filter by combinaison id ──
    if (type === "writing") {
      const id = searchParams.get("id");
      if (id) {
        const item = json.data.items.find((i: { id: number }) => i.id === Number(id));
        if (!item) return NextResponse.json({ error: `Combinaison ${id} not found` }, { status: 404 });
        return NextResponse.json({ type, item });
      }
      // Return summary
      const items = json.data.items.map((i: { id: number; titre: string; monthName: string; monthYear: number; orderIndex: number; tache3Titre: string }) => ({
        id: i.id, titre: i.titre, monthName: i.monthName, monthYear: i.monthYear,
        orderIndex: i.orderIndex, tache3Titre: i.tache3Titre,
      }));
      return NextResponse.json({ type, totalItems: json.data.totalItems, items });
    }

    // ── Speaking: optionally filter by partie id ──
    if (type === "speaking") {
      const partieId = searchParams.get("partie");
      if (partieId) {
        for (const month of json.months) {
          const partie = month.parties.find((p: { id: number }) => p.id === Number(partieId));
          if (partie) {
            return NextResponse.json({ type, month: month.name, year: month.year, partie });
          }
        }
        return NextResponse.json({ error: `Partie ${partieId} not found` }, { status: 404 });
      }
      // Return summary
      const months = json.months.map((m: { name: string; year: number; parties: { id: number; jour: number; date: string; sujets: unknown[] }[] }) => ({
        name: m.name, year: m.year,
        parties: m.parties.map((p) => ({
          id: p.id, jour: p.jour, date: p.date, sujetCount: p.sujets.length,
        })),
      }));
      return NextResponse.json({ type, totalMonths: months.length, months });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err) {
    console.error("[exam-data] Error:", err);
    return NextResponse.json({ error: "Failed to read exam data" }, { status: 500 });
  }
}
