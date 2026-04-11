'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createAssignment, type CreateAssignmentDTO, type StudentProfile } from '@/app/actions/assignment.actions';

type ExamType = 'listening' | 'reading' | 'writing' | 'speaking';

interface ExamOption {
  value: number;
  label: string;
  group?: string;
}

interface AssignmentFormProps {
  students: StudentProfile[];
}

const EXAM_TYPES: { value: ExamType; label: string; icon: string; color: string }[] = [
  { value: 'listening', label: 'Compréhension Orale', icon: '🎧', color: 'border-sky-400 bg-sky-50' },
  { value: 'reading', label: 'Compréhension Écrite', icon: '📖', color: 'border-emerald-400 bg-emerald-50' },
  { value: 'writing', label: 'Expression Écrite', icon: '✍️', color: 'border-violet-400 bg-violet-50' },
  { value: 'speaking', label: 'Expression Orale', icon: '🎙️', color: 'border-rose-400 bg-rose-50' },
];

export function AssignmentForm({ students }: AssignmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [studentEmail, setStudentEmail] = useState('');
  const [examType, setExamType] = useState<ExamType | ''>('');
  const [targetId, setTargetId] = useState<number | ''>('');
  const [examLabel, setExamLabel] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  // Dynamic exam options loaded from JSON
  const [examOptions, setExamOptions] = useState<ExamOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Load exam options when exam type changes
  useEffect(() => {
    if (!examType) {
      setExamOptions([]);
      setTargetId('');
      return;
    }

    setLoadingOptions(true);
    setTargetId('');

    if (examType === 'listening') {
      fetch('/data/listening.json')
        .then((r) => r.json())
        .then((json) => {
          const options: ExamOption[] = json.data.tests.map((t: { testNumber: number }) => ({
            value: t.testNumber,
            label: `Série ${t.testNumber}`,
          }));
          setExamOptions(options);
        })
        .catch(() => setExamOptions([]))
        .finally(() => setLoadingOptions(false));
    } else if (examType === 'reading') {
      fetch('/data/reading.json')
        .then((r) => r.json())
        .then((json) => {
          const options: ExamOption[] = json.data.tests.map((t: { testNumber: number }) => ({
            value: t.testNumber,
            label: `Série ${t.testNumber}`,
          }));
          setExamOptions(options);
        })
        .catch(() => setExamOptions([]))
        .finally(() => setLoadingOptions(false));
    } else if (examType === 'writing') {
      fetch('/data/writing.json')
        .then((r) => r.json())
        .then((json) => {
          const options: ExamOption[] = json.data.items.map((item: { id: number; titre: string; monthName: string }) => ({
            value: item.id,
            label: `${item.titre}`,
            group: item.monthName,
          }));
          setExamOptions(options);
        })
        .catch(() => setExamOptions([]))
        .finally(() => setLoadingOptions(false));
    } else if (examType === 'speaking') {
      fetch('/data/speaking.json')
        .then((r) => r.json())
        .then((json) => {
          const options: ExamOption[] = [];
          json.months.forEach((month: { name: string; parties: { id: number; titre: string }[] }) => {
            month.parties.forEach((partie) => {
              options.push({
                value: partie.id,
                label: partie.titre || `Partie ${partie.id}`,
                group: month.name,
              });
            });
          });
          setExamOptions(options);
        })
        .catch(() => setExamOptions([]))
        .finally(() => setLoadingOptions(false));
    }
  }, [examType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentEmail || !examType || targetId === '') {
      setError('Vui lòng điền đầy đủ: học viên, loại exam, và bài cụ thể');
      return;
    }

    setLoading(true);
    try {
      const dto: CreateAssignmentDTO = {
        student_email: studentEmail,
        exam_type: examType as ExamType,
        serie_id: (examType === 'listening' || examType === 'reading') ? Number(targetId) : null,
        combinaison_id: examType === 'writing' ? Number(targetId) : null,
        partie_id: examType === 'speaking' ? Number(targetId) : null,
        exam_label: examLabel || null,
        due_date: dueDate || null,
        note: note || null,
      };
      await createAssignment(dto);
      router.push('/admin/assignments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  // Group options by group name for writing/speaking
  const groupedOptions: Map<string, ExamOption[]> = new Map();
  examOptions.forEach((opt) => {
    const group = opt.group || '';
    if (!groupedOptions.has(group)) groupedOptions.set(group, []);
    groupedOptions.get(group)!.push(opt);
  });

  const hasGroups = examOptions.some((o) => o.group);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Step 1: Student */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          1. Học viên <span className="text-red-500">*</span>
        </label>
        <select
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          required
        >
          <option value="">— Chọn học viên —</option>
          {students.map((s) => (
            <option key={s.id} value={s.email}>
              {s.full_name ? `${s.full_name} (${s.email})` : s.email}
              {s.role === 'admin' && ' 👑'}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: Exam Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          2. Loại bài thi <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {EXAM_TYPES.map((et) => (
            <button
              key={et.value}
              type="button"
              onClick={() => setExamType(et.value)}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                examType === et.value
                  ? `${et.color} shadow-sm`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{et.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{et.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Specific Exam Item (Dynamic) */}
      {examType && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            3. Bài cụ thể <span className="text-red-500">*</span>
            {loadingOptions && <span className="text-gray-400 font-normal ml-2">Đang tải...</span>}
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            required
            disabled={loadingOptions}
          >
            <option value="">— Chọn bài —</option>
            {hasGroups
              ? Array.from(groupedOptions.entries()).map(([group, opts]) => (
                  <optgroup key={group} label={group}>
                    {opts.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              : examOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {examOptions.length} bài khả dụng
          </p>
        </div>
      )}

      {/* Step 4: Optional Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            4. Hạn nộp <span className="text-gray-400 font-normal">(tùy chọn)</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Tên hiển thị <span className="text-gray-400 font-normal">(tùy chọn)</span>
          </label>
          <input
            type="text"
            value={examLabel}
            onChange={(e) => setExamLabel(e.target.value)}
            placeholder="VD: Bài kiểm tra giữa kỳ"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Ghi chú <span className="text-gray-400 font-normal">(tùy chọn)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú cho học viên..."
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '⏳ Đang gán...' : '✅ Gán bài cho học viên'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/assignments')}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
