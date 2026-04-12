'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createAssignment, bulkCreateAssignments, type CreateAssignmentDTO, type StudentProfile } from '@/app/actions/assignment.actions';
import { toVietnamDeadlineIso, VIETNAM_TIME_ZONE_LABEL } from '@/lib/exam/deadline';
import {
  Headphones, BookOpen, PenLine, Mic, User, Users, AlertTriangle,
  CheckCircle, X, Loader2, CheckSquare,
} from 'lucide-react';

type ExamType = 'listening' | 'reading' | 'writing' | 'speaking';

interface ExamOption {
  value: number;
  label: string;
  group?: string;
}

interface AssignmentFormProps {
  students: StudentProfile[];
}

const EXAM_TYPES: { value: ExamType; label: string; Icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: 'listening', label: 'Compréhension Orale', Icon: Headphones, color: 'border-sky-400 bg-sky-50' },
  { value: 'reading', label: 'Compréhension Écrite', Icon: BookOpen, color: 'border-emerald-400 bg-emerald-50' },
  { value: 'writing', label: 'Expression Écrite', Icon: PenLine, color: 'border-violet-400 bg-violet-50' },
  { value: 'speaking', label: 'Expression Orale', Icon: Mic, color: 'border-rose-400 bg-rose-50' },
];

export function AssignmentForm({ students }: AssignmentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mode: single or bulk
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // Form state
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [examType, setExamType] = useState<ExamType | ''>('');
  const [targetId, setTargetId] = useState<number | ''>('');
  const [examLabel, setExamLabel] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');

  // Dynamic exam options
  const [examOptions, setExamOptions] = useState<ExamOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const prevExamTypeRef = useRef<ExamType | ''>('');

  // Pre-fill loại đề + nhãn từ URL (nút "Gán bài" từ ngân hàng đề)
  useEffect(() => {
    const paramType = searchParams.get('type') as ExamType | null;
    const paramLabel = searchParams.get('label');
    if (paramType) setExamType(paramType);
    if (paramLabel) setExamLabel(paramLabel);
  }, [searchParams]);

  // Đồng bộ bài cụ thể (serie / combinaison / partie) với URL; tránh race với effect tải options
  useEffect(() => {
    const urlType = searchParams.get('type') as ExamType | null;
    const rawId = searchParams.get('id');
    const parsed =
      rawId && rawId !== '' && !Number.isNaN(Number(rawId)) ? Number(rawId) : null;

    if (!examType) {
      prevExamTypeRef.current = '';
      return;
    }

    const typeChanged = prevExamTypeRef.current !== examType;
    prevExamTypeRef.current = examType;

    if (urlType === examType && parsed !== null) {
      setTargetId(parsed);
    } else if (typeChanged) {
      setTargetId('');
    }
  }, [examType, searchParams]);

  // Load exam options when exam type changes
  useEffect(() => {
    if (!examType) {
      setExamOptions([]);
      return;
    }

    setLoadingOptions(true);

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

  const toggleStudent = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const selectAll = () => {
    const studentEmails = students.filter((s) => s.role === 'student').map((s) => s.email);
    setSelectedEmails(studentEmails);
  };
  const deselectAll = () => setSelectedEmails([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!examType || targetId === '') {
      setError('Vui lòng chọn loại exam và bài cụ thể');
      return;
    }

    if (mode === 'single' && !studentEmail) {
      setError('Vui lòng chọn học viên');
      return;
    }
    if (mode === 'bulk' && selectedEmails.length === 0) {
      setError('Vui lòng chọn ít nhất 1 học viên');
      return;
    }

    setLoading(true);
    try {
      const examConfig: Omit<CreateAssignmentDTO, 'student_email'> = {
        exam_type: examType as ExamType,
        serie_id: (examType === 'listening' || examType === 'reading') ? Number(targetId) : null,
        combinaison_id: examType === 'writing' ? Number(targetId) : null,
        partie_id: examType === 'speaking' ? Number(targetId) : null,
        exam_label: examLabel || null,
        due_date: toVietnamDeadlineIso(dueDate),
        note: note || null,
      };

      if (mode === 'single') {
        await createAssignment({ ...examConfig, student_email: studentEmail });
        router.push('/admin/assignments');
      } else {
        const result = await bulkCreateAssignments(selectedEmails, examConfig);
        setSuccess(`Đã gán thành công cho ${result.success} học viên!`);
        setSelectedEmails([]);
      }
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

  const studentsList = students.filter((s) => s.role === 'student');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Mode toggle */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Chế độ gán</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              mode === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <User className="w-4 h-4" /> Gán 1 người
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
              mode === 'bulk'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4" /> Gán hàng loạt
          </button>
        </div>
      </div>

      {/* Step 1: Student selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          1. Học viên <span className="text-red-500">*</span>
        </label>

        {mode === 'single' ? (
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
                {s.role === 'admin' && ' (Admin)'}
              </option>
            ))}
          </select>
        ) : (
          <div>
            {/* Bulk controls */}
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={selectAll} className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1">
                <CheckSquare className="w-3 h-3" /> Chọn tất cả ({studentsList.length})
              </button>
              <button type="button" onClick={deselectAll} className="text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Bỏ chọn
              </button>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg self-center ml-auto">
                {selectedEmails.length} đã chọn
              </span>
            </div>

            {/* Student checkbox list */}
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {studentsList.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 text-center">Chưa có học viên nào</p>
              ) : (
                studentsList.map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-blue-50/50 transition-colors ${
                      selectedEmails.includes(s.email) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmails.includes(s.email)}
                      onChange={() => toggleStudent(s.email)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {s.full_name || s.email}
                      </p>
                      {s.full_name && <p className="text-xs text-gray-400">{s.email}</p>}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
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
              <et.Icon className="w-5 h-5" />
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
            4. Hạn nộp <span className="text-gray-400 font-normal">(tùy chọn, giờ Việt Nam {VIETNAM_TIME_ZONE_LABEL})</span>
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            step={60}
          />
          <p className="mt-1 text-xs text-gray-400">
            Deadline sẽ được lưu và hiển thị theo giờ Việt Nam ({VIETNAM_TIME_ZONE_LABEL}).
          </p>
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
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gán...</>
            : mode === 'single'
              ? <><CheckCircle className="w-4 h-4" /> Gán bài cho học viên</>
              : <><CheckCircle className="w-4 h-4" /> Gán cho {selectedEmails.length} học viên</>
          }
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
