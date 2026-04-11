'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import type { Testimonial } from '@/lib/types/student-hub';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const len = testimonials.length;

  const next = useCallback(() => {
    if (len > 0) setCurrent((i) => (i + 1) % len);
  }, [len]);

  const prev = useCallback(() => {
    if (len > 0) setCurrent((i) => (i - 1 + len) % len);
  }, [len]);

  useEffect(() => {
    if (len <= 1 || isPaused) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [len, isPaused, next]);

  if (testimonials.length === 0) {
    return (
      <section id="testimonials" className="bg-white py-16 lg:py-24">
        <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px] text-center">
          <h2 className="text-3xl font-extrabold text-[#121212]">Học Viên Nói Gì Về Miora?</h2>
          <div className="mt-10 rounded-[16px] border-2 border-dashed border-[#d7c9b8] bg-[#f3efe6] py-16">
            <span className="text-4xl">💬</span>
            <p className="mt-3 text-[#5d5d5d] font-medium">Feedback đang được cập nhật!</p>
          </div>
        </div>
      </section>
    );
  }

  const t = testimonials[current];

  return (
    <section id="testimonials" className="bg-white py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
        {/* Header */}
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#f05e23]">
            Feedback
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#121212] lg:text-4xl">
            Học Viên Nói Gì Về Miora?
          </h2>
        </div>

        {/* Carousel Container */}
        <div
          className="relative mx-auto mt-12 max-w-[800px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Testimonial Card */}
          <div className="rounded-[16px] bg-[#f3efe6] p-8 border border-[#e4ddd1] lg:p-12">
            <Quote className="h-10 w-10 text-[#f05e23]/20 mb-4" />

            <blockquote className="text-lg leading-relaxed text-[#3d3d3d] lg:text-xl lg:leading-9 min-h-[80px]">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <div className="my-6 h-px bg-[#d7c9b8]" />

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f05e23] text-white text-lg font-bold shadow-sm">
                {t.avatar_url ? (
                  <img
                    src={t.avatar_url}
                    alt={t.student_name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  t.student_name.charAt(0)
                )}
              </div>

              <div className="flex-1">
                <p className="font-bold text-[#121212]">{t.student_name}</p>
                {t.course && <p className="text-sm text-[#5d5d5d]">Khóa {t.course}</p>}
              </div>

              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < t.rating
                        ? 'fill-[#ffd700] text-[#ffd700]'
                        : 'fill-[#d7c9b8] text-[#d7c9b8]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {len > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute -left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd] bg-white text-[#666] shadow-sm transition hover:bg-[#f5f5f5] lg:-left-14"
                aria-label="Feedback trước"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute -right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[#f05e23] text-white shadow-sm transition hover:bg-[#d85118] lg:-right-14"
                aria-label="Feedback sau"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {len > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`transition-all ${
                  i === current
                    ? 'h-2.5 w-7 rounded-full bg-[#f05e23]'
                    : 'h-2.5 w-2.5 rounded-full bg-[#d7c9b8] hover:bg-[#bbb]'
                }`}
                aria-label={`Feedback ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
