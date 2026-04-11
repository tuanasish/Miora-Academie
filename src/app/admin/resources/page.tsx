import { getAllResources, deleteResource } from '@/app/actions/resource.actions';
import Link from 'next/link';

export default async function AdminResourcesPage() {
  const resources = await getAllResources();

  const fileTypeLabel: Record<string, string> = {
    pdf: '📄 PDF',
    audio: '🎵 Audio',
    doc: '📝 DOC',
    other: '📎 File',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Quản lý Tài liệu</h1>
          <p className="text-gray-500 mt-1">Tải lên và quản lý các tài liệu miễn phí cho học viên.</p>
        </div>
        <Link href="/admin/resources/new" className="bg-blue-600 font-medium text-white px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 transition-colors w-fit">
          + Thêm tài liệu
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold w-2/5">Tiêu đề</th>
                <th className="p-4 font-semibold">Loại</th>
                <th className="p-4 font-semibold">Kích thước</th>
                <th className="p-4 font-semibold">Lượt tải</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-right">Quản lý</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((res) => (
                <tr key={res.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                  <td className="p-4">
                    <p className="text-gray-800 font-medium truncate max-w-xs">{res.title}</p>
                    {res.description && (
                      <p className="text-gray-400 text-sm truncate max-w-xs mt-0.5">{res.description}</p>
                    )}
                  </td>
                  <td className="p-4 text-sm whitespace-nowrap">{fileTypeLabel[res.file_type] || '📎 File'}</td>
                  <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{res.file_size || '—'}</td>
                  <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{res.download_count}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${res.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {res.is_active ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-4 justify-end items-center text-sm font-medium">
                    <Link href={`/admin/resources/${res.id}/edit`} className="text-blue-600 hover:text-blue-800">Sửa</Link>
                    <form action={async () => {
                      'use server'
                      await deleteResource(res.id)
                    }}>
                      <button type="submit" className="text-red-500 hover:text-red-700">Xóa</button>
                    </form>
                  </td>
                </tr>
              ))}
              {resources.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="text-4xl mb-3">📚</div>
                    <p>Chưa có tài liệu nào.</p>
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
