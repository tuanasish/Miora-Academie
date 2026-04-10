import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Miora Académie CMS',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow flex-shrink-0 border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Miora Admin
          </h2>
        </div>
        <nav className="mt-6 flex flex-col gap-1 px-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 bg-gray-50 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            Tổng quan
          </Link>
          <Link href="/admin/posts" className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-md font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
            Quản lý Bài viết
          </Link>
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-500 rounded-md font-medium hover:bg-gray-100 transition-colors mt-8">
            Quay lại Website
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
