'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const sections = [
  { id: 'blog', label: '📰 Blog' },
  { id: 'tips', label: '💡 Tips' },
  { id: 'resources', label: '📚 Tài liệu' },
  { id: 'achievements', label: '🏆 Thành tựu' },
  { id: 'testimonials', label: '💬 Feedback' },
];

export function SectionNav() {
  const [activeId, setActiveId] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const heroEl = document.getElementById('hero');

    const handleScroll = () => {
      if (heroEl) {
        const heroBottom = heroEl.getBoundingClientRect().bottom;
        setIsVisible(heroBottom < 0);
      }

      let currentId = '';
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            currentId = section.id;
          }
        }
      }
      setActiveId(currentId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 border-b border-black/5 bg-[#f3efe6]/95 backdrop-blur-md shadow-[0_4px_4px_rgba(0,0,0,0.10)] transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-1 px-4 py-2.5 overflow-x-auto scrollbar-hide lg:px-[120px]">
        {/* Back to home */}
        <Link
          href="/"
          className="mr-2 flex shrink-0 items-center gap-1.5 rounded-[12px] px-3 py-2 text-sm font-bold text-[#3d3d3d] transition hover:bg-white hover:text-[#f05e23]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Trang chủ</span>
        </Link>

        <div className="h-5 w-px bg-[#d7c9b8] shrink-0 mr-1" />

        {/* Section links */}
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => {
              document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`whitespace-nowrap rounded-[12px] px-3 py-2 text-sm font-bold transition shrink-0 ${
              activeId === section.id
                ? 'bg-white text-[#f05e23] shadow-sm'
                : 'text-[#3d3d3d] hover:bg-white hover:text-[#f05e23]'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
