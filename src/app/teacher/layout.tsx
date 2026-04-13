import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Users, FileCheck, ClipboardList, ArrowLeft } from 'lucide-react';

import { getCurrentUserProfile } from '@/lib/supabase/adminAuth';

export const metadata: Metadata = {
  title: 'Teacher Dashboard',
  description: 'Miora Académie - Khu vực Giáo viên',
};

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { profile } = await getCurrentUserProfile();
    if (profile.role !== 'teacher' && profile.role !== 'admin') {
      redirect('/dashboard');
    }
    if (profile.role === 'teacher' && profile.status !== 'active') {
      redirect('/pending-approval');
    }
  } catch {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow flex-shrink-0 border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            Teacher Hub
          </h2>
        </div>
        <nav className="mt-6 flex flex-col gap-1 px-4">
          <Link href="/teacher" className="flex items-center gap-3 px-4 py-3 text-gray-700 bg-gray-50 rounded-md font-medium hover:bg-purple-50 hover:text-purple-600 transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Tổng quan
          </Link>
          <Link href="/teacher/students" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-purple-50 hover:text-purple-600 transition-colors">
            <Users className="w-4 h-4" /> Lớp của tôi
          </Link>
          <Link href="/teacher/assignments" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-purple-50 hover:text-purple-600 transition-colors">
            <ClipboardList className="w-4 h-4" /> Giao bài
          </Link>
          <Link href="/teacher/submissions" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-purple-50 hover:text-purple-600 transition-colors">
            <FileCheck className="w-4 h-4" /> Chấm bài
          </Link>

          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-500 rounded-md font-medium hover:bg-gray-100 transition-colors mt-8">
            <ArrowLeft className="w-4 h-4" /> Quay lại Website
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
