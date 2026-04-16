'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle } from 'lucide-react';
import { hardDeleteUser } from '@/app/actions/user.actions';

export function HardDeleteUserButton({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (confirmEmail !== userEmail) return;
    try {
      setIsDeleting(true);
      await hardDeleteUser(userId);
      router.push('/admin/users');
    } catch (e) {
      alert('Có lỗi xảy ra khi xóa: ' + (e as Error).message);
      setIsDeleting(false);
    }
  }

  if (isConfirming) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 border-l-4 border-l-red-600 mt-6">
        <div className="flex items-center gap-2 text-red-800 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-bold text-base">Vùng nguy hiểm (Danger Zone)</h3>
        </div>
        <p className="text-sm text-red-700 mb-4 leading-relaxed">
          Thao tác này <strong>không thể hoàn tác</strong>. Dữ liệu tài khoản của người dùng này, bao gồm cả điểm số, bài nộp, và thông tin đăng nhập sẽ bị xóa MÃI MÃI.
          Vui lòng nhập <strong className="font-mono bg-red-100 px-1 py-0.5 rounded">{userEmail}</strong> để xác nhận.
        </p>
        <div className="max-w-md">
          <input 
            type="text" 
            value={confirmEmail} 
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={userEmail}
            className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm mb-4 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmEmail !== userEmail || isDeleting}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? 'Đang phân hủy...' : 'Chắc chắn xóa vĩnh viễn'}
            </button>
            <button
              type="button"
              onClick={() => { setIsConfirming(false); setConfirmEmail(''); }}
              disabled={isDeleting}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-red-100 bg-white border border-red-200"
            >
              Hủy thao tác
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
        <Trash2 className="w-4 h-4" /> Xóa vĩnh viễn (Danger Zone)
      </h3>
      <p className="text-sm text-gray-500 mb-3">
        Dành cho việc dọn dẹp các tài khoản rác. Xóa xong không thể khôi phục lại dữ liệu điểm số, lịch sử.
      </p>
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-2 transition-colors"
      >
        Xóa vĩnh viễn người dùng này
      </button>
    </div>
  );
}
