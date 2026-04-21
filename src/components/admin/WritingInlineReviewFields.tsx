'use client';

import type { ReactNode } from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Mark, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { SuggestionDeleteMark } from '@/lib/tiptap/SuggestionDeleteMark';
import { SuggestionInsertMark } from '@/lib/tiptap/SuggestionInsertMark';
import {
  applySuggestionToHtml,
  createSuggestion,
  generateSuggestionId,
  rejectSuggestionFromHtml,
} from '@/lib/exam/suggestions';
import type { Suggestion, ReviewMode, WritingTaskKey } from '@/lib/exam/writingReview';
import {
  acceptAllWritingAiSuggestions,
  generateWritingAiSuggestions,
  undoWritingAiSuggestion,
} from '@/app/actions/submission.actions';
import {
  Bold,
  Italic,
  List,
  RotateCcw,
  WandSparkles,
  Underline as UnderlineIcon,
  Undo2,
  Redo2,
  CheckCheck,
  Rewind,
  PenTool,
  Pencil,
  MessageSquarePlus,
  Eye,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────

interface WritingTaskReviewField {
  key: WritingTaskKey;
  label: string;
  originalHtml: string;
  initialHtml: string;
}

// ── Existing marks (editing mode) ────────────────────

const ReviewErrorMark = Mark.create({
  name: 'reviewError',

  parseHTML() {
    return [{ tag: 'span[data-review-error="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-review-error': 'true',
        style:
          'color:#dc2626;background:rgba(220,38,38,0.10);text-decoration:line-through;text-decoration-thickness:2px;border-radius:0.25rem;padding:0 0.12rem;font-weight:600;',
      }),
      0,
    ];
  },
});

const ReviewFixMark = Mark.create({
  name: 'reviewFix',

  parseHTML() {
    return [{ tag: 'span[data-review-fix="true"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-review-fix': 'true',
        style:
          'color:#166534;background:rgba(22,163,74,0.10);border-bottom:2px solid #16a34a;border-radius:0.25rem;padding:0 0.12rem;font-weight:700;',
      }),
      0,
    ];
  },
});

// ── Shared ToolbarButton ─────────────────────────────

function ToolbarButton({
  active,
  children,
  onClick,
  disabled,
  title,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        disabled
          ? 'pointer-events-none border-gray-100 bg-gray-50 text-gray-300'
          : active
            ? 'border-violet-300 bg-violet-100 text-violet-800'
            : 'border-gray-200 bg-white text-gray-600 hover:border-violet-200 hover:text-violet-700'
      }`}
    >
      {children}
    </button>
  );
}

// ── Mode Switcher ────────────────────────────────────

type EditorMode = 'editing' | 'suggesting' | 'viewing';

const MODE_TABS: { mode: EditorMode; icon: typeof Pencil; label: string; desc: string }[] = [
  { mode: 'editing', icon: Pencil, label: 'Chỉnh sửa', desc: 'Sửa trực tiếp trên bài' },
  { mode: 'suggesting', icon: MessageSquarePlus, label: 'Đề xuất', desc: 'Tạo đề xuất sửa cho học viên' },
  { mode: 'viewing', icon: Eye, label: 'Xem', desc: 'Xem trước kết quả' },
];

function ReviewModeSwitcher({
  mode,
  onModeChange,
  suggestionCount,
}: {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  suggestionCount: number;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
      {MODE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = mode === tab.mode;
        return (
          <button
            key={tab.mode}
            type="button"
            onClick={() => onModeChange(tab.mode)}
            title={tab.desc}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              isActive
                ? tab.mode === 'suggesting'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : tab.mode === 'viewing'
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-white hover:text-gray-700 hover:shadow-sm'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.mode === 'suggesting' && suggestionCount > 0 && (
              <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {suggestionCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Per-Task Editor ──────────────────────────────────

function WritingTaskReviewEditor({
  submissionId,
  field,
  onChange,
  onModeChange,
  onSuggestionsChange,
  initialSuggestions,
}: {
  submissionId: string;
  field: WritingTaskReviewField;
  onChange: (html: string) => void;
  onModeChange: (mode: EditorMode) => void;
  onSuggestionsChange: (suggestions: Suggestion[]) => void;
  initialSuggestions: Suggestion[];
}) {
  const [mode, setMode] = useState<EditorMode>('editing');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);
  const [isUndoingSuggestion, setIsUndoingSuggestion] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);

  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const suggestionsRef = useRef(suggestions);
  useEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  const updateSuggestions = useCallback(
    (newSuggestions: Suggestion[]) => {
      setSuggestions(newSuggestions);
      onSuggestionsChange(newSuggestions);
    },
    [onSuggestionsChange],
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      ReviewErrorMark,
      ReviewFixMark,
      SuggestionDeleteMark,
      SuggestionInsertMark,
    ],
    content: field.initialHtml,
    editable: true,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[220px] p-4 text-gray-900 leading-relaxed focus:outline-none',
      },
      handleKeyDown(view, event) {
        if (modeRef.current !== 'suggesting') return false;
        
        // Handle auto-delete track changes on Backspace/Delete
        if (event.key === 'Backspace' || event.key === 'Delete') {
          const { from, to, empty } = view.state.selection;
          if (!empty) {
            const originalText = view.state.doc.textBetween(from, to, ' ');
            const sgId = generateSuggestionId();
            
            const tr = view.state.tr;
            // mark selection as deleted
            tr.addMark(from, to, view.state.schema.marks.suggestionDelete.create({ suggestionId: sgId }));
            
            // move cursor to the end
            tr.setSelection(TextSelection.create(tr.doc, to));
            view.dispatch(tr);
            
            const newSg = createSuggestion('delete', originalText, '');
            newSg.id = sgId;
            setTimeout(() => {
              updateSuggestions([...suggestionsRef.current, newSg]);
            }, 0);
            
            return true;
          }
        }
        return false;
      },
      handleTextInput(view, from, to, text) {
        if (modeRef.current !== 'suggesting') return false;
        const deleteMarkType = view.state.schema.marks.suggestionDelete;
        
        // If they are typing inside an active Suggestion Insert mark, let ProseMirror handle it 
        // to extend the inclusive mark seamlessly.
        const activeMarks = view.state.doc.resolve(from).marks();
        if (activeMarks.some(m => m.type.name === 'suggestionInsert')) {
            return false;
        }

        // 1. selection replacement
        if (from !== to) {
          const originalText = view.state.doc.textBetween(from, to, ' ');
          const sgId = generateSuggestionId();
          
          const tr = view.state.tr;
          tr.addMark(from, to, view.state.schema.marks.suggestionDelete.create({ suggestionId: sgId }));
          tr.setSelection(TextSelection.create(tr.doc, to));
          
          const insertMark = view.state.schema.marks.suggestionInsert.create({ suggestionId: sgId });
          tr.setStoredMarks([]);
          tr.insertText(text, to, to);
          // Never let newly typed text inherit a delete mark.
          tr.removeMark(to, to + text.length, deleteMarkType);
          tr.addMark(to, to + text.length, insertMark);
          tr.setSelection(TextSelection.create(tr.doc, to + text.length));
          tr.addStoredMark(insertMark);
          
          view.dispatch(tr);
          
          const newSg = createSuggestion('replace', originalText, text);
          newSg.id = sgId;
          setTimeout(() => {
            updateSuggestions([...suggestionsRef.current, newSg]);
          }, 0);
          
          return true;
        }
        
        // 2. auto insert track changes
        if (from === to) {
          const sgId = generateSuggestionId();
          const tr = view.state.tr;
          
          const insertMark = view.state.schema.marks.suggestionInsert.create({ suggestionId: sgId });
          tr.setStoredMarks([]);
          tr.insertText(text, from, to);
          // Never let newly typed text inherit a delete mark.
          tr.removeMark(from, from + text.length, deleteMarkType);
          tr.addMark(from, from + text.length, insertMark);
          tr.setSelection(TextSelection.create(tr.doc, from + text.length));
          tr.addStoredMark(insertMark);
          
          view.dispatch(tr);
          
          const newSg = createSuggestion('insert', '', text);
          newSg.id = sgId;
          setTimeout(() => {
            updateSuggestions([...suggestionsRef.current, newSg]);
          }, 0);
          
          return true;
        }
        return false;
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
      
      if (modeRef.current === 'suggesting') {
          // Sync HTML texts into React suggestions state so UI card is always updated when inclusive marks grow
          const json = currentEditor.getJSON();
          const suggestionTexts: Record<string, string> = {};
          
          const walk = (node: any) => {
              if (node.text && node.marks) {
                  const insertMark = node.marks.find((m: any) => m.type === 'suggestionInsert');
                  if (insertMark && insertMark.attrs?.suggestionId) {
                      const id = insertMark.attrs.suggestionId;
                      suggestionTexts[id] = (suggestionTexts[id] || '') + node.text;
                  }
              }
              if (node.content) {
                  node.content.forEach(walk);
              }
          };
          walk(json);
          
          let hasChanges = false;
          const currentSuggestions = [...suggestionsRef.current];
          for (const sg of currentSuggestions) {
              if (sg.type === 'replace' || sg.type === 'insert') {
                  const currentTextInEditor = suggestionTexts[sg.id] || '';
                  if (currentTextInEditor !== sg.suggestedText) {
                      sg.suggestedText = currentTextInEditor;
                      hasChanges = true;
                  }
              }
          }
          
          if (hasChanges) {
             updateSuggestions(currentSuggestions);
          }
      }
    },
    immediatelyRender: false,
  });

  const getActiveSuggestionId = useCallback(() => {
    if (!editor) return null;
    const { from } = editor.state.selection;
    const marks = editor.state.doc.resolve(from).marks();
    const mark = marks.find(
      (item) => item.type.name === 'suggestionDelete' || item.type.name === 'suggestionInsert',
    );
    const suggestionId = mark?.attrs?.suggestionId;
    return typeof suggestionId === 'string' ? suggestionId : null;
  }, [editor]);

  const findTextRangeInEditor = useCallback(
    (needle: string): { from: number; to: number } | null => {
      if (!editor || !needle) return null;
      const doc = editor.state.doc;
      let found: { from: number; to: number } | null = null;

      doc.descendants((node, pos) => {
        if (found || !node.isText || !node.text) return;
        const idx = node.text.indexOf(needle);
        if (idx >= 0) {
          found = {
            from: pos + idx,
            to: pos + idx + needle.length,
          };
        }
      });

      return found;
    },
    [editor],
  );

  const applySuggestionToEditor = useCallback(
    (suggestion: Suggestion): boolean => {
      if (!editor) return false;
      const tr = editor.state.tr;
      const deleteMark = editor.state.schema.marks.suggestionDelete;
      const insertMark = editor.state.schema.marks.suggestionInsert.create({
        suggestionId: suggestion.id,
      });

      if (suggestion.type === 'insert') {
        const at = editor.state.selection.to;
        tr.insertText(suggestion.suggestedText, at, at);
        tr.addMark(at, at + suggestion.suggestedText.length, insertMark);
        tr.setSelection(TextSelection.create(tr.doc, at + suggestion.suggestedText.length));
        editor.view.dispatch(tr);
        return true;
      }

      const target = findTextRangeInEditor(suggestion.originalText);
      if (!target) return false;

      if (suggestion.type === 'delete') {
        tr.addMark(target.from, target.to, deleteMark.create({ suggestionId: suggestion.id }));
        tr.setSelection(TextSelection.create(tr.doc, target.to));
        editor.view.dispatch(tr);
        return true;
      }

      tr.addMark(target.from, target.to, deleteMark.create({ suggestionId: suggestion.id }));
      tr.insertText(suggestion.suggestedText, target.to, target.to);
      tr.addMark(target.to, target.to + suggestion.suggestedText.length, insertMark);
      tr.setSelection(TextSelection.create(tr.doc, target.to + suggestion.suggestedText.length));
      editor.view.dispatch(tr);
      return true;
    },
    [editor, findTextRangeInEditor],
  );

  // Update editable when mode changes
  const handleModeChange = useCallback(
    (newMode: EditorMode) => {
      const prevMode = modeRef.current;
      setMode(newMode);
      onModeChange(newMode);
      setActionError(null);
      if (editor) {
        // Leaving suggesting mode: clear transient marks so next typing in editing mode
        // doesn't inherit suggestion insert/delete styling.
        if (prevMode === 'suggesting' && newMode !== 'suggesting') {
          const tr = editor.state.tr.setStoredMarks([]);
          editor.view.dispatch(tr);
        }
        editor.setEditable(newMode !== 'viewing');
      }
    },
    [editor, onModeChange],
  );

  if (!editor) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-400">
        Đang tải trình chấm...
      </div>
    );
  }

  const resetToOriginal = () => {
    editor.commands.setContent(field.originalHtml);
    onChange(field.originalHtml);
    setActionError(null);
    updateSuggestions([]);
  };

  const handleRunAi = async () => {
    if (mode !== 'suggesting' || !editor) return;
    setIsAiRunning(true);
    setActionError(null);
    try {
      const result = await generateWritingAiSuggestions({
        submissionId,
        taskKey: field.key,
        taskHtml: editor.getHTML(),
      });

      const created: Suggestion[] = [];
      for (const suggestion of result.suggestions) {
        const applied = applySuggestionToEditor(suggestion);
        if (applied) {
          created.push(suggestion);
        }
      }

      if (created.length > 0) {
        updateSuggestions([...suggestionsRef.current, ...created]);
      } else {
        setActionError(result.message ?? 'AI chưa tìm thấy vị trí phù hợp để gắn đề xuất.');
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể gọi AI lúc này.');
    } finally {
      setIsAiRunning(false);
    }
  };

  const handleAcceptAll = async () => {
    if (!editor) return;
    const pending = suggestionsRef.current.filter((item) => item.status === 'pending');
    if (pending.length === 0) {
      setActionError('Không có đề xuất đang chờ để chấp nhận.');
      return;
    }

    setIsAcceptingAll(true);
    setActionError(null);
    try {
      let nextHtml = editor.getHTML();
      for (const item of pending) {
        nextHtml = applySuggestionToHtml(nextHtml, item.id);
      }

      editor.commands.setContent(nextHtml);
      updateSuggestions(
        suggestionsRef.current.map((item) =>
          item.status === 'pending' ? { ...item, status: 'accepted' } : item,
        ),
      );

      await acceptAllWritingAiSuggestions({
        submissionId,
        taskKey: field.key,
        suggestionIds: pending.map((item) => item.id),
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể chấp nhận toàn bộ đề xuất.');
    } finally {
      setIsAcceptingAll(false);
    }
  };

  const handleUndoCurrentSuggestion = async () => {
    if (!editor) return;
    const suggestionId = getActiveSuggestionId();
    if (!suggestionId) {
      setActionError('Đặt con trỏ vào đoạn đang được đề xuất rồi bấm Undo đề xuất.');
      return;
    }

    setIsUndoingSuggestion(true);
    setActionError(null);
    try {
      const nextHtml = rejectSuggestionFromHtml(editor.getHTML(), suggestionId);
      editor.commands.setContent(nextHtml);
      updateSuggestions(suggestionsRef.current.filter((item) => item.id !== suggestionId));
      await undoWritingAiSuggestion({
        submissionId,
        suggestionId,
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Không thể undo đề xuất này.');
    } finally {
      setIsUndoingSuggestion(false);
    }
  };

  // ── Render ──
  return (
    <div className="rounded-2xl border border-violet-200 bg-white shadow-sm">
      {/* Header: Mode Switcher + Reset */}
      <div className="flex flex-col gap-3 border-b border-violet-100 px-4 py-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold text-gray-800">{field.label}</p>
            <ReviewModeSwitcher
              mode={mode}
              onModeChange={handleModeChange}
              suggestionCount={suggestions.filter((s) => s.status === 'pending').length}
            />
          </div>
          <button
            type="button"
            onClick={resetToOriginal}
            className="inline-flex items-center gap-1 self-start rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:border-violet-200 hover:text-violet-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Khôi phục bài gốc
          </button>
        </div>

        {/* Mode description */}
        <p className="text-xs leading-relaxed text-gray-500">
          {mode === 'editing' && (
            <>
              Chỉnh sửa trực tiếp trên bài làm của học viên. Sử dụng thanh công cụ để bôi đậm, in nghiêng nếu cần thiết.
            </>
          )}
          {mode === 'suggesting' && (
            <>
              <span className="font-semibold text-emerald-700">Tự động đề xuất:</span> Bôi đen đoạn cần sửa rồi gõ phím trực tiếp! Hệ thống tự gạch bỏ <span className="text-red-600 line-through">bản cũ</span> và thêm <span className="font-semibold text-emerald-700 underline">bản mới</span> màu xanh lá bên cạnh để học viên duyệt.
            </>
          )}
          {mode === 'viewing' && 'Xem trước bài viết với tất cả đánh dấu. Không thể chỉnh sửa ở chế độ này.'}
        </p>

        {/* ── Editing Mode Toolbar ── */}
        {mode === 'editing' && (
          <>
            <div className="flex flex-wrap gap-2">
              <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                <Bold className="h-3.5 w-3.5" /> Đậm
              </ToolbarButton>
              <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                <Italic className="h-3.5 w-3.5" /> Nghiêng
              </ToolbarButton>
              <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                <UnderlineIcon className="h-3.5 w-3.5" /> Gạch chân
              </ToolbarButton>
              <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <List className="h-3.5 w-3.5" /> Gạch đầu dòng
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
                <Undo2 className="h-3.5 w-3.5" /> Undo
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
                <Redo2 className="h-3.5 w-3.5" /> Redo
              </ToolbarButton>
            </div>
          </>
        )}

        {/* ── Suggesting Mode Toolbar ── */}
        {mode === 'suggesting' && (
          <>
            <div className="flex flex-wrap gap-2">
              <ToolbarButton
                onClick={handleRunAi}
                disabled={isAiRunning}
                title="Sinh đề xuất tự động bằng Gemini"
              >
                <WandSparkles className="h-3.5 w-3.5" /> {isAiRunning ? 'Đang chạy AI...' : 'AI đề xuất'}
              </ToolbarButton>
              <ToolbarButton
                onClick={handleAcceptAll}
                disabled={isAcceptingAll}
                title="Chấp nhận tất cả đề xuất đang chờ"
              >
                <CheckCheck className="h-3.5 w-3.5" /> {isAcceptingAll ? 'Đang áp dụng...' : 'Accept all'}
              </ToolbarButton>
              <ToolbarButton
                onClick={handleUndoCurrentSuggestion}
                disabled={isUndoingSuggestion}
                title="Undo đề xuất tại vị trí con trỏ"
              >
                <Rewind className="h-3.5 w-3.5" /> {isUndoingSuggestion ? 'Đang hoàn tác...' : 'Undo đề xuất'}
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
                <Undo2 className="h-3.5 w-3.5" /> Undo
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
                <Redo2 className="h-3.5 w-3.5" /> Redo
              </ToolbarButton>
            </div>
          </>
        )}

        {/* ── Viewing Mode Info ── */}
        {mode === 'viewing' && (
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">
              👁️ Xem trước — đây là bản học viên sẽ thấy sau khi bạn submit chấm điểm.
            </p>
          </div>
        )}

        {actionError && (
          <p className="text-xs font-medium text-red-600">{actionError}</p>
        )}
      </div>

      <EditorContent
        editor={editor}
        className="bg-[#fffdf9]"
      />
    </div>
  );
}

// ── Main Component ───────────────────────────────────

export default function WritingInlineReviewFields({
  submissionId,
  fields,
  initialMode = 'editing',
  initialSuggestionsByTask,
}: {
  submissionId: string;
  fields: WritingTaskReviewField[];
  initialMode?: ReviewMode;
  initialSuggestionsByTask?: Partial<Record<WritingTaskKey, Suggestion[]>>;
}) {
  const [htmlByTask, setHtmlByTask] = useState<Record<WritingTaskKey, string>>(() => ({
    t1: fields.find((f) => f.key === 't1')?.initialHtml ?? '<p></p>',
    t2: fields.find((f) => f.key === 't2')?.initialHtml ?? '<p></p>',
    t3: fields.find((f) => f.key === 't3')?.initialHtml ?? '<p></p>',
  }));

  const [suggestionsByTask, setSuggestionsByTask] = useState<Record<WritingTaskKey, Suggestion[]>>(() => ({
    t1: initialSuggestionsByTask?.t1 ?? [],
    t2: initialSuggestionsByTask?.t2 ?? [],
    t3: initialSuggestionsByTask?.t3 ?? [],
  }));

  const [modeByTask, setModeByTask] = useState<Record<WritingTaskKey, EditorMode>>({
    t1: initialMode === 'suggesting' ? 'suggesting' : 'editing',
    t2: initialMode === 'suggesting' ? 'suggesting' : 'editing',
    t3: initialMode === 'suggesting' ? 'suggesting' : 'editing',
  });

  const reviewMode: ReviewMode =
    modeByTask.t1 === 'suggesting' || modeByTask.t2 === 'suggesting' || modeByTask.t3 === 'suggesting'
      ? 'suggesting'
      : 'editing';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-200 bg-violet-50/70 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-violet-900">
          <PenTool className="h-4 w-4" /> Chấm bài viết
        </p>
        <p className="mt-1 text-xs leading-relaxed text-violet-700">
          Chọn chế độ <span className="font-semibold">Chỉnh sửa</span> để sửa trực tiếp, hoặc{' '}
          <span className="font-semibold text-emerald-700">Đề xuất</span> để gợi ý sửa cho học viên tự quyết định.
        </p>
      </div>

      {fields.map((field) => (
        <div key={field.key}>
          <WritingTaskReviewEditor
            submissionId={submissionId}
            field={field}
            onChange={(html) => {
              setHtmlByTask((current) => ({
                ...current,
                [field.key]: html,
              }));
            }}
            onModeChange={(mode) => {
              setModeByTask((current) => ({
                ...current,
                [field.key]: mode,
              }));
            }}
            onSuggestionsChange={(sgs) => {
              setSuggestionsByTask((current) => ({
                ...current,
                [field.key]: sgs,
              }));
            }}
            initialSuggestions={initialSuggestionsByTask?.[field.key] ?? []}
          />
          <input type="hidden" name={`writing_review_${field.key}_html`} value={htmlByTask[field.key]} />
        </div>
      ))}

      {/* Hidden fields for mode and suggestions data */}
      <input type="hidden" name="writing_review_mode" value={reviewMode} />
      <input
        type="hidden"
        name="writing_review_suggestions"
        value={JSON.stringify(suggestionsByTask)}
      />

      {/* Summary message */}
      {(suggestionsByTask.t1.length > 0 || suggestionsByTask.t2.length > 0 || suggestionsByTask.t3.length > 0) && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm mt-4">
          <p className="text-sm font-semibold text-emerald-800">Tổng kết đề xuất</p>
          <ul className="text-xs text-emerald-700 mt-2 list-disc list-inside">
            {suggestionsByTask.t1.length > 0 && <li>Task 1: Đã tạo {suggestionsByTask.t1.length} đề xuất</li>}
            {suggestionsByTask.t2.length > 0 && <li>Task 2: Đã tạo {suggestionsByTask.t2.length} đề xuất</li>}
            {suggestionsByTask.t3.length > 0 && <li>Task 3: Đã tạo {suggestionsByTask.t3.length} đề xuất</li>}
          </ul>
          <p className="text-xs text-emerald-600 mt-2 italic">Lưu ý: Học viên sẽ cần tự duyệt từng đề xuất này.</p>
        </div>
      )}
    </div>
  );
}
