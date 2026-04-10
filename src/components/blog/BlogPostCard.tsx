import Link from "next/link";
import type { BlogPost } from "@/components/landing/landing-data";

export function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-[20px] border border-[#ececec] bg-[#fafafa] p-5 transition hover:border-[#f05e23]/40 hover:shadow-md"
    >
      <div className="mb-3 h-40 rounded-xl bg-gradient-to-b from-[#dce7ff] to-[#f2f6ff] transition group-hover:from-[#ffd4c2] group-hover:to-[#ffe8dc]" />
      <h3 className="text-lg font-bold text-[#121212] group-hover:text-[#f05e23]">{post.title}</h3>
      <p className="mt-2 text-sm text-[#5d5d5d]">{post.excerpt}</p>
      <span className="mt-3 inline-block text-sm font-bold text-[#f05e23]">Xem thêm →</span>
    </Link>
  );
}
