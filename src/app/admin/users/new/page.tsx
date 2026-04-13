import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';

import { createUserAccount } from '@/app/actions/user.actions';

export default function AdminNewUserPage() {
  async function handleCreate(formData: FormData) {
    'use server';
    const email = (formData.get('email') as string) || '';
    const fullName = (formData.get('full_name') as string) || '';
    const role = (formData.get('role') as 'admin' | 'teacher' | 'student') || 'student';

    await createUserAccount({
      email,
      full_name: fullName,
      role,
    });

    redirect('/admin/users');
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-blue-600" /> Tạo Tài Khoản Mới
        </h1>
      </div>

      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <form action={handleCreate} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên hiển thị</label>
              <input
                type="text"
                name="full_name"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vai trò</label>
            <select name="role" defaultValue="student" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm">
              <option value="student">Học viên</option>
              <option value="teacher">Giáo viên</option>
              <option value="admin">Admin</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Giáo viên mới sẽ được tạo ở trạng thái <strong>pending</strong>. Admin và học viên được kích hoạt ngay.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Tạo tài khoản
            </button>
            <Link
              href="/admin/users"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
