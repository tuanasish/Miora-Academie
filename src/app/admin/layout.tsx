import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard, FileText, BookOpen, MessageSquare, Award,
  Library, ClipboardList, FileCheck, Users, ArrowLeft, ShieldCheck,
} from 'lucide-react';

import { getCurrentUserProfile } from '@/lib/supabase/adminAuth';
import { ASSETS } from '@/components/landing/landing-data';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Miora Académie CMS',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { profile } = await getCurrentUserProfile();
    if (profile.role !== 'admin') {
      redirect('/dashboard');
    }
  } catch {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow flex-shrink-0 border-r border-gray-200">
        <div className="p-6">
          <Link href="/admin" className="inline-flex flex-col gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ASSETS.logo}
              alt="Miora"
              className="h-10 w-auto max-w-full object-contain object-left"
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 notranslate" translate="no">
              Admin
            </span>
          </Link>
        </div>
        <nav className="mt-6 flex flex-col gap-1 px-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 bg-gray-50 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Tổng quan
          </Link>
          <Link href="/admin/posts" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <FileText className="w-4 h-4" /> Quản lý Bài viết
          </Link>

          {/* Student Hub section */}
          <div className="mt-4 mb-1 px-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Góc Học Viên</p>
          </div>
          <Link href="/admin/resources" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <BookOpen className="w-4 h-4" /> Tài liệu
          </Link>
          <Link href="/admin/testimonials" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <MessageSquare className="w-4 h-4" /> Feedback
          </Link>
          <Link href="/admin/achievements" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Award className="w-4 h-4" /> Thành tựu
          </Link>

          {/* Exam section */}
          <div className="mt-4 mb-1 px-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Luyện Thi</p>
          </div>
          <Link href="/admin/exams" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Library className="w-4 h-4" /> Ngân hàng đề
          </Link>
          <Link href="/admin/assignments" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <ClipboardList className="w-4 h-4" /> Gán bài
          </Link>
          <Link href="/admin/submissions" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <FileCheck className="w-4 h-4" /> Bài nộp
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <Users className="w-4 h-4" /> Người dùng
          </Link>
          <Link href="/admin/audit-logs" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            <ShieldCheck className="w-4 h-4" /> Audit log
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
