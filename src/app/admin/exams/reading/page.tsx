'use client';
import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, HelpCircle, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: number;
  orderIndex: number;
  level: string;
  points: number;
  prompt: string;
  audioUrl: string | null;
  imageUrl: string | null;
  options: string[];
  correctAnswerIndex: number;
  explanation: string | null;
}

const LABELS = ['A', 'B', 'C', 'D'];

export default function AdminReadingBankPage() {
  const [selectedSerie, setSelectedSerie] = useState(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/exam-data?type=reading&serie=${selectedSerie}`)
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setLoading(false);
        setExpandedQ(null);
      })
      .catch(() => setLoading(false));
  }, [selectedSerie]);

  const levelStats = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.level] = (acc[q.level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/exams" className="hover:text-blue-600">Ngân hàng đề</Link>
            <span>/</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            Compréhension Écrite
          </h1>
          <p className="text-sm text-gray-500 mt-1">40 séries · 39 questions par série · 1 560 questions total</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <label className="text-sm font-medium text-gray-600">Série:</label>
          <select
            value={selectedSerie}
            onChange={(e) => setSelectedSerie(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold bg-white focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500"
          >
            {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>Série {n}</option>
            ))}
          </select>
          <Link
            href={`/admin/assignments/new?type=reading&id=${selectedSerie}&label=${encodeURIComponent(`Série ${selectedSerie}`)}`}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-full hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            Gán bài
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      {questions.length > 0 && (
        <div className="flex gap-3 mb-5 flex-wrap">
          <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
            {questions.length} questions
          </span>
          {Object.entries(levelStats).map(([level, count]) => (
            <span key={level} className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
              {level}: {count}
            </span>
          ))}
          <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full">
            Total: {questions.reduce((s, q) => s + q.points, 0)} pts
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[50px_60px_60px_1fr_50px_60px] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>#</span>
            <span>Level</span>
            <span>Pts</span>
            <span>Question</span>
            <span><ImageIcon className="w-4 h-4" /></span>
            <span>Rép.</span>
          </div>

          {/* Questions */}
          <div className="divide-y divide-gray-100">
            {questions.map((q, idx) => {
              const isExpanded = expandedQ === q.id;
              return (
                <div key={q.id}>
                  <button
                    onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                    className="w-full grid grid-cols-[50px_60px_60px_1fr_50px_60px] gap-2 px-4 py-3 hover:bg-emerald-50/50 transition-colors text-left items-center"
                  >
                    <span className="text-sm font-bold text-gray-400">{idx + 1}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-center ${
                      q.level.includes('A1') ? 'bg-green-100 text-green-700'
                      : q.level.includes('A2') ? 'bg-emerald-100 text-emerald-700'
                      : q.level.includes('B1') ? 'bg-sky-100 text-sky-700'
                      : q.level.includes('B2') ? 'bg-violet-100 text-violet-700'
                      : q.level.includes('C1') ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>{q.level}</span>
                    <span className="text-xs font-semibold text-gray-600">{q.points}pts</span>
                    <span className="text-sm text-gray-700 truncate">{q.prompt}</span>
                    <span>{q.imageUrl ? <ImageIcon className="w-4 h-4 text-violet-500" /> : <span className="text-gray-300">—</span>}</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-600">{LABELS[q.correctAnswerIndex]}</span>
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-5 pt-1 bg-emerald-50/30 border-t border-emerald-100">
                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Énoncé complet</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{q.prompt}</p>
                      </div>

                      {q.imageUrl && (
                        <div className="mb-3">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Image</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={q.imageUrl} alt="Question" className="max-w-md rounded-lg border border-gray-200" />
                        </div>
                      )}

                      <div className="mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Choix de réponse</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                i === q.correctAnswerIndex
                                  ? 'bg-emerald-100 border-2 border-emerald-300 font-semibold text-emerald-800'
                                  : 'bg-white border border-gray-200 text-gray-600'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                                i === q.correctAnswerIndex
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {LABELS[i]}
                              </span>
                              {opt}
                              {i === q.correctAnswerIndex && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" /> Explication
                        </p>
                        {q.explanation ? (
                          <p className="text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3">{q.explanation}</p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Aucune explication disponible</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setSelectedSerie(Math.max(1, selectedSerie - 1))}
          disabled={selectedSerie === 1}
          className="text-sm text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Série {selectedSerie - 1}
        </button>
        <span className="text-sm text-gray-400">Série {selectedSerie} / 40</span>
        <button
          onClick={() => setSelectedSerie(Math.min(40, selectedSerie + 1))}
          disabled={selectedSerie === 40}
          className="text-sm text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Série {selectedSerie + 1} →
        </button>
      </div>
    </div>
  );
}
