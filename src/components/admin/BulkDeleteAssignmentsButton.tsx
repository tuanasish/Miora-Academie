'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteAssignmentsMatching } from '@/app/actions/assignment.actions';
import { Trash2, Loader2 } from 'lucide-react';

export function BulkDeleteAssignmentsButton({
  studentEmail,
  from,
  to,
  listCount,
  canBulk,
}: {
  studentEmail: string;
  from: string;
  to: string;
  listCount: number;
  canBulk: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading || !canBulk}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
      onClick={async () => {
        if (!canBulk) {
          alert('Chọn ít nhất học viên hoặc khoảng ngày gán (từ/đến).');
          return;
        }
        if (
          !window.confirm(
            `Xóa mọi bài gán trong DB khớp bộ lọc (đang hiển thị ${listCount} bản ghi)? Hành động không thể hoàn tác.`,
          )
        ) {
          return;
        }
        if (window.prompt('Gõ chính xác XÓA để xác nhận') !== 'XÓA') return;
        setLoading(true);
        try {
          const { deleted } = await deleteAssignmentsMatching({
            student_email: studentEmail || null,
            assigned_from: from || null,
            assigned_to: to || null,
          });
          alert(`Đã xóa ${deleted} bài gán.`);
          router.refresh();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Lỗi';
          if (msg === 'FILTER_REQUIRED') {
            alert('Cần ít nhất học viên hoặc khoảng ngày.');
          } else {
            alert(msg);
          }
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Xóa tất cả theo bộ lọc
    </button>
  );
}
