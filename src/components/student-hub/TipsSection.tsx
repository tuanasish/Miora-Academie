import Link from 'next/link';
import { Lightbulb, ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/types/post';

interface TipsSectionProps {
  posts: Post[];
}

export function TipsSection({ posts }: TipsSectionProps) {
  return (
    <section id="tips" className="bg-[#f3efe6] py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7c9b8] bg-white px-4 py-1.5 text-sm font-bold text-[#f05e23]">
            <Lightbulb className="h-4 w-4" />
            Bí kíp học tập
          </div>
          <h2 className="text-3xl font-extrabold text-[#121212] lg:text-4xl">
            Tips Học Tiếng Pháp
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[#5d5d5d]">
            Tổng hợp các mẹo hay, phương pháp hiệu quả giúp bạn học nhanh hơn, nhớ lâu hơn.
          </p>
        </div>

        {/* Tips Cards */}
        {posts.length === 0 ? (
          <div className="mt-10 rounded-[16px] border-2 border-dashed border-[#d7c9b8] bg-white py-16 text-center">
            <span className="text-4xl">💡</span>
            <p className="mt-3 text-[#5d5d5d] font-medium">Tips đang được chuẩn bị. Hãy quay lại sớm nhé!</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, idx) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-[16px] border border-[#e4ddd1] bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 hover:border-[#f05e23]/40"
              >
                {/* Number tag */}
                <div className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#f3efe6] text-sm font-extrabold text-[#f05e23]">
                  {idx + 1}
                </div>

                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#f05e23] text-white shadow-sm">
                  <Lightbulb className="h-6 w-6" />
                </div>

                {/* Badge */}
                <span className="mb-3 inline-block w-fit rounded-full bg-[#f3efe6] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#f05e23]">
                  Tips
                </span>

                <h3 className="text-lg font-bold text-[#121212] line-clamp-2 group-hover:text-[#f05e23] transition-colors">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-[#5d5d5d] line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#f05e23] group-hover:gap-2 transition-all">
                  Đọc ngay <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
