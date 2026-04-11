import { BookOpen, Users, Trophy, Sparkles } from 'lucide-react';

export function HeroSection() {
  const stats = [
    { icon: Users, value: '500+', label: 'Học viên' },
    { icon: BookOpen, value: '20+', label: 'Khóa học' },
    { icon: Trophy, value: '95%', label: 'Đạt chứng chỉ' },
  ];

  return (
    <section id="hero" className="bg-[#f3efe6]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-16 lg:px-[120px] lg:py-24">
        <div className="text-center">
          {/* Badge */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#d7c9b8] bg-white px-4 py-2 text-sm font-bold text-[#f05e23] shadow-sm">
            <Sparkles className="h-4 w-4" />
            Cộng đồng Miora Académie
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold leading-tight text-[#121212] lg:text-5xl">
            Góc Học Viên{' '}
            <span className="text-[#f05e23]">Miora</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[640px] text-lg text-[#5d5d5d] leading-relaxed">
            Blog chia sẻ kinh nghiệm, tips học tập, tài liệu miễn phí và câu chuyện thành công
            từ cộng đồng học viên Miora Académie.
          </p>

          {/* Stats */}
          <div className="mx-auto mt-10 flex max-w-[520px] justify-center gap-6 lg:gap-10">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#d7c9b8] bg-white px-6 py-4 shadow-sm"
              >
                <s.icon className="h-6 w-6 text-[#f05e23]" />
                <p className="text-2xl font-extrabold text-[#121212]">{s.value}</p>
                <p className="text-sm font-medium text-[#5d5d5d]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
