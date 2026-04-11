'use client';
import { useState, useEffect } from 'react';
import { Mic, ChevronDown, ChevronUp, MessageSquare, Lightbulb } from 'lucide-react';
import Link from 'next/link';

interface PartieSummary {
  id: number;
  jour: number;
  date: string;
  sujetCount: number;
}

interface MonthSummary {
  name: string;
  year: number;
  parties: PartieSummary[];
}

interface Sujet {
  id: number;
  tache: number;
  title: string;
  description: string | null;
  question: string | null;
  correction: {
    exemple?: string;
    conseils?: string;
    [key: string]: unknown;
  } | string | null;
}

interface PartieDetail {
  id: number;
  jour: number;
  date: string;
  sujets: Sujet[];
}

export default function AdminSpeakingBankPage() {
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [expandedPartie, setExpandedPartie] = useState<number | null>(null);
  const [partieDetail, setPartieDetail] = useState<PartieDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch('/api/exam-data?type=speaking')
      .then((r) => r.json())
      .then((data) => {
        setMonths(data.months || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const years = Array.from(new Set(months.map((m) => m.year))).sort((a, b) => b - a);
  const filteredMonths = months.filter((m) => {
    if (selectedYear && m.year !== selectedYear) return false;
    return true;
  });
  const currentMonthData = selectedMonth
    ? filteredMonths.find((m) => m.name === selectedMonth)
    : null;

  useEffect(() => {
    if (years.length > 0 && !selectedYear) setSelectedYear(years[0]);
  }, [years, selectedYear]);

  const loadPartie = async (id: number) => {
    if (expandedPartie === id) { setExpandedPartie(null); setPartieDetail(null); return; }
    setExpandedPartie(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/exam-data?type=speaking&partie=${id}`);
      const data = await res.json();
      setPartieDetail(data.partie || null);
    } catch { setPartieDetail(null); }
    setDetailLoading(false);
  };

  function getCorrection(c: Sujet['correction']): { exemple: string; conseils: string } {
    if (!c) return { exemple: '', conseils: '' };
    if (typeof c === 'string') return { exemple: c, conseils: '' };
    return { exemple: c.exemple || '', conseils: c.conseils || '' };
  }

  const allParties = selectedMonth && currentMonthData
    ? currentMonthData.parties
    : filteredMonths.flatMap((m) => m.parties.map((p) => ({ ...p, _monthName: m.name })));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/admin/exams" className="hover:text-blue-600">Ngân hàng đề</Link>
          <span>/</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Mic className="w-6 h-6 text-rose-600" />
          Expression Orale
        </h1>
        <p className="text-sm text-gray-500 mt-1">38 mois · 314 parties · Corrections et exemples inclus</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Année:</label>
          <select
            value={selectedYear ?? ''}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); setSelectedMonth(null); setExpandedPartie(null); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white focus:ring-2 focus:ring-rose-300"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Mois:</label>
          <select
            value={selectedMonth ?? ''}
            onChange={(e) => { setSelectedMonth(e.target.value || null); setExpandedPartie(null); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white focus:ring-2 focus:ring-rose-300"
          >
            <option value="">Tous</option>
            {filteredMonths.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
        </div>
        <span className="text-xs font-bold bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full self-center">
          {allParties.length} parties
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {allParties.map((p) => {
            const partieData = p as PartieSummary & { _monthName?: string };
            const isExpanded = expandedPartie === partieData.id;
            return (
              <div key={partieData.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => loadPartie(partieData.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-rose-50/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-100 text-rose-700 text-xs font-bold w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                      J{partieData.jour}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Partie {partieData.id}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {partieData.date}
                        {partieData._monthName && ` · ${partieData._monthName}`}
                        {' · '}{partieData.sujetCount} sujets
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/admin/assignments/new?type=speaking&id=${partieData.id}&label=${encodeURIComponent(`Partie ${partieData.id} · ${partieData.date}`)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      Gán bài
                    </Link>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                    {detailLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="w-6 h-6 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                      </div>
                    ) : partieDetail ? (
                      <div className="space-y-5">
                        {partieDetail.sujets.map((sujet) => {
                          const { exemple, conseils } = getCorrection(sujet.correction);
                          return (
                            <div key={sujet.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Tâche {sujet.tache}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-800 mb-2">{sujet.title}</p>
                              
                              {sujet.description && (
                                <div className="mb-2">
                                  <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Description</p>
                                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{sujet.description}</p>
                                </div>
                              )}

                              {sujet.question && (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-gray-400 uppercase mb-0.5">Question</p>
                                  <p className="text-sm text-gray-700 bg-white rounded-lg p-2 border border-gray-200">{sujet.question}</p>
                                </div>
                              )}

                              {/* Correction */}
                              {exemple && (
                                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-2">
                                  <p className="text-xs font-bold text-rose-500 uppercase mb-1 flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5" /> Exemple de réponse
                                  </p>
                                  <p className="text-sm text-rose-900 whitespace-pre-wrap leading-relaxed">{exemple}</p>
                                </div>
                              )}
                              {conseils && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                  <p className="text-xs font-bold text-amber-600 uppercase mb-1 flex items-center gap-1">
                                    <Lightbulb className="w-3.5 h-3.5" /> Conseils
                                  </p>
                                  <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{conseils}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Erreur lors du chargement</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
