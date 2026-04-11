"use client";
import { AlertCircle, CheckCircle2, Flag, X } from "lucide-react";

interface Props {
  total: number;
  answeredCount: number;
  unansweredIndices: number[];
  flaggedIndices: number[];
  onConfirm: () => void;
  onCancel: () => void;
  onJumpTo: (idx: number) => void;
  submitting?: boolean;
}

export default function SubmitConfirmModal({
  total, answeredCount, unansweredIndices, flaggedIndices,
  onConfirm, onCancel, onJumpTo, submitting,
}: Props) {
  const allAnswered = unansweredIndices.length === 0;
  const hasFlags = flaggedIndices.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-[#faf8f5] rounded-2xl shadow-2xl border border-[#e4ddd1] max-w-md w-full p-6 modal-content">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {allAnswered ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
            )}
            <div>
              <h3 className="font-display font-bold text-[#3d3d3d]">Soumettre l&apos;examen ?</h3>
              <p className="text-sm text-[#888]">
                {answeredCount}/{total} questions répondues
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-[#888] hover:text-[#3d3d3d] transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[#ede8dd] rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-[#f05e23] rounded-full anim-bar-fill"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>

        {/* Unanswered warning */}
        {!allAnswered && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              ⚠️ {unansweredIndices.length} question{unansweredIndices.length > 1 ? "s" : ""} sans réponse :
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unansweredIndices.map((idx) => (
                <button
                  key={idx}
                  onClick={() => { onCancel(); onJumpTo(idx); }}
                  className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 transition-colors"
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Flagged questions */}
        {hasFlags && (
          <div className="bg-[#fffaf6] border border-[#e4ddd1] rounded-xl p-3 mb-3">
            <p className="text-sm font-semibold text-[#3d3d3d] mb-2 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-[#f05e23]" />
              {flaggedIndices.length} question{flaggedIndices.length > 1 ? "s" : ""} marquée{flaggedIndices.length > 1 ? "s" : ""} :
            </p>
            <div className="flex flex-wrap gap-1.5">
              {flaggedIndices.map((idx) => (
                <button
                  key={idx}
                  onClick={() => { onCancel(); onJumpTo(idx); }}
                  className="w-8 h-8 rounded-lg bg-[#f05e23]/10 text-[#f05e23] text-xs font-bold hover:bg-[#f05e23]/20 transition-colors"
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#e4ddd1] text-sm font-semibold text-[#5d5d5d] hover:bg-[#f3efe6] transition-colors"
          >
            Revérifier
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-[#f05e23] hover:bg-[#d85118] text-white text-sm font-bold transition-colors disabled:opacity-60"
          >
            {submitting ? "Envoi..." : "Soumettre ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
