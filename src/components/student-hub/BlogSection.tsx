import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';
import type { Post } from '@/lib/types/post';

interface BlogSectionProps {
  posts: Post[];
}

export function BlogSection({ posts }: BlogSectionProps) {
  return (
    <section id="blog" className="bg-white py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#f05e23]">
              Blog & Cập nhật
            </p>
            <h2 className="mt-1 text-3xl font-extrabold text-[#121212] lg:text-4xl">
              Bài Viết Mới Nhất
            </h2>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 rounded-[12px] border border-[#d7c9b8] px-4 py-2.5 text-sm font-bold text-[#3d3d3d] transition hover:border-[#f05e23] hover:text-[#f05e23]"
          >
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Cards Grid */}
        {posts.length === 0 ? (
          <div className="mt-10 rounded-[16px] border-2 border-dashed border-[#d7c9b8] bg-[#f3efe6] py-16 text-center">
            <Newspaper className="mx-auto h-12 w-12 text-[#d7c9b8]" />
            <p className="mt-3 font-medium text-[#5d5d5d]">Bài viết đang được chuẩn bị. Hãy quay lại sớm nhé!</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-[16px] border border-[#e4ddd1] bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Thumbnail */}
                <div className="aspect-[16/10] overflow-hidden bg-[#f3efe6]">
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Newspaper className="h-12 w-12 text-[#d7c9b8]" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <span className="mb-2 inline-block w-fit rounded-full bg-[#f3efe6] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#f05e23]">
                    Blog
                  </span>
                  <h3 className="text-lg font-bold text-[#121212] line-clamp-2 group-hover:text-[#f05e23] transition-colors">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#5d5d5d] line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#f05e23] group-hover:gap-2 transition-all">
                    Đọc thêm <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
