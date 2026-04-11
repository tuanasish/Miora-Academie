import { getStudentsList, updateStudentRole } from '@/app/actions/student.actions';
import { revalidatePath } from 'next/cache';
import { Users, Shield, GraduationCap, UserX } from 'lucide-react';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default async function AdminStudentsPage() {
  const students = await getStudentsList();

  async function handleRoleChange(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const role = formData.get('role') as 'admin' | 'student';
    await updateStudentRole(id, role);
    revalidatePath('/admin/students');
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Quản Lý Học Viên
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý tài khoản và phân quyền · {students.length} users
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Tổng Users</p>
          <p className="text-2xl font-bold text-gray-800">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Admins</p>
          <p className="text-2xl font-bold text-blue-600">{students.filter(s => s.role === 'admin').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Học viên</p>
          <p className="text-2xl font-bold text-emerald-600">{students.filter(s => s.role === 'student').length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Tên</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Quyền</th>
              <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Bài gán</th>
              <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Bài nộp</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-800">{s.email}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-600">{s.full_name || '—'}</p>
                </td>
                <td className="px-4 py-4">
                  <form action={handleRoleChange}>
                    <input type="hidden" name="id" value={s.id} />
                    <select
                      name="role"
                      defaultValue={s.role}
                      onChange={(e) => {
                        const form = e.currentTarget.closest('form');
                        if (form) form.requestSubmit();
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-300 ${
                        s.role === 'admin'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <option value="admin">Admin</option>
                      <option value="student">Học viên</option>
                    </select>
                  </form>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`text-sm font-semibold ${s.assignments_count > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                    {s.assignments_count || '—'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`text-sm font-semibold ${s.submissions_count > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                    {s.submissions_count || '—'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <p className="text-xs text-gray-400">{fmtDate(s.created_at)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {students.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <UserX className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold">Chưa có user nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
