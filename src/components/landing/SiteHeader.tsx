'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogIn, Menu, X } from 'lucide-react';
import { ASSETS, navLeft, navRight } from './landing-data';

/**
 * Shared site header - logo centered, nav split left/right on desktop.
 * Responsive hamburger menu on mobile/tablet.
 */
export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const allLinks = [...navLeft, ...navRight];

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f3efe6] shadow-[0_4px_4px_rgba(0,0,0,0.15)]">
      <div className="mx-auto flex h-[70px] xl:h-[85px] w-full max-w-[1440px] items-center justify-between px-4 xl:px-[120px]">

        {/* Mobile: hamburger (left) */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="xl:hidden p-2 rounded-lg text-[#3d3d3d] hover:bg-white/60 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Desktop: left nav */}
        <nav className="hidden xl:flex flex-1 items-center justify-end gap-1">
          {navLeft.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-[15px] font-semibold text-[#3d3d3d] transition-colors hover:bg-white/60 hover:text-[#f05e23]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Logo - always centered */}
        <Link href="/" className="flex shrink-0 items-center px-4 xl:px-8">
          <img src={ASSETS.logo} alt="Miora" className="h-10 w-auto object-contain xl:h-[54px]" />
        </Link>

        {/* Desktop: right nav + CTA */}
        <div className="hidden xl:flex flex-1 items-center gap-1">
          {navRight.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-[15px] font-semibold text-[#3d3d3d] transition-colors hover:bg-white/60 hover:text-[#f05e23]"
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/login"
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#f05e23] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#d85118]"
          >
            <LogIn className="h-4 w-4" /> Đăng nhập
          </Link>
        </div>

        {/* Mobile: CTA (right) */}
        <Link
          href="/login"
          className="xl:hidden inline-flex items-center gap-1.5 rounded-xl bg-[#f05e23] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#d85118]"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Đăng nhập</span>
        </Link>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`xl:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="border-t border-black/5 bg-[#f3efe6] px-4 py-3 space-y-1">
          {allLinks.map((item) => (
            <a
              key={item.href + item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-[#3d3d3d] transition-colors hover:bg-white/80 hover:text-[#f05e23]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
