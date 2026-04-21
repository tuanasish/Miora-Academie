'use client';

import { CheckCircle, Loader2, Save } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export default function GradeSubmitButton({ isGraded }: { isGraded: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      translate="no"
      className="notranslate inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
        </>
      ) : isGraded ? (
        <>
          <Save className="w-4 h-4" /> Cập nhật điểm
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" /> Xác nhận chấm điểm
        </>
      )}
    </button>
  );
}
