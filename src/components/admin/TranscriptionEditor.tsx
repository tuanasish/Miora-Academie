'use client';

import { useState, useEffect } from 'react';
import { FileText, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { upsertTranscription } from '@/app/actions/transcription.actions';

interface TranscriptionEditorProps {
  serieId: number;
  questionId: number;
  initialText: string;
  onSave?: (newText: string) => void;
}

export default function TranscriptionEditor({
  serieId,
  questionId,
  initialText,
  onSave,
}: TranscriptionEditorProps) {
  const [text, setText] = useState(initialText);

  // Sync internal state if initialText from parent changes
  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setLoading(true);
    setStatus('idle');
    try {
      const result = await upsertTranscription(serieId, questionId, text);
      if (result.success) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
        setIsEditing(false);
        if (onSave) onSave(text);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing && !text) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-2 rounded-lg border border-sky-100 transition-all hover:shadow-sm"
      >
        <FileText className="w-3.5 h-3.5" />
        Thêm lời thoại (Transcription)
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all">
      <div className="bg-gray-50/80 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transcription (Lời thoại)</span>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Chỉnh sửa
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setText(initialText);
                setIsEditing(false);
              }}
              disabled={loading}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-bold bg-sky-600 text-white px-3 py-1 rounded-md hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Lưu
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        {isEditing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập lời thoại của bài nghe tại đây..."
            className="w-full min-h-[120px] text-sm p-3 border border-sky-100 rounded-lg focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none transition-all"
            autoFocus
          />
        ) : (
          <div className="relative">
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed italic border-l-2 border-sky-200 pl-4 py-1">
              {text}
            </p>
            {status === 'success' && (
              <div className="absolute top-0 right-0 flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">
                <CheckCircle className="w-3 h-3" /> Đã lưu
              </div>
            )}
          </div>
        )}
        
        {status === 'error' && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Lỗi khi lưu. Vui lòng thử lại.
          </p>
        )}
      </div>
    </div>
  );
}
