import { getPosts, deletePost } from '@/app/actions/post.actions'
import Link from 'next/link'

export default async function AdminPostsPage() {
  const posts = await getPosts(true) // Lấy cả bài draft của admin

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">Quản lý bài viết</h1>
          <p className="text-gray-500 mt-1">Nơi tập trung các bản tin, blog trên web của trung tâm.</p>
        </div>
        <Link href="/admin/posts/new" className="bg-blue-600 font-medium text-white px-5 py-2.5 rounded-lg shadow hover:bg-blue-700 transition-colors w-fit">
          + Soạn bài mới
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold w-2/5">Tiêu đề bài viết</th>
                <th className="p-4 font-semibold">Phân loại</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold">Ngày tạo</th>
                <th className="p-4 font-semibold text-right">Quản lý</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                  <td className="p-4 text-gray-800 font-medium truncate max-w-xs">{post.title}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      post.category === 'tips' ? 'bg-amber-100 text-amber-700' :
                      post.category === 'news' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {post.category === 'tips' ? '💡 Tips' : post.category === 'news' ? '📢 Tin' : '📰 Blog'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} whitespace-nowrap`}>
                      {post.status === 'published' ? 'Xuất bản' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-sm whitespace-nowrap">
                    {new Date(post.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-4 flex gap-4 justify-end items-center text-sm font-medium">
                    <Link href={`/admin/posts/${post.id}/edit`} className="text-blue-600 hover:text-blue-800">Sửa</Link>
                    <form action={async () => {
                      'use server'
                      await deletePost(post.id)
                    }}>
                      <button type="submit" className="text-red-500 hover:text-red-700">Xóa</button>
                    </form>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <div className="text-4xl mb-3">📝</div>
                    <p>Chưa có bài viết nào.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
