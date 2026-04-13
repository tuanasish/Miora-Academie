import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, SquarePen } from 'lucide-react';

import { deactivateUser, getUserById, updateUserProfile } from '@/app/actions/user.actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditUserPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

  async function handleSave(formData: FormData) {
    'use server';
    const email = (formData.get('email') as string) || '';
    const fullName = (formData.get('full_name') as string) || '';
    const role = (formData.get('role') as 'admin' | 'teacher' | 'student') || 'student';
    const status =
      (formData.get('status') as 'pending' | 'active' | 'disabled') || 'active';

    await updateUserProfile(id, {
      email,
      full_name: fullName,
      role,
      status,
    });

    redirect('/admin/users');
  }

  async function handleDeactivate() {
    'use server';
    await deactivateUser(id);
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
          <SquarePen className="w-6 h-6 text-blue-600" /> Chỉnh Sửa Tài Khoản
        </h1>
      </div>

      <div className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <form action={handleSave} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên hiển thị</label>
              <input
                type="text"
                name="full_name"
                defaultValue={user.full_name ?? ''}
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
                defaultValue={user.email}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vai trò</label>
              <select
                name="role"
                defaultValue={user.role}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
              >
                <option value="student">Học viên</option>
                <option value="teacher">Giáo viên</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái</label>
              <select
                name="status"
                defaultValue={user.status}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-800 mb-1">Lưu ý</p>
            <p>
              “Xóa tài khoản” được xử lý theo dạng <strong>soft delete</strong>: tài khoản được chuyển sang
              trạng thái <strong>disabled</strong>, nhưng dữ liệu học tập cũ vẫn được giữ nguyên.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Lưu thay đổi
            </button>
            <Link
              href="/admin/users"
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Hủy
            </Link>
          </div>
        </form>

        <form action={handleDeactivate} className="mt-4 border-t border-gray-200 pt-4">
          <button
            type="submit"
            className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-900"
          >
            Disable tài khoản
          </button>
        </form>
      </div>
    </div>
  );
}
