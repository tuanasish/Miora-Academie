import { getPosts } from '@/app/actions/post.actions'
import Link from 'next/link'

export const metadata = {
  title: 'Blog & Tin tức | Miora Académie',
  description: 'Tổng hợp các bài viết, tin tức, tài liệu học tiếng Pháp từ Miora Académie.',
}

export default async function BlogPage() {
  const posts = await getPosts(false) // false = Chỉ lấy bài public (published)

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 lg:py-24">
      <div className="text-center mb-16 md:mb-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Blog & Tin tức</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Cập nhật những thông tin mới nhất về phương pháp học tiếng Pháp, thủ tục du học Pháp và vô vàn kinh nghiệm bổ ích từ Miora Académie.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <span className="text-5xl mb-4 block">📚</span>
          <p className="text-gray-500 text-lg font-medium">Hiện chưa có bài viết nào được đăng tải.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="aspect-[16/10] w-full bg-gray-100 overflow-hidden relative">
                {post.thumbnail_url ? (
                  <img 
                    src={post.thumbnail_url} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                {/* Date badge */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                  {new Date(post.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })}
                </div>
              </div>
              <div className="p-6 lg:p-8 flex flex-col flex-1">
                <h2 className="text-xl leading-tight font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 line-clamp-3 mb-6 flex-1 text-sm md:text-base">
                  {post.excerpt}
                </p>
                <div className="text-blue-600 font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all mt-auto text-sm md:text-base">
                  Đọc tiếp <span className="text-xl leading-none">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
