'use client';
import { useState, useEffect } from 'react';
import { PenLine, ChevronDown, ChevronUp, FileText, BookCopy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface WritingSummary {
  id: number;
  titre: string;
  monthName: string;
  monthYear: number;
  orderIndex: number;
  tache3Titre: string;
}

interface WritingDetail {
  id: number;
  titre: string;
  monthName: string;
  monthYear: number;
  tache1Sujet: string;
  tache1Correction: string | null;
  tache2Sujet: string;
  tache2Correction: string | null;
  tache3Titre: string;
  tache3Document1: { contenu: string } | string | null;
  tache3Document2: { contenu: string } | string | null;
  tache3Correction: string | null;
}

const MONTH_ORDER = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

function monthIndex(name: string) {
  return MONTH_ORDER.findIndex((m) => name.startsWith(m));
}

function getDoc(v: { contenu: string } | string | null): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.contenu || '';
}

export default function AdminWritingBankPage() {
  const [items, setItems] = useState<WritingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<WritingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetch('/api/exam-data?type=writing')
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group by year → month
  const years = Array.from(new Set(items.map((i) => i.monthYear))).sort((a, b) => b - a);
  const months = selectedYear
    ? Array.from(new Set(items.filter((i) => i.monthYear === selectedYear).map((i) => i.monthName)))
        .sort((a, b) => monthIndex(a) - monthIndex(b))
    : [];
  const filtered = items.filter((i) => {
    if (selectedYear && i.monthYear !== selectedYear) return false;
    if (selectedMonth && i.monthName !== selectedMonth) return false;
    return true;
  });

  const loadDetail = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/exam-data?type=writing&id=${id}`);
      const data = await res.json();
      setDetail(data.item || null);
    } catch { setDetail(null); }
    setDetailLoading(false);
  };

  // Init year
  useEffect(() => {
    if (years.length > 0 && !selectedYear) setSelectedYear(years[0]);
  }, [years, selectedYear]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/admin/exams" className="hover:text-blue-600">Ngân hàng đề</Link>
          <span>/</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <PenLine className="w-6 h-6 text-violet-600" />
          Expression Écrite
        </h1>
        <p className="text-sm text-gray-500 mt-1">320 combinaisons · 3 tâches chacune · Corrections incluses</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Année:</label>
          <select
            value={selectedYear ?? ''}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); setSelectedMonth(null); setExpandedId(null); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white focus:ring-2 focus:ring-violet-300"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Mois:</label>
          <select
            value={selectedMonth ?? ''}
            onChange={(e) => { setSelectedMonth(e.target.value || null); setExpandedId(null); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white focus:ring-2 focus:ring-violet-300"
          >
            <option value="">Tous</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <span className="text-xs font-bold bg-violet-100 text-violet-700 px-3 py-1.5 rounded-full self-center">
          {filtered.length} combinaisons
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => loadDetail(item.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-violet-50/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-violet-100 text-violet-700 text-xs font-bold w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                      #{item.id}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{item.titre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.monthName} {item.monthYear}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/admin/assignments/new?type=writing&id=${item.id}&label=${encodeURIComponent(item.titre)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      Gán bài
                    </Link>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                    {detailLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="w-6 h-6 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
                      </div>
                    ) : detail ? (
                      <div className="space-y-5">
                        {/* Tâche 1 */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Tâche 1</span>
                            <span className="text-[10px] text-gray-400">60-120 mots</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 mb-2">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Sujet</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{detail.tache1Sujet}</p>
                          </div>
                          {detail.tache1Correction && (
                            <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                              <p className="text-xs font-bold text-violet-500 uppercase mb-1 flex items-center gap-1"><PenLine className="w-3 h-3" /> Correction modèle</p>
                              <p className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed">{detail.tache1Correction}</p>
                            </div>
                          )}
                        </div>

                        {/* Tâche 2 */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Tâche 2</span>
                            <span className="text-[10px] text-gray-400">120-150 mots</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 mb-2">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Sujet</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{detail.tache2Sujet}</p>
                          </div>
                          {detail.tache2Correction && (
                            <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                              <p className="text-xs font-bold text-violet-500 uppercase mb-1 flex items-center gap-1"><PenLine className="w-3 h-3" /> Correction modèle</p>
                              <p className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed">{detail.tache2Correction}</p>
                            </div>
                          )}
                        </div>

                        {/* Tâche 3 */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Tâche 3</span>
                            <span className="text-[10px] text-gray-400">120-180 mots</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 mb-2">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Titre</p>
                            <p className="text-sm font-semibold text-gray-700">{detail.tache3Titre}</p>
                          </div>
                          {/* Documents */}
                          {(getDoc(detail.tache3Document1) || getDoc(detail.tache3Document2)) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                              {getDoc(detail.tache3Document1) && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-xs font-bold text-blue-500 uppercase mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Document 1</p>
                                  <p className="text-xs text-blue-800 whitespace-pre-wrap leading-relaxed line-clamp-6">{getDoc(detail.tache3Document1)}</p>
                                </div>
                              )}
                              {getDoc(detail.tache3Document2) && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-xs font-bold text-blue-500 uppercase mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Document 2</p>
                                  <p className="text-xs text-blue-800 whitespace-pre-wrap leading-relaxed line-clamp-6">{getDoc(detail.tache3Document2)}</p>
                                </div>
                              )}
                            </div>
                          )}
                          {detail.tache3Correction && (
                            <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                              <p className="text-xs font-bold text-violet-500 uppercase mb-1 flex items-center gap-1"><PenLine className="w-3 h-3" /> Correction modèle</p>
                              <p className="text-sm text-violet-900 whitespace-pre-wrap leading-relaxed">{detail.tache3Correction}</p>
                            </div>
                          )}
                        </div>
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
