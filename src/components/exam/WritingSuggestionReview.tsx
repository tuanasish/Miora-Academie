'use client';

import { useState } from 'react';
import { CheckCheck, XSquare } from 'lucide-react';
import { 
  handleSuggestionResponse, 
  handleBulkSuggestionResponse 
} from '@/app/actions/submission.actions';
import { Suggestion, WritingTaskKey } from '@/lib/exam/writingReview';
import { SuggestionReviewCard } from './SuggestionReviewCard';

export function WritingSuggestionReview({
  submissionId,
  taskKey,
  initialHtml,
  initialSuggestions,
}: {
  submissionId: string;
  taskKey: WritingTaskKey;
  initialHtml: string;
  initialSuggestions: Suggestion[];
}) {
  const [html, setHtml] = useState(initialHtml);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending');

  const handleAccept = async (suggestionId: string) => {
    if (processingIds.has(suggestionId)) return;
    
    setProcessingIds((prev) => new Set(prev).add(suggestionId));
    
    // Optistic UI
    setSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, status: 'accepted' } : s)),
    );

    const res = await handleSuggestionResponse(submissionId, taskKey, suggestionId, 'accept');
    
    if ('error' in res) {
      window.alert(res.error);
      // Rollback
      setSuggestions(suggestions);
    } else {
      setHtml(res.newHtml);
    }
    
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(suggestionId);
      return next;
    });
  };

  const handleReject = async (suggestionId: string) => {
    if (processingIds.has(suggestionId)) return;
    
    setProcessingIds((prev) => new Set(prev).add(suggestionId));
    
    // Optistic UI
    setSuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, status: 'rejected' } : s)),
    );

    const res = await handleSuggestionResponse(submissionId, taskKey, suggestionId, 'reject');
    
    if ('error' in res) {
      window.alert(res.error);
      // Rollback
      setSuggestions(suggestions);
    } else {
      setHtml(res.newHtml);
    }
    
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(suggestionId);
      return next;
    });
  };

  const handleBulk = async (action: 'accept' | 'reject') => {
    if (isBulkProcessing) return;
    setIsBulkProcessing(true);

    const res = await handleBulkSuggestionResponse(submissionId, taskKey, action);
    
    if ('error' in res) {
      alert(res.error);
    } else {
      setHtml(res.newHtml);
      setSuggestions((prev) =>
        prev.map((s) => (s.status === 'pending' ? { ...s, status: action === 'accept' ? 'accepted' : 'rejected' } : s)),
      );
      // alert(action === 'accept' ? 'Đã chấp nhận tất cả' : 'Đã từ chối tất cả');
    }

    setIsBulkProcessing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cột trái: Bài viết hiển thị inline */}
      <div className="lg:col-span-2">
        <div className="bg-white border rounded-lg p-5 min-h-[300px]">
          <div
            className="tiptap prose prose-blue max-w-none 
              [&_span[data-suggestion-type='delete']]:line-through
              [&_span[data-suggestion-type='delete']]:text-red-500
              [&_span[data-suggestion-type='delete']]:bg-red-50
              [&_span[data-suggestion-type='delete']]:transition-opacity
              [&_span[data-suggestion-type='insert']]:underline 
              [&_span[data-suggestion-type='insert']]:decoration-green-500 
              [&_span[data-suggestion-type='insert']]:text-green-700
              [&_span[data-suggestion-type='insert']]:bg-green-50"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {/* Cột phải: Danh sách đề xuất */}
      <div className="bg-gray-50 border rounded-lg p-4 max-h-[600px] overflow-y-auto w-full">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 pb-2 z-10 border-b">
          <h3 className="font-medium text-sm text-gray-700">
            Có {pendingSuggestions.length} đề xuất sửa
          </h3>
          {pendingSuggestions.length > 0 && (
            <div className="flex gap-1">
              <button
                className="flex items-center bg-white border rounded px-2 h-7 text-xs hover:bg-gray-50"
                onClick={() => handleBulk('accept')}
                disabled={isBulkProcessing}
                title="Chấp nhận tất cả"
              >
                <CheckCheck className="w-3 h-3 text-green-600 mr-1" /> All
              </button>
              <button
                className="flex items-center bg-white border rounded px-2 h-7 text-xs hover:bg-gray-50"
                onClick={() => handleBulk('reject')}
                disabled={isBulkProcessing}
                title="Từ chối tất cả"
              >
                <XSquare className="w-3 h-3 text-red-500 mr-1" /> All
              </button>
            </div>
          )}
        </div>

        {pendingSuggestions.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            Không có đề xuất nào chờ xử lý.
          </div>
        ) : (
          <div className="flex flex-col gap-2 relative">
            {pendingSuggestions.map((s) => (
              <SuggestionReviewCard
                key={s.id}
                suggestion={s}
                onAccept={() => handleAccept(s.id)}
                onReject={() => handleReject(s.id)}
                isProcessing={processingIds.has(s.id) || isBulkProcessing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
