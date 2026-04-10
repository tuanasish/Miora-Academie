"use client";
import { useState, useEffect } from "react";
import { PenLine, ChevronLeft, Play, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

interface WritingItem {
  id: number;
  titre: string;
  monthName: string;
  monthYear: number;
  orderIndex: number;
  tache3Titre: string;
}

interface WritingData {
  data: { totalItems: number; items: WritingItem[] };
}

interface MonthGroup {
  name: string;
  year: number;
  items: WritingItem[];
}

interface YearGroup {
  year: number;
  months: MonthGroup[];
  totalItems: number;
}

const MONTH_ORDER = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];

function monthIndex(name: string) {
  const shortName = name.split(" ")[0];
  return MONTH_ORDER.indexOf(shortName);
}

export default function WritingSelectionPage() {
  const [years, setYears] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthGroup | null>(null);

  useEffect(() => {
    fetch("/data/writing.json")
      .then((r) => r.json())
      .then((json: WritingData) => {
        // Group by year → month
        const yMap = new Map<number, Map<string, WritingItem[]>>();
        json.data.items.forEach((item) => {
          if (!yMap.has(item.monthYear)) yMap.set(item.monthYear, new Map());
          const mMap = yMap.get(item.monthYear)!;
          if (!mMap.has(item.monthName)) mMap.set(item.monthName, []);
          mMap.get(item.monthName)!.push(item);
        });

        const grouped: YearGroup[] = Array.from(yMap.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([year, mMap]) => {
            const months: MonthGroup[] = Array.from(mMap.entries())
              .sort((a, b) => monthIndex(a[0]) - monthIndex(b[0]))
              .map(([name, items]) => ({ name, year, items }));
            return {
              year,
              months,
              totalItems: months.reduce((s, m) => s + m.items.length, 0),
            };
          });

        setYears(grouped);
        if (grouped.length > 0) setSelectedYear(grouped[0].year);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const currentYear = years.find((y) => y.year === selectedYear);
  const totalAll = years.reduce((s, y) => s + y.totalItems, 0);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50">
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
          <PenLine className="w-5 h-5 text-violet-500" />
          <div>
            <h1 className="font-bold text-slate-900">Expression Écrite</h1>
            <p className="text-xs text-slate-400">
              {years.length} ans · {totalAll} combinaisons · 3 tâches · 60 min
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
                    ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600"
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
                const isSelected = selectedMonth?.name === month.name;
                return (
                  <button
                    key={month.name}
                    onClick={() => setSelectedMonth(isSelected ? null : month)}
                    className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-violet-500 bg-violet-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:shadow"
                    }`}
                  >
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-2 ${isSelected ? "text-violet-600" : "text-emerald-600"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-violet-500" : "bg-emerald-500"}`} />
                      {isSelected ? "Sélectionné" : "Disponible"}
                    </span>

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${isSelected ? "bg-violet-500" : "bg-violet-100 group-hover:bg-violet-200"} transition-colors`}>
                      <PenLine className={`w-5 h-5 ${isSelected ? "text-white" : "text-violet-600"}`} />
                    </div>

                    <p className="font-bold text-slate-900 text-sm leading-snug">{month.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {month.items.length} combinaisons
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── STEP 3: Combinaisons for selected month ── */}
        {selectedMonth && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">
                Combinaisons — <span className="text-violet-600">{selectedMonth.name}</span>
              </p>
              <span className="text-xs bg-violet-100 text-violet-600 font-semibold px-2 py-0.5 rounded-full">
                {selectedMonth.items.length} combinaisons
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedMonth.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/exam/writing/${item.id}`}
                  className="group bg-white border border-slate-200 hover:border-violet-300 hover:shadow-md rounded-2xl p-4 transition-all duration-200"
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-lg">
                      {item.titre}
                    </span>
                    <div className="flex gap-1">
                      <span className="w-5 h-5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded flex items-center justify-center">1</span>
                      <span className="w-5 h-5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded flex items-center justify-center">2</span>
                      <span className="w-5 h-5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded flex items-center justify-center">3</span>
                    </div>
                  </div>

                  {/* Sujet preview */}
                  {item.tache3Titre && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-3">
                      📝 {item.tache3Titre}
                    </p>
                  )}

                  {/* CTA */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-violet-600 group-hover:gap-3 transition-all">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Commencer · 60 min
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
