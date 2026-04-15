'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createAssignment,
  bulkCreateMultiExamAssignments,
  createTeacherAssignment,
  bulkCreateMultiExamTeacherAssignments,
  getAlreadyAssignedExamKeysForRecipients,
  type CreateAssignmentDTO,
  type StudentProfile,
} from '@/app/actions/assignment.actions';
import { assignmentExamKey } from '@/lib/exam/assignmentKeys';
import {
  toVietnamDeadlineIso,
  VIETNAM_TIME_ZONE_LABEL,
  getNowVietnamLocalInput,
  isDueDateOverdue,
} from '@/lib/exam/deadline';
import {
  Headphones, BookOpen, PenLine, Mic, User, Users, AlertTriangle,
  CheckCircle, X, Loader2, CheckSquare, Plus, Trash2, ShoppingCart,
  ChevronDown,
} from 'lucide-react';

/* ───────── Types ───────── */
type ExamType = 'listening' | 'reading' | 'writing' | 'speaking';

interface ExamOption {
  value: number;
  label: string;
  group?: string;
}

interface CartItem {
  id: string; // unique key for React
  examType: ExamType;
  targetId: number;
  examLabel: string;
  /** Human-readable summary for display */
  displayLabel: string;
  /** Ghi chú riêng cho từng bài (vd: làm câu 1–20) */
  note: string;
}

interface AssignmentFormProps {
  students: StudentProfile[];
  scope?: 'admin' | 'teacher';
  cancelHref?: string;
}

/* ───────── Constants ───────── */
const EXAM_TYPES: { value: ExamType; label: string; Icon: React.ComponentType<{ className?: string }>; color: string; activeColor: string }[] = [
  { value: 'listening', label: 'Compréhension Orale', Icon: Headphones, color: 'border-gray-200 bg-white hover:border-sky-300', activeColor: 'border-sky-400 bg-sky-50 ring-2 ring-sky-200' },
  { value: 'reading', label: 'Compréhension Écrite', Icon: BookOpen, color: 'border-gray-200 bg-white hover:border-emerald-300', activeColor: 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200' },
  { value: 'writing', label: 'Expression Écrite', Icon: PenLine, color: 'border-gray-200 bg-white hover:border-violet-300', activeColor: 'border-violet-400 bg-violet-50 ring-2 ring-violet-200' },
  { value: 'speaking', label: 'Expression Orale', Icon: Mic, color: 'border-gray-200 bg-white hover:border-rose-300', activeColor: 'border-rose-400 bg-rose-50 ring-2 ring-rose-200' },
];

const EXAM_TYPE_LABEL_MAP: Record<ExamType, string> = {
  listening: 'Compréhension Orale',
  reading: 'Compréhension Écrite',
  writing: 'Expression Écrite',
  speaking: 'Expression Orale',
};

const EXAM_TYPE_ICON_MAP: Record<ExamType, React.ComponentType<{ className?: string }>> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenLine,
  speaking: Mic,
};

let _cartIdCounter = 0;
function nextCartId() {
  return `cart-${++_cartIdCounter}-${Date.now()}`;
}

/* ───────── Component ───────── */
export function AssignmentForm({
  students,
  scope = 'admin',
  cancelHref,
}: AssignmentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const listHref = scope === 'teacher' ? '/teacher/assignments' : '/admin/assignments';

  // Mode: single or bulk
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // Student selection
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Current exam picker state (used to build items for cart)
  const [examType, setExamType] = useState<ExamType | ''>('');
  const [targetId, setTargetId] = useState<number | ''>('');
  const [examOptions, setExamOptions] = useState<ExamOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Cart – stores multiple exam items
  const [cart, setCart] = useState<CartItem[]>([]);

  // Shared fields
  const [examLabel, setExamLabel] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueDateWarning, setDueDateWarning] = useState('');
  /** Ghi chú khi chỉ chọn 1 bài trực tiếp (chưa thêm vào giỏ) */
  const [pendingNote, setPendingNote] = useState('');

  const [assignedExamKeys, setAssignedExamKeys] = useState<string[]>([]);
  const [loadingAssignedKeys, setLoadingAssignedKeys] = useState(false);

  const prevExamTypeRef = useRef<ExamType | ''>('');
  const [examPickerOpen, setExamPickerOpen] = useState(false);
  const examPickerWrapRef = useRef<HTMLDivElement>(null);

  /* ───────── URL pre-fill ───────── */
  useEffect(() => {
    const paramType = searchParams.get('type') as ExamType | null;
    const paramLabel = searchParams.get('label');
    if (paramType) setExamType(paramType);
    if (paramLabel) setExamLabel(paramLabel);
  }, [searchParams]);

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

  /* ───────── Load exam options ───────── */
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

  /* ───────── Khóa bài đã gán ───────── */
  const recipientEmailsKey =
    mode === 'single'
      ? studentEmail.trim().toLowerCase()
      : [...selectedEmails].sort().join('\0');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const emails =
        mode === 'single'
          ? studentEmail.trim()
            ? [studentEmail.trim().toLowerCase()]
            : []
          : selectedEmails.map((e) => e.trim().toLowerCase()).filter(Boolean);
      if (emails.length === 0) {
        setAssignedExamKeys([]);
        return;
      }
      setLoadingAssignedKeys(true);
      try {
        const keys = await getAlreadyAssignedExamKeysForRecipients(emails);
        if (!cancelled) setAssignedExamKeys(keys);
      } catch {
        if (!cancelled) setAssignedExamKeys([]);
      } finally {
        if (!cancelled) setLoadingAssignedKeys(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [mode, recipientEmailsKey]);

  const isExamAlreadyAssigned = useCallback(
    (et: ExamType, targetNum: number) => assignedExamKeys.includes(assignmentExamKey(et, targetNum)),
    [assignedExamKeys],
  );

  useEffect(() => {
    if (!examType || targetId === '') return;
    if (isExamAlreadyAssigned(examType as ExamType, Number(targetId))) {
      setTargetId('');
    }
  }, [examType, targetId, assignedExamKeys, isExamAlreadyAssigned]);

  useEffect(() => {
    if (!examPickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (examPickerWrapRef.current && !examPickerWrapRef.current.contains(e.target as Node)) {
        setExamPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [examPickerOpen]);

  useEffect(() => {
    const taken = new Set(assignedExamKeys);
    setCart((prev) =>
      prev.filter((item) => !taken.has(assignmentExamKey(item.examType, item.targetId))),
    );
  }, [assignedExamKeys]);

  /* ───────── Due Date Validation ───────── */
  const handleDueDateChange = useCallback((value: string) => {
    if (!value) {
      setDueDate('');
      setDueDateWarning('');
      return;
    }
    // Check if the chosen time is in the past
    if (isDueDateOverdue(value)) {
      const snapped = getNowVietnamLocalInput(60); // +1 hour
      setDueDate(snapped);
      setDueDateWarning('Thời gian hạn nộp không hợp lệ (nằm trong quá khứ). Hệ thống đã tự động điều chỉnh về thời điểm hiện tại +1 giờ.');
    } else {
      setDueDate(value);
      setDueDateWarning('');
    }
  }, []);

  /* ───────── Student toggles ───────── */
  const toggleStudent = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const studentsList = students.filter((s) => s.role === 'student');
  const selectAll = () => setSelectedEmails(studentsList.map((s) => s.email));
  const deselectAll = () => setSelectedEmails([]);

  /* ───────── Cart actions ───────── */
  const addToCart = () => {
    if (!examType || targetId === '') return;

    if (isExamAlreadyAssigned(examType as ExamType, Number(targetId))) {
      setError('Bài này đã được gán cho học viên đã chọn.');
      return;
    }

    // Prevent duplicates
    const alreadyExists = cart.some(
      (item) => item.examType === examType && item.targetId === Number(targetId)
    );
    if (alreadyExists) {
      setError('Bài thi này đã có trong danh sách gán.');
      return;
    }

    const selectedOption = examOptions.find((o) => o.value === Number(targetId));
    const displayLabel = `${EXAM_TYPE_LABEL_MAP[examType]} – ${selectedOption?.label ?? `#${targetId}`}`;

    setCart((prev) => [
      ...prev,
      {
        id: nextCartId(),
        examType: examType as ExamType,
        targetId: Number(targetId),
        examLabel: examLabel || '',
        displayLabel,
        note: pendingNote,
      },
    ]);

    // Reset picker for next selection
    setExamType('');
    setTargetId('');
    setPendingNote('');
    setError('');
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCartItemNote = (id: string, value: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note: value } : item)),
    );
  };

  /* ───────── Submit ───────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate: must have at least 1 exam (either in cart or currently selected)
    const finalCart = [...cart];
    // If user has a current selection but hasn't added to cart, add it automatically
    if (examType && targetId !== '') {
      const alreadyExists = finalCart.some(
        (item) => item.examType === examType && item.targetId === Number(targetId)
      );
      if (!alreadyExists) {
        const selectedOption = examOptions.find((o) => o.value === Number(targetId));
        finalCart.push({
          id: nextCartId(),
          examType: examType as ExamType,
          targetId: Number(targetId),
          examLabel: examLabel || '',
          displayLabel: `${EXAM_TYPE_LABEL_MAP[examType as ExamType]} – ${selectedOption?.label ?? `#${targetId}`}`,
          note: pendingNote,
        });
      }
    }

    if (finalCart.length === 0) {
      setError('Vui lòng chọn ít nhất 1 bài thi để gán.');
      return;
    }

    const taken = new Set(assignedExamKeys);
    const conflict = finalCart.find((item) => taken.has(assignmentExamKey(item.examType, item.targetId)));
    if (conflict) {
      setError(`Bài "${conflict.displayLabel}" trùng với bài đã gán.`);
      return;
    }

    if (mode === 'single' && !studentEmail) {
      setError('Vui lòng chọn học viên.');
      return;
    }
    if (mode === 'bulk' && selectedEmails.length === 0) {
      setError('Vui lòng chọn ít nhất 1 học viên.');
      return;
    }

    setLoading(true);
    try {
      const examConfigs = finalCart.map((item) => ({
        exam_type: item.examType as ExamType,
        serie_id: (item.examType === 'listening' || item.examType === 'reading') ? item.targetId : null,
        combinaison_id: item.examType === 'writing' ? item.targetId : null,
        partie_id: item.examType === 'speaking' ? item.targetId : null,
        exam_label: item.examLabel || examLabel || null,
        due_date: toVietnamDeadlineIso(dueDate),
        note: item.note.trim() ? item.note.trim() : null,
      }));

      const emails = mode === 'single' ? [studentEmail] : selectedEmails;

      if (finalCart.length === 1) {
        // Single exam → use original simple actions
        const config = examConfigs[0];
        if (mode === 'single') {
          if (scope === 'teacher') {
            await createTeacherAssignment({ ...config, student_email: studentEmail });
          } else {
            await createAssignment({ ...config, student_email: studentEmail });
          }
        } else {
          // Bulk students, 1 exam
          if (scope === 'teacher') {
            const { bulkCreateTeacherAssignments } = await import('@/app/actions/assignment.actions');
            await bulkCreateTeacherAssignments(emails, config);
          } else {
            const { bulkCreateAssignments } = await import('@/app/actions/assignment.actions');
            await bulkCreateAssignments(emails, config);
          }
        }
      } else {
        // Multiple exams → use multi-exam actions
        if (scope === 'teacher') {
          await bulkCreateMultiExamTeacherAssignments(emails, examConfigs);
        } else {
          await bulkCreateMultiExamAssignments(emails, examConfigs);
        }
      }

      const totalAssignments = finalCart.length * emails.length;
      setSuccess(
        `Đã gán thành công ${finalCart.length} bài thi cho ${emails.length} học viên (${totalAssignments} lượt gán).`
      );
      // Reset form
      setCart([]);
      setExamType('');
      setTargetId('');
      setExamLabel('');
      setPendingNote('');
      if (mode === 'single') {
        // Navigate back for single mode
        setTimeout(() => router.push(listHref), 1500);
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Lỗi không xác định';
      // Map known DB errors → friendly messages
      if (raw.includes('duplicate key') || raw.includes('unique constraint')) {
        setError('Bài thi này đã được gán trùng.');
      } else {
        setError(raw);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ───────── Grouped options ───────── */
  const groupedOptions: Map<string, ExamOption[]> = new Map();
  examOptions.forEach((opt) => {
    const group = opt.group || '';
    if (!groupedOptions.has(group)) groupedOptions.set(group, []);
    groupedOptions.get(group)!.push(opt);
  });
  const hasGroups = examOptions.some((o) => o.group);

  const currentPickerBlocked =
    Boolean(examType) &&
    targetId !== '' &&
    isExamAlreadyAssigned(examType as ExamType, Number(targetId));

  /* ───────── Render ───────── */
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* ─── Mode toggle ─── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Chế độ gán</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
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

      {/* ─── Step 1: Student selection ─── */}
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

      {/* ─── Step 2: Exam picker + Add to Cart ─── */}
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 space-y-4">
        <label className="block text-sm font-semibold text-gray-700">
          2. Chọn bài thi <span className="text-red-500">*</span>
        </label>

        {/* Exam type grid */}
        <div className="grid grid-cols-2 gap-3">
          {EXAM_TYPES.map((et) => (
            <button
              key={et.value}
              type="button"
              onClick={() => {
                setExamType(et.value);
                setExamPickerOpen(false);
              }}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                examType === et.value ? et.activeColor : et.color
              }`}
            >
              <et.Icon className="w-5 h-5" />
              <span className="text-sm font-semibold text-gray-800">{et.label}</span>
            </button>
          ))}
        </div>

        {/* Bài cụ thể — dropdown nổi (giống select native) */}
        {examType && (
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Bài cụ thể
              {loadingOptions && <span className="text-gray-400 font-normal ml-2">Đang tải...</span>}
            </label>
            {loadingOptions || loadingAssignedKeys ? (
              <p className="text-sm text-gray-400 py-3">Đang tải…</p>
            ) : (
              <div ref={examPickerWrapRef} className="relative">
                <button
                  type="button"
                  id="assignment-exam-target-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={examPickerOpen}
                  onClick={() => setExamPickerOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:border-gray-400 hover:bg-gray-50/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <span
                    className={
                      targetId === ''
                        ? 'text-gray-400'
                        : 'truncate font-medium text-gray-900'
                    }
                  >
                    {targetId === ''
                      ? '— Chọn bài —'
                      : examOptions.find((o) => o.value === Number(targetId))?.label ?? `#${targetId}`}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${examPickerOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>

                {examPickerOpen && (
                  <div
                    className="absolute left-0 right-0 z-[100] mt-1 max-h-[min(28rem,60vh)] overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl ring-1 ring-black/10"
                    role="listbox"
                    aria-labelledby="assignment-exam-target-trigger"
                  >
                    {hasGroups
                      ? Array.from(groupedOptions.entries()).map(([group, opts]) => (
                          <div key={group}>
                            <div className="sticky top-0 z-[1] bg-gray-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                              {group}
                            </div>
                            {opts.map((opt) => {
                              const blocked = isExamAlreadyAssigned(examType as ExamType, opt.value);
                              const selected = targetId !== '' && Number(targetId) === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  disabled={blocked}
                                  role="option"
                                  aria-selected={selected}
                                  onClick={() => {
                                    if (blocked) return;
                                    setTargetId(opt.value);
                                    setExamPickerOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                                    blocked
                                      ? 'cursor-not-allowed bg-gray-50 text-gray-400 opacity-60'
                                      : selected
                                        ? 'bg-blue-50 font-semibold text-blue-900'
                                        : 'text-gray-800 hover:bg-gray-50'
                                  }`}
                                >
                                  <span className="min-w-0 truncate">{opt.label}</span>
                                  {blocked ? (
                                    <span className="shrink-0 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                                      Đã gán
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        ))
                      : examOptions.map((opt) => {
                          const blocked = isExamAlreadyAssigned(examType as ExamType, opt.value);
                          const selected = targetId !== '' && Number(targetId) === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={blocked}
                              role="option"
                              aria-selected={selected}
                              onClick={() => {
                                if (blocked) return;
                                setTargetId(opt.value);
                                setExamPickerOpen(false);
                              }}
                              className={`flex w-full items-center justify-between gap-2 border-b border-gray-50 px-3 py-2.5 text-left text-sm transition-colors last:border-b-0 ${
                                blocked
                                  ? 'cursor-not-allowed bg-gray-50 text-gray-400 opacity-60'
                                  : selected
                                    ? 'bg-blue-50 font-semibold text-blue-900'
                                    : 'text-gray-800 hover:bg-gray-50'
                              }`}
                            >
                              <span className="min-w-0 truncate">{opt.label}</span>
                              {blocked ? (
                                <span className="shrink-0 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                                  Đã gán
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                  </div>
                )}
              </div>
            )}
            {!loadingOptions && !loadingAssignedKeys && (
              <p className="text-xs text-gray-400 mt-1">{examOptions.length} bài trong danh mục</p>
            )}
          </div>
        )}

        {/* Add to cart button */}
        <button
          type="button"
          onClick={addToCart}
          disabled={!examType || targetId === '' || currentPickerBlocked || loadingAssignedKeys}
          className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm vào danh sách gán
        </button>
      </div>

      {/* ─── Step 3: Cart ─── */}
      {cart.length > 0 && (
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <ShoppingCart className="w-4 h-4" />
            3. Danh sách bài thi sẽ gán ({cart.length})
          </label>

          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {cart.map((item) => {
              const Icon = EXAM_TYPE_ICON_MAP[item.examType];
              return (
                <div
                  key={item.id}
                  className="px-4 py-3 bg-white hover:bg-gray-50/80 transition-colors space-y-2"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-800 font-medium flex-1 min-w-0">
                      {item.displayLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 shrink-0"
                      title="Xoá khỏi danh sách"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="pl-7">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Ghi chú cho bài này <span className="text-gray-400 font-normal">(tùy chọn)</span>
                    </label>
                    <textarea
                      value={item.note}
                      onChange={(e) => updateCartItemNote(item.id, e.target.value)}
                      placeholder="VD: Làm từ câu 1–20"
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Step 4: Shared fields ─── */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {cart.length > 0 ? '4.' : '3.'} Hạn nộp <span className="text-gray-400 font-normal">(tùy chọn, giờ Việt Nam {VIETNAM_TIME_ZONE_LABEL})</span>
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => handleDueDateChange(e.target.value)}
            min={getNowVietnamLocalInput()}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            step={60}
          />
          {dueDateWarning ? (
            <p className="mt-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {dueDateWarning}
            </p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">
              Deadline sẽ được lưu và hiển thị theo giờ Việt Nam ({VIETNAM_TIME_ZONE_LABEL}).
            </p>
          )}
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

      {(() => {
        const hasPendingSelection =
          Boolean(examType) &&
          targetId !== '' &&
          !cart.some((c) => c.examType === examType && c.targetId === Number(targetId));

        if (cart.length === 0) {
          return (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Ghi chú <span className="text-gray-400 font-normal">(tùy chọn, cho bài đang chọn)</span>
              </label>
              <textarea
                value={pendingNote}
                onChange={(e) => setPendingNote(e.target.value)}
                placeholder="Ghi chú cho học viên..."
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
              />
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Ghi chú cho từng bài đã thêm vào danh sách: nhập trong từng mục ở mục 3 (bên trên).
            </p>
            {hasPendingSelection && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Ghi chú <span className="text-gray-400 font-normal">(bài đang chọn, sẽ gán kèm khi nộp)</span>
                </label>
                <textarea
                  value={pendingNote}
                  onChange={(e) => setPendingNote(e.target.value)}
                  placeholder="VD: Làm từ câu 1–30"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* ─── Submit summary & buttons ─── */}
      {(cart.length > 0 || (examType && targetId !== '')) && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          <strong>Tóm tắt:</strong>{' '}
          {(() => {
            const examCount = cart.length + ((examType && targetId !== '' && !cart.some(c => c.examType === examType && c.targetId === Number(targetId))) ? 1 : 0);
            const studentCount = mode === 'single' ? (studentEmail ? 1 : 0) : selectedEmails.length;
            return `${examCount} bài thi × ${studentCount} học viên = ${examCount * studentCount} lượt gán`;
          })()}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gán...</>
            : <><CheckCircle className="w-4 h-4" /> Gán bài</>
          }
        </button>
        <button
          type="button"
          onClick={() => router.push(cancelHref ?? listHref)}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
