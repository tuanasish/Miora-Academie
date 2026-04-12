"use client";
import { useState, useEffect } from "react";
import { Mic, ChevronLeft, Play, Calendar, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Sujet {
  id: number;
  tache: number;
  title: string;
}

interface Partie {
  id: number;
  jour: number;
  date: string;
  sujets: Sujet[];
}

interface Month {
  name: string;
  slug: string;
  year: number;
  parties: Partie[];
}

interface SpeakingData {
  months: Month[];
}

interface YearGroup {
  year: number;
  months: Month[];
  totalParties: number;
}

const MONTH_ORDER = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];

function monthIndex(name: string) {
  const shortName = name.split(" ")[0];
  return MONTH_ORDER.indexOf(shortName);
}

export default function SpeakingSelectionPage() {
  const [years, setYears] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Month | null>(null);
  const [donePartieIds, setDonePartieIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      const { data: rows } = await supabase
        .from("exam_submissions")
        .select("partie_id")
        .eq("student_email", user.email)
        .eq("exam_type", "speaking")
        .not("partie_id", "is", null);
      const ids = new Set<number>();
      for (const r of rows ?? []) {
        if (r.partie_id != null) ids.add(r.partie_id);
      }
      setDonePartieIds(ids);
    })();
  }, []);

  useEffect(() => {
    fetch("/data/speaking.json")
      .then((r) => r.json())
      .then((json: SpeakingData) => {
        const yMap = new Map<number, Month[]>();
        json.months.forEach((m) => {
          if (!yMap.has(m.year)) yMap.set(m.year, []);
          yMap.get(m.year)!.push(m);
        });

        const grouped: YearGroup[] = Array.from(yMap.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([year, months]) => ({
            year,
            months: [...months].sort((a, b) => monthIndex(a.name) - monthIndex(b.name)),
            totalParties: months.reduce(
              (s, m) => s + m.parties.filter((p) => p.sujets.length > 0).length, 0
            ),
          }));

        setYears(grouped);
        if (grouped.length > 0) setSelectedYear(grouped[0].year);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentYear = years.find((y) => y.year === selectedYear);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />Retour
          </Link>
          <span className="text-slate-300">|</span>
          <Mic className="w-5 h-5 text-rose-500" />
          <div>
            <h1 className="font-bold text-slate-900">Expression Orale</h1>
            <p className="text-xs text-slate-400">
              {years.length} ans · {years.reduce((s, y) => s + y.totalParties, 0)} parties · Tâche 2 (2:00 + 3:30) + Tâche 3 (4:30)
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* ── STEP 1: Year tabs ── */}
        <section className="mb-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-3">
            <Calendar className="w-4 h-4" />
            Sélectionnez une année
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {years.map((yg) => (
              <button
                key={yg.year}
                onClick={() => { setSelectedYear(yg.year); setSelectedMonth(null); }}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  selectedYear === yg.year
                    ? "bg-rose-600 text-white shadow-md shadow-rose-200"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600"
                }`}
              >
                {yg.year}
              </button>
            ))}
          </div>
        </section>

        {/* ── STEP 2: Month grid ── */}
        {currentYear && (
          <section className="mb-8">
            <p className="text-sm font-semibold text-slate-500 mb-3">
              Sélectionnez un mois
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentYear.months.map((month) => {
                const validParties = month.parties.filter((p) => p.sujets.length > 0);
                if (validParties.length === 0) return null;
                const isSelected = selectedMonth?.name === month.name;
                return (
                  <button
                    key={month.name}
                    onClick={() => setSelectedMonth(isSelected ? null : month)}
                    className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-rose-500 bg-rose-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-rose-300 hover:shadow"
                    }`}
                  >
                    {/* Disponible dot */}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-2 ${isSelected ? "text-rose-600" : "text-emerald-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-rose-500" : "bg-emerald-500"}`} />
                      {isSelected ? "Sélectionné" : "Disponible"}
                    </span>

                    {/* Calendar icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${isSelected ? "bg-rose-500" : "bg-rose-100 group-hover:bg-rose-200"} transition-colors`}>
                      <Calendar className={`w-5 h-5 ${isSelected ? "text-white" : "text-rose-600"}`} />
                    </div>

                    <p className="font-bold text-slate-900 text-sm leading-snug">{month.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {validParties.length} parties
                    </p>
                    {validParties.some((p) => donePartieIds.has(p.id)) && (
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        {validParties.filter((p) => donePartieIds.has(p.id)).length} đã nộp
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── STEP 3: Parties for selected month ── */}
        {selectedMonth && (() => {
          const validParties = selectedMonth.parties.filter((p) => p.sujets.length > 0);
          return (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-700">
                  Parties — <span className="text-rose-600">{selectedMonth.name}</span>
                </p>
                <span className="text-xs bg-rose-100 text-rose-600 font-semibold px-2 py-0.5 rounded-full">
                  {validParties.length} parties
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {validParties.map((partie) => {
                  const t2 = partie.sujets.find((s) => s.tache === 2);
                  const t3 = partie.sujets.find((s) => s.tache === 3);
                  const done = donePartieIds.has(partie.id);
                  return (
                    <Link
                      key={partie.id}
                      href={`/exam/speaking/${partie.id}`}
                      className={`group rounded-2xl p-4 transition-all duration-200 border-2 ${
                        done
                          ? "bg-emerald-50/80 border-emerald-200 hover:border-emerald-300 hover:shadow-md"
                          : "bg-white border-slate-200 hover:border-rose-300 hover:shadow-md"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-xl text-sm font-black flex items-center justify-center ${
                            done ? "bg-emerald-200 text-emerald-800" : "bg-rose-100 text-rose-700"
                          }`}>
                            {partie.jour}
                          </span>
                          <span className="text-sm font-bold text-slate-700">Jour {partie.jour}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {done && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-white/80 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Đã nộp
                            </span>
                          )}
                          <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-lg">2:00 + 3:30</span>
                          <span className="text-xs text-slate-300">+</span>
                          <span className="text-xs bg-orange-50 text-orange-600 font-semibold px-2 py-0.5 rounded-lg">4:30</span>
                        </div>
                      </div>

                      {/* T2 */}
                      {t2 && (
                        <div className="mb-2.5">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-4 h-4 rounded bg-blue-500 text-white text-[10px] font-black flex items-center justify-center">2</span>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Tâche 2</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 pl-5">{t2.title}</p>
                        </div>
                      )}

                      {/* T3 */}
                      {t3 && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-4 h-4 rounded bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">3</span>
                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">Tâche 3</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 pl-5">{t3.title}</p>
                        </div>
                      )}

                      {/* CTA */}
                      <div className={`mt-3 pt-3 border-t flex items-center gap-1.5 text-xs font-semibold group-hover:gap-3 transition-all ${
                        done ? "border-emerald-100 text-emerald-700" : "border-slate-100 text-rose-600"
                      }`}>
                        {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        {done ? "Xem lại / làm lại" : "Commencer"}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })()}
      </main>
    </div>
  );
}
