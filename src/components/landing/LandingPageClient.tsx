"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, LogIn } from "lucide-react";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import {
  ASSETS,
  blogPosts,
  challengeCards,
  examPrograms,
  heroSlides,
  methodZBlocks,
  navLeft,
  navRight,
  processSteps,
  studyFormats,
  teachPills,
  teachers,
} from "./landing-data";

function CarouselArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onPrev}
        className="rounded-full border border-[#ddd] bg-white p-2 text-[#666] shadow-sm transition hover:bg-[#f5f5f5]"
        aria-label="Trước"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded-full bg-[#f05e23] p-2 text-white shadow-sm transition hover:bg-[#d85118]"
        aria-label="Sau"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

export function LandingPageClient() {
  const [heroI, setHeroI] = useState(0);
  const [fbI, setFbI] = useState(0);
  const [achI, setAchI] = useState(0);
  const [blogI, setBlogI] = useState(0);
  const [teachI, setTeachI] = useState(0);

  const heroNext = useCallback(() => setHeroI((i) => (i + 1) % heroSlides.length), []);
  const heroPrev = useCallback(() => setHeroI((i) => (i - 1 + heroSlides.length) % heroSlides.length), []);

  const fbLen = 3;
  const fbNext = useCallback(() => setFbI((i) => (i + 1) % fbLen), []);
  const fbPrev = useCallback(() => setFbI((i) => (i - 1 + fbLen) % fbLen), []);

  const achLen = 4;
  const achNext = useCallback(() => setAchI((i) => (i + 1) % achLen), []);
  const achPrev = useCallback(() => setAchI((i) => (i - 1 + achLen) % achLen), []);

  const blogMax = Math.max(0, blogPosts.length - 1);
  const blogNext = useCallback(() => setBlogI((i) => Math.min(blogMax, i + 1)), [blogMax]);
  const blogPrev = useCallback(() => setBlogI((i) => Math.max(0, i - 1)), []);

  const teachNext = useCallback(() => setTeachI((i) => (i + 1) % teachers.length), []);
  const teachPrev = useCallback(() => setTeachI((i) => (i - 1 + teachers.length) % teachers.length), []);

  const feedbackBg = [ASSETS.feedbackCard1, ASSETS.feedbackCard2, ASSETS.feedbackCard1];
  const achBg = [ASSETS.result1, ASSETS.result2, ASSETS.result1, ASSETS.result2];

  return (
    <main id="top" className="min-h-screen bg-white text-[#121212]">
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
          <a href="#top" className="order-first flex shrink-0 justify-center xl:order-none xl:px-6">
            <img src={ASSETS.logo} alt="Miora" className="h-12 w-auto object-contain xl:h-[54px]" />
          </a>
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

      <section className="mx-auto w-full max-w-[1440px] bg-[#f3efe6]">
        <div className="relative mx-auto max-w-[1440px] px-4 py-8 lg:px-[120px] lg:py-10">
          <div className="relative h-[min(70vh,600px)] min-h-[360px] overflow-hidden rounded-[24px]">
            {heroSlides.map((s, i) => (
              <div
                key={s.id}
                className="absolute inset-0 transition-opacity duration-500"
                style={{ backgroundColor: s.bg, opacity: i === heroI ? 1 : 0, pointerEvents: i === heroI ? "auto" : "none" }}
                aria-hidden={i !== heroI}
              />
            ))}
            <button
              type="button"
              onClick={heroPrev}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm lg:left-4"
              aria-label="Slide trước"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={heroNext}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm lg:right-4"
              aria-label="Slide sau"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
            <div className="absolute inset-x-0 bottom-8 flex justify-center gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setHeroI(i)}
                  className={i === heroI ? "h-2 w-6 rounded-full bg-white" : "h-2 w-2 rounded-full bg-white/50"}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="intro" className="bg-white py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1200px] px-4 text-center lg:px-[120px]">
          <h2 className="text-balance text-[36px] font-extrabold leading-tight lg:text-[48px]">
            Tiếng Pháp trong tầm tay cùng MIORA
          </h2>
          <p className="mx-auto mt-6 max-w-[818px] text-[18px] leading-7 text-[#5d5d5d]">
            Cùng bạn thiết kế một hành trình riêng biệt, tập trung vào thấu hiểu gốc rễ ngôn ngữ thông qua lộ trình học
            phù hợp với mục tiêu và định hướng cá nhân.
          </p>
        </div>
      </section>

      <section id="challenge" className="bg-white py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
          <div className="mx-auto max-w-[1200px] text-center">
            <h2 className="text-[36px] font-extrabold leading-tight lg:text-[48px]">
              Bạn đang gặp <span className="text-[#f05e23]">khó khăn</span> với tiếng Pháp?
            </h2>
            <p className="mx-auto mt-5 max-w-[1118px] text-[20px] leading-[28px] text-[#5d5d5d]">
              Miora hiểu những <span className="font-bold text-[#f05e23]">rào cản đặc thù của người Việt</span> khi
              tiếp cận ngôn ngữ này.
            </p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {challengeCards.map((card, idx) => (
              <article key={card.id} className="rounded-[20px] border border-[#5a4334] bg-white px-8 pb-8 pt-14">
                <img
                  src={[ASSETS.challengeIcon1, ASSETS.challengeIcon2, ASSETS.challengeIcon3][idx]}
                  alt=""
                  className="mb-3 h-[84px] w-[84px] object-contain"
                />
                <p className="text-[48px] font-medium leading-[60px] text-[#f05e23]">{card.id}</p>
                <h3 className="mt-2 text-[32px] font-bold leading-[44px]">{card.title}</h3>
                <p className="mt-2 text-[20px] leading-[28px] text-[#888]">{card.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link href="/login" className="rounded-[12px] bg-[#f05e23] px-8 py-5 text-[24px] font-bold text-white">
              TƯ VẤN NGAY
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f9f7f3] py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
          <p className="text-center text-[clamp(28px,5vw,64px)] font-extrabold leading-tight">
            Tại sao bạn cứ mãi <span className="text-[#f05e23]">dậm chân tại chỗ...</span>
          </p>
          <p className="mt-8 text-center text-[clamp(28px,5vw,64px)] font-extrabold leading-tight">
            ...thậm chí cảm thấy mình <span className="text-[#f05e23]">đang thụt lùi?</span>
          </p>
          <h2 className="mx-auto mt-14 max-w-[1200px] text-center text-[clamp(36px,6vw,74px)] font-extrabold leading-tight">
            Vì bạn <span className="text-[#f05e23]">thiếu</span> 1 người <span className="text-[#f05e23]">đồng hành</span>{" "}
            và <span className="text-[#f05e23]">dẫn dắt</span>
          </h2>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#f05e23] px-8 py-5 text-[20px] font-bold text-white lg:text-[24px]"
            >
              KHÁM PHÁ LỘ TRÌNH HỌC <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section id="feedback" className="bg-white py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[clamp(32px,4vw,48px)] font-bold leading-tight text-[#f05e23]">FEEDBACK HỌC VIÊN</p>
                <h2 className="mt-2 max-w-[320px] text-[22px] leading-snug text-[#5d5d5d] lg:text-[28px]">
                  Minh chứng thực tế từ lộ trình cá nhân hóa tại Miora
                </h2>
              </div>
              <img src={ASSETS.feedbackLeft} alt="" className="h-[140px] w-auto object-contain sm:ml-4 lg:h-[170px]" />
            </div>
            <div className="lg:hidden">
              <CarouselArrows onPrev={fbPrev} onNext={fbNext} />
            </div>
          </div>
          <div className="mt-8 hidden gap-4 lg:grid lg:grid-cols-3">
            {feedbackBg.map((src, idx) => (
              <div
                key={idx}
                className="relative aspect-[3/4] overflow-hidden rounded-[20px]"
                style={{
                  backgroundImage: `url(${src})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <p className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-3 py-1 text-xs font-medium">
                  Học viên #{idx + 1}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 overflow-hidden lg:hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${fbI * 100}%)` }}
            >
              {feedbackBg.map((src, idx) => (
                <div key={idx} className="w-full shrink-0 px-1">
                  <div
                    className="relative aspect-[3/4] overflow-hidden rounded-[20px]"
                    style={{
                      backgroundImage: `url(${src})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <p className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-3 py-1 text-xs font-medium">
                      Học viên #{idx + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-2 lg:hidden">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFbI(i)}
                className={i === fbI ? "h-2 w-6 rounded-full bg-[#f05e23]" : "h-2 w-2 rounded-full bg-[#ddd]"}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="method" className="border-y border-[#ede8dd] bg-[#faf8f5] py-16 lg:py-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 lg:px-8">
          <h2 className="text-center text-[clamp(28px,4vw,48px)] font-extrabold leading-tight">
            Xây gốc tiếng Pháp từ số 0 với lộ trình cá nhân hoá
          </h2>
          <div className="mt-12 space-y-16 lg:space-y-24">
            {methodZBlocks.map((block) => (
              <div
                key={block.title}
                className={`grid items-center gap-10 lg:grid-cols-2 ${block.reverse ? "lg:[&>div:first-child]:order-2" : ""}`}
              >
                <div>
                  <h3 className="text-[28px] font-bold leading-tight text-[#121212] lg:text-[36px]">{block.title}</h3>
                  <p className="mt-4 text-[18px] leading-8 text-[#5d5d5d]">{block.body}</p>
                </div>
                <div className="overflow-hidden rounded-[24px] border border-[#e7dfd3] bg-white shadow-sm">
                  <img src={ASSETS.methodPlaceholder} alt="" className="h-[240px] w-full object-cover lg:h-[320px]" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-14 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-[12px] bg-[#f05e23] px-8 py-5 text-[20px] font-bold text-white"
            >
              TÌM HIỂU LỘ TRÌNH HỌC <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section id="steps" className="bg-white py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1200px] px-4">
          <h2 className="text-center text-[32px] font-extrabold">Quy trình đồng hành</h2>
          <p className="mx-auto mt-2 max-w-[640px] text-center text-[#5d5d5d]">
            Các bước được thiết kế để bạn luôn biết mình đang ở đâu và cần làm gì tiếp theo.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {processSteps.map((step) => (
              <article
                key={step.n}
                className="rounded-[20px] border border-[#e7dfd3] bg-[#f9f7f3] p-6 shadow-sm"
              >
                <p className="text-sm font-bold text-[#f05e23]">{step.n}</p>
                <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-6 text-[#5d5d5d]">{step.body}</p>
                <span className="mt-4 inline-block rounded-full bg-[#f05e23]/10 px-3 py-1 text-xs font-semibold text-[#f05e23]">
                  {step.tag}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap justify-center gap-4 px-4">
          {teachPills.map((p) => (
            <div
              key={p.value}
              className="flex min-w-[200px] flex-1 items-center justify-center gap-2 rounded-[16px] border-2 border-[#5a4334] bg-[#fffaf6] px-6 py-4 text-center shadow-sm"
            >
              <span className="text-2xl font-extrabold text-[#f05e23]">{p.value}</span>
              <span className="text-left text-sm font-semibold text-[#3d3d3d]">{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="programs" className="bg-[#f9f7f3] py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1200px] space-y-16 px-4">
          <div>
            <h2 className="text-[28px] font-extrabold lg:text-[32px]">{studyFormats.title}</h2>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {studyFormats.columns.map((col) => (
                <div key={col.title} className="rounded-[20px] border border-[#e7dfd3] bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#121212]">{col.title}</h3>
                  <ul className="mt-4 space-y-4">
                    {col.items.map((line) => (
                      <li key={line.slice(0, 40)} className="flex gap-3 text-[15px] leading-6 text-[#5d5d5d]">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#f05e23]" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-[28px] font-extrabold lg:text-[32px]">{examPrograms.title}</h2>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {examPrograms.columns.map((col) => (
                <div key={col.title} className="rounded-[20px] border border-[#e7dfd3] bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-[#121212]">{col.title}</h3>
                  <ul className="mt-4 space-y-4">
                    {col.items.map((line) => (
                      <li key={line.slice(0, 40)} className="flex gap-3 text-[15px] leading-6 text-[#5d5d5d]">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#f05e23]" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className="mt-6 flex w-full items-center justify-center rounded-[12px] bg-[#f05e23] py-3 text-sm font-bold text-white"
                  >
                    Đăng ký tư vấn
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="roadmap" className="bg-white py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1280px] px-4">
          <div className="text-center">
            <h2 className="text-[32px] font-extrabold lg:text-[40px]">Lộ trình học tập</h2>
            <p className="mt-3 text-[#5d5d5d]">Hành trình được thiết kế bài bản để làm chủ ngôn ngữ.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step) => (
              <article key={step.n + "road"} className="relative rounded-[20px] border border-[#ece6da] bg-[#faf8f5] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f05e23] text-lg font-bold text-white">
                  {step.n}
                </div>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5d5d5d]">{step.body}</p>
                <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wide text-[#f05e23]">
                  {step.tag}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="khai-giang" className="border-y border-[#ede8dd] bg-[#fffaf6] py-12">
        <div className="mx-auto max-w-[800px] px-4 text-center">
          <h2 className="text-2xl font-extrabold">Lịch khai giảng</h2>
          <p className="mt-3 text-[#5d5d5d]">
            Cập nhật lịch mở lớp theo từng tháng. Liên hệ để được tư vấn khung giờ phù hợp với bạn.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-[12px] bg-[#f05e23] px-6 py-3 font-bold text-white"
          >
            Nhận lịch khai giảng
          </Link>
        </div>
      </section>

      <section id="teachers" className="bg-white py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
          <div className="text-center">
            <h2 className="text-[40px] font-extrabold uppercase tracking-wide lg:text-[48px]">Giáo viên đồng hành</h2>
            <p className="mx-auto mt-3 max-w-[800px] text-[18px] text-[#5d5d5d]">
              Đội ngũ cũng đã đi qua hành trình giống bạn. Giáo viên nhà Miora không làm màu, chúng tôi làm gương.
            </p>
          </div>
          <div className="mt-8 hidden gap-6 lg:grid lg:grid-cols-3">
            {teachers.map((t, i) => (
              <article
                key={t.name + i}
                className="overflow-hidden rounded-[24px] border border-[#e7dfd3] bg-[#faf8f5] shadow-sm"
              >
                <div className="aspect-square w-full overflow-hidden">
                  <img src={t.img} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="p-5 text-center">
                  <h3 className="text-lg font-bold">{t.name}</h3>
                  <p className="text-sm text-[#5d5d5d]">{t.role}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link href="/login" className="rounded-[10px] bg-[#f05e23] py-2.5 text-sm font-bold text-white">
                      Chat ngay
                    </Link>
                    <button type="button" className="rounded-[10px] border border-[#5a4334] py-2.5 text-sm font-bold">
                      Xem hồ sơ
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-4 lg:hidden">
            <CarouselArrows onPrev={teachPrev} onNext={teachNext} />
          </div>
          <div className="mx-auto mt-4 max-w-[400px] overflow-hidden lg:hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${teachI * 100}%)` }}
            >
              {teachers.map((t, i) => (
                <div key={t.name + i} className="w-full shrink-0 px-2">
                  <article className="overflow-hidden rounded-[24px] border border-[#e7dfd3] bg-[#faf8f5] shadow-sm">
                    <div className="aspect-square w-full overflow-hidden">
                      <img src={t.img} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="p-5 text-center">
                      <h3 className="text-lg font-bold">{t.name}</h3>
                      <p className="text-sm text-[#5d5d5d]">{t.role}</p>
                      <div className="mt-4 flex flex-col gap-2">
                        <Link href="/login" className="rounded-[10px] bg-[#f05e23] py-2.5 text-sm font-bold text-white">
                          Chat ngay
                        </Link>
                        <button type="button" className="rounded-[10px] border border-[#5a4334] py-2.5 text-sm font-bold">
                          Xem hồ sơ
                        </button>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="achievements" className="bg-[#f9f7f3] py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
          <div className="text-center">
            <h2 className="text-[48px] font-extrabold">Thành tích học viên</h2>
            <p className="text-[32px] font-bold text-[#f05e23]">Xây gốc vững, nói tự tin</p>
          </div>
          <div className="mt-8 flex justify-end lg:hidden">
            <CarouselArrows onPrev={achPrev} onNext={achNext} />
          </div>
          <div className="mt-4 hidden gap-3 rounded-[20px] lg:grid lg:grid-cols-4">
            {achBg.map((src, i) => (
              <div
                key={i}
                className="aspect-[3/4] overflow-hidden rounded-[20px]"
                style={{
                  backgroundImage: `url(${src})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-[20px] lg:hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${achI * 100}%)` }}
            >
              {achBg.map((src, i) => (
                <div key={i} className="w-full shrink-0 px-1">
                  <div
                    className="aspect-[3/4] rounded-[20px]"
                    style={{
                      backgroundImage: `url(${src})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <Link href="/login" className="rounded-[12px] bg-[#f05e23] px-8 py-4 text-lg font-bold text-white">
              TƯ VẤN NGAY
            </Link>
          </div>
        </div>
      </section>

      <section id="blog" className="bg-white py-16">
        <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
          <div className="text-center">
            <h2 className="text-[48px] font-extrabold">Blog</h2>
            <p className="mt-2 text-[20px] text-[#5d5d5d]">
              Khám phá kho tư liệu học tập miễn phí từ các giảng viên tại Miora
            </p>
            <Link
              href="/blog"
              className="mt-4 inline-block text-base font-bold text-[#f05e23] hover:underline"
            >
              Xem tất cả bài viết →
            </Link>
          </div>
          <div className="mt-8 flex justify-end xl:hidden">
            <CarouselArrows onPrev={blogPrev} onNext={blogNext} />
          </div>
          <div className="mt-4 hidden gap-4 xl:grid xl:grid-cols-4">
            {blogPosts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="mt-4 overflow-hidden xl:hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${blogI * 100}%)` }}
            >
              {blogPosts.map((post) => (
                <div key={post.slug} className="w-full shrink-0 px-2 sm:px-3">
                  <BlogPostCard post={post} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="consult" className="bg-[#f9f7f3] px-4 py-16 lg:px-[120px]">
        <div className="mx-auto grid w-full max-w-[1200px] gap-10 rounded-[30px] bg-[#f3efe6] p-6 md:grid-cols-2 md:p-10">
          <div className="space-y-3">
            <h2 className="text-4xl font-extrabold">Tư vấn ngay hôm nay</h2>
            <p className="text-[#5d5d5d]">Để lại thông tin để nhận lộ trình học phù hợp với mục tiêu của bạn.</p>
            <img src={ASSETS.consultVisual} alt="" className="mt-4 max-h-[280px] w-full rounded-[16px] object-cover" />
          </div>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#3d3d3d]">Họ và tên</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                className="w-full rounded-xl border border-[#d7c9b8] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#f05e23]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#3d3d3d]">Số điện thoại</label>
              <input
                type="tel"
                placeholder="09xx xxx xxx"
                className="w-full rounded-xl border border-[#d7c9b8] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#f05e23]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#3d3d3d]">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full rounded-xl border border-[#d7c9b8] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#f05e23]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#3d3d3d]">Bạn đang tìm...</label>
              <select className="w-full rounded-xl border border-[#d7c9b8] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#f05e23]">
                <option value="">Chọn mục tiêu</option>
                <option>DELF</option>
                <option>TCF</option>
                <option>Giao tiếp</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#f05e23] px-4 py-3 text-lg font-bold text-white transition hover:bg-[#d85118]"
            >
              Đăng ký nhận tư vấn
            </button>
          </form>
        </div>
      </section>

      <footer className="border-t border-[#e4ddd1] bg-white py-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[120px]">
          <img src={ASSETS.logo} alt="Miora" className="h-[48px] w-auto object-contain" />
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap gap-6 text-[18px] text-[#3d3d3d]">
              <a href="#programs" className="hover:text-[#f05e23]">
                Lộ trình học
              </a>
              <a href="#khai-giang" className="hover:text-[#f05e23]">
                Lịch khai giảng
              </a>
              <a href="#teachers" className="hover:text-[#f05e23]">
                Về giáo viên
              </a>
              <a href="/blog" className="hover:text-[#f05e23]">
                Góc học viên
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd] text-[#3d3d3d] hover:border-[#f05e23] hover:text-[#f05e23]"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd] text-[#3d3d3d] hover:border-[#f05e23] hover:text-[#f05e23]"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
            <p className="text-[16px] text-[#5d5d5d]">Copyright © 2026 by ...</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
