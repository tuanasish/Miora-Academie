import { Users, Flame, Trophy, Calendar, ClipboardList, FileCheck, AlertTriangle } from 'lucide-react';

import { getTeacherStudents } from '@/app/actions/teacher.actions';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default async function TeacherStudentsPage() {
  const students = await getTeacherStudents();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
        <Users className="w-6 h-6 text-purple-600" /> Lớp Của Tôi
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Theo dõi {students.length} học viên được admin phân công cho bạn.
      </p>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-700">Chưa có học viên nào</p>
          <p className="text-sm text-gray-400 mt-1">Admin sẽ phân công học viên cho bạn.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[1080px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Học viên</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">
                  <span className="flex items-center justify-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5 text-blue-500" /> Đã giao
                  </span>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">
                  <span className="flex items-center justify-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Đã nộp
                  </span>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Đã chấm</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">
                  <span className="flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Quá hạn
                  </span>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">
                  <span className="flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" /> Streak
                  </span>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">
                  <span className="flex items-center justify-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> Kỷ lục
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" /> Hoạt động gần nhất
                  </span>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{student.full_name || student.email}</p>
                    {student.full_name && (
                      <p className="text-xs text-gray-400 mt-0.5">{student.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-gray-700">
                    {student.assigned_count}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-emerald-700">
                    {student.submitted_count}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-violet-700">
                    {student.graded_count}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold text-red-600">
                    {student.overdue_count}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-sm font-bold ${
                        student.current_streak > 0 ? 'text-orange-600' : 'text-gray-300'
                      }`}
                    >
                      <Flame className="w-4 h-4" /> {student.current_streak}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`text-sm font-bold ${
                        student.highest_streak > 0 ? 'text-amber-600' : 'text-gray-300'
                      }`}
                    >
                      {student.highest_streak}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">{fmtDate(student.last_activity)}</td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        student.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : student.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {student.status === 'active'
                        ? 'Active'
                        : student.status === 'pending'
                          ? 'Pending'
                          : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
