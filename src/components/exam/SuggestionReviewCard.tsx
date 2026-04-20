'use client';

import { Check, X, ArrowRight, Trash2 } from 'lucide-react';
import { Suggestion } from '@/lib/exam/writingReview';

export function SuggestionReviewCard({
  suggestion,
  onAccept,
  onReject,
  isProcessing,
}: {
  suggestion: Suggestion;
  onAccept: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  if (suggestion.status !== 'pending') return null;

  return (
    <div className="border rounded-md p-3 mb-2 bg-white shadow-sm transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2 flex-grow">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {suggestion.type === 'delete' ? (
              <span className="flex items-center text-red-600 bg-red-50 px-1.5 py-0.5 rounded gap-1">
                <Trash2 className="w-3 h-3" />
                Xóa: <span className="line-through">{suggestion.originalText}</span>
              </span>
            ) : suggestion.type === 'insert' ? (
              <span className="flex items-center text-green-600 bg-green-50 px-1.5 py-0.5 rounded gap-1">
                Thêm: <span>{suggestion.suggestedText}</span>
              </span>
            ) : (
              <>
                <span className="line-through text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                  {suggestion.originalText}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                  {suggestion.suggestedText}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 ml-4 shrink-0">
          <button
            className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
            onClick={onAccept}
            disabled={isProcessing}
            title="Chấp nhận"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
            onClick={onReject}
            disabled={isProcessing}
            title="Từ chối"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
