import Link from "next/link";
import { ASSETS } from "@/components/landing/landing-data";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#121212]">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#f3efe6] shadow-[0_4px_4px_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src={ASSETS.logo} alt="Miora" className="h-10 w-auto object-contain" />
            <span className="text-sm font-bold text-[#5d5d5d]">Blog</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-bold">
            <Link href="/" className="text-[#3d3d3d] hover:text-[#f05e23]">
              Trang chủ
            </Link>
            <Link href="/blog" className="text-[#f05e23]">
              Tất cả bài viết
            </Link>
            <Link
              href="/login"
              className="rounded-[10px] bg-[#f05e23] px-4 py-2 text-white hover:bg-[#d85118]"
            >
              Đăng nhập
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
