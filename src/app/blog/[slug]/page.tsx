import { getPostBySlug } from '@/app/actions/post.actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug)
  if (!post) return { title: 'Bài viết không tồn tại' }
  return {
    title: `${post.title} | Miora Académie`,
    description: post.excerpt,
    openGraph: {
      images: post.thumbnail_url ? [post.thumbnail_url] : [],
    }
  }
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug)
  
  // Chặn nếu null hoặc dạng draft (chưa public)
  if (!post || post.status !== 'published') {
    return notFound()
  }

  return (
    <main className="pb-24">
      {/* Header section (Title & Meta) */}
      <header className="bg-gradient-to-b from-gray-50 to-white pt-20 pb-16 md:pt-32 md:pb-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog" className="text-sm font-semibold tracking-wider text-blue-600 uppercase mb-8 inline-block hover:text-blue-800 transition-colors">
            ← Quay lại danh sách
          </Link>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>
          <p className="text-gray-500 font-medium">
            Miora Académie • Đăng ngày {new Date(post.created_at).toLocaleDateString('vi-VN', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>
      </header>

      {/* Main Cover Image */}
      {post.thumbnail_url && (
        <div className="max-w-5xl mx-auto px-4 -mt-12 md:-mt-20 relative z-10 mb-16">
          <img 
            src={post.thumbnail_url} 
            alt={post.title} 
            className="w-full rounded-2xl shadow-2xl aspect-video lg:aspect-[21/9] object-cover ring-1 ring-gray-200/50 bg-white"
          />
        </div>
      )}

      {/* Content Area */}
      <article className="max-w-3xl mx-auto px-6 mt-8 md:mt-16">
        {post.excerpt && (
          <div className="text-xl md:text-2xl text-gray-700 font-medium mb-12 italic border-l-4 border-blue-500 pl-6 md:pl-8 leading-relaxed">
            {post.excerpt}
          </div>
        )}
        
        {/* Tailwind Typography Plugin handles all standard HTML tags from Tiptap */}
        <div 
          className="prose prose-lg md:prose-xl prose-blue max-w-none text-gray-800 
            prose-headings:font-bold prose-headings:tracking-tight 
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-lg"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />
        
        {/* Bottom divider and back link */}
        <div className="mt-20 pt-10 border-t border-gray-200 text-center">
          <Link href="/blog" className="inline-flex items-center justify-center px-8 py-3 font-semibold rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors">
            Khám phá thêm các bài viết khác
          </Link>
        </div>
      </article>
    </main>
  )
}
