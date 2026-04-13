import Link from 'next/link';
import { LayoutDashboard, Users, FileCheck, ClipboardList } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ login_notified?: string }>;
}

export default async function TeacherDashboard({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div>
      {params.login_notified === '1' && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Hoạt động đăng nhập của bạn vừa được thông báo tới admin.
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
        <LayoutDashboard className="w-6 h-6 text-purple-600" /> Tổng Quan Giáo Viên
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/teacher/students"
          className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow group flex flex-col items-center text-center"
        >
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Lớp của tôi</h2>
          <p className="text-sm text-gray-500">
            Theo dõi tiến độ học viên do admin phân công cho bạn.
          </p>
        </Link>

        <Link
          href="/teacher/assignments"
          className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow group flex flex-col items-center text-center"
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Giao bài</h2>
          <p className="text-sm text-gray-500">
            Giao bài, đặt deadline và theo dõi bài chưa hoàn thành của lớp bạn.
          </p>
        </Link>

        <Link
          href="/teacher/submissions"
          className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow group flex flex-col items-center text-center"
        >
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Chấm bài</h2>
          <p className="text-sm text-gray-500">
            Xem bài nộp của học viên, chấm điểm và trả feedback.
          </p>
        </Link>
      </div>
    </div>
  );
}
