import { getAllAchievements, deleteAchievement } from '@/app/actions/achievement.actions';
import Link from 'next/link';
import { Award, Trophy, Plus, Inbox, Pencil, Trash2 } from 'lucide-react';

export default async function AdminAchievementsPage() {
  const achievements = await getAllAchievements();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800 flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-500" /> Quản lý Thành tựu
          </h1>
          <p className="text-gray-500 mt-1">Vinh danh các học viên đạt kết quả xuất sắc.</p>
        </div>
        <Link href="/admin/achievements/new" className="bg-blue-600 font-medium text-white px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 transition-colors w-fit inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Thêm thành tựu
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold w-1/4">Học viên</th>
                <th className="p-4 font-semibold w-1/4">Thành tích</th>
                <th className="p-4 font-semibold">Năm</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-right">Quản lý</th>
              </tr>
            </thead>
            <tbody>
              {achievements.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 text-gray-800 font-medium">{a.student_name}</td>
                  <td className="p-4">
                    <span className="text-amber-700 font-semibold inline-flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500" /> {a.achievement}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{a.year || '—'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {a.is_active ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-4 justify-end items-center text-sm font-medium">
                    <Link href={`/admin/achievements/${a.id}/edit`} className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> Sửa
                    </Link>
                    <form action={async () => {
                      'use server'
                      await deleteAchievement(a.id)
                    }}>
                      <button type="submit" className="text-red-500 hover:text-red-700 inline-flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {achievements.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <Award className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>Chưa có thành tựu nào.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
