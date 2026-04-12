'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Mark, mergeAttributes } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  AlertCircle,
  Bold,
  CircleOff,
  Italic,
  List,
  RotateCcw,
  Sparkles,
  Underline as UnderlineIcon,
  Undo2,
  Redo2,
  PenTool,
} from 'lucide-react';

type WritingTaskKey = 't1' | 't2' | 't3';

interface WritingTaskReviewField {
  key: WritingTaskKey;
  label: string;
  originalHtml: string;
  initialHtml: string;
}

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

function ToolbarButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-violet-300 bg-violet-100 text-violet-800'
          : 'border-gray-200 bg-white text-gray-600 hover:border-violet-200 hover:text-violet-700'
      }`}
    >
      {children}
    </button>
  );
}

function WritingTaskReviewEditor({
  field,
  onChange,
}: {
  field: WritingTaskReviewField;
  onChange: (html: string) => void;
}) {
  const [correctionText, setCorrectionText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Underline, ReviewErrorMark, ReviewFixMark],
    content: field.initialHtml,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[220px] p-4 text-gray-900 leading-relaxed focus:outline-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    immediatelyRender: false,
  });

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
    setCorrectionText('');
    setActionError(null);
  };

  const markSelectionAsError = () => {
    if (editor.state.selection.empty) {
      setActionError('Bôi đen phần học viên sai trước khi tô đỏ.');
      return;
    }

    setActionError(null);
    editor.chain().focus().setMark('reviewError').run();
  };

  const clearReviewMarks = () => {
    if (editor.state.selection.empty) {
      setActionError('Bôi đen đoạn cần bỏ đánh dấu trước khi xóa mark.');
      return;
    }

    setActionError(null);
    editor.chain().focus().unsetMark('reviewError').unsetMark('reviewFix').run();
  };

  const insertCorrectionInline = () => {
    const value = correctionText.trim();
    if (!value) {
      setActionError('Nhập nội dung sửa trước khi chèn cạnh bên.');
      return;
    }

    setActionError(null);

    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent([
          { type: 'text', text: ' ' },
          { type: 'text', text: value, marks: [{ type: 'reviewFix' }] },
        ])
        .run();
    } else {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        ' ',
      );

      editor
        .chain()
        .focus()
        .insertContent([
          { type: 'text', text: selectedText, marks: [{ type: 'reviewError' }] },
          { type: 'text', text: ' ' },
          { type: 'text', text: value, marks: [{ type: 'reviewFix' }] },
        ])
        .run();
    }

    setCorrectionText('');
  };

  return (
    <div className="rounded-2xl border border-violet-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-violet-100 px-4 py-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">{field.label} — Bản chấm trực tiếp</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Bôi đen đoạn sai rồi bấm <span className="font-semibold">Tô đỏ lỗi</span>. Nếu muốn sửa ngay bên cạnh,
              nhập bản đúng vào ô <span className="font-semibold">Sửa thành...</span> rồi bấm{' '}
              <span className="font-semibold">Chèn sửa cạnh bên</span>.
            </p>
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

        <div className="flex flex-wrap gap-2">
          <ToolbarButton active={editor.isActive('reviewError')} onClick={markSelectionAsError}>
            <AlertCircle className="h-3.5 w-3.5" /> Tô đỏ lỗi
          </ToolbarButton>
          <ToolbarButton onClick={clearReviewMarks}>
            <CircleOff className="h-3.5 w-3.5" /> Bỏ đánh dấu
          </ToolbarButton>
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

        <div className="flex flex-col gap-2 rounded-xl border border-violet-100 bg-[#fffaf5] p-3 lg:flex-row lg:items-center">
          <label className="text-xs font-semibold text-gray-600 lg:min-w-[82px]">Sửa thành...</label>
          <input
            type="text"
            value={correctionText}
            onChange={(event) => setCorrectionText(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            placeholder="Ví dụ: mes parents"
          />
          <button
            type="button"
            onClick={insertCorrectionInline}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
          >
            <Sparkles className="h-3.5 w-3.5" /> Chèn sửa cạnh bên
          </button>
        </div>

        {actionError && (
          <p className="text-xs font-medium text-red-600">{actionError}</p>
        )}
      </div>

      <EditorContent editor={editor} className="bg-[#fffdf9]" />
    </div>
  );
}

export default function WritingInlineReviewFields({
  fields,
}: {
  fields: WritingTaskReviewField[];
}) {
  const [htmlByTask, setHtmlByTask] = useState<Record<WritingTaskKey, string>>(() => ({
    t1: fields.find((field) => field.key === 't1')?.initialHtml ?? '<p></p>',
    t2: fields.find((field) => field.key === 't2')?.initialHtml ?? '<p></p>',
    t3: fields.find((field) => field.key === 't3')?.initialHtml ?? '<p></p>',
  }));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-violet-200 bg-violet-50/70 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-violet-900">
          <PenTool className="h-4 w-4" /> Chấm trực tiếp trên bài viết
        </p>
        <p className="mt-1 text-xs leading-relaxed text-violet-700">
          Người chấm có thể đánh dấu lỗi và sửa trực tiếp trên bản sao của bài làm. Bài gốc của học viên vẫn được giữ nguyên ở phần trên.
        </p>
      </div>

      {fields.map((field) => (
        <div key={field.key}>
          <WritingTaskReviewEditor
            field={field}
            onChange={(html) => {
              setHtmlByTask((current) => ({
                ...current,
                [field.key]: html,
              }));
            }}
          />
          <input type="hidden" name={`writing_review_${field.key}_html`} value={htmlByTask[field.key]} />
        </div>
      ))}
    </div>
  );
}
