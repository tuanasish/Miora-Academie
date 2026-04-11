'use client';

import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { ASSETS, navLeft, navRight } from './landing-data';

/**
 * Shared site header - dùng chung cho Landing Page và các trang con (blog, góc học viên...)
 * Giữ nguyên style y hệt Landing Page header.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f3efe6] shadow-[0_4px_4px_rgba(0,0,0,0.15)]">
      <div className="mx-auto flex min-h-[95px] w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-3 xl:px-[120px]">
        <nav className="hidden flex-1 items-center justify-end gap-2 xl:flex xl:gap-4">
          {navLeft.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap px-2 py-2 text-[18px] font-bold text-[#3d3d3d] hover:text-[#f05e23]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <Link href="/" className="order-first flex shrink-0 justify-center xl:order-none xl:px-6">
          <img src={ASSETS.logo} alt="Miora" className="h-12 w-auto object-contain xl:h-[54px]" />
        </Link>
        <div className="flex flex-1 items-center justify-between gap-3 xl:justify-start">
          <nav className="hidden items-center gap-2 xl:flex xl:gap-4">
            {navRight.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-2 py-2 text-[18px] font-bold text-[#3d3d3d] hover:text-[#f05e23]"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <Link
            href="/login"
            className="ml-auto inline-flex items-center gap-2 rounded-[12px] bg-[#f05e23] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#d85118] lg:ml-0"
          >
            <LogIn className="h-4 w-4" />
            Đăng nhập
          </Link>
        </div>
      </div>
      <nav className="flex flex-wrap justify-center gap-2 border-t border-black/5 px-4 py-2 xl:hidden">
        {[...navLeft, ...navRight].map((item) => (
          <a key={item.href + item.label} href={item.href} className="text-sm font-semibold text-[#3d3d3d]">
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
