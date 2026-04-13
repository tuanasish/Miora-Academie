import Link from 'next/link';
import { Users, UserX, Plus, SquarePen } from 'lucide-react';

import { getUsersList, updateUserRole, updateUserStatus } from '@/app/actions/user.actions';
import { RoleSelect } from '@/components/admin/RoleSelect';
import { StatusSelect } from '@/components/admin/StatusSelect';
import { TeacherRow } from '@/components/admin/TeacherRow';

export default async function AdminUsersPage() {
  const users = await getUsersList();

  async function handleRoleChange(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const role = formData.get('role') as 'admin' | 'teacher' | 'student';
    await updateUserRole(id, role);
  }

  async function handleStatusChange(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const status = formData.get('status') as 'pending' | 'active' | 'disabled';
    await updateUserStatus(id, status);
  }

  const students = users.filter((user) => user.role === 'student');

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Quản Lý Người Dùng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý tài khoản, kích hoạt giáo viên và phân công học viên · {users.length} users
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Tạo tài khoản
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Tổng Users</p>
          <p className="text-2xl font-bold text-gray-800">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Admins</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter((user) => user.role === 'admin').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Giáo viên</p>
          <p className="text-2xl font-bold text-purple-600">
            {users.filter((user) => user.role === 'teacher').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Học viên</p>
          <p className="text-2xl font-bold text-emerald-600">{students.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Tên</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Quyền</th>
              <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Thống kê</th>
              <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Trạng thái</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => {
              if (user.role === 'teacher') {
                return (
                  <TeacherRow
                    key={user.id}
                    teacherId={user.id}
                    teacherEmail={user.email}
                    teacherName={user.full_name}
                    teacherStatus={user.status}
                    studentsCount={user.students_count || 0}
                    allStudents={students}
                    RoleSelectComponent={
                      <RoleSelect userId={user.id} currentRole={user.role} action={handleRoleChange} />
                    }
                    StatusSelectComponent={
                      <StatusSelect userId={user.id} currentStatus={user.status} action={handleStatusChange} />
                    }
                  />
                );
              }

              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">{user.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600">{user.full_name || '—'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <RoleSelect userId={user.id} currentRole={user.role} action={handleRoleChange} />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-xs text-gray-500">
                      <p>{user.assignments_count} bài gán</p>
                      <p>{user.submissions_count} bài nộp</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StatusSelect userId={user.id} currentStatus={user.status} action={handleStatusChange} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      <SquarePen className="w-3.5 h-3.5" />
                      Chỉnh sửa
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <UserX className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold">Chưa có user nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
